"use client";

import { useState, useEffect } from "react";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { useRouter } from "next/navigation";
import Link from "next/link";
import LogoutButton from "@/components/LogoutButton";
import styles from "./list.module.css";

const supabase = createClientComponentClient();

export default function ListPage() {
  const router = useRouter();
  const [tasks, setTasks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Kiểm tra authentication
  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        setIsAuthenticated(true);
        fetchTasks();
      } else {
        router.push('/login');
      }
    };
    checkAuth();
  }, [router]);

  const fetchTasks = async () => {
    const { data, error } = await supabase.from("tasks").select("*").order("start_time");
    if (error) console.error(error);
    else setTasks(data);
    setLoading(false);
  };

  const setStatus = async (task: any, status: "pending" | "in_progress" | "done") => {
    const payload: any = { status };
    if (typeof task.completed !== "undefined") {
      payload.completed = status === "done";
    }
    const { error } = await supabase.from("tasks").update(payload).eq("id", task.id);
    if (error) console.error(error);
    else {
      setTasks((prev) =>
        prev.map((t) =>
          t.id === task.id ? { ...t, status, completed: typeof t.completed !== "undefined" ? status === "done" : t.completed } : t
        )
      );
    }
  };

  // nhóm theo type
  const groupedTasks: Record<string, any[]> = tasks.reduce((acc, task) => {
    const group = task.type || "other";
    if (!acc[group]) acc[group] = [];
    acc[group].push(task);
    return acc;
  }, {} as Record<string, any[]>);

  if (loading) return <p>Loading...</p>;
  
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
        <div className={styles.navbar}>
            <Link href="/dashboard">
                <button className={styles.switchBtn}>🏠 Dashboard</button>
            </Link>
            <Link href="/calendar">
                <button className={styles.switchBtn}>📅 Calendar</button>
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

      <h2 className={styles.title}>My Task List</h2>

      {Object.entries(groupedTasks).map(([type, items]) => (
        <div key={type} className={styles.section}>
          <h3 className={styles.sectionTitle}>
            {mapTypeLabel(type)} <span className={styles.count}>{items.length}</span>
          </h3>

          <ul className={styles.taskList}>
            {items.map((task) => (
              <li
                key={task.id}
                className={`${styles.taskItem} ${task.completed ? styles.completed : ""}`}
              >
                <div className={styles.checkboxWrapper}>
                  <select
                    value={task.status ?? (task.completed ? "done" : "pending")}
                    onChange={(e) => setStatus(task, e.target.value as any)}
                    style={{ marginRight: 8 }}
                  >
                    <option value="pending">Pending</option>
                    <option value="in_progress">In progress</option>
                    <option value="done">Done</option>
                  </select>
                  <span className={styles.taskTitle}>{task.title}</span>
                </div>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}

function mapTypeLabel(type: string) {
  switch (type) {
    case "work":
      return "Công việc";
    case "study":
      return "Học tập";
    case "outdoor":
      return "Ngoài trời";
    case "personal":
      return "Cá nhân";
    default:
      return "Khác";
  }
}
