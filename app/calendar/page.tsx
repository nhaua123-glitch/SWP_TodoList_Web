"use client";

import { useState, useEffect } from "react";
import { Calendar, dateFnsLocalizer } from "react-big-calendar";
import { format, parse, startOfWeek, getDay } from "date-fns";
import enUS from "date-fns/locale/en-US";
import { createClient } from "@supabase/supabase-js";
import "react-big-calendar/lib/css/react-big-calendar.css";
import Link from "next/link";
import styles from "./calendar.module.css";
import WidgetTimer from "../components/widgettimer";
// 1. IMPORT THÊM withDragAndDrop
import withDragAndDrop from "react-big-calendar/lib/addons/dragAndDrop";
import "react-big-calendar/lib/addons/dragAndDrop/styles.css"; // Import CSS cần thiết

// ========== SUPABASE ==========
const supabase = createClient(
  "https://lmgbtjieffptlrvjkimp.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxtZ2J0amllZmZwdGxydmpraW1wIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg4ODEyNzEsImV4cCI6MjA3NDQ1NzI3MX0.-9fEQrwQvzHZfcWIOiukGKmcVyECoMUf8fRffWSPlEs"
);

// Localizer cho Calendar
const locales = { "en-US": enUS };
const localizer = dateFnsLocalizer({ format, parse, startOfWeek, getDay, locales });

// 2. TẠO DRAG AND DROP CALENDAR
// Component này phải nằm ngoài hàm export default Home()
const DragAndDropCalendar = withDragAndDrop(Calendar);


export default function Home() {
  const [events, setEvents] = useState<any[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<any>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [points, setPoints] = useState(0);
  
  // task mới (dùng chung cho form ngoài & modal add)
  const [newTask, setNewTask] = useState<any>({
    title: "",
    description: "",
    start: "",
    end: "",
    color: "#3174ad",
    type: "work",
  });

  // lấy task từ supabase
  useEffect(() => {
    fetchTasks();
  }, []);

  const fetchTasks = async () => {
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
  };

  // thêm task
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
      // reset form ngoài
      setNewTask({ title: "", start: "", end: "", color: "#3174ad", type: "work" });
    }
  };

  // click vào ô trống trong calendar
  const handleSelectSlot = (slotInfo: any) => {
    setNewTask({
      title: "",
      start: slotInfo.start.toISOString().slice(0, 16),
      end: slotInfo.end.toISOString().slice(0, 16),
      color: "#6a879fff",
      type: "work",
    });
    setShowAddModal(true);
  };

  // 3. HÀM XỬ LÝ KÉO VÀ THẢ (DRAG AND DROP)
  const handleEventDrop = async ({ event, start, end, isAllDay }: any) => {
    // 1. Cập nhật trạng thái cục bộ
    const updatedEvents = events.map((existingEvent) =>
      existingEvent.id === event.id ? { ...existingEvent, start, end, isAllDay } : existingEvent
    );
    setEvents(updatedEvents);

    // 2. Cập nhật Supabase
    // Cần format lại Date object thành chuỗi ISO string (để khớp với kiểu dữ liệu trong DB)
    const { error } = await supabase
      .from("tasks")
      .update({
        start_time: start.toISOString(),
        end_time: end.toISOString(),
      })
      .eq("id", event.id);

    if (error) console.error("Error updating task date in Supabase:", error);
  };
  
  // style cho event trên calendar
  const eventStyleGetter = (event: any) => {
    const backgroundColor = event.completed ? "gray" : event.color || "#285882ff";
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



  return (
    <div className={styles.page}>
      <PointsBar points={points} />
      <div className={styles.navbar}>
        <Link href="/list">
          <button className={styles.switchBtn}>📋 List</button>
        </Link>
      </div>

      <BackgroundCustomizer />
      <h2 className={styles.title}>My Task Calendar</h2>

      {/* FORM ADD BÊN NGOÀI */}
      <div className={styles.taskForm}>
        <input
          type="text"
          placeholder="Add New Task"
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
      <DragAndDropCalendar // Đã đổi tên thành DragAndDropCalendar
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
              // 4. THÊM PROPS CHO DRAG AND DROP
              resizable={false} // Cho phép kéo dài/thu ngắn sự kiện (có thể bật nếu cần)
              onEventDrop={handleEventDrop} // Xử lý khi kéo và thả
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
          setShowModal={setShowEditModal}
          // Truyền setPoints xuống để cập nhật điểm khi hoàn thành task
          setPoints={setPoints} 
        />
      )}

      {/* WIDGET TIMER */}
      {/* Truyền events và selectedEvent cho WidgetTimer */}
      <WidgetTimer tasks={events} /> 
    </div>
    
  );
}

// ---------- BackgroundCustomizer ----------
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

// ---------- AddModal ----------
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

/* Hiển thị điểm số */
function PointsBar({ points }: { points: number }) {
  return (
    <div style={{ margin: "20px auto", maxWidth: "400px", textAlign: "center" }}>
      <div style={{ fontWeight: "bold", marginBottom: "5px" }}>Points: {points}</div>
      <div style={{ background: "#ecdfdfff", borderRadius: "6px", height: "20px", overflow: "hidden" }}>
        <div
          style={{
            width: `${Math.min(points, 100)}%`, // nếu muốn max 100 điểm
            background: "#8adb8d",
            height: "100%",
            transition: "width 0.3s",
          }}
        />
      </div>
    </div>
  );
}

// ---------- EditModal ----------
function EditModal({ selectedEvent, setSelectedEvent, setEvents, setShowModal, setPoints }: any) { // Thêm setPoints
  const handleDelete = async () => {
    await supabase.from("tasks").delete().eq("id", selectedEvent.id);
    setEvents((prev: any[]) => prev.filter((ev) => ev.id !== selectedEvent.id));
    setShowModal(false);
  };

  const handleSave = async () => {
    // Lưu lại trạng thái completed cũ trước khi cập nhật
    const oldCompleted = setEvents.find((ev: any) => ev.id === selectedEvent.id)?.completed || false;
    
    // Cập nhật lên Supabase
    await supabase
      .from("tasks")
      .update({
        title: selectedEvent.title,
        description: selectedEvent.description,
        // Chuyển Date object sang ISO string để Supabase nhận đúng
        start_time: selectedEvent.start.toISOString(),
        end_time: selectedEvent.end.toISOString(),
        color: selectedEvent.color,
        type: selectedEvent.type,
        completed: selectedEvent.completed,
      })
      .eq("id", selectedEvent.id);

    // Cập nhật trạng thái cục bộ
    setEvents((prev: any[]) => prev.map((ev) => (ev.id === selectedEvent.id ? selectedEvent : ev)));

    // LOGIC CỘNG ĐIỂM
    const now = new Date();
    // Điều kiện cộng điểm: vừa được đánh dấu là HOÀN THÀNH VÀ trước đó CHƯA HOÀN THÀNH
    // Và task phải có thời gian hợp lệ (end >= start)
    const isNowCompleted = selectedEvent.completed;
    const wasCompleted = oldCompleted;
    
    // Kiểm tra đã hoàn thành, chưa hoàn thành trước đó, và task kết thúc đúng hoặc trước hiện tại (on time)
    if (isNowCompleted && !wasCompleted && selectedEvent.end >= selectedEvent.start && selectedEvent.end <= now) {
      setPoints((prev: number) => prev + 10);
    }

    setShowModal(false);
  };


  return (
    <div className={styles.modal}>
      <h3>Edit Task</h3>
      <label>
        Title:
        <input
          type="text"
          value={selectedEvent.title}
          onChange={(e) => setSelectedEvent({ ...selectedEvent, title: e.target.value })}
        />
      </label>
      <label>
        Description:
        <input
          type="text"
          value={selectedEvent.description || ""}
          onChange={(e) =>setSelectedEvent({ ...selectedEvent, description: e.target.value })}
        />
      </label>
      <label>
        Start:
        <input
          type="datetime-local"
          // Format Date object thành chuỗi datetime-local để hiển thị trong input
          value={new Date(selectedEvent.start).toISOString().slice(0, 16)} 
          onChange={(e) => setSelectedEvent({ ...selectedEvent, start: new Date(e.target.value) })}
        />
      </label>
      <label>
        End:
        <input
          type="datetime-local"
          // Format Date object thành chuỗi datetime-local để hiển thị trong input
          value={new Date(selectedEvent.end).toISOString().slice(0, 16)} 
          onChange={(e) => setSelectedEvent({ ...selectedEvent, end: new Date(e.target.value) })}
        />
      </label>
      <label>
        Color:
        <input
          type="color"
          value={selectedEvent.color}
          onChange={(e) => setSelectedEvent({ ...selectedEvent, color: e.target.value })}
        />
      </label>
      <label>
        Type:
        <select
          value={selectedEvent.type}
          onChange={(e) => setSelectedEvent({ ...selectedEvent, type: e.target.value })}
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
          checked={selectedEvent.completed}
          onChange={(e) => setSelectedEvent({ ...selectedEvent, completed: e.target.checked })}
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