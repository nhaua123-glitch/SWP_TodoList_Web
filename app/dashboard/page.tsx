// File: app/dashboard/page.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import { createBrowserClient } from "@supabase/ssr";
import Link from "next/link";
import { useRouter } from "next/navigation";
import LogoutButton from "@/components/LogoutButton";
import type { Session } from "@supabase/supabase-js";
import styles from "./dashboard.module.css";

const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function DashboardPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [session, setSession] = useState<Session | null>(null);
  const [tasks, setTasks] = useState<any[]>([]);
  const [myUsername, setMyUsername] = useState<string>("");
  const [myBio, setMyBio] = useState<string>("");

  async function fetchTasks() {
    const { data, error } = await supabase
      .from("tasks")
      .select("*")
      .order("start_time", { ascending: true });

    if (!error && data) {
      setTasks(data);
    }
  }

  useEffect(() => {
    const checkAuth = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) {
        setSession(null);
        setLoading(false);
        router.push("/login");
        return;
      }

      setSession(session);
      await fetchTasks();
      setLoading(false);
    };

    checkAuth();
  }, [router]);

  useEffect(() => {
    const fetchProfile = async () => {
      if (!session?.user) return;
      const { data: prof } = await supabase
        .from("profiles")
        .select("username, bio")
        .eq("id", session.user.id)
        .maybeSingle();

      if (prof?.username) setMyUsername(prof.username as string);
      if (typeof prof?.bio === "string") setMyBio(prof.bio as string);
    };

    fetchProfile();
  }, [session]);

  const stats = useMemo(() => {
    const total = tasks.length;
    const completed = tasks.filter((t) => t.completed).length;
    const upcoming = tasks.filter((t) => {
      const start = getStartDate(t);
      return !t.completed && start && start.getTime() > Date.now();
    }).length;
    const byType = tasks.reduce((acc: Record<string, number>, task: any) => {
      const type = task.type || "other";
      acc[type] = (acc[type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    const recent = [...tasks]
      .sort((a, b) => {
        const aDate = getStartDate(a)?.getTime() ?? 0;
        const bDate = getStartDate(b)?.getTime() ?? 0;
        return bDate - aDate;
      })
      .slice(0, 5);

    return { total, completed, upcoming, byType, recent };
  }, [tasks]);

  const completionRate = useMemo(() => {
    if (!stats.total) return 0;
    return Math.round((stats.completed / stats.total) * 100);
  }, [stats.completed, stats.total]);

  const upcomingTask = useMemo(() => {
    const open = tasks
      .filter((task) => {
        if (task.completed) return false;
        const start = getStartDate(task);
        return !!start && start.getTime() >= Date.now();
      })
      .sort((a, b) => {
        const aDate = getStartDate(a)?.getTime() ?? Number.MAX_SAFE_INTEGER;
        const bDate = getStartDate(b)?.getTime() ?? Number.MAX_SAFE_INTEGER;
        return aDate - bDate;
      });

    return open[0] ?? null;
  }, [tasks]);

  const overdueCount = useMemo(() => {
    return tasks.filter((task) => {
      if (task.completed) return false;
      const deadline = getEndDate(task) ?? getStartDate(task);
      return !!deadline && deadline.getTime() < Date.now();
    }).length;
  }, [tasks]);

  const tasksToday = useMemo(() => {
    const today = new Date();
    return tasks.filter((task) => {
      const start = getStartDate(task);
      return start ? isSameDay(start, today) : false;
    }).length;
  }, [tasks]);

  const completedThisWeek = useMemo(() => {
    const reference = new Date();
    return tasks.filter((task) => {
      if (!task.completed) return false;
      const completedDate = getEndDate(task) ?? getStartDate(task);
      return completedDate ? isWithinDays(completedDate, 7, reference) : false;
    }).length;
  }, [tasks]);

  const summaryCards = useMemo(
    () => [
      { icon: "🗂️", label: "Total tasks", value: stats.total },
      { icon: "✅", label: "Completed", value: stats.completed },
      { icon: "⚡", label: "In progress", value: Math.max(stats.total - stats.completed, 0) },
      { icon: "🚀", label: "Upcoming", value: stats.upcoming },
    ],
    [stats.total, stats.completed, stats.upcoming]
  );

  const typeEntries = useMemo(
    () => Object.entries(stats.byType).sort((a, b) => b[1] - a[1]),
    [stats.byType]
  );

  const currentDate = useMemo(
    () => new Intl.DateTimeFormat("en-US", { dateStyle: "full" }).format(new Date()),
    []
  );

  const displayName =
    myUsername ||
    session?.user?.user_metadata?.full_name ||
    session?.user?.email?.split("@")[0] ||
    "there";

  if (loading) {
    return (
      <div className={styles.page}>
        <div className={styles.empty}>Loading your dashboard…</div>
      </div>
    );
  }

  if (!session) {
    return (
      <div className={styles.page}>
        <div className={styles.empty}>Redirecting to login…</div>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div className={styles.titleBlock}>
          <span className={styles.date}>{currentDate}</span>
          <h1>Dashboard overview</h1>
          <p className={styles.subtitle}>{`Welcome back, ${displayName}.`}</p>
          {myBio && <p className={styles.subtitle}>{myBio}</p>}
        </div>
        <div className={styles.headerActions}>
          <div className={styles.navGroup}>
            <Link href="/calendar" className={styles.navButton}>
              <span aria-hidden>📅</span>
              Calendar
            </Link>
            <Link href="/friends" className={styles.navButton}>
              <span aria-hidden>🤝</span>
              Friends
            </Link>
            <Link href="/calendar" className={styles.backButton}>
          ← Back to Calendar
          </Link>
          </div>
        </div>
      </header>

      <section className={styles.hero}>
        <div className={styles.heroContent}>
          <span className={styles.heroBadge}>
            <span aria-hidden>✨</span> Productivity pulse
          </span>
          <h2 className={styles.heroHeading}>Shape your next big win</h2>
          <p className={styles.heroText}>
            {myBio
              ? myBio
              : "Prioritise what matters, keep your streak alive, and let every task move you forward."}
          </p>
          <ul className={styles.heroMetaList}>
            <li className={styles.heroMetaItem}>
              <span className={styles.metaLabel}>Next focus</span>
              <span className={styles.metaValue}>
                {upcomingTask ? upcomingTask.title : "No upcoming tasks"}
              </span>
              <span className={styles.metaSubtle}>
                {upcomingTask && getStartDate(upcomingTask)
                  ? formatDateTime(getStartDate(upcomingTask))
                  : "Schedule your next priority to keep momentum."}
              </span>
            </li>
            <li className={styles.heroMetaItem}>
              <span className={styles.metaLabel}>Completed this week</span>
              <span className={styles.metaValue}>{completedThisWeek}</span>
              <span className={styles.metaSubtle}>Past 7 days</span>
            </li>
            <li className={styles.heroMetaItem}>
              <span className={styles.metaLabel}>Overdue</span>
              <span className={styles.metaValue}>{overdueCount}</span>
              <span className={styles.metaSubtle}>
                {overdueCount ? "Let's bring these back on track." : "You're all caught up!"}
              </span>
            </li>
          </ul>
        </div>
        <div className={styles.heroStats}>
          <div className={styles.heroStatCard}>
            <span className={styles.heroStatLabel}>Completion rate</span>
            <span className={styles.heroStatValue}>{completionRate}%</span>
            <div className={styles.progressBar}>
              <div
                className={styles.progressFill}
                style={{ width: `${completionRate}%` }}
              />
            </div>
            <span className={styles.metaSubtle}>
              {stats.completed} of {stats.total} tasks
            </span>
          </div>
          <div className={styles.heroStatCard}>
            <span className={styles.heroStatLabel}>Today's tasks</span>
            <span className={styles.heroStatValue}>{tasksToday}</span>
            <div className={styles.progressBar}>
              <div
                className={styles.progressFill}
                style={{ width: `${Math.min(tasksToday * 12, 100)}%` }}
              />
            </div>
            <span className={styles.metaSubtle}>Scheduled for today</span>
          </div>
          <div className={styles.heroStatCard}>
            <span className={styles.heroStatLabel}>Open backlog</span>
            <span className={styles.heroStatValue}>
              {Math.max(stats.total - stats.completed, 0)}
            </span>
            <div className={styles.progressBar}>
              <div
                className={styles.progressFill}
                style={{
                  width: `${
                    stats.total
                      ? Math.round(((stats.total - stats.completed) / stats.total) * 100)
                      : 0
                  }%`,
                }}
              />
            </div>
            <span className={styles.metaSubtle}>Ready to tackle next</span>
          </div>
        </div>
      </section>

      <section className={styles.statGrid}>
        {summaryCards.map((card) => (
          <div key={card.label} className={styles.statCard}>
            <span className={styles.statIcon} aria-hidden>
              {card.icon}
            </span>
            <div>
              <div className={styles.statValue}>{card.value}</div>
              <div className={styles.statLabel}>{card.label}</div>
            </div>
          </div>
        ))}
      </section>

      <section className={styles.panels}>
        <div className={styles.panel}>
          <div className={styles.panelHeader}>
            <div>
              <h3 className={styles.panelTitle}>By type</h3>
              <span className={styles.panelSubtitle}>Where your energy goes</span>
            </div>
          </div>
          {typeEntries.length ? (
            <ul className={styles.list}>
              {typeEntries.map(([type, count]) => {
                const percentage = stats.total ? Math.round((count / stats.total) * 100) : 0;
                return (
                  <li key={type} className={styles.listItem}>
                    <span className={styles.listIcon} aria-hidden>
                      {mapTypeIcon(type)}
                    </span>
                    <div className={styles.listContent}>
                      <p className={styles.listTitle}>{mapTypeLabel(type)}</p>
                      <span className={styles.listMeta}>
                        {count} {count === 1 ? "task" : "tasks"} · {percentage}%
                      </span>
                      <div className={`${styles.progressBar} ${styles.listProgress}`}>
                        <div
                          className={styles.progressFill}
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          ) : (
            <div className={styles.empty}>No tasks yet—create your first one to see insights.</div>
          )}
        </div>

        <div className={styles.panel}>
          <div className={styles.panelHeader}>
            <div>
              <h3 className={styles.panelTitle}>Recently active</h3>
              <span className={styles.panelSubtitle}>Latest progress</span>
            </div>
          </div>
          {stats.recent.length ? (
            <ul className={styles.list}>
              {stats.recent.map((task: any) => {
                const statusClass = task.completed ? styles.tagSuccess : styles.tagPending;
                const statusLabel = task.completed ? "Completed" : "In progress";
                return (
                  <li key={task.id} className={styles.listItem}>
                    <span className={styles.listIcon} aria-hidden>
                      {task.completed ? "✅" : "🕒"}
                    </span>
                    <div className={styles.listContent}>
                      <p className={styles.listTitle}>{task.title || "Untitled task"}</p>
                      <span className={styles.listMeta}>{formatDateTime(getStartDate(task))}</span>
                      {task.description && (
                        <span className={styles.listMeta}>{task.description}</span>
                      )}
                      <span className={`${styles.tag} ${statusClass}`}>{statusLabel}</span>
                    </div>
                  </li>
                );
              })}
            </ul>
          ) : (
            <div className={styles.empty}>No recent tasks—once you add tasks they will appear here.</div>
          )}
        </div>
      </section>
    </div>
  );
}

function mapTypeLabel(type: string): string {
  switch (type) {
    case "work":
      return "Work";
    case "study":
      return "Study";
    case "outdoor":
      return "Outdoor";
    case "personal":
      return "Personal";
    default:
      return "Other";
  }
}

function mapTypeIcon(type: string): string {
  switch (type) {
    case "work":
      return "";
    case "study":
      return "";
    case "outdoor":
      return "";
    case "personal":
      return "";
    default:
      return "";
  }
}

function parseDate(value: any): Date | null {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function getStartDate(task: any): Date | null {
  return parseDate(task?.start_time ?? task?.start ?? task?.startDate);
}

function getEndDate(task: any): Date | null {
  return parseDate(task?.end_time ?? task?.end ?? task?.endDate);
}

function formatDateTime(value: Date | null): string {
  if (!value) return "No date";
  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(value);
}

function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function isWithinDays(date: Date, days: number, reference: Date): boolean {
  const diff = reference.getTime() - date.getTime();
  return diff >= 0 && diff <= days * 24 * 60 * 60 * 1000;
}