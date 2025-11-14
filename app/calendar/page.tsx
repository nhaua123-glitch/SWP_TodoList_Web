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
import { createBrowserClient } from '@supabase/ssr'
import type { Session } from '@supabase/supabase-js'; 

// ===================================

const locales = { "en-US": enUS };
const localizer = dateFnsLocalizer({ format, parse, startOfWeek, getDay, locales });

const DragAndDropCalendar = withDragAndDrop(Calendar);


export default function Home() {
  const router = useRouter();
  const [events, setEvents] = useState<any[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<any>(null); 
  const [hoveredEvent, setHoveredEvent] = useState<any>(null);   
  const [points, setPoints] = useState(0);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false); // (State này có thể không cần nữa)
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [friendsList, setFriendsList] = useState<any[]>([]);
  const [session, setSession] = useState<Session | null>(null);
  const [myAvatarUrl, setMyAvatarUrl] = useState<string>("");
  const [myUsername, setMyUsername] = useState<string>("");
  const [showProfileCard, setShowProfileCard] = useState(false);
  const [myBio, setMyBio] = useState<string>("");
  const [streak, setStreak] = useState(0); 
  const showInlineProfile = true; 

  // Inline Profile moved into BackgroundCustomizer sidebar

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const clearTimer = () => {
    if (timerRef.current) {
      clearTimeout(timerRef.current as ReturnType<typeof setTimeout>);
      timerRef.current = null;
    }
  };

  const [date, setDate] = useState(new Date());
  const [view, setView] = useState("month");

  const [newTask, setNewTask] = useState<any>({
    title: "",
    description: "",
    start: "",
    end: "",
    color: "#3174ad",
    type: "work",
    visibility: "PRIVATE",      
    collaborators: [],                      
  });

  useEffect(() => {
    const getSessionAndData = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setSession(session); 
      
      const user = session?.user ?? null;
      setCurrentUser(user); 

      if (user) {
        setIsAuthenticated(true); 
        fetchTasks();
        fetchFriends(user); 

        // 1. Các hàm trợ giúp so sánh ngày (bỏ qua phần giờ)
        const isSameDay = (d1: Date, d2: Date) => {
          return d1.getFullYear() === d2.getFullYear() &&
                 d1.getMonth() === d2.getMonth() &&
                 d1.getDate() === d2.getDate();
        };

        const isYesterday = (d1: Date, d2: Date) => {
          const yesterday = new Date(d2);
          yesterday.setDate(d2.getDate() - 1);
          return isSameDay(d1, yesterday);
        };

        const today = new Date();
        let newStreak = 0;
        let updatePayload: any = {}; // Object để cập nhật CSDL

       const { data: prof, error: profError } = await supabase
          .from("profiles")
          .select("avatar_url, username, bio, current_streak, last_login")
          .eq("id", user.id)
          .maybeSingle();

        if (profError) console.error("Lỗi khi lấy profile (streak):", profError);
        if (prof?.avatar_url) setMyAvatarUrl(prof.avatar_url as string);
        if (prof?.username) setMyUsername(prof.username as string);
        if (typeof prof?.bio === 'string') setMyBio(prof.bio as string);

        const lastLogin = prof?.last_login ? new Date(prof.last_login) : null;
        const currentStreak = prof?.current_streak || 0;

        if (!lastLogin) {
          // Case 1: Đăng nhập lần đầu tiên
          newStreak = 1;
          updatePayload = { current_streak: 1, last_login: today.toISOString() };
        } else if (isSameDay(lastLogin, today)) {
          // Case 2a: Đã đăng nhập trong hôm nay -> Không làm gì
          newStreak = currentStreak;
          // Không cần update CSDL
        } else if (isYesterday(lastLogin, today)) {
          // Case 2b: Đăng nhập ngày hôm qua -> Tăng streak
          newStreak = currentStreak + 1;
          updatePayload = { current_streak: newStreak, last_login: today.toISOString() };
        } else {
          // Case 2c: Đăng nhập cách đây > 1 ngày -> Streak bị reset
          newStreak = 1;
          updatePayload = { current_streak: 1, last_login: today.toISOString() };
        }

        // 5. Cập nhật state (để hiển thị trên UI)
        setStreak(newStreak);

        // 6. Cập nhật CSDL (chỉ khi cần thiết)
        if (Object.keys(updatePayload).length > 0) {
          const { error: updateError } = await supabase
            .from("profiles")
            .update(updatePayload)
            .eq("id", user.id);
          
          if (updateError) console.error("Lỗi cập nhật streak:", updateError);
          else console.log("Streak updated:", updatePayload);
        }

      } else {
        setLoading(false);
      }
    };
    getSessionAndData(); 
  }, []);

  // (Profile save + load now lives inside BackgroundCustomizer)

  console.log("Dữ liệu friendsList trong Form:", friendsList);

  const fetchTasks = async () => {
    setLoading(true);
    
    // 1. Lấy Tasks (như cũ)
    const { data: tasksData, error: tasksError } = await supabase.from("tasks").select("*");
    if (tasksError) {
      console.error("Error fetching tasks:", tasksError);
      setLoading(false);
      return;
    }
    if (!tasksData || tasksData.length === 0) {
      setEvents([]);
      setLoading(false);
      return;
    }

    const taskIds = tasksData.map((t: any) => t.id);

    // 2. Lấy Collaborators (như cũ)
    const { data: collabRows, error: collabError } = await supabase
      .from("task_collaborators")
      .select("task_id, user_id, role")
      .in("task_id", taskIds);
    if (collabError) console.error("Error fetching task_collaborators:", collabError);

    // 3. LẤY SUBTASKS (MỚI)
    const { data: subtasksData, error: subtasksError } = await supabase
      .from("subtasks")
      .select("*")
      .in("task_id", taskIds);
    if (subtasksError) console.error("Error fetching subtasks:", subtasksError);

    // 4. Lấy TẤT CẢ User IDs (Owners, Collaborators, VÀ Assignees)
    const ownerUserIds = tasksData.map((t: any) => t.user_id);
    const collaboratorUserIds = (collabRows || []).map((r: any) => r.user_id);
    const assigneeUserIds = (subtasksData || []).map((st: any) => st.assignee_id); // <-- MỚI

    const allUserIds = Array.from(
      new Set([...ownerUserIds, ...collaboratorUserIds, ...assigneeUserIds]) // <-- ĐÃ THÊM ASSIGNEE
    );

    // 5. Lấy TẤT CẢ Profiles (trong 1 lần)
    let profilesMap: Record<string, any> = {};
    if (allUserIds.length > 0) {
      const { data: profilesData, error: profilesError } = await supabase
        .from("profiles")
        .select("id, username, email, avatar_url")
        .in("id", allUserIds);
      if (profilesError) console.error("Error fetching profiles:", profilesError);
      else if (profilesData) {
        profilesMap = profilesData.reduce((acc: any, p: any) => { acc[p.id] = p; return acc; }, {});
      }
    }

    // 6. Gộp tất cả lại
    const formatted = tasksData.map((task: any) => {
      // Gắn collaborators (như cũ)
      const taskCollabs = (collabRows || []).filter((c: any) => c.task_id === task.id);
      const collaborators = taskCollabs.map((c: any) => ({
        user_id: c.user_id,
        role: c.role,
        profile: profilesMap[c.user_id] || null,
      }));
      
      // Gắn Owner profile (như cũ)
      const ownerProfile = profilesMap[task.user_id] || null;

      // GẮN SUBTASKS (MỚI)
      const taskSubtasks = (subtasksData || []).filter((st: any) => st.task_id === task.id);
      const subtasks = taskSubtasks.map((st: any) => ({
        ...st,
        assigneeProfile: profilesMap[st.assignee_id] || null, 
      }));

      return { 
        ...task, 
        start: new Date(task.start_time), 
        end: new Date(task.end_time), 
        collaborators, 
        ownerProfile,
      };
    });
    
    setEvents(formatted);
    setLoading(false);
  };

  // Sửa fetchFriends để nhận 'user' từ useEffect, tránh gọi supabase.auth.getUser() 2 lần
  const fetchFriends = async (user: any) => {
    if (!user) return;

    const { data: friendsData, error: friendsError } = await supabase
      .from('friends')
      .select('sender_id, receiver_id')
      .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`)
      .eq('status', 'accepted'); 

    if (friendsError) {
      console.error("Error fetching friends list:", friendsError);
      return;
    }
    if (!friendsData || friendsData.length === 0) {
      setFriendsList([]); 
      return;
    }
    const friendIds = friendsData.map((f: any) => 
      f.sender_id === user.id ? f.receiver_id : f.sender_id
    );
    const { data: profilesData, error: profilesError } = await supabase
      .from('profiles')
      .select('id, username, email, avatar_url')
      .in('id', friendIds);
    if (profilesError) {
      console.error("Error fetching friends' profile information:", profilesError);
      return;
    }
    if (profilesData) {
      const formattedFriends = profilesData.map((u: any) => ({
        id: u.id,
        name: u.username || u.email || "Anonymous",
        avatar_url: u.avatar_url || null ,
      }));
      setFriendsList(formattedFriends);
    }
  };

  const handleAddTask = async () => {
      if (!newTask.title || !newTask.start || !newTask.end)
        return alert("Please fill in all required information!");
      try {
        setLoading(true);
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        // 1. Insert Task
        const taskPayload = {
          user_id: user.id,
          title: newTask.title.trim(),
          description: newTask.description?.trim() || "",
          start_time: newTask.start,
          end_time: newTask.end,
          color: newTask.color || "#3174ad",
          type: newTask.type || "work",
          visibility: newTask.visibility || "PRIVATE",
          completed: false,
        };
        const { data: taskData, error: taskError } = await supabase
          .from("tasks")
          .insert([taskPayload])
          .select()
          .single();
        if (taskError) throw taskError;

        const newTaskId = taskData.id;
        
        // 2. Chuẩn bị Collaborators
        if (newTask.visibility === "PUBLIC" && newTask.collaborators?.length > 0) {
          const collaboratorsPayload = newTask.collaborators.map((friendId: string) => ({
            task_id: newTaskId,
            user_id: friendId,
            role: (newTask.collaboratorRoles && newTask.collaboratorRoles[friendId]) || "VIEWER", 
          }));
          await supabase.from("task_collaborators").insert(collaboratorsPayload);
        }
        
        // 3. Format profile 
        const tempProfileMap: Record<string, any> = friendsList.reduce((acc, f) => {
          acc[f.id] = { username: f.name, avatar_url: f.avatar_url };
          return acc;
        }, {});
        tempProfileMap[user.id] = { username: myUsername || "Tôi", avatar_url: myAvatarUrl };

        // 4. Thêm event vào state (đã xóa subtasks)
        const addedEvent = {
          ...taskData,
          start: new Date(taskData.start_time),
          end: new Date(taskData.end_time),
          collaborators: [], 
          ownerProfile: tempProfileMap[user.id]
        };

        setEvents((prev) => [...prev, addedEvent]);
        setNewTask({
          title: "", description: "", start: "", end: "", color: "#3174ad",
          type: "work", visibility: "PRIVATE", collaborators: [],
          collaboratorRoles: {},
        });
      } catch (error) {
        console.error("❌ Error creating task:", error);
        alert("Unable to add task, please try again!");
      } finally {
        setLoading(false);
      }
    };

  const handleSelectSlot = (slotInfo: any) => {
    setSelectedEvent(null); 
    setHoveredEvent(null);  
    setNewTask({
      title: "",
      description: "",
      start: slotInfo.start.toISOString().slice(0, 16),
      end: slotInfo.end.toISOString().slice(0, 16),
      color: "#6a879fff",
      type: "work",
    });
  };

  const handleMouseLeave = () => {
    timerRef.current = setTimeout(() => {
      setSelectedEvent(null);
    }, 300);
  };


  const handleEventDrop = async ({ event, start, end, isAllDay }: any) => {
    // Check if currentUser is the owner of the event
    if (!currentUser || event.user_id !== currentUser.id) {
      alert("Only the owner can change the task time!");
      // Dừng hàm lại, không cập nhật state và không gọi Supabase
      // Giao diện calendar sẽ tự động snap event về vị trí cũ
      return;   
    }
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
    work: "💼", study: "📚", outdoor: "🌳", personal: "🧘", other: "🔹",
  };

  const handleEventHover = (event: any) => {
    if (!selectedEvent) { 
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
        style={{ cursor: "pointer", display: "block", height: "100%" }} 
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

  return (
    <div className={styles.page}>
      <BackgroundCustomizer session={session} streak={streak} />
      {/* Top-right avatar button linking to Profile */}
      {isAuthenticated && streak > 0 && (
        <div
          className={styles.streakContainer}
          title={`Login streak: ${streak} days`}
        >
          <span className={styles.streakFlame}>
            🔥
          </span>
          <span className={styles.streakNumber}>
            {streak}
          </span>
        </div>
      )}

      {/* Profile UI moved into the sidebar below */}

      <h2 className={styles.title}>My Task Calendar</h2>

      <div className={styles.mainContentContainer}>
        <div className={styles.editSidebar}>
          {selectedEvent ? (
            <EditModal
              selectedEvent={selectedEvent}
              setEvents={setEvents}
              events={events}
              setShowModal={() => setSelectedEvent(null)}
              setPoints={setPoints}
              supabase={supabase}
              friendsList={friendsList}
              currentUser={currentUser}
              myUsername={myUsername}
              myAvatarUrl={myAvatarUrl}
            />
          ) : hoveredEvent ? (
            <TaskDetailsView 
              event={hoveredEvent}
              supabase={supabase}    
              currentUser={currentUser}
              myUsername={myUsername}
              myAvatarUrl={myAvatarUrl}
              />
          ) : (
            <AddTaskForm
              newTask={newTask}
              setNewTask={setNewTask}
              handleAddTask={handleAddTask}
              supabase={supabase}
              friendsList={friendsList} 
              currentUser={currentUser} 
            />
          )}
        </div>

        <div className={styles.calendarContainer}>
          <DragAndDropCalendar
            localizer={localizer}
            events={events}
            startAccessor={(event: any) => new Date(event.start)}
            endAccessor={(event: any) => new Date(event.end)}
            style={{ height: 600 }}
            eventPropGetter={eventStyleGetter}
            onSelectEvent={(event) => {
              setSelectedEvent(event); 
              setHoveredEvent(null);  
            }}
            selectable
            onSelectSlot={handleSelectSlot} 
            components={{
              event: EventComponent, 
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
      
      <WidgetTimer tasks={events as unknown as never[]} />
    </div>
  );
}

// -----------------------------------------------------------------------------
// CÁC COMPONENT PHỤ
// -----------------------------------------------------------------------------

  // Custom bg và các cài đặt khác
function BackgroundCustomizer({ session, streak }: { session: Session | null, streak: number }) {
    const [bgColor, setBgColor] = useState("#efe4e4ff");
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [isCustomizeOpen, setIsCustomizeOpen] = useState(false);


    useEffect(() => {
      if (!document.body.style.backgroundImage || document.body.style.backgroundImage === 'none') {
          document.body.style.backgroundColor = bgColor;
      }
    }, [bgColor]);

    const handleColorChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const val = e.target.value;
      setBgColor(val);
      document.body.style.backgroundImage = 'none';
      document.body.style.background = val;
      document.body.style.backgroundColor = val;
      document.body.style.setProperty('--background', val);
      try {
        localStorage.setItem('app_bg_mode', 'color');
        localStorage.setItem('app_bg_color', val);
        localStorage.removeItem('app_bg_image');
      } catch {}
    };

    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onloadend = () => {
        document.body.style.backgroundImage = `url(${reader.result})`;
        document.body.style.backgroundSize = "cover";
        document.body.style.backgroundPosition = "center";
        document.body.style.backgroundColor = "";
        try {
          localStorage.setItem('app_bg_mode', 'image');
          localStorage.setItem('app_bg_image', String(reader.result));
          localStorage.removeItem('app_bg_color');
        } catch {}
      };
      reader.readAsDataURL(file);
    };

    const toggleSidebar = () => {
      setIsSidebarOpen(prev => !prev);
    };

    const handleCloseSidebar = () => {
        setIsSidebarOpen(false);
    };

    const HamburgerIcon = (
      <div 
        style={{ 
          display: 'flex', 
          flexDirection: 'column', 
          justifyContent: 'space-around', 
          width: '50%',
          height: '50%',
          margin: 'auto'
        }}
      >
        <div className={styles.iconBar}></div>
        <div className={styles.iconBar}></div>
        <div className={styles.iconBar}></div>
      </div>
    );

    

    return (
      <>
        {isSidebarOpen && (
            <div 
                onClick={handleCloseSidebar}
                style={{
                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                    backgroundColor: 'rgba(122, 118, 118, 0.3)', 
                    zIndex: 999, 
                    transition: 'opacity 0.3s ease-in-out',
                    cursor: 'pointer',
                }}
            />
        )}

        <button 
          onClick={toggleSidebar} 
          title="Edit Interface"
          className={styles.toggleButton} 
          style={{ 
            transform: isSidebarOpen ? 'rotate(0deg)' : 'rotate(0deg)', 
          }}
        >
          {HamburgerIcon} 
        </button>

          <div 
          className={styles.sidebar} 
          style={{ 
            transform: isSidebarOpen ? 'translateX(0)' : 'translateX(-100%)',
            transition: 'transform 0.3s ease-in-out',
            pointerEvents: isSidebarOpen ? 'auto' : 'none', 
          }}
        >
          {/* ==== 2. THÊM ONCLICK VÀ MŨI TÊN (ARROW) ==== */}
          <div 
            className={styles.dashboardHeader} // <-- ĐÃ THAY TỪ sidebarHeader sang dashboardHeader
            onClick={() => setIsCustomizeOpen(!isCustomizeOpen)} 
          >
            <span>Customize the interface</span> { /* Bọc text */ }
            <span 
              className={`${styles.customizeArrow} ${isCustomizeOpen ? styles.open : ''}`}
            >
            </span> 
          </div>
          <div 
            className={`${styles.customizeContentWrapper} ${isCustomizeOpen ? styles.open : ''}`}
          >
            {/* Hai mục này giờ nằm bên trong wrapper */}
            <div className={styles.menuItem}>
                <label title="Choose background color" className={styles.labelWrapper}>
                    <span className={styles.linkText}>Background Color</span>
                    <input type="color" value={bgColor} onChange={handleColorChange} style={{ display: 'none' }} />
                    <div className={styles.actionPlus} title="Open color picker">
                      +
                    </div>
                </label>
            </div>
            <div className={styles.menuItem}>
                <label title="Upload background image" className={styles.labelWrapper}>
                    <span className={styles.linkText}>Upload Background Image</span>
                    <input type="file" accept="image/*" onChange={handleImageUpload} style={{ display: "none" }}/>
                    <div className={styles.actionPlus} title="Upload">
                      +
                    </div>
                </label>
            </div>
          </div>

          <Link 
              href="/profile/view" 
              className={styles.dashboardHeader}
          >
            <span className={styles.dashboardLink}>Profile</span>
          </Link>

          <Link 
              href="/dashboard" 
              className={styles.dashboardHeader}
          >
            <span className={styles.dashboardLink}>Dashboard</span>
          </Link>
          {/* Invite Friends inside sidebar */}
          <Link 
              href="/friends" 
              className={styles.dashboardHeader}
          >
            <span className={styles.dashboardLink}>Invite Friends</span>
          </Link>
          <div className={styles.logoutContainer}> 
              
              <LogoutButton
                session={session} 
                style={{
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  width: '100%',
                  fontWeight: 'bold',
                }}
              >
                 Loggout
              </LogoutButton>
          </div>
          </div>

      </>
    );
  }

function TaskDetailsView({ event, supabase, currentUser, myUsername, myAvatarUrl }: { event: any, supabase: any, currentUser: any, myUsername: string, myAvatarUrl: string }) {
  const taskTypeIcons = { work: "💼", study: "📚", outdoor: "🌳", personal: "🧘", other: "🔹" };

  return (
    <div className={styles.taskDetailsView}>
      <h3>Task Details</h3>
      <h4>{taskTypeIcons[event.type as keyof typeof taskTypeIcons] || "🔹"} {event.title}</h4>
      <p><strong>Start:</strong> {new Date(event.start).toLocaleString()}</p>
      <p><strong>End:</strong> {new Date(event.end).toLocaleString()}</p>
      <p><strong>Description:</strong></p>
      <p className={styles.taskDescription}>{event.description || "No description available."}</p>

      <div style={{ marginTop: 10 }}>
        <p><strong>Owner:</strong></p>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '4px' }}>
          <img 
            src={event.ownerProfile?.avatar_url || 'https://placehold.co/24x24?text=O'} 
            alt={event.ownerProfile?.username || 'Owner'}
            style={{ width: 24, height: 24, borderRadius: '50%', objectFit: 'cover' }}
          />
          <span style={{ fontWeight: 500 }}>
            {event.ownerProfile?.username || 'Chủ sở hữu ẩn danh'}
          </span>
        </div>
      </div>

      <div style={{ marginTop: 10 }}>
              <p><strong>Collaborators:</strong></p>
              {event.collaborators && event.collaborators.length > 0 ? (
                <ul style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '4px' }}>
                  {event.collaborators.map((c: any) => (
                    <li key={c.user_id} style={{ marginBottom: 6, display: 'flex', alignItems: 'center', gap: 6 }}>
                      <img 
                          src={c.profile?.avatar_url || 'https://placehold.co/20x20?text=C'} 
                          alt={c.profile?.username || 'Collab'}
                          style={{ width: 20, height: 20, borderRadius: '50%', objectFit: 'cover' }}
                        />
                      <span>
                        {c.profile?.username || c.profile?.email || "Bạn ẩn danh"}
                        <small style={{ color: "#666", marginLeft: 4 }}>
                          ({c.role === 'EDITOR' ? 'Edit' : 'View only'})
                        </small>
                      </span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p>No collaborators.</p>
              )}
        </div>

      <TaskComments
        supabase={supabase}
        task={event}
        currentUser={currentUser}
        showInput={false} 
        myUsername={myUsername}
        myAvatarUrl={myAvatarUrl}
      />
    </div>
  );
}


function AddTaskForm({ newTask, setNewTask, handleAddTask,friendsList = [], currentUser }: any) {

  // Tạo danh sách những người có thể assign task (Gồm mình + bạn bè đã chọn)
  const assignableUsers = [
    { id: currentUser?.id, name: '🙋‍♂️ Tôi' },
    ...(newTask.visibility === 'PUBLIC' 
        ? friendsList.filter((f: any) => newTask.collaborators?.includes(f.id)) 
        : [])
  ];

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
          <option value="work">Work</option>
          <option value="study">Study</option>
          <option value="outdoor">Outdoor</option>
          <option value="personal">Personal</option>
          <option value="other">Other</option>
        </select>
      </label>
      {/* Chọn chế độ */}
      <div style={{ marginTop: '15px', marginBottom: '15px' }}>
        <label style={{ fontWeight: 'bold' }}>Mode:</label>
        <div style={{ display: 'flex', gap: '10px', marginTop: '5px' }}>
          <button 
            className={newTask.visibility === 'PRIVATE' ? styles.save : styles.cancel}
            onClick={() => setNewTask({ ...newTask, visibility: 'PRIVATE', collaborators: [] })}
          >
            Private
          </button>
          <button 
            className={newTask.visibility === 'PUBLIC' ? styles.save : styles.cancel}
            onClick={() => setNewTask({ ...newTask, visibility: 'PUBLIC' })}
          >
            Collaborate
          </button>
        </div>
      </div>
      {/* Choose friends (if mode is PUBLIC) */}
      {newTask.visibility === 'PUBLIC' && (
        <div style={{ marginBottom: '15px', padding: '10px', border: '1px dashed #ccc', borderRadius: '6px' }}>
          <label style={{ fontWeight: 'bold' }}>Invite friends:</label>
          <div style={{ maxHeight: '100px', overflowY: 'auto', marginTop: '5px' }}>
            {friendsList.map((friend: any) => (
              <div key={friend.id} style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                <input
                  type="checkbox"
                  id={`friend-${friend.id}`}
                  checked={newTask.collaborators?.includes(friend.id) || false}
                  onChange={(e) => {
                    const currentCollaborators = newTask.collaborators || [];
                    const currentRoles = newTask.collaboratorRoles || {};

                    if (e.target.checked) {
                      // Thêm bạn
                      setNewTask({ 
                        ...newTask, 
                        collaborators: [...currentCollaborators, friend.id],
                        collaboratorRoles: { ...currentRoles, [friend.id]: 'VIEWER' } // Mặc định là VIEWER
                      });
                    } else {
                      // Xóa bạn
                      const newRoles = { ...currentRoles };
                      delete newRoles[friend.id]; // Xóa role của bạn
                      setNewTask({ 
                        ...newTask, 
                        collaborators: currentCollaborators.filter((id: string) => id !== friend.id),
                        collaboratorRoles: newRoles
                      });
                    }
                  }}
                />
                <label htmlFor={`friend-${friend.id}`} style={{ cursor: 'pointer' }}>{friend.name}</label>
                
                {/* Dropdown chọn Role (THÊM MỚI) */}
                {newTask.collaborators?.includes(friend.id) && (
                  <select
                    value={newTask.collaboratorRoles?.[friend.id] || 'VIEWER'}
                    onChange={(e) => {
                      setNewTask({
                        ...newTask,
                        collaboratorRoles: {
                          ...(newTask.collaboratorRoles || {}),
                          [friend.id]: e.target.value,
                        },
                      });
                    }}
                    style={{ marginLeft: 60, fontSize: '12px', padding: '5px', borderRadius: '4px',color: "#666" }}
                  >
                    <option value="VIEWER">View only</option>
                    <option value="EDITOR">Edit</option>
                  </select>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      <div className={styles.buttonGroupadd}>
        <button className={styles.save} onClick={handleAddTask}>Add Task</button>
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





interface Task {
  collaborators: never[];
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

function EditModal({ selectedEvent, setEvents, setShowModal, setPoints, events, supabase, friendsList = [], currentUser, myUsername, myAvatarUrl }: EditModalProps & { supabase: any, friendsList?: any[], currentUser?: any, myUsername: string, myAvatarUrl: string }) {  
  const [editingEvent, setEditingEvent] = useState<any>(selectedEvent);
  const [localCollabRoles, setLocalCollabRoles] = useState<Record<string, string>>({});

  const getMyRole = () => {
    if (!currentUser || !editingEvent) return 'NONE';
    
    // 1. Tôi là chủ task
    if (editingEvent.user_id === currentUser.id) {
      return 'OWNER';
    }
    
    // 2. Tìm tôi trong danh sách collaborators
    const myCollabInfo = (editingEvent.collaborators || []).find(
      (c: any) => c.user_id === currentUser.id
    );

    if (myCollabInfo) {
      return myCollabInfo.role; // (VD: 'EDITOR' hoặc 'VIEWER')
    }
    
    // 3. Tôi không liên quan
    return 'NONE'; 
  };

  const myRole = getMyRole();
  
  // Tạo các biến cờ để code dễ đọc
  const canEdit = (myRole === 'OWNER' || myRole === 'EDITOR');
  const isOwner = (myRole === 'OWNER');

  useEffect(() => {
    setEditingEvent(selectedEvent);
    // Init local collaborators from selectedEvent.collaborators (mảng object)
    const initRoles = (selectedEvent?.collaborators || []).reduce((acc: any, c: any) => {
      acc[c.user_id] = c.role; // { 'user-id': 'EDITOR' }
      return acc;
    }, {});
    setLocalCollabRoles(initRoles);
  }, [selectedEvent]);

  const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const target = e.target as HTMLInputElement | HTMLSelectElement;
    const { name, value, type } = target;
    const checked = (target as HTMLInputElement).checked;
    const finalValue = type === 'checkbox' ? checked : value;
    setEditingEvent((prev: any) => ({ ...prev, [name]: finalValue }));
  };

  const toggleCollaborator = (userId: string) => {
    setLocalCollabRoles(prev => {
      const newRoles = { ...prev };
      if (newRoles[userId]) {
        delete newRoles[userId];
      } else {
        newRoles[userId] = 'VIEWER'; 
      }
      return newRoles;
    });
  };

  const updateCollaboratorRole = (userId: string, role: string) => {
      setLocalCollabRoles(prev => ({
        ...prev,
        [userId]: role,
      }));
  };

  const handleDelete = async () => {
    if (window.confirm(`Are you sure you want to delete the task "${selectedEvent.title}"?`)) {
      const { error } = await supabase.from("tasks").delete().eq("id", selectedEvent.id);
      if (error) {
        console.error("Error deleting task:", error);
        alert("Delete failed!");
      } else {
        // Delete related collaborators (cleanup) - optional
        await supabase.from("task_collaborators").delete().eq("task_id", selectedEvent.id);
        setEvents((prev) => prev.filter((ev) => ev.id !== selectedEvent.id));
        setShowModal(false);
      }
    }
  };

  const handleSave = async () => {
    try {
      // chuẩn hoá start/end
      const startDate = new Date(editingEvent.start);
      const endDate = new Date(editingEvent.end);

      // Update tasks table
      const { error: updateError } = await supabase
        .from("tasks")
        .update({
          title: editingEvent.title,
          description: editingEvent.description,
          start_time: startDate.toISOString(),
          end_time: endDate.toISOString(),
          color: editingEvent.color,
          type: editingEvent.type,
          completed: editingEvent.completed,
          visibility: editingEvent.visibility || "PRIVATE"
        })
        .eq("id", editingEvent.id);

      if (updateError) {
        console.error("Error", updateError);
        alert("Failed. Check console for details.");
        return;
      }

      const { error: delError } = await supabase.from("task_collaborators").delete().eq("task_id", editingEvent.id);
      if (delError) {
        console.error("Error deleting old collaborators:", delError);
      }

      const localCollaboratorIds = Object.keys(localCollabRoles);

      if (editingEvent.visibility === "PUBLIC" && localCollaboratorIds.length > 0) {
        const payload = localCollaboratorIds.map((uid) => ({
          task_id: editingEvent.id,
          user_id: uid,
          role: localCollabRoles[uid] || "VIEWER", // Lấy role, nếu lỗi thì mặc định là VIEWER
        }));

        const { error: insError } = await supabase.from("task_collaborators").insert(payload);
        if (insError) {
          console.error("Error insert collaborators:", insError);
        }
      }

      const { data: collabRows } = await supabase
        .from("task_collaborators")
        .select("user_id, role")
        .eq("task_id", editingEvent.id);

      let collaborators = [];
      if (collabRows && collabRows.length > 0) {
        const userIds = collabRows.map((r: any) => r.user_id);
        const { data: profilesData } = await supabase
          .from("profiles")
          .select("id, username, email, avatar_url")
          .in("id", userIds);

        const profMap = (profilesData || []).reduce((acc: any, p: any) => { acc[p.id] = p; return acc; }, {});
        collaborators = collabRows.map((r: any) => ({ user_id: r.user_id, role: r.role, profile: profMap[r.user_id] || null }));
      }

      const finalEventToSave = {
        ...editingEvent,
        start: startDate,
        end: endDate,
        collaborators,
        ownerProfile: editingEvent.ownerProfile, // Giữ lại ownerProfile đã fetch
      };
      setEvents((prev) => prev.map(ev => ev.id === finalEventToSave.id ? finalEventToSave : ev));

      // Logic cộng điểm (giữ nguyên)
      const originalEvent = events.find((ev) => ev.id === finalEventToSave.id);
      const wasCompleted = originalEvent ? originalEvent.completed : false;
      const now = new Date();
      if (finalEventToSave.completed && !wasCompleted && finalEventToSave.end <= now) {
        setPoints((prev) => prev + 10);
      }

      setShowModal(false);
    } catch (err) {
      console.error("Lỗi khi lưu edit modal:", err);
      alert("Lưu thất bại, kiểm tra console.");
    }
  };

  if (!editingEvent) return null;

  const formatDateTimeLocal = (date: string | Date | undefined) => {
    if (!date) return "";
    const d = new Date(date);
    d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
    return d.toISOString().slice(0, 16);
  };

  return (
    <div className={styles.editForm}>
      <h3>{isOwner ? "Edit Task" : "View Task Details"}</h3>
      {!isOwner && (
        <p style={{ fontStyle: 'italic', color: '#666', fontSize: '0.9em' }}>
          You only have view access because you are not the owner.
        </p>
      )}
      <div style={{ marginTop: 12 }}>
        <label style={{ fontWeight: "bold" }}>Owner:</label>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px', background: 'rgba(0,0,0,0.04)', borderRadius: '6px', marginTop: 4 }}>
          <img 
            src={editingEvent.ownerProfile?.avatar_url || 'https://placehold.co/32x32?text=O'} 
            alt={editingEvent.ownerProfile?.username || 'Owner'}
            style={{ width: 32, height: 32, borderRadius: '50%', objectFit: 'cover' }}
          />
          <span style={{ fontWeight: 500 }}>
            {editingEvent.ownerProfile?.username || 'Chủ sở hữu ẩn danh'}
          </span>
        </div>
      </div>    

      <label>
        Title:
        <input type="text" name="title" value={editingEvent.title} onChange={handleChange} disabled={!isOwner} />
      </label>
      <label>
        Description:
        <input type="text" name="description" value={editingEvent.description || ""} onChange={handleChange} disabled={!isOwner} />
      </label>
      <label>
        Start:
        <input type="datetime-local" name="start" value={formatDateTimeLocal(editingEvent.start)} onChange={handleChange} disabled={!isOwner} />
      </label>
      <label>
        End:
        <input type="datetime-local" name="end" value={formatDateTimeLocal(editingEvent.end)} onChange={handleChange} disabled={!isOwner} />
      </label>
      <label>
        Color:
        <input type="color" name="color" value={editingEvent.color} onChange={handleChange} disabled={!isOwner} />
      </label>
      <label>
        Type:
        <select name="type" value={editingEvent.type} onChange={handleChange} disabled={!isOwner}>
          <option value="work">Work</option>
          <option value="study">Study</option>
          <option value="outdoor">Outdoor</option>
          <option value="personal">Personal</option>
          <option value="other">Other</option>
        </select>
      </label>

      <div style={{ marginTop: 10 }}>
        <label style={{ fontWeight: "bold" }}>Visibility:</label>
        <div style={{ display: "flex", gap: 8, marginTop: 6 }}>
          <button onClick={() => setEditingEvent((p: any) => ({ ...p, visibility: "PRIVATE" }))} className={editingEvent.visibility === "PRIVATE" ? styles.save : styles.cancel} disabled={!isOwner}>Private</button>
          <button onClick={() => setEditingEvent((p: any) => ({ ...p, visibility: "PUBLIC" }))} className={editingEvent.visibility === "PUBLIC" ? styles.save : styles.cancel} disabled={!isOwner}>Collaboration</button>
        </div>
      </div>

      {/* Collaborators chooser (vẫn disable luôn) */}
      {editingEvent.visibility === "PUBLIC" && (
        
        // NẾU TÔI LÀ CHỦ (OWNER) -> Tôi thấy danh sách bạn bè (friendsList)
        isOwner ? (
          <div style={{ marginTop: 12 }}>
            <label style={{ fontWeight: "bold" }}>Collaborators:</label>
            <div style={{ maxHeight: 120, overflowY: "auto", marginTop: 6, display: 'flex', flexDirection: 'column', gap: 10 }}>
              {friendsList.length === 0 && <div style={{ color: '#666', fontSize: '0.9em' }}>Không có bạn bè</div>}

              {friendsList.map((f: any) => {
                const isChecked = !!localCollabRoles[f.id]; // Kiểm tra xem có trong object roles không
                const currentRole = localCollabRoles[f.id] || 'VIEWER'; // Lấy role (nếu có)

                return (
                  <div key={f.id} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <input
                      type="checkbox"
                      id={`friend-edit-${f.id}`}
                      style={{ width: 16, height: 16, flexShrink: 0 }}
                      checked={isChecked}
                      onChange={() => toggleCollaborator(f.id)}
                    />
                    
                    <label 
                        htmlFor={`friend-edit-${f.id}`} 
                        style={{ 
                          display: 'flex', 
                          flexDirection: 'row',      
                          alignItems: 'center',   
                          gap: 6, 
                          cursor: 'pointer', 
                          flex: 1 
                        }}
                      >
                        <img 
                          src={f.avatar_url || 'https://placehold.co/24x24?text=F'} 
                          alt={f.name}
                          style={{ width: 24, height: 24, borderRadius: '50%', objectFit: 'cover' }}
                        />
                        <span>{f.name}</span>
                    </label>
                    
                    {/* Hiển thị dropdown chọn Role NẾU họ được check */}
                    {isChecked && (
                      <select
                        value={currentRole}
                        onChange={(e) => updateCollaboratorRole(f.id, e.target.value)}
                        style={{ marginLeft: 'auto', fontSize: '15px', padding: '2px', borderRadius: '4px', width: '100px'}}
                      >
                        <option value="VIEWER">View only</option>
                        <option value="EDITOR">Edit</option>
                      </select>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
        // NẾU TÔI KHÔNG PHẢI CHỦ -> Tôi chỉ thấy danh sách (editingEvent.collaborators)
          <div style={{ marginTop: 12 }}>
            <label style={{ fontWeight: "bold" }}>Collaborators:</label>
            {/* ... (Code cũ của bạn cho phần non-owner giữ nguyên - nó đã đẹp rồi) ... */}
            {editingEvent.collaborators && editingEvent.collaborators.length > 0 ? (
              <ul style={{ paddingLeft: 16, marginTop: 6, marginBlock: 0 }}>
                {editingEvent.collaborators.map((c: any) => (
                  <li key={c.user_id} style={{ marginBottom: 6, display: 'flex', alignItems: 'center', gap: 8 }}>
                     <img 
                        src={c.profile?.avatar_url || 'https://placehold.co/24x24?text=C'} 
                        alt={c.profile?.username || 'Collab'}
                        style={{ width: 24, height: 24, borderRadius: '50%', objectFit: 'cover' }}
                      />
                    <span>
                      {c.profile?.username || c.profile?.email || "Bạn ẩn danh"}
                      <small style={{ color: "#666", marginLeft: 4 }}>
                        ({c.role === 'EDITOR' ? 'Edit' : 'View only'})
                      </small>
                    </span>
                  </li>
                ))}
              </ul>
            ) : (
              <div style={{ marginTop: 6, color: "#666", fontSize: '0.9em' }}>Không có ai được mời.</div>
            )}
          </div>
        )
      )}

      <label className={styles.checkboxLabel}>
        Completed:
        <div className={styles.checkboxWrapper}>
          <input type="checkbox" name="completed" checked={!!editingEvent.completed} onChange={handleChange} disabled={!isOwner} />
        </div>
      </label>

      <TaskComments
        supabase={supabase}
        task={editingEvent}
        currentUser={currentUser}
        myUsername={myUsername}
        myAvatarUrl={myAvatarUrl}
      />

      <div className={styles.buttonGroup}>
        <button className={styles.saveBtn} onClick={handleSave} disabled={!isOwner}>Save</button>
        <button className={styles.deleteBtn} onClick={handleDelete} disabled={!isOwner}>Delete</button>
        <button className={styles.cancelBtn} onClick={() => setShowModal(false)}>Cancel</button>
      </div>
    </div>
  );
}


function TaskComments({ supabase, task, currentUser, myUsername, myAvatarUrl, showInput: initialShowInput = true }: { supabase: any, task: any, currentUser: any, myUsername: string, myAvatarUrl: string, showInput?: boolean }) {
  const [comments, setComments] = useState<any[]>([]);
  const [newComment, setNewComment] = useState("");
  const [loading, setLoading] = useState(true);

  // Hàm lấy comments
  const fetchComments = async () => {
    if (!task?.id) return;
    setLoading(true);

    // Query 1: Lấy tất cả comment
    const { data: commentsData, error: commentsError } = await supabase
      .from('task_comments')
      .select('*') // Chỉ lấy comment, không join
      .eq('task_id', task.id)
      .order('created_at', { ascending: true });

    if (commentsError) {
      console.error("Lỗi lấy comments:", commentsError);
      setLoading(false);
      return;
    }
    if (!commentsData || commentsData.length === 0) {
      setComments([]);
      setLoading(false);
      return;
    }

    // Query 2: Lấy profiles cho các comment đó
    const userIds = Array.from(new Set(commentsData.map((c: any) => c.user_id)));
    const { data: profilesData, error: profilesError } = await supabase
      .from('profiles')
      .select('id, username, avatar_url')
      .in('id', userIds);

    if (profilesError) {
      console.error("Error to fetch profiles:", profilesError);
    }

    // Gộp 2 kết quả lại
    const profilesMap = (profilesData || []).reduce((acc: any, p: any) => {
      acc[p.id] = p;
      return acc;
    }, {});

    const combinedComments = commentsData.map((comment: any) => ({
      ...comment,
      profiles: profilesMap[comment.user_id] || null // Gắn profile vào comment
    }));

    setComments(combinedComments);
    setLoading(false);
  };

  useEffect(() => {
    fetchComments();
  }, [task.id]);


  // Hàm gửi comment
  const handleSubmitComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newComment.trim().length === 0 || !currentUser) return;

    // 1. Insert comment (Không .select() join)
    const { data, error } = await supabase
      .from('task_comments')
      .insert({
        task_id: task.id,
        user_id: currentUser.id,
        content: newComment.trim(),
      })
      .select() // Chỉ .select() để lấy lại dòng vừa insert
      .single();

    if (error) {
      alert("Không thể gửi comment!");
      console.error(error);
    } else {
      // 2. Tự "gắn" profile của mình vào comment mới
      // để nó hiển thị ngay mà không cần fetch
      const newCommentWithProfile = {
        ...data,
        profiles: {
          username: myUsername || 'Tôi',
          avatar_url: myAvatarUrl || null
        }
      };
      
      setComments((prev) => [...prev, newCommentWithProfile]);
      setNewComment("");
    }
  };

  return (
    <div className={styles.commentsSection} style={{ marginTop: 20, borderTop: '1px solid #eee', paddingTop: 15 }}>
      <h4>Comment</h4>
      
      {/* Danh sách comments */}
      <div style={{ 
          maxHeight: '150px',     
          overflowY: 'auto',       
          marginBottom: 10, 
          padding: '8px',          
          borderRadius: '5px',     
          background: '#f5f2f2ff' 
      }}>
        {loading && <p>Loading...</p>}
        {!loading && comments.length === 0 && <p style={{ color: '#888', fontSize: '0.9em' }}>No comments yet.</p>}
        
        {comments.map((comment) => (
          <div key={comment.id} style={{ marginBottom: 6, paddingBottom: 5, borderBottom: '1px solid #f0f0f0' }}>
            <strong style={{ fontSize: '0.9em' , color: '#535353ff'}}>
              {/* Sửa lại để kiểm tra 'profiles' tồn tại */}
              {comment.profiles?.username || 'Anonymous user'}
            </strong>
            <p style={{ margin: '4px 0 0', whiteSpace: 'pre-wrap', color: '#6a6e7c' }}>{comment.content}</p>
            <small style={{ color: '#dad7d7ff', fontSize: '0.75em' }}>
              {new Date(comment.created_at).toLocaleString()}
            </small>
          </div>
        ))}
      </div>
      {initialShowInput && (
        <form onSubmit={handleSubmitComment} style={{ display: 'flex', gap: 8, color: '#979494ff' }}>
          <input
            type="text"
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder="Comment..."
            style={{ flex: 1 }}
          />
          <button type="submit" className={styles.saveBtn} style={{ padding: '0px 12px' }}>Send</button>
        </form>
      )}
    </div>
  );
}

