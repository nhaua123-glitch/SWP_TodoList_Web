import React, { useState } from "react";
import { Calendar, dateFnsLocalizer } from "react-big-calendar";
import { format, parse, startOfWeek, getDay } from "date-fns";
import enUS from "date-fns/locale/en-US";
import "react-big-calendar/lib/css/react-big-calendar.css";
import "./App.css";

const locales = { "en-US": enUS };

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek: () => startOfWeek(new Date(), { weekStartsOn: 0 }),
  getDay,
  locales,
});

const events = [
  {
    title: "Morning Run",
    start: new Date(2025, 8, 24, 7, 0),
    end: new Date(2025, 8, 24, 8, 0),
    type: "personal",
  },
  {
    title: "Team Meeting",
    start: new Date(2025, 8, 24, 9, 0),
    end: new Date(2025, 8, 24, 10, 0),
    type: "work",
  },
  {
    title: "Study React",
    start: new Date(2025, 8, 25, 14, 0),
    end: new Date(2025, 8, 25, 16, 0),
    type: "study",
  },
];

// ✅ Custom Toolbar
function CustomToolbar({ label, onNavigate, onView }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "10px" }}>
      <div>
        <button onClick={() => onNavigate("TODAY")}>Today</button>
        <button onClick={() => onNavigate("PREV")}>◀</button>
        <button onClick={() => onNavigate("NEXT")}>▶</button>
      </div>
      <span style={{ fontWeight: "bold", fontSize: "1.2rem" }}>{label}</span>
      <div>
        <button onClick={() => onView("month")}>Month</button>
        <button onClick={() => onView("week")}>Week</button>
        <button onClick={() => onView("day")}>Day</button>
      </div>
    </div>
  );
}

function App() {
  const [view, setView] = useState("month"); // ✅ giữ state view

  return (
    <div style={{ height: "100vh", padding: "20px" }}>
      <Calendar
        localizer={localizer}
        events={events}
        startAccessor="start"
        endAccessor="end"
        style={{ height: "90vh" }}
        views={{ month: true, week: true, day: true }}
        view={view}                // ✅ truyền state vào
        onView={(newView) => setView(newView)} // ✅ cập nhật state
        defaultView="month"
        components={{ toolbar: CustomToolbar }}
        eventPropGetter={(event) => {
          let backgroundColor = "#90caf9";
          if (event.type === "personal") backgroundColor = "#ffcccb";
          if (event.type === "work") backgroundColor = "#bbdefb";
          if (event.type === "study") backgroundColor = "#c8e6c9";

          return {
            style: {
              backgroundColor,
              borderRadius: "8px",
              color: "#333",
              border: "none",
              padding: "2px 6px",
              fontSize: "0.85rem",
            },
          };
        }}
      />
    </div>
  );
}

export default App;
