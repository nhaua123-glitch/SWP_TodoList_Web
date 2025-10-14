"use client";

import { useState, useEffect } from "react";
import { Calendar, dateFnsLocalizer } from "react-big-calendar";
import { format, parse, startOfWeek, getDay } from "date-fns";
import enUS from "date-fns/locale/en-US";
import { createClient } from "@supabase/supabase-js";
import "react-big-calendar/lib/css/react-big-calendar.css";
import Link from "next/link";
import { useRouter } from "next/navigation";
import LogoutButton from "@/components/LogoutButton";
import styles from "./calendar.module.css";
import WidgetTimer from "../components/widgettimer";
import withDragAndDrop from "react-big-calendar/lib/addons/dragAndDrop";
import "react-big-calendar/lib/addons/dragAndDrop/styles.css";
import { isAuthenticated as checkAuthStatus } from "@/lib/auth"; 


const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY. Please check your .env.local file or Hosting configuration.');
}

const supabase = createClient(supabaseUrl, supabaseKey);
// ===================================

const locales = { "en-US": enUS };
const localizer = dateFnsLocalizer({ format, parse, startOfWeek, getDay, locales });

const DragAndDropCalendar = withDragAndDrop(Calendar);


export default function Home() {
  const router = useRouter();
  const [events, setEvents] = useState<any[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<any>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [points, setPoints] = useState(0);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  
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

  // Kiểm tra authentication
  useEffect(() => {
    const checkAuth = () => {
      const user = localStorage.getItem('user');
      const session = localStorage.getItem('session');
      
      console.log('Checking auth:', { user, session });
      
      if (user && session) {
        try {
          const sessionData = JSON.parse(session);
          const now = Date.now() / 1000;
          
          if (sessionData.expires_at && sessionData.expires_at > now) {
            console.log('User is authenticated');
            setIsAuthenticated(true);
            setLoading(false);
            fetchTasks(); 
          } else {
            console.log('Session expired');
            localStorage.removeItem('user');
            localStorage.removeItem('session');
            router.push('/login');
          }
        } catch (error) {
          console.error('Invalid session:', error);
          localStorage.removeItem('user');
          localStorage.removeItem('session');
          router.push('/login');
        }
      } else {
        console.log('No user or session found');
        router.push('/login');
      }
    };

    checkAuth();
  }, [router]);

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

    const task = {
      title: newTask.title,
      description: newTask.description,
      start_time: newTask.start,
      end_time: newTask.end,
      color: newTask.color,
      type: newTask.type,
      completed: false,
    };

    const { data, error } = await supabase.from("tasks").insert([task]).select();
    if (error) console.error(error);
    else {
      const added = {
        ...data[0],
        start: new Date(data[0].start_time),
        end: new Date(data[0].end_time),
      };
      setEvents([...events, added]);
      setShowAddModal(false);
      setNewTask({ title: "", start: "", end: "", color: "#3174ad", type: "work", description: "" });
    }
  };

  const handleSelectSlot = (slotInfo: any) => {
    setNewTask({
      title: "",
      description: "", 
      start: slotInfo.start.toISOString().slice(0, 16),
      end: slotInfo.end.toISOString().slice(0, 16),
      color: "#6a879fff",
      type: "work",
    });
    setShowAddModal(true);
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

  const EventComponent = ({ event }: { event: any }) => {
    const start = new Date(event.start).toLocaleString();
    const end = new Date(event.end).toLocaleString();
    return (
      <span
        title={`📌 ${event.title}\n🗓 ${start} - ${end}\n📝 ${event.description || "No description"}`}
        style={{ cursor: "pointer" }}
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

      <BackgroundCustomizer />
      <h2 className={styles.title}>My Task Calendar</h2>

      {/* FORM ADD BÊN NGOÀI */}
      <div className={styles.taskForm}>
        <input
          type="text"
          placeholder="Add New Task Title"
          value={newTask.title}
          onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
        />
        <input
          type="text"
          placeholder="Description"
          value={newTask.description}
          onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
        />
        <input
          type="datetime-local"
          value={newTask.start}
          onChange={(e) => setNewTask({ ...newTask, start: e.target.value })}
        />
        <input
          type="datetime-local"
          value={newTask.end}
          onChange={(e) => setNewTask({ ...newTask, end: e.target.value })}
        />
        <input
          type="color"
          value={newTask.color}
          onChange={(e) => setNewTask({ ...newTask, color: e.target.value })}
        />
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
        <button onClick={handleAddTask}>Add Task</button>
      </div>

      {/* CALENDAR SỬ DỤNG DRAG AND DROP */}
      <div className={styles.calendarContainer}>
        <DragAndDropCalendar
          localizer={localizer}
          events={events}
          startAccessor="start"
          endAccessor="end"
          style={{ height: 600 }}
          eventPropGetter={eventStyleGetter}
          onSelectEvent={(event) => {
            setSelectedEvent(event);
            setShowEditModal(true);
          }}
          selectable
          onSelectSlot={handleSelectSlot}
          components={{
            event: EventComponent,
          }}
          resizable={false}
          onEventDrop={handleEventDrop}
          
          // 💡 QUẢN LÝ CHẾ ĐỘ XEM (MONTH/WEEK/DAY)
          view={view} 
          onView={setView} 
          
          // 💡 QUẢN LÝ ĐIỀU HƯỚNG (BACK/NEXT)
          date={date}
          onNavigate={setDate} 
        />
      </div>

      {/* MODAL ADD */}
      {showAddModal && (
        <AddModal
          newTask={newTask}
          setNewTask={setNewTask}
          handleAddTask={handleAddTask}
          setShowAddModal={setShowAddModal}
        />
      )}

      {/* MODAL EDIT */}
      {showEditModal && selectedEvent && (
        <EditModal
          selectedEvent={selectedEvent}
          setSelectedEvent={setSelectedEvent}
          setEvents={setEvents}
          events={events}
          setShowModal={setShowEditModal}
          setPoints={setPoints} 
        />
      )}

      {/* WIDGET TIMER */}
      <WidgetTimer tasks={events} /> 
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

function AddModal({ newTask, setNewTask, handleAddTask, setShowAddModal }: any) {
  return (
    <div className={styles.modaladd}>
      <h3>Add Task</h3>
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
        <button className={styles.save} onClick={handleAddTask}>Add</button>
        <button className={styles.cancel} onClick={() => setShowAddModal(false)}>Cancel</button>
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

function EditModal({ selectedEvent, setEvents, setShowModal, setPoints, events }) {
  // ✅ STATE: Dùng state cục bộ này để lưu lại các thay đổi khi bạn chỉnh sửa.
  const [editingEvent, setEditingEvent] = useState(selectedEvent);

  // useEffect này đảm bảo rằng nếu một sự kiện mới được chọn,
  // form chỉnh sửa sẽ được reset lại với dữ liệu của sự kiện mới đó.
  useEffect(() => {
    setEditingEvent(selectedEvent);
  }, [selectedEvent]);

  // ✅ HANDLER: Một hàm xử lý duy nhất cho tất cả các input trong form.
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
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
    <div className={styles.modal}>
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