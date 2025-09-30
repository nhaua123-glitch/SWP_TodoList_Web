import React, { useState, useEffect } from "react";
import { Calendar, dateFnsLocalizer } from "react-big-calendar";
import { format, parse, startOfWeek, getDay } from "date-fns";
import enUS from "date-fns/locale/en-US";
import { createClient } from "@supabase/supabase-js";
import "react-big-calendar/lib/css/react-big-calendar.css";
import "./App.css";

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

function App() {
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

  // ========== Fetch tasks from DB ==========
  useEffect(() => {
    fetchTasks();
  }, []);

  const fetchTasks = async () => {
    const { data, error } = await supabase.from("tasks").select("*");
    if (error) {
      console.error("Error fetching tasks:", error);
    } else {
      const formatted = data.map((task) => ({
        ...task,
        start: new Date(task.start_time),
        end: new Date(task.end_time),
      }));
      setEvents(formatted);
    }
  };

  // ========== Add Task ==========
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
    if (error) {
      console.error("Error adding task:", error);
    } else {
      const added = {
        ...data[0],
        start: new Date(data[0].start_time),
        end: new Date(data[0].end_time),
      };
      setEvents([...events, added]);
      setNewTask({ title: "", start: "", end: "", color: "#155690ff", type: "work" });
    }
  };

  // ========== Event Style ==========
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
          <label style={{ display: "block", textAlign: "left", marginBottom: "0.0001px" }}>
            Title:
            <input
              type="text"
              value={selectedEvent.title}
              onChange={(e) =>
                setSelectedEvent({ ...selectedEvent, title: e.target.value })
              }
            />
          </label>
          <br />
          <label style={{ display: "block", textAlign: "left", marginBottom: "0.0001px" }}>
            Start:
            <input
              type="datetime-local"
              value={new Date(selectedEvent.start).toISOString().slice(0, 16)}
              onChange={(e) =>
                setSelectedEvent({
                  ...selectedEvent,
                  start: new Date(e.target.value),
                })
              }
            />
          </label>
          <br />
          <label style={{ display: "block", textAlign: "left", marginBottom: "0.0001px" }}>
            End:
            <input
              type="datetime-local"
              value={new Date(selectedEvent.end).toISOString().slice(0, 16)}
              onChange={(e) =>
                setSelectedEvent({
                  ...selectedEvent,
                  end: new Date(e.target.value),
                })
              }
            />
          </label>
          <br />
          <label style={{ display: "block", textAlign: "left", marginBottom: "0.0001px" }}>
            Color:
            <input
              type="color"
              value={selectedEvent.color}
              onChange={(e) =>
                setSelectedEvent({ ...selectedEvent, color: e.target.value })
              }
            />
          </label>
          <br />
          <label style={{ display: "block", textAlign: "left", marginBottom: "0.0001px" }}>
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
          <br />
          <label>
            <input
              type="checkbox"
              checked={selectedEvent.completed}
              onChange={(e) =>
                setSelectedEvent({
                  ...selectedEvent,
                  completed: e.target.checked,
                })
              }
            />{" "}
            Completed
          </label>
          <br />
          <br />

          <button
            onClick={async () => {
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
            }}
          >
            Save
          </button>

          <button
            onClick={async () => {
              await supabase.from("tasks").delete().eq("id", selectedEvent.id);
              setEvents((prev) =>
                prev.filter((ev) => ev.id !== selectedEvent.id)
              );
              setShowModal(false);
            }}
            style={{
              marginLeft: "10px",
              background: "#b93c3aff",
              color: "white",
              border: "none",
              padding: "6px 12px",
              borderRadius: "4px",
            }}
          >
            Delete
          </button>

          <button
            onClick={() => setShowModal(false)}
            style={{ marginLeft: "10px" }}
          >
            Cancel
          </button>
        </div>
      )}
    </div>
  );
}


function BackgroundCustomizer() {
  const [bgColor, setBgColor] = useState("#ffffff");

  // Khi chọn màu
  const handleColorChange = (e) => {
    const color = e.target.value;
    setBgColor(color);
    document.body.style.backgroundColor = color;
    document.body.style.backgroundImage = "none"; // bỏ ảnh nếu đang có
  };

  // Khi upload ảnh
  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        document.body.style.backgroundImage = `url(${reader.result})`;
        document.body.style.backgroundSize = "cover";
        document.body.style.backgroundPosition = "center";
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="bg-widget">
      <label title="Chọn màu nền">
        🎨
        <input
          type="color"
          value={bgColor}
          onChange={handleColorChange}
          style={{ display: "none" }}
        />
      </label>

      <label title="Upload ảnh nền">
        🖼
        <input
          type="file"
          accept="image/*"
          onChange={handleImageUpload}
          style={{ display: "none" }}
        />
      </label>
    </div>
  );
}

export default App;
