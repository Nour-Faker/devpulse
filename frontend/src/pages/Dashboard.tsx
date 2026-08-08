import { useEffect, useState, useRef } from "react";
import type { WorkSession } from "../api/sessions";
import type { Project } from "../api/projects";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import { getProjects, createProject, deleteProject } from "../api/projects";
import { getSessions, createSession, deleteSession } from "../api/sessions";
import { getStats } from "../api/stats";
import {
  LayoutDashboard, FolderKanban, Clock, Timer,
  LogOut, Sun, Moon, Plus, X, Trash2,
  TrendingUp, Flame, Target, Download,
} from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, AreaChart, Area,
} from "recharts";

const MOOD_COLORS: Record<string, string> = {
  great: "#22c55e", good: "#3b82f6", okay: "#f59e0b", bad: "#ef4444",
};

const MOOD_EMOJI: Record<string, string> = {
  great: "🔥", good: "😊", okay: "😐", bad: "😤",
};

type View = "dashboard" | "projects" | "sessions" | "pomodoro";

function StatCard({ label, value, icon, delay, color }: any) {
  const [displayed, setDisplayed] = useState(0);
  const num = parseFloat(value) || 0;

  useEffect(() => {
    let start = 0;
    const step = num / 30;
    const timer = setInterval(() => {
      start += step;
      if (start >= num) { setDisplayed(num); clearInterval(timer); }
      else setDisplayed(Math.floor(start));
    }, 30);
    return () => clearInterval(timer);
  }, [num]);

  return (
    <div className={`card p-5 animate-fade-in-up stagger-${delay}`} style={{ background: "var(--card)" }}>
      <div className="flex justify-between items-start mb-3">
        <p style={{ fontSize: 13, color: "var(--text-2)" }}>{label}</p>
        <div style={{ background: color + "22", borderRadius: 10, padding: "6px 8px" }}>
          {icon}
        </div>
      </div>
      <p className="stat-number" style={{ fontSize: 32, fontWeight: 700, color: "var(--text)" }}>
        {typeof value === "string" && value.includes("h") ? `${displayed}h` : displayed}
      </p>
    </div>
  );
}

function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === "dark";
  return (
    <button
      onClick={toggleTheme}
      className={`theme-toggle ${isDark ? "active" : ""}`}
      aria-label="Toggle theme"
    >
      <div className="theme-toggle-thumb" />
    </button>
  );
}

function NavItem({ icon, label, active, onClick }: any) {
  return (
    <button
      onClick={onClick}
      style={{
        position: "relative",
        display: "flex",
        alignItems: "center",
        gap: 10,
        width: "100%",
        padding: "10px 16px",
        borderRadius: 10,
        fontSize: 14,
        fontWeight: active ? 500 : 400,
        color: active ? "var(--accent)" : "var(--text-2)",
        background: active ? "var(--accent)15" : "transparent",
        border: "none",
        cursor: "pointer",
        transition: "all 0.2s ease",
      }}
    >
      {active && <div className="nav-active-indicator" />}
      {icon}
      {label}
    </button>
  );
}

function Modal({ title, onClose, children }: any) {
  return (
    <div
      className="animate-fade-in"
      style={{
        position: "fixed", inset: 0, zIndex: 50,
        background: "rgba(0,0,0,0.5)",
        display: "flex", alignItems: "center", justifyContent: "center",
        backdropFilter: "blur(4px)",
      }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        className="animate-fade-in-up"
        style={{
          background: "var(--surface)", borderRadius: 20,
          padding: 28, width: "100%", maxWidth: 460,
          border: "1px solid var(--border)",
          boxShadow: "0 24px 60px rgba(0,0,0,0.3)",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
          <h3 style={{ fontSize: 18, fontWeight: 600, color: "var(--text)" }}>{title}</h3>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-2)" }}>
            <X size={18} />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

function Input({ label, ...props }: any) {
  return (
    <div style={{ marginBottom: 16 }}>
      <label style={{ display: "block", fontSize: 13, color: "var(--text-2)", marginBottom: 6, fontWeight: 500 }}>{label}</label>
      <input
        {...props}
        style={{
          width: "100%", padding: "10px 14px",
          background: "var(--surface-2)", border: "1px solid var(--border)",
          borderRadius: 10, color: "var(--text)", fontSize: 14, outline: "none",
          transition: "border-color 0.2s",
        }}
        onFocus={(e) => e.target.style.borderColor = "var(--accent)"}
        onBlur={(e) => e.target.style.borderColor = "var(--border)"}
      />
    </div>
  );
}

function Select({ label, children, ...props }: any) {
  return (
    <div style={{ marginBottom: 16 }}>
      <label style={{ display: "block", fontSize: 13, color: "var(--text-2)", marginBottom: 6, fontWeight: 500 }}>{label}</label>
      <select
        {...props}
        style={{
          width: "100%", padding: "10px 14px",
          background: "var(--surface-2)", border: "1px solid var(--border)",
          borderRadius: 10, color: "var(--text)", fontSize: 14, outline: "none",
        }}
      >
        {children}
      </select>
    </div>
  );
}

function Btn({ children, variant = "primary", ...props }: any) {
  const styles: any = {
    primary: { background: "var(--accent)", color: "#fff" },
    success: { background: "#22c55e", color: "#fff" },
    ghost: { background: "var(--surface-2)", color: "var(--text)" },
    danger: { background: "#ef444422", color: "#ef4444" },
  };
  return (
    <button
      {...props}
      style={{
        ...styles[variant],
        padding: "10px 18px", borderRadius: 10, border: "none",
        fontSize: 14, fontWeight: 500, cursor: "pointer",
        transition: "opacity 0.2s, transform 0.1s",
        ...props.style,
      }}
      onMouseEnter={(e: any) => e.currentTarget.style.opacity = "0.88"}
      onMouseLeave={(e: any) => e.currentTarget.style.opacity = "1"}
      onMouseDown={(e: any) => e.currentTarget.style.transform = "scale(0.97)"}
      onMouseUp={(e: any) => e.currentTarget.style.transform = "scale(1)"}
    >
      {children}
    </button>
  );
}

export default function Dashboard() {
  const { user, logout } = useAuth();
  const { theme } = useTheme();
  const navigate = useNavigate();
  const [view, setView] = useState<View>("dashboard");

  const [projects, setProjects] = useState<Project[]>([]);
  const [sessions, setSessions] = useState<WorkSession[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const [showProjectModal, setShowProjectModal] = useState(false);
  const [showSessionModal, setShowSessionModal] = useState(false);

  const [projectName, setProjectName] = useState("");
  const [projectDesc, setProjectDesc] = useState("");

  const [sessionTitle, setSessionTitle] = useState("");
  const [sessionDesc, setSessionDesc] = useState("");
  const [sessionDuration, setSessionDuration] = useState("");
  const [sessionMood, setSessionMood] = useState("great");
  const [sessionProject, setSessionProject] = useState("");

  const [searchQuery, setSearchQuery] = useState("");
  const [filterMood, setFilterMood] = useState("all");
  const [filterProject, setFilterProject] = useState("all");

  const [goalHours, setGoalHours] = useState(() => parseInt(localStorage.getItem("goalHours") || "4"));

  // Pomodoro
  const [pomMinutes, setPomMinutes] = useState(25);
  const [pomSeconds, setPomSeconds] = useState(0);
  const [pomRunning, setPomRunning] = useState(false);
  const [pomMode, setPomMode] = useState<"work" | "break">("work");
  const [pomSessions, setPomSessions] = useState(0);
  const intervalRef = useRef<any>(null);

  useEffect(() => {
    Promise.all([getProjects(), getSessions(), getStats()])
      .then(([p, s, st]) => {
        setProjects(p.data);
        setSessions(s.data);
        setStats(st.data);
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (pomRunning) {
      intervalRef.current = setInterval(() => {
        setPomSeconds((sec) => {
          if (sec > 0) return sec - 1;
          setPomMinutes((min) => {
            if (min > 0) { setPomSeconds(59); return min - 1; }
            setPomRunning(false);
            if (pomMode === "work") {
              setPomSessions((s) => s + 1);
              setPomMode("break");
              setPomMinutes(5);
            } else {
              setPomMode("work");
              setPomMinutes(25);
            }
            return 0;
          });
          return 0;
        });
      }, 1000);
    }
    return () => clearInterval(intervalRef.current);
  }, [pomRunning, pomMode]);

  const handleLogout = () => { logout(); navigate("/login"); };

  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await createProject({ name: projectName, description: projectDesc });
    setProjects([...projects, res.data]);
    setProjectName(""); setProjectDesc(""); setShowProjectModal(false);
  };

  const handleCreateSession = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await createSession({
      title: sessionTitle, description: sessionDesc,
      duration_minutes: parseInt(sessionDuration),
      mood: sessionMood, project_id: sessionProject || undefined,
    });
    setSessions([...sessions, res.data]);
    setSessionTitle(""); setSessionDesc(""); setSessionDuration("");
    setShowSessionModal(false);
  };

  const handleDeleteProject = async (id: string) => {
    await deleteProject(id);
    setProjects(projects.filter((p) => p.id !== id));
  };

  const handleDeleteSession = async (id: string) => {
    await deleteSession(id);
    setSessions(sessions.filter((s) => s.id !== id));
  };

  const exportCSV = () => {
    const header = "Title,Description,Duration (min),Mood,Date\n";
    const rows = sessions.map((s) =>
      `"${s.title}","${s.description || ""}",${s.duration_minutes},${s.mood},${new Date(s.created_at).toLocaleDateString()}`
    ).join("\n");
    const blob = new Blob([header + rows], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = "devpulse-sessions.csv"; a.click();
  };

  const totalMinutes = sessions.reduce((acc, s) => acc + s.duration_minutes, 0);
  const totalHours = Math.round(totalMinutes / 60);
  const activeProjects = projects.filter((p) => p.status === "active").length;
  const todayMinutes = sessions.filter((s) => {
    const d = new Date(s.created_at);
    const now = new Date();
    return d.toDateString() === now.toDateString();
  }).reduce((acc, s) => acc + s.duration_minutes, 0);
  const todayHours = Math.round(todayMinutes / 60 * 10) / 10;
  const goalProgress = Math.min((todayHours / goalHours) * 100, 100);

  const moodCounts: Record<string, number> = {};
  sessions.forEach((s) => { if (s.mood) moodCounts[s.mood] = (moodCounts[s.mood] || 0) + 1; });
  const moodData = Object.entries(moodCounts).map(([mood, count]) => ({ mood, count }));

  const labels = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const dailyMap: Record<string, number> = {};
  labels.forEach((d) => (dailyMap[d] = 0));
  sessions.forEach((s) => {
    const day = labels[new Date(s.created_at).getDay()];
    dailyMap[day] = (dailyMap[day] || 0) + s.duration_minutes;
  });
  const dailyData = labels.map((day) => ({ day, hours: Math.round(dailyMap[day] / 60 * 10) / 10 }));

  const filteredSessions = sessions.filter((s) => {
    const matchSearch = s.title.toLowerCase().includes(searchQuery.toLowerCase());
    const matchMood = filterMood === "all" || s.mood === filterMood;
    const matchProject = filterProject === "all" || s.project_id === filterProject;
    return matchSearch && matchMood && matchProject;
  });

  const totalTime = pomMode === "work" ? pomMinutes * 60 : 5 * 60;
  const elapsed = (pomMode === "work" ? 25 * 60 : 5 * 60) - (pomMinutes * 60 + pomSeconds);
  const pomProgress = totalTime > 0 ? elapsed / totalTime : 0;
  const radius = 80;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference * (1 - pomProgress);

  const chartTheme = {
    contentStyle: {
      background: "var(--surface)",
      border: "1px solid var(--border)",
      borderRadius: 10,
      color: "var(--text)",
      fontSize: 12,
    },
    labelStyle: { color: "var(--text)" },
  };

  if (loading) return (
    <div style={{ minHeight: "100vh", background: "var(--bg)", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ textAlign: "center" }}>
        <div style={{ width: 40, height: 40, border: "3px solid var(--border)", borderTop: "3px solid var(--accent)", borderRadius: "50%", animation: "spin-slow 0.8s linear infinite", margin: "0 auto 12px" }} />
        <p style={{ color: "var(--text-2)", fontSize: 14 }}>Loading DevPulse...</p>
      </div>
    </div>
  );

  const navItems = [
    { key: "dashboard" as View, label: "Dashboard", icon: <LayoutDashboard size={16} /> },
    { key: "projects" as View, label: "Projects", icon: <FolderKanban size={16} /> },
    { key: "sessions" as View, label: "Sessions", icon: <Clock size={16} /> },
    { key: "pomodoro" as View, label: "Pomodoro", icon: <Timer size={16} /> },
  ];

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg)", display: "flex" }}>
      {/* Sidebar */}
      <aside style={{
        width: 220, background: "var(--sidebar)", borderRight: "1px solid var(--sidebar-border)",
        display: "flex", flexDirection: "column", position: "fixed", height: "100vh", zIndex: 10,
      }}>
        <div style={{ padding: "24px 20px 20px", borderBottom: "1px solid var(--border)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
            <div style={{ width: 32, height: 32, background: "var(--accent)", borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <TrendingUp size={16} color="#fff" />
            </div>
            <span style={{ fontWeight: 700, fontSize: 16, color: "var(--text)" }}>DevPulse</span>
          </div>
          <p style={{ fontSize: 12, color: "var(--text-3)", marginLeft: 42 }}>{user?.email}</p>
        </div>

        <nav style={{ flex: 1, padding: "16px 12px", display: "flex", flexDirection: "column", gap: 4 }}>
          {navItems.map((item) => (
            <NavItem
              key={item.key}
              icon={item.icon}
              label={item.label}
              active={view === item.key}
              onClick={() => setView(item.key)}
            />
          ))}
        </nav>

        <div style={{ padding: "16px 20px", borderTop: "1px solid var(--border)" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6, color: "var(--text-2)", fontSize: 13 }}>
              {theme === "dark" ? <Moon size={14} /> : <Sun size={14} />}
              <span>{theme === "dark" ? "Dark" : "Light"}</span>
            </div>
            <ThemeToggle />
          </div>
          <button
            onClick={handleLogout}
            style={{
              display: "flex", alignItems: "center", gap: 8,
              width: "100%", padding: "9px 12px", borderRadius: 10,
              background: "none", border: "none", cursor: "pointer",
              color: "var(--text-2)", fontSize: 13,
              transition: "all 0.2s",
            }}
            onMouseEnter={(e: any) => { e.currentTarget.style.background = "#ef444418"; e.currentTarget.style.color = "#ef4444"; }}
            onMouseLeave={(e: any) => { e.currentTarget.style.background = "none"; e.currentTarget.style.color = "var(--text-2)"; }}
          >
            <LogOut size={14} /> Logout
          </button>
        </div>
      </aside>

      {/* Main */}
      <main style={{ flex: 1, marginLeft: 220, minHeight: "100vh" }}>

        {/* DASHBOARD */}
        {view === "dashboard" && (
          <div style={{ padding: "32px 36px", maxWidth: 1100 }}>
            <div className="animate-fade-in-up" style={{ marginBottom: 28 }}>
              <h2 style={{ fontSize: 26, fontWeight: 700, color: "var(--text)", marginBottom: 4 }}>
                Good day, {user?.full_name?.split(" ")[0]} 👋
              </h2>
              <p style={{ color: "var(--text-2)", fontSize: 14 }}>Here's your productivity overview</p>
            </div>

            {/* Stats */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16, marginBottom: 24 }}>
              <StatCard label="Total Sessions" value={sessions.length} icon={<Clock size={16} color="#3b82f6" />} delay={1} color="#3b82f6" />
              <StatCard label="Hours Logged" value={`${totalHours}h`} icon={<TrendingUp size={16} color="#22c55e" />} delay={2} color="#22c55e" />
              <StatCard label="Active Projects" value={activeProjects} icon={<FolderKanban size={16} color="#8b5cf6" />} delay={3} color="#8b5cf6" />
              <StatCard label="This Week" value={`${stats?.weekly_hours || 0}h`} icon={<Flame size={16} color="#f59e0b" />} delay={4} color="#f59e0b" />
            </div>

            {/* Goal progress */}
            <div className="card animate-fade-in-up stagger-5" style={{ padding: "18px 24px", marginBottom: 24, background: "var(--card)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <Target size={16} color="var(--accent)" />
                  <span style={{ fontSize: 14, fontWeight: 500, color: "var(--text)" }}>Today's Goal</span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ fontSize: 13, color: "var(--text-2)" }}>{todayHours}h / {goalHours}h</span>
                  <input
                    type="number" min={1} max={12} value={goalHours}
                    onChange={(e) => { const v = parseInt(e.target.value); setGoalHours(v); localStorage.setItem("goalHours", String(v)); }}
                    style={{ width: 52, padding: "4px 8px", background: "var(--surface-2)", border: "1px solid var(--border)", borderRadius: 8, color: "var(--text)", fontSize: 13, textAlign: "center", outline: "none" }}
                  />
                </div>
              </div>
              <div className="progress-bar">
                <div className="progress-fill" style={{ width: `${goalProgress}%` }} />
              </div>
              <p style={{ fontSize: 12, color: "var(--text-3)", marginTop: 6 }}>
                {goalProgress >= 100 ? "Goal reached! Great work today 🎉" : `${Math.round(goalProgress)}% complete`}
              </p>
            </div>

            {/* Charts */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, marginBottom: 24 }}>
              <div className="card animate-fade-in-up stagger-3" style={{ padding: "20px 24px", background: "var(--card)" }}>
                <h3 style={{ fontSize: 14, fontWeight: 600, color: "var(--text)", marginBottom: 16 }}>Hours This Week</h3>
                <ResponsiveContainer width="100%" height={180}>
                  <AreaChart data={dailyData}>
                    <defs>
                      <linearGradient id="grad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <XAxis dataKey="day" stroke="var(--text-3)" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                    <YAxis stroke="var(--text-3)" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                    <Tooltip {...chartTheme} />
                    <Area type="monotone" dataKey="hours" stroke="#3b82f6" strokeWidth={2} fill="url(#grad)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>

              <div className="card animate-fade-in-up stagger-4" style={{ padding: "20px 24px", background: "var(--card)" }}>
                <h3 style={{ fontSize: 14, fontWeight: 600, color: "var(--text)", marginBottom: 16 }}>Mood Breakdown</h3>
                {moodData.length === 0 ? (
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: 180, color: "var(--text-3)", fontSize: 13 }}>
                    Log sessions to see mood data
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height={180}>
                    <PieChart>
                      <Pie data={moodData} dataKey="count" nameKey="mood" cx="50%" cy="50%" outerRadius={65} innerRadius={30} paddingAngle={3}>
                        {moodData.map((entry) => (
                          <Cell key={entry.mood} fill={MOOD_COLORS[entry.mood] || "#6b7280"} />
                        ))}
                      </Pie>
                      <Tooltip {...chartTheme} />
                    </PieChart>
                  </ResponsiveContainer>
                )}
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 8 }}>
                  {moodData.map((m) => (
                    <span key={m.mood} className={`mood-${m.mood}`} style={{ fontSize: 12, padding: "2px 8px", borderRadius: 20 }}>
                      {MOOD_EMOJI[m.mood]} {m.mood} ({m.count})
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* Recent sessions */}
            <div className="card animate-fade-in-up stagger-5" style={{ padding: "20px 24px", background: "var(--card)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                <h3 style={{ fontSize: 14, fontWeight: 600, color: "var(--text)" }}>Recent Sessions</h3>
                <button onClick={() => setView("sessions")} style={{ fontSize: 12, color: "var(--accent)", background: "none", border: "none", cursor: "pointer" }}>View all</button>
              </div>
              {sessions.length === 0 ? (
                <p style={{ color: "var(--text-3)", fontSize: 13 }}>No sessions yet. Log your first one!</p>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  {[...sessions].reverse().slice(0, 5).map((s) => (
                    <div key={s.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingBottom: 10, borderBottom: "1px solid var(--border)" }}>
                      <div>
                        <p style={{ fontSize: 14, fontWeight: 500, color: "var(--text)" }}>{s.title}</p>
                        <p style={{ fontSize: 12, color: "var(--text-3)" }}>{new Date(s.created_at).toLocaleDateString()}</p>
                      </div>
                      <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                        <span style={{ fontSize: 12, padding: "3px 10px", borderRadius: 20, background: "var(--surface-2)", color: "var(--text-2)" }}>{s.duration_minutes}min</span>
                        <span className={`mood-${s.mood}`} style={{ fontSize: 12, padding: "3px 10px", borderRadius: 20 }}>{MOOD_EMOJI[s.mood || ""] || ""} {s.mood}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* PROJECTS */}
        {view === "projects" && (
          <div style={{ padding: "32px 36px", maxWidth: 900 }}>
            <div className="animate-fade-in-up" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 28 }}>
              <div>
                <h2 style={{ fontSize: 24, fontWeight: 700, color: "var(--text)", marginBottom: 4 }}>Projects</h2>
                <p style={{ color: "var(--text-2)", fontSize: 14 }}>{projects.length} total, {activeProjects} active</p>
              </div>
              <Btn onClick={() => setShowProjectModal(true)}>
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}><Plus size={15} /> New Project</div>
              </Btn>
            </div>

            {projects.length === 0 ? (
              <div className="card animate-fade-in" style={{ padding: 48, textAlign: "center", background: "var(--card)" }}>
                <FolderKanban size={40} color="var(--text-3)" style={{ margin: "0 auto 12px" }} />
                <p style={{ color: "var(--text-2)", fontSize: 14 }}>No projects yet. Create your first one.</p>
              </div>
            ) : (
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                {projects.map((p, i) => (
                  <div key={p.id} className={`card animate-fade-in-up stagger-${(i % 4) + 1}`} style={{ padding: 20, background: "var(--card)", position: "relative" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                      <div style={{ flex: 1 }}>
                        <h4 style={{ fontSize: 16, fontWeight: 600, color: "var(--text)", marginBottom: 6 }}>{p.name}</h4>
                        <p style={{ fontSize: 13, color: "var(--text-2)", marginBottom: 12 }}>{p.description || "No description"}</p>
                        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                          <span style={{ fontSize: 11, padding: "3px 10px", borderRadius: 20, background: p.status === "active" ? "#22c55e22" : "var(--surface-2)", color: p.status === "active" ? "#22c55e" : "var(--text-3)", fontWeight: 500 }}>
                            {p.status}
                          </span>
                          <span style={{ fontSize: 12, color: "var(--text-3)" }}>
                            {sessions.filter((s) => s.project_id === p.id).length} sessions
                          </span>
                        </div>
                      </div>
                      <button onClick={() => handleDeleteProject(p.id)} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-3)", padding: 4, borderRadius: 6, transition: "color 0.2s" }}
                        onMouseEnter={(e: any) => e.currentTarget.style.color = "#ef4444"}
                        onMouseLeave={(e: any) => e.currentTarget.style.color = "var(--text-3)"}
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* SESSIONS */}
        {view === "sessions" && (
          <div style={{ padding: "32px 36px", maxWidth: 900 }}>
            <div className="animate-fade-in-up" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
              <div>
                <h2 style={{ fontSize: 24, fontWeight: 700, color: "var(--text)", marginBottom: 4 }}>Work Sessions</h2>
                <p style={{ color: "var(--text-2)", fontSize: 14 }}>{sessions.length} total · {totalHours}h logged</p>
              </div>
              <div style={{ display: "flex", gap: 10 }}>
                <Btn variant="ghost" onClick={exportCSV} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13 }}>
                  <Download size={14} /> Export CSV
                </Btn>
                <Btn variant="success" onClick={() => setShowSessionModal(true)}>
                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}><Plus size={15} /> Log Session</div>
                </Btn>
              </div>
            </div>

            {/* Filters */}
            <div className="card animate-fade-in-up stagger-1" style={{ padding: "14px 18px", marginBottom: 20, background: "var(--card)", display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
              <input
                placeholder="Search sessions..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{ flex: 1, minWidth: 160, padding: "8px 14px", background: "var(--surface-2)", border: "1px solid var(--border)", borderRadius: 10, color: "var(--text)", fontSize: 13, outline: "none" }}
              />
              <select value={filterMood} onChange={(e) => setFilterMood(e.target.value)} style={{ padding: "8px 14px", background: "var(--surface-2)", border: "1px solid var(--border)", borderRadius: 10, color: "var(--text)", fontSize: 13, outline: "none" }}>
                <option value="all">All moods</option>
                <option value="great">Great</option>
                <option value="good">Good</option>
                <option value="okay">Okay</option>
                <option value="bad">Bad</option>
              </select>
              <select value={filterProject} onChange={(e) => setFilterProject(e.target.value)} style={{ padding: "8px 14px", background: "var(--surface-2)", border: "1px solid var(--border)", borderRadius: 10, color: "var(--text)", fontSize: 13, outline: "none" }}>
                <option value="all">All projects</option>
                {projects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            </div>

            {filteredSessions.length === 0 ? (
              <div className="card animate-fade-in" style={{ padding: 48, textAlign: "center", background: "var(--card)" }}>
                <Clock size={40} color="var(--text-3)" style={{ margin: "0 auto 12px" }} />
                <p style={{ color: "var(--text-2)", fontSize: 14 }}>No sessions found.</p>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {[...filteredSessions].reverse().map((s, i) => (
                  <div key={s.id} className={`card animate-fade-in-up stagger-${(i % 4) + 1}`} style={{ padding: "16px 20px", background: "var(--card)", display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                    <div>
                      <h4 style={{ fontSize: 15, fontWeight: 600, color: "var(--text)", marginBottom: 4 }}>{s.title}</h4>
                      {s.description && <p style={{ fontSize: 13, color: "var(--text-2)", marginBottom: 8 }}>{s.description}</p>}
                      <div style={{ display: "flex", gap: 8 }}>
                        <span style={{ fontSize: 12, padding: "3px 10px", borderRadius: 20, background: "var(--surface-2)", color: "var(--text-2)" }}>⏱ {s.duration_minutes}min</span>
                        {s.mood && <span className={`mood-${s.mood}`} style={{ fontSize: 12, padding: "3px 10px", borderRadius: 20 }}>{MOOD_EMOJI[s.mood]} {s.mood}</span>}
                        <span style={{ fontSize: 12, color: "var(--text-3)" }}>{new Date(s.created_at).toLocaleDateString()}</span>
                      </div>
                    </div>
                    <button onClick={() => handleDeleteSession(s.id)} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-3)", padding: 4, transition: "color 0.2s" }}
                      onMouseEnter={(e: any) => e.currentTarget.style.color = "#ef4444"}
                      onMouseLeave={(e: any) => e.currentTarget.style.color = "var(--text-3)"}
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* POMODORO */}
        {view === "pomodoro" && (
          <div style={{ padding: "32px 36px", display: "flex", flexDirection: "column", alignItems: "center", minHeight: "100vh" }}>
            <div className="animate-fade-in-up" style={{ textAlign: "center", marginBottom: 40 }}>
              <h2 style={{ fontSize: 24, fontWeight: 700, color: "var(--text)", marginBottom: 4 }}>Pomodoro Timer</h2>
              <p style={{ color: "var(--text-2)", fontSize: 14 }}>Stay focused. {pomSessions} sessions completed today.</p>
            </div>

            <div className="animate-fade-in-up stagger-1" style={{ position: "relative", marginBottom: 36 }}>
              <svg width="220" height="220" viewBox="0 0 220 220">
                <circle cx="110" cy="110" r={radius} fill="none" stroke="var(--surface-2)" strokeWidth="8" />
                <circle
                  cx="110" cy="110" r={radius}
                  fill="none"
                  stroke={pomMode === "work" ? "#3b82f6" : "#22c55e"}
                  strokeWidth="8"
                  strokeLinecap="round"
                  strokeDasharray={circumference}
                  strokeDashoffset={strokeDashoffset}
                  transform="rotate(-90 110 110)"
                  className={pomMode === "work" ? "pom-ring" : "pom-ring-break"}
                  style={{ transition: "stroke-dashoffset 1s linear, stroke 0.5s ease" }}
                />
              </svg>
              <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
                <p style={{ fontSize: 11, fontWeight: 600, letterSpacing: 3, color: pomMode === "work" ? "#3b82f6" : "#22c55e", textTransform: "uppercase", marginBottom: 4 }}>
                  {pomMode === "work" ? "Focus" : "Break"}
                </p>
                <p style={{ fontSize: 44, fontWeight: 700, fontFamily: "monospace", color: "var(--text)" }}>
                  {String(pomMinutes).padStart(2, "0")}:{String(pomSeconds).padStart(2, "0")}
                </p>
              </div>
            </div>

            <div className="animate-fade-in-up stagger-2" style={{ display: "flex", gap: 12, marginBottom: 28 }}>
              <Btn
                onClick={() => setPomRunning(!pomRunning)}
                variant={pomRunning ? "ghost" : "primary"}
                style={{ minWidth: 120, fontSize: 15, padding: "12px 24px" }}
              >
                {pomRunning ? "Pause" : pomSeconds === 0 && pomMinutes === (pomMode === "work" ? 25 : 5) ? "Start" : "Resume"}
              </Btn>
              <Btn variant="ghost" style={{ padding: "12px 20px" }} onClick={() => {
                setPomRunning(false);
                clearInterval(intervalRef.current);
                setPomMinutes(25); setPomSeconds(0); setPomMode("work");
              }}>
                Reset
              </Btn>
            </div>

            <div className="animate-fade-in-up stagger-3" style={{ display: "flex", gap: 8, marginBottom: 36 }}>
              {[{ label: "25 min", min: 25 }, { label: "45 min", min: 45 }, { label: "60 min", min: 60 }].map((opt) => (
                <Btn key={opt.label} variant="ghost" style={{ fontSize: 13, padding: "8px 16px" }} onClick={() => {
                  setPomRunning(false);
                  clearInterval(intervalRef.current);
                  setPomMinutes(opt.min); setPomSeconds(0); setPomMode("work");
                }}>
                  {opt.label}
                </Btn>
              ))}
            </div>

            <div className="card animate-fade-in-up stagger-4" style={{ padding: "20px 28px", background: "var(--card)", width: "100%", maxWidth: 420 }}>
              <h3 style={{ fontSize: 14, fontWeight: 600, color: "var(--text)", marginBottom: 16 }}>Today's Pomodoros</h3>
              <div style={{ display: "flex", gap: 8 }}>
                {Array.from({ length: Math.max(pomSessions, 4) }).map((_, i) => (
                  <div key={i} style={{
                    width: 36, height: 36, borderRadius: 8,
                    background: i < pomSessions ? "#3b82f6" : "var(--surface-2)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: 16, transition: "background 0.3s ease",
                  }}>
                    {i < pomSessions ? "🍅" : ""}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </main>

      {/* MODALS */}
      {showProjectModal && (
        <Modal title="New Project" onClose={() => setShowProjectModal(false)}>
          <form onSubmit={handleCreateProject}>
            <Input label="Project Name" value={projectName} onChange={(e: any) => setProjectName(e.target.value)} placeholder="My awesome project" required />
            <Input label="Description" value={projectDesc} onChange={(e: any) => setProjectDesc(e.target.value)} placeholder="What is this project about?" />
            <div style={{ display: "flex", gap: 10, marginTop: 8 }}>
              <Btn type="submit" style={{ flex: 1 }}>Create Project</Btn>
              <Btn type="button" variant="ghost" onClick={() => setShowProjectModal(false)}>Cancel</Btn>
            </div>
          </form>
        </Modal>
      )}

      {showSessionModal && (
        <Modal title="Log Work Session" onClose={() => setShowSessionModal(false)}>
          <form onSubmit={handleCreateSession}>
            <Input label="What did you work on?" value={sessionTitle} onChange={(e: any) => setSessionTitle(e.target.value)} placeholder="Built the auth system..." required />
            <Input label="Notes (optional)" value={sessionDesc} onChange={(e: any) => setSessionDesc(e.target.value)} placeholder="Any blockers, wins, thoughts..." />
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <Input label="Duration (minutes)" type="number" value={sessionDuration} onChange={(e: any) => setSessionDuration(e.target.value)} placeholder="90" required />
              <Select label="Mood" value={sessionMood} onChange={(e: any) => setSessionMood(e.target.value)}>
                <option value="great">🔥 Great</option>
                <option value="good">😊 Good</option>
                <option value="okay">😐 Okay</option>
                <option value="bad">😤 Bad</option>
              </Select>
            </div>
            <Select label="Project (optional)" value={sessionProject} onChange={(e: any) => setSessionProject(e.target.value)}>
              <option value="">No project</option>
              {projects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
            </Select>
            <div style={{ display: "flex", gap: 10, marginTop: 8 }}>
              <Btn type="submit" variant="success" style={{ flex: 1 }}>Log Session</Btn>
              <Btn type="button" variant="ghost" onClick={() => setShowSessionModal(false)}>Cancel</Btn>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}