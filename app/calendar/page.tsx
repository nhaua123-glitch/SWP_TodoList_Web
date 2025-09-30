"use client"; // important: để dùng client-side React hooks

import { useState, useEffect } from "react";
import { Calendar, dateFnsLocalizer } from "react-big-calendar";
import { format, parse, startOfWeek, getDay } from "date-fns";
import enUS from "date-fns/locale/en-US";
import { createClient } from "@supabase/supabase-js";
import "react-big-calendar/lib/css/react-big-calendar.css";


// ========== SUPABASE ==========
const supabase = createClient(
  "https://lmgbtjieffptlrvjkimp.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxtZ2J0amllZmZwdGxydmpraW1wIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg4ODEyNzEsImV4cCI6MjA3NDQ1NzI3MX0.-9fEQrwQvzHZfcWIOiukGKmcVyECoMUf8fRffWSPlEs"
);

// ========== Calendar Localizer ==========
const locales = { "en-US": enUS };
const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek,
  getDay,
  locales,
});

export default function Home() {
  const [events, setEvents] = useState([]);
  const [newTask, setNewTask] = useState({
    title: "",
    start: "",
    end: "",
    color: "#e9edf1ff",
    type: "work",
  });
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [showModal, setShowModal] = useState(false);

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

  const handleAddTask = async () => {
    if (!newTask.title || !newTask.start || !newTask.end) return;

    const task = {
      title: newTask.title,
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
      setNewTask({ title: "", start: "", end: "", color: "#155690ff", type: "work" });
    }
  };

  const eventStyleGetter = (event) => {
    const backgroundColor = event.completed ? "gray" : event.color || "#3174ad";
    return { style: { backgroundColor } };
  };

  return (
    <div className="App">
      <BackgroundCustomizer />
      <h2>My Task Calendar</h2>

      {/* ADD TASK FORM */}
      <div style={{ marginBottom: "20px" }}>
        <input
          type="text"
          placeholder="Task title"
          value={newTask.title}
          onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
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
          <option value="outdoor">Hoạt động ngoài trời</option>
          <option value="personal">Cá nhân</option>
          <option value="other">Khác</option>
        </select>
        <button onClick={handleAddTask}>Add Task</button>
      </div>

      {/* CALENDAR */}
      <Calendar
        localizer={localizer}
        events={events}
        startAccessor="start"
        endAccessor="end"
        style={{ height: 600 }}
        eventPropGetter={eventStyleGetter}
        onSelectEvent={(event) => {
          setSelectedEvent(event);
          setShowModal(true);
        }}
      />

      {/* MODAL EDIT */}
      {showModal && selectedEvent && (
        <EditModal
          selectedEvent={selectedEvent}
          setSelectedEvent={setSelectedEvent}
          setEvents={setEvents}
          setShowModal={setShowModal}
        />
      )}
    </div>
  );
}

// ---------- BackgroundCustomizer ----------
function BackgroundCustomizer() {
  const [bgColor, setBgColor] = useState("#ffffff");

  useEffect(() => {
    document.body.style.backgroundColor = bgColor;
  }, [bgColor]);

  const handleColorChange = (e) => setBgColor(e.target.value);

  const handleImageUpload = (e) => {
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
    <div className="bg-widget">
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

// ---------- EditModal ----------
function EditModal({ selectedEvent, setSelectedEvent, setEvents, setShowModal }) {
  const handleSave = async () => {
    await supabase
      .from("tasks")
      .update({
        title: selectedEvent.title,
        start_time: selectedEvent.start,
        end_time: selectedEvent.end,
        color: selectedEvent.color,
        type: selectedEvent.type,
        completed: selectedEvent.completed,
      })
      .eq("id", selectedEvent.id);

    setEvents((prev) =>
      prev.map((ev) => (ev.id === selectedEvent.id ? selectedEvent : ev))
    );
    setShowModal(false);
  };

  const handleDelete = async () => {
    await supabase.from("tasks").delete().eq("id", selectedEvent.id);
    setEvents((prev) => prev.filter((ev) => ev.id !== selectedEvent.id));
    setShowModal(false);
  };

  return (
    <div
      style={{
        position: "fixed",
        top: "50%",
        left: "50%",
        transform: "translate(-50%, -50%)",
        background: "white",
        padding: "25px",
        borderRadius: "8px",
        boxShadow: "0 4px 10px rgba(0,0,0,0.3)",
        zIndex: 999,
      }}
    >
      <h3>Edit Task</h3>
      <label style={{ display: "block", textAlign: "left" }}>
        Title:
        <input
          type="text"
          value={selectedEvent.title}
          onChange={(e) =>
            setSelectedEvent({ ...selectedEvent, title: e.target.value })
          }
        />
      </label>
      <label style={{ display: "block", textAlign: "left" }}>
        Start:
        <input
          type="datetime-local"
          value={new Date(selectedEvent.start).toISOString().slice(0, 16)}
          onChange={(e) =>
            setSelectedEvent({ ...selectedEvent, start: new Date(e.target.value) })
          }
        />
      </label>
      <label style={{ display: "block", textAlign: "left" }}>
        End:
        <input
          type="datetime-local"
          value={new Date(selectedEvent.end).toISOString().slice(0, 16)}
          onChange={(e) =>
            setSelectedEvent({ ...selectedEvent, end: new Date(e.target.value) })
          }
        />
      </label>
      <label style={{ display: "block", textAlign: "left" }}>
        Color:
        <input
          type="color"
          value={selectedEvent.color}
          onChange={(e) =>
            setSelectedEvent({ ...selectedEvent, color: e.target.value })
          }
        />
      </label>
      <label style={{ display: "block", textAlign: "left" }}>
        Type:
        <select
          value={selectedEvent.type}
          onChange={(e) =>
            setSelectedEvent({ ...selectedEvent, type: e.target.value })
          }
        >
          <option value="work">Công việc</option>
          <option value="study">Học tập</option>
          <option value="outdoor">Hoạt động ngoài trời</option>
          <option value="personal">Cá nhân</option>
          <option value="other">Khác</option>
        </select>
      </label>
      <label>
        <input
          type="checkbox"
          checked={selectedEvent.completed}
          onChange={(e) =>
            setSelectedEvent({ ...selectedEvent, completed: e.target.checked })
          }
        />{" "}
        Completed
      </label>
      <div style={{ marginTop: 10 }}>
        <button onClick={handleSave}>Save</button>
        <button onClick={handleDelete} style={{ marginLeft: 10, background: "#b93c3aff", color: "white" }}>
          Delete
        </button>
        <button onClick={() => setShowModal(false)} style={{ marginLeft: 10 }}>
          Cancel
        </button>
      </div>
    </div>
  );
}
