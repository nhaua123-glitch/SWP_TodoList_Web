"use client";

import { useState, useEffect, useRef, ChangeEvent } from "react";
import { Calendar, dateFnsLocalizer } from "react-big-calendar";
import { format, parse, startOfWeek, getDay } from "date-fns";
import { enUS } from "date-fns/locale/en-US";
import "react-big-calendar/lib/css/react-big-calendar.css";
import Link from "next/link";
import { useRouter } from "next/navigation";
import LogoutButton from "@/components/LogoutButton";
import styles from "./calendar.module.css";
import WidgetTimer from "../components/widgettimer";
import withDragAndDrop from "react-big-calendar/lib/addons/dragAndDrop";
import "react-big-calendar/lib/addons/dragAndDrop/styles.css";
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';


// ===================================

const locales = { "en-US": enUS };
const localizer = dateFnsLocalizer({ format, parse, startOfWeek, getDay, locales });

const DragAndDropCalendar = withDragAndDrop(Calendar);


export default function Home() {
  const router = useRouter();
  const supabase = createClientComponentClient();
  const [events, setEvents] = useState<any[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<any>(null); // Task ĐANG BỊ CLICK để edit
  const [hoveredEvent, setHoveredEvent] = useState<any>(null);   // Task ĐANG BỊ RÊ CHUỘT qua
  const [points, setPoints] = useState(0);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [friendsList, setFriendsList] = useState<any[]>([]);

  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const clearTimer = () => {
    if (timerRef.current) {
      clearTimeout(timerRef.current as ReturnType<typeof setTimeout>);
      timerRef.current = null;
    }
  };

  // 💡 1. THÊM STATE ĐỂ QUẢN LÝ NGÀY THÁNG HIỆN TẠI (CHO NÚT BACK/NEXT)
  const [date, setDate] = useState(new Date());

  // 💡 2. THÊM STATE QUẢN LÝ CHẾ ĐỘ XEM (CHO NÚT MONTH/WEEK/DAY)
  const [view, setView] = useState("month");

  const [newTask, setNewTask] = useState<any>({
    title: "",
    description: "",
    start: "",
    end: "",
    color: "#3174ad",
    type: "work",
    visibility: "PRIVATE",      // 'PRIVATE' | 'PUBLIC'
    collaborators: [],          // Mảng chứa ID của bạn bè được chọn: ['user-id-1', 'user-id-2']
    subtasks: [],               // Mảng chứa các object subtask: { title: '...', assignee_id: '...' }
  });


  useEffect(() => {
    const getCurrentUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setCurrentUser(user); // Cập nhật state currentUser
    };
    getCurrentUser(); 
    fetchTasks();
    fetchFriends(); 
  }, []);

  console.log("Dữ liệu friendsList trong Form:", friendsList);

  const fetchTasks = async () => {
  setLoading(true);
  // 1) Lấy tất cả task
  const { data: tasksData, error: tasksError } = await supabase.from("tasks").select("*");
  if (tasksError) {
    console.error("Lỗi lấy tasks:", tasksError);
    setLoading(false);
    return;
  }
  if (!tasksData || tasksData.length === 0) {
    setEvents([]);
    setLoading(false);
    return;
  }

  // Map task ids
  const taskIds = tasksData.map((t: any) => t.id);

  // 2) Lấy danh sách collaborators cho các task này
  const { data: collabRows, error: collabError } = await supabase
    .from("task_collaborators")
    .select("task_id, user_id, role")
    .in("task_id", taskIds);

  if (collabError) {
    console.error("Lỗi lấy task_collaborators:", collabError);
    // không return, vẫn tiếp tục (task vẫn có thể hiển thị)
  }

  // 3) Lấy thông tin profile của các user trong collaborators (nếu có)
  const collaboratorUserIds = Array.from(new Set((collabRows || []).map((r: any) => r.user_id)));
  let profilesMap: Record<string, any> = {};
  if (collaboratorUserIds.length > 0) {
    const { data: profilesData, error: profilesError } = await supabase
      .from("profiles")
      .select("id, username, email, avatar_url")
      .in("id", collaboratorUserIds);

    if (profilesError) {
      console.error("Lỗi lấy profiles của collaborators:", profilesError);
    } else if (profilesData) {
      profilesMap = profilesData.reduce((acc: any, p: any) => {
        acc[p.id] = p;
        return acc;
      }, {});
    }
  }

  // 4) Format tasks kèm collaborators detail
  const formatted = tasksData.map((task: any) => {
    const taskCollabs = (collabRows || []).filter((c: any) => c.task_id === task.id);
    const collaborators = taskCollabs.map((c: any) => ({
      user_id: c.user_id,
      role: c.role,
      profile: profilesMap[c.user_id] || null,
    }));

    return {
      ...task,
      start: new Date(task.start_time),
      end: new Date(task.end_time),
      collaborators, // mảng { user_id, role, profile }
    };
  });

  setEvents(formatted);
  setLoading(false);
};


  const fetchFriends = async () => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  // B1: Lấy list quan hệ bạn bè (đã accepted)
  // Mình có thể là người gửi (sender_id) HOẶC người nhận (receiver_id)
  const { data: friendsData, error: friendsError } = await supabase
    .from('friends')
    .select('sender_id, receiver_id')
    .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`)
    .eq('status', 'accepted'); // Đảm bảo bạn có cột 'status' và giá trị 'accepted'

  if (friendsError) {
    console.error("Lỗi lấy danh sách bạn bè:", friendsError);
    return;
  }

  if (!friendsData || friendsData.length === 0) {
    setFriendsList([]); // Không có bạn bè nào
    return;
  }

  // B2: Lọc ra ID của người bạn kia
  const friendIds = friendsData.map((f: any) => 
    f.sender_id === user.id ? f.receiver_id : f.sender_id
  );

  // B3: Lấy thông tin chi tiết từ bảng profiles
  const { data: profilesData, error: profilesError } = await supabase
    .from('profiles')
    .select('id, username, email, avatar_url')
    .in('id', friendIds);

  if (profilesError) {
    console.error("Lỗi lấy thông tin profile bạn bè:", profilesError);
    return;
  }

  // B4: Format dữ liệu và set state
  if (profilesData) {
    const formattedFriends = profilesData.map((u: any) => ({
      id: u.id,
      name: u.username || u.email || "Bạn ẩn danh"
    }));
    setFriendsList(formattedFriends);
  }
};


const handleAddTask = async () => {
  if (!newTask.title || !newTask.start || !newTask.end)
    return alert("Vui lòng điền đủ thông tin!");

  try {
    setLoading(true);

    // 🔹 Lấy user
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // 🔹 Chuẩn bị dữ liệu task
    const taskPayload = {
      user_id: user.id,
      title: newTask.title.trim(),
      description: newTask.description?.trim() || "",
      start_time: newTask.start,
      end_time: newTask.end,
      color: newTask.color || "#3174ad",
      type: newTask.type || "work",
      visibility: newTask.visibility || "PRIVATE",
      completed: false,
    };

    // 🔹 INSERT task chính
    const { data: taskData, error: taskError } = await supabase
      .from("tasks")
      .insert([taskPayload])
      .select()
      .single();

    if (taskError) throw taskError;
    const newTaskId = taskData.id;

    // 🔹 Tạo các promise để chạy song song (collab + subtask)
    const promises: Promise<any>[] = [];

    if (newTask.visibility === "PUBLIC" && newTask.collaborators?.length > 0) {
      const collaboratorsPayload = newTask.collaborators.map((friendId: string) => ({
        task_id: newTaskId,
        user_id: friendId,
        role: "EDITOR",
      }));
      promises.push(supabase.from("task_collaborators").insert(collaboratorsPayload));
    }

    if (newTask.subtasks?.length > 0) {
      const subtasksPayload = newTask.subtasks.map((st: any) => ({
        task_id: newTaskId,
        title: st.title?.trim(),
        assignee_id: st.assignee_id || user.id,
        is_completed: false,
      }));
      promises.push(supabase.from("subtasks").insert(subtasksPayload));
    }

    // 🔹 Chạy tất cả insert phụ song song
    await Promise.all(promises);

    // 🔹 Optimistic update UI (không cần reload)
    const addedEvent = {
      ...taskData,
      start: new Date(taskData.start_time),
      end: new Date(taskData.end_time),
    };
    setEvents((prev) => [...prev, addedEvent]);

    // 🔹 Reset form
    setNewTask({
      title: "",
      description: "",
      start: "",
      end: "",
      color: "#3174ad",
      type: "work",
      visibility: "PRIVATE",
      collaborators: [],
      subtasks: [],
    });

  } catch (error) {
    console.error("❌ Lỗi khi tạo task:", error);
    alert("Không thể thêm task, vui lòng thử lại!");
  } finally {
    setLoading(false);
  }
};


    const handleSelectSlot = (slotInfo: any) => {
      setSelectedEvent(null); // Chuyển sidebar về chế độ ADD
      setHoveredEvent(null);  // Xóa mọi thông tin hover

      setNewTask({
        title: "",
        description: "",
        start: slotInfo.start.toISOString().slice(0, 16),
        end: slotInfo.end.toISOString().slice(0, 16),
        color: "#6a879fff",
        type: "work",
      });

    };

    // Khi di chuột ra khỏi task HOẶC sidebar
    const handleMouseLeave = () => {
      // Đặt timer để ẩn sidebar sau 300ms (đủ thời gian di chuyển chuột)
      timerRef.current = setTimeout(() => {
        setSelectedEvent(null);
      }, 300);
    };


  const handleEventDrop = async ({ event, start, end, isAllDay }: any) => {
    const updatedEvents = events.map((existingEvent) =>
      existingEvent.id === event.id ? { ...existingEvent, start, end, isAllDay } : existingEvent
    );
    setEvents(updatedEvents);

    const { error } = await supabase
      .from("tasks")
      .update({
        start_time: start.toISOString(),
        end_time: end.toISOString(),
      })
      .eq("id", event.id);

    if (error) console.error("Error updating task date in Supabase:", error);
  };

  const eventStyleGetter = (event: any) => {
    const backgroundColor = event.completed ? "#acfab8ff" : event.color || "#285882ff";
    return { style: { backgroundColor } };
  };

  const taskTypeIcons: Record<string, string> = {
    work: "💼",
    study: "📚",
    outdoor: "🌳",
    personal: "🧘",
    other: "🔹",
  };

  const handleEventHover = (event: any) => {
    if (!selectedEvent) { // Chỉ hiển thị hover NẾU không có task nào đang được edit
      setHoveredEvent(event);
    }
  };

  const handleEventMouseLeave = () => {
    if (!selectedEvent) {
      setHoveredEvent(null);
    }
  };

  const EventComponent = ({ event }: { event: any }) => {
    const start = new Date(event.start).toLocaleString();
    const end = new Date(event.end).toLocaleString();
    return (
      <span
        title={`📌 ${event.title}\n🗓 ${start} - ${end}\n📝 ${event.description || "No description"}`}
        style={{ cursor: "pointer", display: "block", height: "100%" }} // Style để bắt hover dễ hơn
        onMouseEnter={() => handleEventHover(event)}  
        onMouseLeave={handleEventMouseLeave}
      >
        {taskTypeIcons[event.type] || "🔹"} {event.title}
      </span>
    );
  };

  if (loading) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        fontSize: '18px'
      }}>
        Đang tải...
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <PointsBar points={points} />

      {/* === KẾT NỐI BẠN BÈ === */}
      <div style={{ margin: "20px 0", textAlign: "center" }}>
        <Link href="/friends">
          <button
            style={{
              background: "linear-gradient(-45deg, #EEAECA, #94bbe9, #b8f1eb, #f2dcf4)",
              color: "#fff",
              border: "none",
              borderRadius: "6px",
              padding: "8px 16px",
              cursor: "pointer",
            }}
          >
            👥 Invite Friends
          </button>
        </Link>
      </div>



      <BackgroundCustomizer />
      <h2 className={styles.title}>My Task Calendar</h2>


      {/* ========================================= */}
      {/* VÙNG NỘI DUNG CHÍNH (SIDEBAR + CALENDAR) */}
      {/* ========================================= */}
      <div className={styles.mainContentContainer}>

        {/* SIDEBAR (Luôn hiển thị) */}
        <div className={styles.editSidebar}>
          
          {/* LOGIC HIỂN THỊ CỦA SIDEBAR */}
          {selectedEvent ? (
            // 1. Nếu có task đang được CLICK (EDIT MODE)
            <EditModal
              selectedEvent={selectedEvent}
              setEvents={setEvents}
              events={events}
              setShowModal={() => setSelectedEvent(null)}
              setPoints={setPoints}
              supabase={supabase}
              friendsList={friendsList}
              currentUser={currentUser}
            />

          ) : hoveredEvent ? (
            // 2. Nếu không, kiểm tra có task đang được HOVER (VIEW MODE)
            <TaskDetailsView event={hoveredEvent} />
          ) : (
            // 3. Mặc định là Form Add Task (ADD MODE)
            <AddTaskForm
              newTask={newTask}
              setNewTask={setNewTask}
              handleAddTask={handleAddTask}
              supabase={supabase}
              friendsList={friendsList} 
              currentUser={currentUser} 
            />
          )}


        </div>

        {/* CALENDAR */}
        <div className={styles.calendarContainer}>
          <DragAndDropCalendar
            localizer={localizer}
            events={events}
            startAccessor={(event: any) => new Date(event.start)}
            endAccessor={(event: any) => new Date(event.end)}
            style={{ height: 600 }}
            eventPropGetter={eventStyleGetter}
            
            // 💡 CẬP NHẬT onSelectEvent (Click vào task)
            onSelectEvent={(event) => {
              setSelectedEvent(event); // "Khóa" task này để edit
              setHoveredEvent(null);  // Xóa thông tin hover
            }}

            selectable
            onSelectSlot={handleSelectSlot} // Đã cập nhật ở trên
            components={{
              event: EventComponent, // Đã cập nhật ở trên
            }}
            resizable={false}
            onEventDrop={handleEventDrop}
            view={view as any}
            onView={(newView: string) => setView(newView)}
            date={date}
            onNavigate={setDate}
          />
        </div>
      </div>
      
      {/* WIDGET TIMER */}
      <WidgetTimer tasks={events as unknown as never[]} />
    </div>
  );
}

// -----------------------------------------------------------------------------
// CÁC COMPONENT PHỤ
// -----------------------------------------------------------------------------

  // Custom bg và các cài đặt khác
  function BackgroundCustomizer() {
    const [bgColor, setBgColor] = useState("#ffffff");
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

    useEffect(() => {
      if (!document.body.style.backgroundImage || document.body.style.backgroundImage === 'none') {
          document.body.style.backgroundColor = bgColor;
      }
    }, [bgColor]);

    const handleColorChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      setBgColor(e.target.value);
      document.body.style.backgroundImage = 'none';
    };

    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onloadend = () => {
        document.body.style.backgroundImage = `url(${reader.result})`;
        document.body.style.backgroundSize = "cover";
        document.body.style.backgroundPosition = "center";
        document.body.style.backgroundColor = "";
      };
      reader.readAsDataURL(file);
    };

    const toggleSidebar = () => {
      setIsSidebarOpen(prev => !prev);
    };

    const handleCloseSidebar = () => {
        setIsSidebarOpen(false);
    };

    // CSS cho icon 3 gạch (Hamburger)
    const HamburgerIcon = (
      <div 
        style={{ 
          display: 'flex', 
          flexDirection: 'column', 
          justifyContent: 'space-around', 
          width: '50%',
          height: '50%',
          margin: 'auto'
        }}
      >
        {/* Dùng class cho thanh ngang */}
        <div className={styles.iconBar}></div>
        <div className={styles.iconBar}></div>
        <div className={styles.iconBar}></div>
      </div>
    );

    return (
      <>
      {/* Lớp phủ mờ khi Sidebar mở - bấm ra ngoài để tắt sidebar */}
        {isSidebarOpen && (
            <div 
                onClick={handleCloseSidebar}
                style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    backgroundColor: 'rgba(122, 118, 118, 0.3)', // Độ mờ 30%
                    zIndex: 999, 
                    transition: 'opacity 0.3s ease-in-out',
                    cursor: 'pointer',
                }}
            />
        )}

        {/* 1. Nút Menu/Toggle */}
        <button 
          onClick={toggleSidebar} 
          title="Mở Tùy chỉnh nền"
          className={styles.toggleButton} // 🔥 SỬ DỤNG CLASS
          style={{ 
            // Vị trí cố định (Giữ lại CSS in-line nếu bạn không muốn refactor toàn bộ)
            // Tốt nhất là sử dụng class: className={styles.toggleButton}
            transform: isSidebarOpen ? 'rotate(0deg)' : 'rotate(0deg)', // Bạn có thể thêm xoay ở đây
          }}
        >
          {HamburgerIcon} 
        </button>

        {/* 2. Sidebar Menu */}
        <div 
          className={styles.sidebar} 
          style={{ 
            transform: isSidebarOpen ? 'translateX(0)' : 'translateX(-100%)',
            transition: 'transform 0.3s ease-in-out',
            pointerEvents: isSidebarOpen ? 'auto' : 'none', // Fix lỗi chặn click
          }}
        >
          {/* ... (Nội dung sidebar) ... */}
          <div className={styles.sidebarHeader}>
              Tùy Chỉnh Giao Diện
          </div>
          <div className={styles.menuItem}>
              <label title="Chọn màu nền" className={styles.labelWrapper}>
                  <span className={styles.linkText}>Chọn Màu Nền</span>
                  <input type="color" value={bgColor} onChange={handleColorChange} style={{ display: 'none' }} />
                  <div className={styles.actionPlus} title="Mở bảng chọn màu" style={{ border: `2px solid ${bgColor}` }}>
                    +
                  </div>
              </label>
          </div>
          <div className={styles.menuItem}>
              <label title="Upload ảnh nền" className={styles.labelWrapper}>
                  <span className={styles.linkText}>Upload Ảnh Nền</span>
                  <input type="file" accept="image/*" onChange={handleImageUpload} style={{ display: "none" }}/>
                  <div className={styles.actionPlus} title="Tải lên">
                    +
                  </div>
              </label>
          </div>
          <Link 
              href="/dashboard" 
              className={styles.dashboardHeader}
          >
            <span className={styles.dashboardLink}>Dashboard</span>
          </Link>
          <div className={styles.logoutContainer}> 
              <LogoutButton
                style={{
                  backgroundColor: '#dc3545', 
                  color: 'white',
                  border: 'none',
                  padding: '10px 20px',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  width: '100%',
                  fontWeight: 'bold',
                }}
              >
                 Đăng Xuất
              </LogoutButton>
          </div>
          </div>

      </>
    );
  }


// 💡 TẠO COMPONENT MỚI ĐỂ XEM CHI TIẾT
function TaskDetailsView({ event }: { event: any }) {
  const taskTypeIcons = { work: "💼", study: "📚", outdoor: "🌳", personal: "🧘", other: "🔹" };

  return (
    <div className={styles.taskDetailsView}>
      <h3>Task Details</h3>
      <h4>{taskTypeIcons[event.type as keyof typeof taskTypeIcons] || "🔹"} {event.title}</h4>
      <p><strong>Bắt đầu:</strong> {new Date(event.start).toLocaleString()}</p>
      <p><strong>Kết thúc:</strong> {new Date(event.end).toLocaleString()}</p>
      <p><strong>Mô tả:</strong></p>
      <p className={styles.taskDescription}>{event.description || "Không có mô tả."}</p>

      <div style={{ marginTop: 10 }}>
        <strong>Collaborators:</strong>
        {event.collaborators && event.collaborators.length > 0 ? (
          <ul style={{ paddingLeft: 16, marginTop: 6 }}>
            {event.collaborators.map((c: any) => (
              <li key={c.user_id} style={{ marginBottom: 6 }}>
                <span style={{ marginRight: 8 }}>
                  {c.profile?.username || c.profile?.email || "Bạn ẩn danh"}
                </span>
                <small style={{ color: "#666" }}>{c.role ? `(${c.role})` : ""}</small>
              </li>
            ))}
          </ul>
        ) : (
          <div style={{ marginTop: 6, color: "#666" }}>Không có cộng tác viên</div>
        )}
      </div>

      <p className={styles.viewNote}>
        Nhấn vào công việc để chỉnh sửa.
      </p>
    </div>
  );
}


function AddTaskForm({ newTask, setNewTask, handleAddTask,friendsList = [], currentUser }: any) {
  // Thêm subtask
  const addSubtaskField = () => {
    setNewTask({
      ...newTask,
      subtasks: [...newTask.subtasks, { title: "", assignee_id: currentUser?.id }]
    });
  };

  // --- HELPER: Cập nhật nội dung subtask ---
  const updateSubtask = (index: number, field: string, value: any) => {
    const updatedSubtasks = [...newTask.subtasks];
    updatedSubtasks[index] = { ...updatedSubtasks[index], [field]: value };
    setNewTask({ ...newTask, subtasks: updatedSubtasks });
  };

  // --- HELPER: Xóa subtask ---
  const removeSubtask = (index: number) => {
    const updatedSubtasks = newTask.subtasks.filter((_: any, i: number) => i !== index);
    setNewTask({ ...newTask, subtasks: updatedSubtasks });
  };

  // Tạo danh sách những người có thể assign task (Gồm mình + bạn bè đã chọn)
  const assignableUsers = [
    { id: currentUser?.id, name: '🙋‍♂️ Tôi' },
    ...(newTask.visibility === 'PUBLIC' 
        ? friendsList.filter((f: any) => newTask.collaborators?.includes(f.id)) 
        : [])
  ];

 return (
    <div className={styles.addForm}> 
      <h3>Add New Task</h3>
      <label>
        Title:
        <input
          type="text"
          value={newTask.title}
          onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
        />
      </label>
      <label>
        Description:
        <input
          type="text"
          value={newTask.description}
          onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
        />
      </label>
      <label>
        Start:
        <input
          type="datetime-local"
          value={newTask.start}
          onChange={(e) => setNewTask({ ...newTask, start: e.target.value })}
        />
      </label>
      <label>
        End:
        <input
          type="datetime-local"
          value={newTask.end}
          onChange={(e) => setNewTask({ ...newTask, end: e.target.value })}
        />
      </label>
      <label>
        Color:
        <input
          type="color"
          value={newTask.color}
          onChange={(e) => setNewTask({ ...newTask, color: e.target.value })}
        />
      </label>
      <label>
        Type:
        <select
          value={newTask.type}
          onChange={(e) => setNewTask({ ...newTask, type: e.target.value })}
        >
          <option value="work">Công việc</option>
          <option value="study">Học tập</option>
          <option value="outdoor">Ngoài trời</option>
          <option value="personal">Cá nhân</option>
          <option value="other">Khác</option>
        </select>
      </label>
      {/* Chọn chế độ */}
      <div style={{ marginTop: '15px', marginBottom: '15px' }}>
        <label style={{ fontWeight: 'bold' }}>Chế độ:</label>
        <div style={{ display: 'flex', gap: '10px', marginTop: '5px' }}>
          <button 
            className={newTask.visibility === 'PRIVATE' ? styles.save : styles.cancel}
            onClick={() => setNewTask({ ...newTask, visibility: 'PRIVATE', collaborators: [] })}
          >
            🔒 Cá nhân
          </button>
          <button 
            className={newTask.visibility === 'PUBLIC' ? styles.save : styles.cancel}
            onClick={() => setNewTask({ ...newTask, visibility: 'PUBLIC' })}
          >
            👥 Hợp tác
          </button>
        </div>
      </div>
      {/* Chọn bạn bè (nếu chế độ PUBLIC) */}
      {newTask.visibility === 'PUBLIC' && (
        <div style={{ marginBottom: '15px', padding: '10px', border: '1px dashed #ccc', borderRadius: '6px' }}>
          <label style={{ fontWeight: 'bold' }}>Mời bạn bè tham gia:</label>
          <div style={{ maxHeight: '100px', overflowY: 'auto', marginTop: '5px' }}>
            {friendsList.map((friend: any) => (
              <div key={friend.id} style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                <input
                  type="checkbox"
                  id={`friend-${friend.id}`}
                  checked={newTask.collaborators?.includes(friend.id) || false}
                  onChange={(e) => {
                    const currentCollaborators = newTask.collaborators || [];
                    if (e.target.checked) {
                      setNewTask({ ...newTask, collaborators: [...currentCollaborators, friend.id] });
                    } else {
                      setNewTask({ ...newTask, collaborators: currentCollaborators.filter((id: string) => id !== friend.id) });
                    }
                  }}
                />
                <label htmlFor={`friend-${friend.id}`} style={{ cursor: 'pointer' }}>{friend.name}</label>
              </div>
            ))}
          </div>
        </div>
      )}
      {/* Subtasks */}
      <div style={{ marginBottom: '20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <label style={{ fontWeight: 'bold' }}>Công việc nhỏ (Subtasks):</label>
          <button onClick={addSubtaskField} style={{ fontSize: '12px', padding: '2px 8px', cursor: 'pointer' }}>+ Thêm</button>
        </div>
        
        <div style={{ marginTop: '10px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {newTask.subtasks?.map((st: any, index: number) => (
            <div key={index} style={{ display: 'flex', gap: '5px' }}>
              {/* Tên subtask */}
              <input
                type="text"
                placeholder="Tên việc nhỏ..."
                value={st.title}
                onChange={(e) => updateSubtask(index, 'title', e.target.value)}
                style={{ flex: 1 }}
              />
              {/* Dropdown chọn người làm */}
              <select
                value={st.assignee_id}
                onChange={(e) => updateSubtask(index, 'assignee_id', e.target.value)}
                className={styles.subtaskSelect}
                title={`Assign subtask ${st.title || 'New subtask'}`}
                aria-label={`Assign subtask ${st.title || 'New subtask'}`}
              >
                 {assignableUsers.map((u: any) => (
                   <option key={u.id} value={u.id}>{u.name}</option>
                 ))}
              </select>
              {/* Nút xoá dòng này */}
              <button onClick={() => removeSubtask(index)} style={{ color: 'red', border: 'none', background: 'none', cursor: 'pointer' }}>✕</button>
            </div>
          ))}
        </div>
      </div>

      <div className={styles.buttonGroupadd}>
        <button className={styles.save} onClick={handleAddTask}>Add Task</button>
        {/* Nút Cancel giờ sẽ clear form */}
        <button 
          className={styles.cancel} 
          onClick={() => setNewTask({ title: "", start: "", end: "", color: "#3174ad", type: "work", description: "" })}
        >
          Clear
        </button>
      </div>
    </div>
  );
}

function PointsBar({ points }: { points: number }) {
  return (
    <div style={{ margin: "20px auto", maxWidth: "400px", textAlign: "center" }}>
      <div style={{ fontWeight: "bold", marginBottom: "5px" }}>Points: {points}</div>
      <div style={{ background: "#ecdfdf", borderRadius: "6px", height: "20px", overflow: "hidden" }}>
        <div
          style={{
            width: `${Math.min(points, 100)}%`,
            background: "#8adb8d",
            height: "100%",
            transition: "width 0.3s",
          }}
        />
      </div>
    </div>
  );
}



interface Task {
  id: number;
  title: string;
  description?: string;
  start: Date | string;
  end: Date | string;
  color: string;
  type: string;
  completed?: boolean;
}

interface EditModalProps {
  selectedEvent: Task;
  setEvents: React.Dispatch<React.SetStateAction<Task[]>>;
  setShowModal: (show: boolean) => void;
  setPoints: React.Dispatch<React.SetStateAction<number>>;
  events: Task[];
}

function EditModal({ selectedEvent, setEvents, setShowModal, setPoints, events, supabase, friendsList = [], currentUser }: EditModalProps & { supabase: any, friendsList?: any[], currentUser?: any }) {
  const [editingEvent, setEditingEvent] = useState<any>(selectedEvent);
  const [localCollaborators, setLocalCollaborators] = useState<string[]>([]); // mảng user_id string

  useEffect(() => {
    setEditingEvent(selectedEvent);
    // Init local collaborators from selectedEvent.collaborators (mảng object)
    const init = (selectedEvent?.collaborators || []).map((c: any) => c.user_id);
    setLocalCollaborators(init);
  }, [selectedEvent]);

  const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const target = e.target as HTMLInputElement | HTMLSelectElement;
    const { name, value, type } = target;
    const checked = (target as HTMLInputElement).checked;
    const finalValue = type === 'checkbox' ? checked : value;
    setEditingEvent((prev: any) => ({ ...prev, [name]: finalValue }));
  };

  const toggleCollaborator = (userId: string) => {
    setLocalCollaborators(prev => prev.includes(userId) ? prev.filter(id => id !== userId) : [...prev, userId]);
  };

  const handleDelete = async () => {
    if (window.confirm(`Bạn có chắc muốn xóa công việc "${selectedEvent.title}" không?`)) {
      const { error } = await supabase.from("tasks").delete().eq("id", selectedEvent.id);
      if (error) {
        console.error("Lỗi khi xóa công việc:", error);
        alert("Xóa thất bại!");
      } else {
        // Xóa collaborators liên quan (cleanup) - optional
        await supabase.from("task_collaborators").delete().eq("task_id", selectedEvent.id);
        setEvents((prev) => prev.filter((ev) => ev.id !== selectedEvent.id));
        setShowModal(false);
      }
    }
  };

  const handleSave = async () => {
    try {
      // chuẩn hoá start/end
      const startDate = new Date(editingEvent.start);
      const endDate = new Date(editingEvent.end);

      // Update tasks table
      const { error: updateError } = await supabase
        .from("tasks")
        .update({
          title: editingEvent.title,
          description: editingEvent.description,
          start_time: startDate.toISOString(),
          end_time: endDate.toISOString(),
          color: editingEvent.color,
          type: editingEvent.type,
          completed: editingEvent.completed,
          visibility: editingEvent.visibility || "PRIVATE"
        })
        .eq("id", editingEvent.id);

      if (updateError) {
        console.error("Lỗi khi cập nhật công việc:", updateError);
        alert("Lưu thay đổi thất bại. Vui lòng thử lại.");
        return;
      }

      // Đồng bộ task_collaborators:
      // 1) Xóa các bản ghi cũ của task
      const { error: delError } = await supabase.from("task_collaborators").delete().eq("task_id", editingEvent.id);
      if (delError) {
        console.error("Không xóa được collaborators cũ:", delError);
        // không return; cố gắng tiếp tục insert mới
      }

      // 2) Insert các collaborators mới (nếu visibility === PUBLIC)
      if (editingEvent.visibility === "PUBLIC" && localCollaborators.length > 0) {
        const payload = localCollaborators.map((uid) => ({
          task_id: editingEvent.id,
          user_id: uid,
          role: "EDITOR",
        }));
        const { error: insError } = await supabase.from("task_collaborators").insert(payload);
        if (insError) {
          console.error("Lỗi khi insert collaborators:", insError);
        }
      }

      // 3) Load collaborators detail mới (để cập nhật state)
      // Lấy rows collaborators
      const { data: collabRows } = await supabase
        .from("task_collaborators")
        .select("user_id, role")
        .eq("task_id", editingEvent.id);

      let collaborators = [];
      if (collabRows && collabRows.length > 0) {
        const userIds = collabRows.map((r: any) => r.user_id);
        const { data: profilesData } = await supabase
          .from("profiles")
          .select("id, username, email, avatar_url")
          .in("id", userIds);

        const profMap = (profilesData || []).reduce((acc: any, p: any) => { acc[p.id] = p; return acc; }, {});
        collaborators = collabRows.map((r: any) => ({ user_id: r.user_id, role: r.role, profile: profMap[r.user_id] || null }));
      }

      const finalEventToSave = {
        ...editingEvent,
        start: startDate,
        end: endDate,
        collaborators,
      };

      // Cập nhật events ở parent
      setEvents((prev) => prev.map(ev => ev.id === finalEventToSave.id ? finalEventToSave : ev));

      // Logic cộng điểm giống bạn (không đổi)
      const originalEvent = events.find((ev) => ev.id === finalEventToSave.id);
      const wasCompleted = originalEvent ? originalEvent.completed : false;
      const now = new Date();
      if (finalEventToSave.completed && !wasCompleted && finalEventToSave.end <= now) {
        setPoints((prev) => prev + 10);
      }

      setShowModal(false);
    } catch (err) {
      console.error("Lỗi khi lưu edit modal:", err);
      alert("Lưu thất bại, kiểm tra console.");
    }
  };

  if (!editingEvent) return null;

  const formatDateTimeLocal = (date: string | Date | undefined) => {
    if (!date) return "";
    const d = new Date(date);
    d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
    return d.toISOString().slice(0, 16);
  };

  return (
    <div className={styles.editForm}>
      <h3>Edit Task</h3>
      <label>
        Title:
        <input type="text" name="title" value={editingEvent.title} onChange={handleChange} />
      </label>
      <label>
        Description:
        <input type="text" name="description" value={editingEvent.description || ""} onChange={handleChange} />
      </label>
      <label>
        Start:
        <input type="datetime-local" name="start" value={formatDateTimeLocal(editingEvent.start)} onChange={handleChange} />
      </label>
      <label>
        End:
        <input type="datetime-local" name="end" value={formatDateTimeLocal(editingEvent.end)} onChange={handleChange} />
      </label>
      <label>
        Color:
        <input type="color" name="color" value={editingEvent.color} onChange={handleChange} />
      </label>
      <label>
        Type:
        <select name="type" value={editingEvent.type} onChange={handleChange}>
          <option value="work">Công việc</option>
          <option value="study">Học tập</option>
          <option value="outdoor">Ngoài trời</option>
          <option value="personal">Cá nhân</option>
          <option value="other">Khác</option>
        </select>
      </label>

      <div style={{ marginTop: 10 }}>
        <strong>Visibility:</strong>
        <div style={{ display: "flex", gap: 8, marginTop: 6 }}>
          <button onClick={() => setEditingEvent((p: any) => ({ ...p, visibility: "PRIVATE" }))} className={editingEvent.visibility === "PRIVATE" ? styles.save : styles.cancel}>🔒 Cá nhân</button>
          <button onClick={() => setEditingEvent((p: any) => ({ ...p, visibility: "PUBLIC" }))} className={editingEvent.visibility === "PUBLIC" ? styles.save : styles.cancel}>👥 Hợp tác</button>
        </div>
      </div>

      {/* Collaborators chooser */}
      {editingEvent.visibility === "PUBLIC" && (
        <div style={{ marginTop: 12, border: "1px dashed #ccc", padding: 8, borderRadius: 6 }}>
          <label style={{ fontWeight: "bold" }}>Collaborators</label>
          <div style={{ maxHeight: 120, overflowY: "auto", marginTop: 6 }}>
            {friendsList.length === 0 && <div style={{ color: "#666" }}>Bạn chưa có bạn bè trong danh sách</div>}
            {friendsList.map((f: any) => (
              <div key={f.id} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                <input
                  type="checkbox"
                  checked={localCollaborators.includes(f.id)}
                  onChange={() => toggleCollaborator(f.id)}
                />
                <span>{f.name}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <label className={styles.checkboxLabel}>
        Completed:
        <div className={styles.checkboxWrapper}>
          <input type="checkbox" name="completed" checked={!!editingEvent.completed} onChange={handleChange} />
        </div>
      </label>

      <div className={styles.buttonGroup}>
        <button className={styles.saveBtn} onClick={handleSave}>Save</button>
        <button className={styles.deleteBtn} onClick={handleDelete}>Delete</button>
        <button className={styles.cancelBtn} onClick={() => setShowModal(false)}>Cancel</button>
      </div>
    </div>
  );
}
