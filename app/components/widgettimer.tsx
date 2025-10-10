"use client";

import React, { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

export default function TimerWidget({ tasks = [] }) {
  // UI state
  const [panelOpen, setPanelOpen] = useState(false);
  const [showWidget, setShowWidget] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // theme / persisted settings
  const [color, setColor] = useState("#7c3aed");
  const [pos, setPos] = useState({ x: 24, y: 80 });
  const [size, setSize] = useState({ w: 260, h: 140 });

  // timer logic
  const [modeSource, setModeSource] = useState("manual"); // 'manual' | 'task'
  const [manualMode, setManualMode] = useState("countup"); // 'countup' | 'countdown'
  const [manualMinutes, setManualMinutes] = useState(15);
  const [manualSeconds, setManualSeconds] = useState(0);

  const [selectedTaskId, setSelectedTaskId] = useState(null);
  const [isRunning, setIsRunning] = useState(false);
  const [timeLeftSec, setTimeLeftSec] = useState(0); // seconds (for countdown) or elapsed for countup
  const [totalSec, setTotalSec] = useState(0); // reference total for progress

  // drag/resize refs
  const dragging = useRef(false);
  const resizing = useRef(false);
  const dragOrigin = useRef({ x: 0, y: 0 });
  const startPos = useRef({ x: 0, y: 0 });
  const startSize = useRef({ w: 260, h: 140 });

  // beep
  const beep = useRef<(() => void) | null>(null);
  useEffect(() => {
    beep.current = () => {
      try {
        const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
        const o = ctx.createOscillator();
        const g = ctx.createGain();
        o.type = "sine";
        o.frequency.value = 880;
        g.gain.value = 0.02;
        o.connect(g);
        g.connect(ctx.destination);
        o.start();
        setTimeout(() => {
          o.stop();
          ctx.close();
        }, 250);
      } catch (e) {
        // ignore audio errors (autoplay restrictions)
      }
    };
  }, []);

  // persist settings to localStorage
  useEffect(() => {
    const saved = localStorage.getItem("timerwidget:v1");
    if (saved) {
      try {
        const s = JSON.parse(saved);
        if (s.color) setColor(s.color);
        if (s.pos) setPos(s.pos);
        if (s.size) setSize(s.size);
        if (s.modeSource) setModeSource(s.modeSource);
        if (s.manualMode) setManualMode(s.manualMode);
        if (s.manualMinutes != null) setManualMinutes(s.manualMinutes);
        if (s.manualSeconds != null) setManualSeconds(s.manualSeconds);
        if (s.selectedTaskId) setSelectedTaskId(s.selectedTaskId);
      } catch (e) {}
    }
  }, []);

  useEffect(() => {
    localStorage.setItem(
      "timerwidget:v1",
      JSON.stringify({
        color,
        pos,
        size,
        modeSource,
        manualMode,
        manualMinutes,
        manualSeconds,
        selectedTaskId,
      })
    );
  }, [color, pos, size, modeSource, manualMode, manualMinutes, manualSeconds, selectedTaskId]);

  // FIX: Hàm tính toán giá trị, trả về object {total, initialTime}
  const calculateTimerValues = (currentModeSource, currentManualMode, currentManualMinutes, currentManualSeconds, currentSelectedTaskId, currentTasks) => {
    if (currentModeSource === "manual") {
      const total = Math.max(0, Math.floor(currentManualMinutes) * 60 + Math.floor(currentManualSeconds));
      const initialTime = currentManualMode === "countdown" ? total : 0;
      return { total, initialTime };
    } else {
      // task mode
      const task = currentTasks.find((t) => String(t.id) === String(currentSelectedTaskId));
      if (task && (task.end || task.end_time)) {
        const end = new Date(task.end || task.end_time).getTime();
        const now = Date.now();
        const diff = Math.max(0, Math.floor((end - now) / 1000));
        return { total: diff, initialTime: diff }; // Task luôn là countdown
      }
      return { total: 0, initialTime: 0 };
    }
  };
  
  // FIX: Hàm update trạng thái tổng quát
  const updateTimerState = () => {
    const { total, initialTime } = calculateTimerValues(
        modeSource,
        manualMode,
        manualMinutes,
        manualSeconds,
        selectedTaskId,
        tasks
    );
    // Cập nhật cả totalSec và timeLeftSec
    setTotalSec(total);
    setTimeLeftSec(initialTime);
  };

  // Cần useEffect để cập nhật giao diện khi người dùng thay đổi settings trong panel
  useEffect(() => {
    // Chỉ cập nhật trạng thái nếu timer không chạy, hoặc nếu đang ở Task mode (cần cập nhật remaining time liên tục)
    if (!isRunning || modeSource === "task") { 
        updateTimerState();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [modeSource, manualMinutes, manualSeconds, manualMode, selectedTaskId, tasks]); 

  // ticking
  useEffect(() => {
    if (!isRunning) return;
    const t = setInterval(() => {
      setTimeLeftSec((prev) => {
        let nextTime;

        if (modeSource === "manual") {
          if (manualMode === "countdown") {
            nextTime = prev - 1;
            if (nextTime <= 0) {
              beep.current?.();
              setIsRunning(false);
              return 0;
            }
          } else {
            // countup
            nextTime = prev + 1;
            if (totalSec > 0 && nextTime >= totalSec) { 
              beep.current?.();
              setIsRunning(false);
              return totalSec;
            }
          }
        } else {
          // task mode — countdown to task end
          nextTime = prev - 1;
          if (nextTime <= 0) {
            beep.current?.();
            setIsRunning(false);
            return 0;
          }
        }
        return nextTime;
      });
    }, 1000);
    return () => clearInterval(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isRunning, modeSource, manualMode, totalSec]);

  // ... (Phần drag/resize global handlers giữ nguyên)
  useEffect(() => {
    const move = (e) => {
      if (dragging.current) {
        const clientX = e.touches ? e.touches[0].clientX : e.clientX;
        const clientY = e.touches ? e.touches[0].clientY : e.clientY;
        const dx = clientX - dragOrigin.current.x;
        const dy = clientY - dragOrigin.current.y;
        setPos({ x: startPos.current.x + dx, y: startPos.current.y + dy });
      }
      if (resizing.current) {
        const clientX = e.touches ? e.touches[0].clientX : e.clientX;
        const clientY = e.touches ? e.touches[0].clientY : e.clientY;
        const dw = clientX - dragOrigin.current.x;
        const dh = clientY - dragOrigin.current.y;
        setSize({
          w: Math.max(160, startSize.current.w + dw),
          h: Math.max(90, startSize.current.h + dh),
        });
      }
    };
    const up = () => {
      dragging.current = false;
      resizing.current = false;
    };
    window.addEventListener("mousemove", move);
    window.addEventListener("touchmove", move, { passive: false });
    window.addEventListener("mouseup", up);
    window.addEventListener("touchend", up);
    return () => {
      window.removeEventListener("mousemove", move);
      window.removeEventListener("touchmove", move);
      window.removeEventListener("mouseup", up);
      window.removeEventListener("touchend", up);
    };
  }, []);
  // ... (Phần drag/resize global handlers giữ nguyên)


  // helpers
  const startDrag = (e) => {
    if (resizing.current) return; 
    if (e.target.closest('button') || e.target.closest('input')) return;
    
    dragging.current = true;
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    dragOrigin.current = { x: clientX, y: clientY };
    startPos.current = { x: pos.x, y: pos.y };
  };
  const startResize = (e) => {
    e.stopPropagation();
    resizing.current = true;
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    dragOrigin.current = { x: clientX, y: clientY };
    startSize.current = { w: size.w, h: size.h };
  };

  // UI derived
  const ss = Math.floor(timeLeftSec % 60);
  const totalMinutes = Math.floor(timeLeftSec / 60);
  const mm = Math.floor(totalMinutes % 60);
  const hh = Math.floor(totalMinutes / 60);
  const display = `${String(hh).padStart(2, "0")}:${String(mm).padStart(2, "0")}:${String(ss).padStart(2, "0")}`;
  
  const progress = totalSec > 0 
    ? (modeSource === "manual" && manualMode === "countup" 
      ? (timeLeftSec / totalSec) 
      : ((totalSec - timeLeftSec) / totalSec)
      ) 
    : 0;

  // small helpers to set selectedTaskId default when tasks available
  useEffect(() => {
    if (!selectedTaskId && tasks.length > 0) {
      const first = tasks[0];
      setSelectedTaskId(first.id ?? first.task_id); 
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tasks]);

  // FIX: Đảm bảo updateTimerState chạy trước khi bật isRunning
  const handleStart = () => {
    // Luôn tính toán lại giá trị ban đầu khi bấm start
    updateTimerState(); 
    // Dùng setTimeout nhỏ để đảm bảo React hoàn thành việc cập nhật trạng thái trước khi bật timer
    // Đây là một "hack" phổ biến để xử lý vấn đề setState đồng bộ/bất đồng bộ khi cần
    setTimeout(() => {
        setIsRunning(true);
    }, 50); 
    
    setShowWidget(true);
    setPanelOpen(false);
  };
  
  // FIX: Đảm bảo updateTimerState chạy trước khi isRunning bị tắt
  const handleReset = () => {
    setIsRunning(false);
    updateTimerState(); 
  };


  return (
    <>
      {/* Floating icon */}
      <div className="fixed bottom-8 right-8 z-40">
        <button
          onClick={() => setPanelOpen((v) => !v)}
          className="w-12 h-12 rounded-full shadow-lg flex items-center justify-center text-white"
          style={{ background: color }}
          aria-label="Open timer"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </button>
      </div>

      {/* Panel */}
      <AnimatePresence>
        {panelOpen && (
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.98 }}
            transition={{ duration: 0.18 }}
            className="fixed top-20 right-4 z-50 w-80 bg-white rounded-xl shadow-2xl p-4"
          >
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-sm font-semibold">Timer</h4>
              <div className="flex items-center gap-2">
                <input type="color" value={color} onChange={(e) => setColor(e.target.value)} className="w-7 h-7 p-0" />
                <button className="text-sm text-gray-500 hover:text-gray-700" onClick={() => setPanelOpen(false)}>Close</button>
              </div>
            </div>

            {/* source toggle */}
            <div className="flex gap-2 mb-2">
              <button onClick={() => setModeSource("manual")} className={`flex-1 py-2 rounded-md text-sm ${modeSource === "manual" ? "bg-gray-100" : "bg-white"}`}>
                Manual
              </button>
              <button onClick={() => setModeSource("task")} className={`flex-1 py-2 rounded-md text-sm ${modeSource === "task" ? "bg-gray-100" : "bg-white"}`}>
                Task
              </button>
            </div>

            {/* manual area */}
            {modeSource === "manual" && (
              <>
                <div className="flex gap-2 mb-2">
                  <button onClick={() => setManualMode("countup")} className={`flex-1 py-2 rounded-md text-sm ${manualMode === "countup" ? "bg-gray-100" : "bg-white"}`}>Count up</button>
                  <button onClick={() => setManualMode("countdown")} className={`flex-1 py-2 rounded-md text-sm ${manualMode === "countdown" ? "bg-gray-100" : "bg-white"}`}>Count down</button>
                </div>

                <div className="flex gap-2 mb-2">
                  <label className="flex-1 text-xs">Minutes
                    <input className="w-full mt-1 p-2 rounded border text-sm" type="number" min={0} value={manualMinutes} onChange={(e) => setManualMinutes(Number(e.target.value))} />
                  </label>
                  <label className="flex-1 text-xs">Seconds
                    <input className="w-full mt-1 p-2 rounded border text-sm" type="number" min={0} max={59} value={manualSeconds} onChange={(e) => setManualSeconds(Number(e.target.value))} />
                  </label>
                </div>
              </>
            )}

            {/* task area */}
            {modeSource === "task" && (
              <>
                <div className="text-xs text-gray-500 mb-2">Select task deadline</div>
                <select className="w-full p-2 border rounded mb-2 text-sm" value={selectedTaskId ?? ""} onChange={(e) => setSelectedTaskId(e.target.value)}>
                  {tasks.length === 0 && <option value="">(No tasks)</option>}
                  {tasks.map((t) => {
                    const id = t.id ?? t.task_id;
                    const label = `${t.title} — ${t.end ? new Date(t.end).toLocaleString() : t.end_time ? new Date(t.end_time).toLocaleString() : "no end"}`;
                    return <option key={id ?? label} value={id}>{label}</option>;
                  })}
                </select>
                <div className="text-xs text-gray-500">When the selected task's deadline reaches, timer finishes.</div>
              </>
            )}

            <div className="flex items-center gap-2 mt-3">
              {!isRunning ? (
                <button onClick={handleStart} className="flex-1 py-2 rounded-md bg-gradient-to-r from-indigo-500 to-violet-500 text-white font-semibold">▶ Start</button>
              ) : (
                <button onClick={() => setIsRunning(false)} className="flex-1 py-2 rounded-md bg-yellow-400 text-black">⏸ Pause</button>
              )}
              <button onClick={handleReset} className="px-3 py-2 rounded-md border">Reset</button>
            </div>

            <div className="mt-3 flex gap-2">
              <button onClick={() => { setShowWidget(true); setPanelOpen(false); }} className="flex-1 py-2 rounded-md border text-sm">Open Widget</button>
              <button onClick={() => { updateTimerState(); setTimeout(() => setIsRunning(true), 50); setIsFullscreen(true); setShowWidget(false); setPanelOpen(false); }} className="flex-1 py-2 rounded-md border text-sm">Fullscreen</button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating widget */}
      <AnimatePresence>
        {showWidget && (
          <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            style={{ left: pos.x, top: pos.y, width: size.w, height: size.h }}
            transition={{ duration: 0.18 }} 
            className="fixed z-40 rounded-lg shadow-2xl overflow-hidden cursor-default"
            onMouseDown={(e) => startDrag(e)}
            onTouchStart={(e) => startDrag(e)}
          >
            <div className="relative w-full h-full" style={{ background: `linear-gradient(180deg, ${color}, rgba(0,0,0,0.08))` }}>
              {/* header (drag handle) */}
              <div className="p-2 flex items-center justify-between" style={{ cursor: "grab" }}> 
                <div>
                  <div className="text-xs text-white/90">{modeSource === "task" ? "Task Timer" : "Manual Timer"}</div>
                  <div className="font-bold text-white text-lg leading-tight">{display}</div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="text-xs text-white/90">{Math.round(progress * 100)}%</div>
                  <button onClick={(e) => { e.stopPropagation(); setIsFullscreen(true); setShowWidget(false); }} className="bg-white/20 px-2 py-1 rounded text-white text-xs">⤢</button>
                  <button onClick={(e) => { e.stopPropagation(); setShowWidget(false); setIsRunning(false); }} className="bg-white/20 px-2 py-1 rounded text-white text-xs">✕</button>
                </div>
              </div>

              {/* progress */}
              <div className="px-3 pb-3">
                <div className="h-2 bg-white/20 rounded overflow-hidden">
                  <div style={{ width: `${Math.min(progress * 100, 100)}%` }} className="h-full bg-white/70" />
                </div>
              </div>

              {/* resize handle */}
              <div
                onMouseDown={(e) => startResize(e)}
                onTouchStart={(e) => startResize(e)}
                className="absolute right-1 bottom-1 w-4 h-4 cursor-se-resize bg-white/30 rounded"
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Fullscreen */}
      <AnimatePresence>
        {isFullscreen && (
          <motion.div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <div className="bg-white rounded-xl w-[min(920px,96%)] max-w-[1000px] p-6">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm text-gray-500">{modeSource === "task" ? "Task Timer (Fullscreen)" : "Manual Timer (Fullscreen)"}</div>
                  <div className="text-6xl font-bold">{display}</div>
                </div>
                <div className="flex gap-2">
                  {!isRunning ? (
                    <button
                      onClick={handleStart} 
                      className="px-4 py-2 rounded-md bg-gradient-to-r from-indigo-500 to-violet-500 text-white font-semibold"
                    >
                    ▶ Start
                    </button>
                  ) : (
                    <button onClick={() => setIsRunning(false)} className="px-4 py-2 rounded bg-yellow-400 text-black">⏸ Pause</button>
                  )}
                  <button onClick={handleReset} className="px-4 py-2 rounded border">Reset</button> 
                  <button onClick={() => setIsFullscreen(false)} className="px-4 py-2 rounded border">Close</button>
                </div>
              </div>

              <div className="mt-6">
                <div className="h-3 bg-gray-200 rounded overflow-hidden">
                  <div style={{ width: `${Math.min(progress * 100, 100)}%` }} className="h-full bg-gradient-to-r from-indigo-500 to-violet-500" />
                </div>
                <div className="mt-4 text-sm text-gray-600">
                  {modeSource === "task" ? (
                    <div>
                      {(() => {
                        const currentTask = tasks.find((t) => String(t.id) === String(selectedTaskId));
                        return (
                          <>
                            <div>Task: {currentTask?.title ?? "—"}</div>
                            <div>Ends at: {currentTask?.end || currentTask?.end_time ? new Date(currentTask.end || currentTask.end_time).toLocaleString() : "—"}</div>
                          </>
                        );
                      })()}
                    </div>
                  ) : (
                    <div>Manual mode — {manualMode === "countdown" ? "Countdown" : "Countup"} — Total {Math.floor(totalSec / 60)}m {totalSec % 60}s</div>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}