"use client";

import { useEffect, useMemo, useState } from "react";
import { createClient } from "@supabase/supabase-js";
import Link from "next/link";
import { useRouter } from "next/navigation";
import LogoutButton from "@/components/LogoutButton";

// Keep consistent with existing pages that instantiate Supabase client inline
const supabase = createClient(
  "https://lmgbtjieffptlrvjkimp.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxtZ2J0amllZmZwdGxydmpraW1wIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg4ODEyNzEsImV4cCI6MjA3NDQ1NzI3MX0.-9fEQrwQvzHZfcWIOiukGKmcVyECoMUf8fRffWSPlEs"
);

export default function DashboardPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [tasks, setTasks] = useState<any[]>([]);

  useEffect(() => {
    const checkAuth = () => {
      const user = localStorage.getItem('user');
      const session = localStorage.getItem('session');
      if (user && session) {
        try {
          const sessionData = JSON.parse(session);
          const now = Date.now() / 1000;
          if (sessionData.expires_at && sessionData.expires_at > now) {
            setIsAuthenticated(true);
            setLoading(false);
            fetchTasks();
          } else {
            localStorage.removeItem('user');
            localStorage.removeItem('session');
            router.push('/login');
          }
        } catch {
          localStorage.removeItem('user');
          localStorage.removeItem('session');
          router.push('/login');
        }
      } else {
        router.push('/login');
      }
    };
    checkAuth();
  }, [router]);

  const fetchTasks = async () => {
    const { data, error } = await supabase.from("tasks").select("*").order("start_time");
    if (!error && data) setTasks(data);
  };

  const stats = useMemo(() => {
    const total = tasks.length;
    const completed = tasks.filter(t => t.completed).length;
    const upcoming = tasks.filter(t => !t.completed && new Date(t.start_time) > new Date()).length;
    const byType: Record<string, number> = tasks.reduce((acc: Record<string, number>, t: any) => {
      const type = t.type || 'other';
      acc[type] = (acc[type] || 0) + 1;
      return acc;
    }, {});
    const recent = [...tasks]
      .sort((a, b) => new Date(b.start_time).getTime() - new Date(a.start_time).getTime())
      .slice(0, 5);
    return { total, completed, upcoming, byType, recent };
  }, [tasks]);

  if (loading) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh',
        fontSize: '18px'
      }}>
        Đang kiểm tra đăng nhập...
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
    <div style={{ maxWidth: 1000, margin: '0 auto', padding: 20 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <div style={{ display: 'flex', gap: 8 }}>
          <Link href="/calendar"><button style={buttonStyle}>📅 Calendar</button></Link>
          <Link href="/list"><button style={buttonStyle}>📋 List</button></Link>
        </div>
        <LogoutButton 
          style={{ 
            backgroundColor: '#dc3545', 
            color: 'white', 
            border: 'none', 
            padding: '8px 16px', 
            borderRadius: '4px'
          }}
        >
          🚪 Logout
        </LogoutButton>
      </div>

      <h2 style={{ fontSize: 24, fontWeight: 700, marginBottom: 16 }}>Dashboard</h2>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12 }}>
        <StatCard label="Tổng task" value={stats.total} />
        <StatCard label="Đã hoàn thành" value={stats.completed} />
        <StatCard label="Sắp tới" value={stats.upcoming} />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginTop: 16 }}>
        <div style={panelStyle}>
          <h3 style={panelTitleStyle}>Theo loại</h3>
          <ul style={{ margin: 0, paddingLeft: 16 }}>
            {Object.entries(stats.byType).map(([type, count]) => (
              <li key={type} style={{ marginBottom: 6 }}>
                <span style={{ textTransform: 'capitalize' }}>{mapTypeLabel(type)}</span>: <strong>{count}</strong>
              </li>
            ))}
            {Object.keys(stats.byType).length === 0 && <li>Không có dữ liệu</li>}
          </ul>
        </div>

        <div style={panelStyle}>
          <h3 style={panelTitleStyle}>Gần đây</h3>
          <ul style={{ margin: 0, paddingLeft: 16 }}>
            {stats.recent.map((t: any) => (
              <li key={t.id} style={{ marginBottom: 8 }}>
                <span style={{ marginRight: 6 }}>{t.completed ? '✅' : '🕒'}</span>
                <strong>{t.title}</strong>
                <span style={{ color: '#666' }}> — {new Date(t.start_time).toLocaleString()}</span>
              </li>
            ))}
            {stats.recent.length === 0 && <li>Chưa có task nào</li>}
          </ul>
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div style={{ background: '#ffffff', border: '1px solid #eee', borderRadius: 8, padding: 16 }}>
      <div style={{ fontSize: 12, color: '#666', marginBottom: 4 }}>{label}</div>
      <div style={{ fontSize: 24, fontWeight: 700 }}>{value}</div>
    </div>
  );
}

const buttonStyle: React.CSSProperties = {
  backgroundColor: '#f0f0f0',
  color: '#333',
  border: '1px solid #ddd',
  padding: '8px 16px',
  borderRadius: '4px',
  cursor: 'pointer'
};

const panelStyle: React.CSSProperties = {
  background: '#ffffff',
  border: '1px solid #eee',
  borderRadius: 8,
  padding: 16
};

const panelTitleStyle: React.CSSProperties = {
  margin: 0,
  marginBottom: 8,
  fontSize: 16,
  fontWeight: 600
};

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


