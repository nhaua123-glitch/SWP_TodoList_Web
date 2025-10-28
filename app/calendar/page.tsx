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
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteMsg, setInviteMsg] = useState("");
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const clearTimer = () => {
    if (timerRef.current) {
      clearTimeout(timerRef.current as ReturnType<typeof setTimeout>);
      timerRef.current = null;
    }
  };





  // Khi di chuột ra khỏi task HOẶC sidebar
  const handleMouseLeave = () => {
    // Đặt timer để ẩn sidebar sau 300ms (đủ thời gian di chuyển chuột)
    timerRef.current = setTimeout(() => {
      setSelectedEvent(null);
    }, 300);
  };

  // Hàm gửi lời mời kết bạn
  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    setInviteMsg("");
    if (!inviteEmail) {
      setInviteMsg("Vui lòng nhập email bạn bè.");
      return;
    }
    // Lấy user hiện tại từ localStorage
    const user = JSON.parse(localStorage.getItem("user") || "{}");
    if (!user?.id) {
      setInviteMsg("Không tìm thấy thông tin người dùng.");
      return;
    }

    // Gửi lời mời lên Supabase
    const { error } = await supabase.from("friends").insert([
      {
        user_id: user.id,
        friend_email: inviteEmail,
        status: "pending",
      },
    ]);
    if (error) {
      setInviteMsg("Gửi lời mời thất bại: " + error.message);
    } else {
      setInviteMsg("Đã gửi lời mời kết bạn!");
      setInviteEmail("");
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
  });


  // 💡 SỬA CUỐI CÙNG: THAY TOÀN BỘ useEffect CŨ BẰNG CODE MỚI NÀY
  // (Dán vào Dòng 132)
  useEffect(() => {
    let isMounted = true; // Flag chống lỗi state update khi component unmount

    // Hàm fetch data riêng
    const fetchTasksForUser = async (userId: string) => {
      if (!isMounted) return;
      // Không cần setLoading(true) ở đây nữa
      const { data, error } = await supabase
        .from("tasks")
        .select("*")
        .eq('user_id', userId);

      if (!isMounted) return; // Check lại sau await

      if (error) {
        console.error("Lỗi fetch tasks:", error);
      } else {
        const formatted = data.map((task) => ({
          ...task,
          start: new Date(task.start_time),
          end: new Date(task.end_time),
        }));
        setEvents(formatted);
      }
       setLoading(false); // Set loading false sau khi fetch xong (kể cả lỗi)
    };

    // --- Luồng chính ---
    setLoading(true); // Bắt đầu loading

    // 1. Kiểm tra session ngay lập tức khi component mount
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!isMounted) return;
      if (session) {
        console.log('>>> Initial Check: Logged In - Fetching tasks...');
        setIsAuthenticated(true);
        fetchTasksForUser(session.user.id); // Fetch data ngay
      } else {
        console.log('>>> Initial Check: Logged Out - Relying on middleware.');
        setIsAuthenticated(false);
        setLoading(false); // Dừng loading nếu logout ngay từ đầu
        // Không redirect ở đây, để middleware lo
      }
    });

    // 2. Setup listener để xử lý login/logout SAU ĐÓ
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (!isMounted) return;

        console.log('>>> Auth Listener Event:', event);

        if (session) {
          // Khi login thành công (SIGNED_IN) hoặc token được refresh
          if (!isAuthenticated) { // Chỉ fetch lại nếu trước đó chưa auth
             console.log('>>> Listener: SIGNED_IN detected - Fetching tasks...');
             setIsAuthenticated(true);
             fetchTasksForUser(session.user.id);
          } else {
             // Nếu chỉ là TOKEN_REFRESHED hoặc INITIAL_SESSION (đã xử lý ở trên), không cần fetch lại
             setIsAuthenticated(true); // Đảm bảo state đúng
          }

        } else if (event === 'SIGNED_OUT') {
          // Khi logout
          console.log('>>> Listener: SIGNED_OUT detected - Redirecting...');
          setIsAuthenticated(false);
          setEvents([]); // Xóa task cũ
          setLoading(false);
          // Tạm thời disable redirect để test
          // router.push('/login'); // Chỉ redirect khi logout rõ ràng
        }
      }
    );

    // Cleanup khi component unmount
    return () => {
      isMounted = false;
      subscription?.unsubscribe();
    };
  }, [router, supabase]); // Dependencies


  const fetchTasks = async () => {
    setLoading(true);
    const { data, error } = await supabase.from("tasks").select("*");
    if (error) console.error(error);
    else {
      const formatted = data.map((task) => ({
        ...task,
        start: new Date(task.start_time),
        end: new Date(task.end_time),
      }));
      setEvents(formatted);
    }
    setLoading(false);
  };

  const handleAddTask = async () => {
    if (!newTask.title || !newTask.start || !newTask.end) return;

    // 1. Lấy thông tin người dùng hiện tại
    const { data: { user } } = await supabase.auth.getUser();

    // 2. Kiểm tra xem người dùng đã đăng nhập chưa
    if (!user) {
      console.error("User is not logged in. Cannot add task.");
      // Bạn có thể thêm thông báo cho người dùng ở đây
      return;
    }

    const task = {
      // 3. Thêm user_id vào task
      user_id: user.id, 
      title: newTask.title,
      description: newTask.description,
      start_time: newTask.start,
      end_time: newTask.end,
      color: newTask.color,
      type: newTask.type,
      completed: false,
    };

    const { data, error } = await supabase.from("tasks").insert([task]).select();
    
    if (error) {
      console.error("Supabase insert error:", error); // In lỗi ra để xem rõ hơn
    } else {
      const added = {
        ...data[0],
        start: new Date(data[0].start_time),
        end: new Date(data[0].end_time),
      };
      setEvents([...events, added]);
      setNewTask({ title: "", start: "", end: "", color: "#3174ad", type: "work", description: "" });
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

  // Tạm thời disable authentication check để test
  /*
  if (!isAuthenticated) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        fontSize: '18px'
      }}>
        Chuyển hướng đến trang đăng nhập...
      </div>
    );
  }
  */

  


  return (
    <div className={styles.page}>
      <PointsBar points={points} />
      <div className={styles.navbar}>
        <Link href="/dashboard">
          <button className={styles.switchBtn}>🏠 Dashboard</button>
        </Link>
        <Link href="/list">
          <button className={styles.switchBtn}>📋 List</button>
        </Link>
        <LogoutButton
          style={{
            backgroundColor: '#dc3545',
            color: 'white',
            border: 'none',
            padding: '8px 16px',
            borderRadius: '4px',
            marginLeft: '10px'
          }}
        >
          🚪 Logout
        </LogoutButton>
      </div>


      {/* === KẾT NỐI BẠN BÈ === */}
      <div style={{ margin: "20px 0", textAlign: "center" }}>
        <Link href="/friends">
          <button
            style={{
              background: "#2563eb",
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
              setShowModal={() => setSelectedEvent(null)} // Nút Cancel/Save sẽ set selectedEvent về null
              setPoints={setPoints}
              supabase={supabase}
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

function BackgroundCustomizer() {
  const [bgColor, setBgColor] = useState("#ffffff");

  useEffect(() => {
    document.body.style.backgroundColor = bgColor;
  }, [bgColor]);

  const handleColorChange = (e: any) => setBgColor(e.target.value);

  const handleImageUpload = (e: any) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => {
      document.body.style.backgroundImage = `url(${reader.result})`;
      document.body.style.backgroundSize = "cover";
      document.body.style.backgroundPosition = "center";
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className={styles.bgWidget}>
      <label title="Chọn màu nền">
        🎨
        <input type="color" value={bgColor} onChange={handleColorChange} style={{ display: "none" }} />
      </label>
      <label title="Upload ảnh nền">
        🖼
        <input type="file" accept="image/*" onChange={handleImageUpload} style={{ display: "none" }} />
      </label>
    </div>
  );
}

function FriendInviteWidget({ supabase }: { supabase: any }) { 
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteMsg, setInviteMsg] = useState("");

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteEmail) {
      setInviteMsg("Vui lòng nhập email bạn bè.");
      return;
    }
    // Lấy user hiện tại từ localStorage
    const user = JSON.parse(localStorage.getItem("user") || "{}");
    if (!user?.id) {
      setInviteMsg("Vui lòng đăng nhập để gửi lời mời.");
      return;
    }

    // Gửi lời mời lên Supabase
    const { error } = await supabase.from("friends").insert([
      {
        user_id: user.id,
        friend_email: inviteEmail,
        status: "pending",
      },
    ]);
    if (error) {
      setInviteMsg("Gửi lời mời thất bại: " + error.message);
    } else {
      setInviteMsg("Đã gửi lời mời kết bạn!");
      setInviteEmail("");
    }
  };

  return (
    <div className={styles.friendInviteWidget} style={{ margin: "24px 0" }}>
      <h3 style={{ fontSize: 18, fontWeight: 600, marginBottom: 8 }}>Kết nối với bạn bè qua email</h3>
      <form onSubmit={handleInvite} style={{ display: "flex", gap: 8 }}>
        <input
          type="email"
          placeholder="Nhập email bạn bè"
          value={inviteEmail}
          onChange={e => setInviteEmail(e.target.value)}
          style={{ flex: 1, padding: 8, borderRadius: 4, border: "1px solid #ccc" }}
          required
        />
        <button
          type="submit"
          style={{
            background: "#3174ad",
            color: "#fff",
            border: "none",
            borderRadius: 4,
            padding: "8px 16px",
            fontWeight: 600,
            cursor: "pointer"
          }}
        >
          Gửi lời mời
        </button>
      </form>
      {inviteMsg && (
        <div style={{ marginTop: 8, color: inviteMsg.startsWith("Đã gửi") ? "#22c55e" : "#e11d48" }}>
          {inviteMsg}
        </div>
      )}
    </div>
  );
}

// 💡 TẠO COMPONENT MỚI ĐỂ XEM CHI TIẾT
function TaskDetailsView({ event }: { event: any }) {
  const taskTypeIcons = { // Lấy lại icons
    work: "💼", study: "📚", outdoor: "🌳", personal: "🧘", other: "🔹"
  };

  return (
    <div className={styles.taskDetailsView}>
      <h3>Task Details</h3>
      <h4>{taskTypeIcons[event.type as keyof typeof taskTypeIcons] || "🔹"} {event.title}</h4>
      <p><strong>Bắt đầu:</strong> {new Date(event.start).toLocaleString()}</p>
      <p><strong>Kết thúc:</strong> {new Date(event.end).toLocaleString()}</p>
      <p><strong>Mô tả:</strong></p>
      <p className={styles.taskDescription}>{event.description || "Không có mô tả."}</p>
      <p className={styles.viewNote}>
        Nhấn vào công việc để chỉnh sửa.
      </p>
    </div>
  );
}

function AddTaskForm({ newTask, setNewTask, handleAddTask }: any) {
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
      <div style={{ background: "#ecdfdfff", borderRadius: "6px", height: "20px", overflow: "hidden" }}>
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

function EditModal({ selectedEvent, setEvents, setShowModal, setPoints, events, supabase }: EditModalProps & { supabase: any }) {
  // ✅ STATE: Dùng state cục bộ này để lưu lại các thay đổi khi bạn chỉnh sửa.
  const [editingEvent, setEditingEvent] = useState(selectedEvent);

  // useEffect này đảm bảo rằng nếu một sự kiện mới được chọn,
  // form chỉnh sửa sẽ được reset lại với dữ liệu của sự kiện mới đó.
  useEffect(() => {
    setEditingEvent(selectedEvent);
  }, [selectedEvent]);

  // ✅ HANDLER: Một hàm xử lý duy nhất cho tất cả các input trong form.
  const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const target = e.target as HTMLInputElement | HTMLSelectElement;
    const { name, value, type } = target;
    const checked = (target as HTMLInputElement).checked;
    // Nếu là checkbox thì lấy giá trị 'checked', ngược lại lấy 'value'.
    const finalValue = type === 'checkbox' ? checked : value;

    setEditingEvent(prev => ({
      ...prev,
      [name]: finalValue,
    }));
  };

  const handleDelete = async () => {
    // Nên có một bước xác nhận trước khi xóa.
    if (window.confirm(`Bạn có chắc muốn xóa công việc "${selectedEvent.title}" không?`)) {
      const { error } = await supabase.from("tasks").delete().eq("id", selectedEvent.id);
      if (error) {
        console.error("Lỗi khi xóa công việc:", error);
        alert("Xóa thất bại!");
      } else {
        setEvents((prev) => prev.filter((ev) => ev.id !== selectedEvent.id));
        setShowModal(false);
      }
    }
  };

  const handleSave = async () => {
    // Chuyển đổi giá trị chuỗi (string) từ input thành đối tượng Date để lưu trữ
    const finalEventToSave = {
      ...editingEvent,
      start: new Date(editingEvent.start),
      end: new Date(editingEvent.end),
    };

    // Tìm sự kiện gốc để so sánh trạng thái 'completed' cho logic cộng điểm
    const originalEvent = events.find((ev) => ev.id === finalEventToSave.id);
    const wasCompleted = originalEvent ? originalEvent.completed : false;

    // Cập nhật dữ liệu lên Supabase
    const { error } = await supabase
      .from("tasks")
      .update({
        title: finalEventToSave.title,
        description: finalEventToSave.description,
        start_time: finalEventToSave.start.toISOString(),
        end_time: finalEventToSave.end.toISOString(),
        color: finalEventToSave.color,
        type: finalEventToSave.type,
        completed: finalEventToSave.completed,
      })
      .eq("id", finalEventToSave.id);

    if (error) {
      console.error("Lỗi khi cập nhật công việc:", error);
      alert("Lưu thay đổi thất bại. Vui lòng kiểm tra console.");
      return;
    }

    // Cập nhật lại danh sách sự kiện ở component cha
    setEvents((prev) =>
      prev.map((ev) => (ev.id === finalEventToSave.id ? finalEventToSave : ev))
    );

    // Logic cộng điểm
    const now = new Date();
    const isNowCompleted = finalEventToSave.completed;
    // Chỉ cộng điểm khi: công việc vừa được chuyển sang 'hoàn thành' VÀ hoàn thành đúng giờ.
    if (isNowCompleted && !wasCompleted && finalEventToSave.end <= now) {
      setPoints((prev) => prev + 10);
    }

    setShowModal(false);
  };

  // Tránh lỗi nếu editingEvent là null
  if (!editingEvent) return null;

  // Hàm hỗ trợ định dạng ngày giờ cho input type="datetime-local"
  const formatDateTimeLocal = (date: string | Date | undefined) => {
    if (!date) return "";
    const d = new Date(date);
    // Điều chỉnh múi giờ trước khi cắt chuỗi để hiển thị đúng trên input
    d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
    return d.toISOString().slice(0, 16);
  };

  return (
    <div className={styles.editForm}>
      <h3>Edit Task</h3>
      <label>
        Title:
        <input
          type="text"
          name="title" // Thêm thuộc tính 'name'
          value={editingEvent.title} // Lấy giá trị từ 'editingEvent'
          onChange={handleChange} // Dùng hàm xử lý chung
        />
      </label>
      <label>
        Description:
        <input
          type="text"
          name="description" // Thêm thuộc tính 'name'
          value={editingEvent.description || ""} // Lấy giá trị từ 'editingEvent'
          onChange={handleChange}
        />
      </label>
      <label>
        Start:
        <input
          type="datetime-local"
          name="start" // Thêm thuộc tính 'name'
          value={formatDateTimeLocal(editingEvent.start)} // Dùng hàm định dạng ngày giờ
          onChange={handleChange}
        />
      </label>
      <label>
        End:
        <input
          type="datetime-local"
          name="end" // Thêm thuộc tính 'name'
          value={formatDateTimeLocal(editingEvent.end)} // Dùng hàm định dạng ngày giờ
          onChange={handleChange}
        />
      </label>
      <label>
        Color:
        <input
          type="color"
          name="color" // Thêm thuộc tính 'name'
          value={editingEvent.color}
          onChange={handleChange}
        />
      </label>
      <label>
        Type:
        <select
          name="type" // Thêm thuộc tính 'name'
          value={editingEvent.type}
          onChange={handleChange}
        >
          <option value="work">Công việc</option>
          <option value="study">Học tập</option>
          <option value="outdoor">Ngoài trời</option>
          <option value="personal">Cá nhân</option>
          <option value="other">Khác</option>
        </select>
      </label>
      <label>
        Completed:
        <input
          type="checkbox"
          name="completed" // Thêm thuộc tính 'name'
          checked={!!editingEvent.completed} // Dùng 'checked' và đảm bảo là boolean
          onChange={handleChange}
        />
      </label>
      <div className={styles.buttonGroup}>
        <button className={styles.saveBtn} onClick={handleSave}>Save</button>
        <button className={styles.deleteBtn} onClick={handleDelete}>Delete</button>
        <button className={styles.cancelBtn} onClick={() => setShowModal(false)}>Cancel</button>
      </div>
    </div>
  );
}
