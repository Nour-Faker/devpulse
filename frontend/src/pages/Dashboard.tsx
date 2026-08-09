import { useEffect, useState, useRef } from "react";
import type { WorkSession } from "../api/sessions";
import type { Project } from "../api/projects";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import { getProjects, createProject, deleteProject } from "../api/projects";
import { getSessions, createSession, deleteSession } from "../api/sessions";
import { getStats, getWeeklySummary, getSuggestedTitles } from "../api/stats";
import {
  LayoutDashboard, FolderKanban, Clock, Timer,
  LogOut, Sun, Moon, Plus, X, Trash2,
  TrendingUp, Flame, Target, Download,
  Zap, Award, Play, Square, BarChart3,
} from "lucide-react";
import {
  XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, AreaChart, Area,
} from "recharts";
import Particles from "../components/Particles";

const MOOD_COLORS: Record<string, string> = {
  great: "#10b981", good: "#6366f1", okay: "#f59e0b", bad: "#ef4444",
};
const MOOD_EMOJI: Record<string, string> = {
  great: "🔥", good: "😊", okay: "😐", bad: "😤",
};

type View = "dashboard" | "projects" | "sessions" | "pomodoro";

const pageVariants = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.22, 1, 0.36, 1] } },
  exit: { opacity: 0, y: -20, transition: { duration: 0.2 } },
};

const cardVariants = {
  initial: { opacity: 0, y: 24, scale: 0.97 },
  animate: (i: number) => ({
    opacity: 1, y: 0, scale: 1,
    transition: { delay: i * 0.07, duration: 0.5, ease: [0.22, 1, 0.36, 1] },
  }),
};

function GlassCard({ children, style, className, delay = 0, hover = true, onClick }: any) {
  return (
    <motion.div
      variants={cardVariants}
      initial="initial"
      animate="animate"
      custom={delay}
      whileHover={hover ? { y: -3, boxShadow: "0 24px 60px rgba(0,0,0,0.4), 0 0 40px #6366f115" } : {}}
      onClick={onClick}
      style={{
        background: "rgba(255,255,255,0.03)",
        backdropFilter: "blur(20px)",
        border: "1px solid rgba(255,255,255,0.08)",
        borderRadius: 20,
        transition: "border-color 0.3s",
        cursor: onClick ? "pointer" : "default",
        ...style,
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

function StatCard({ label, value, icon, color, delay, suffix = "" }: any) {
  const [count, setCount] = useState(0);
  const target = parseFloat(String(value).replace(/[^0-9.]/g, "")) || 0;

  useEffect(() => {
    let start = 0;
    const step = target / 40;
    const timer = setInterval(() => {
      start += step;
      if (start >= target) { setCount(target); clearInterval(timer); }
      else setCount(Math.floor(start * 10) / 10);
    }, 25);
    return () => clearInterval(timer);
  }, [target]);

  return (
    <GlassCard delay={delay} style={{ padding: "20px 24px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 }}>
        <p style={{ fontSize: 13, color: "var(--text-2)", fontWeight: 500 }}>{label}</p>
        <div style={{ width: 36, height: 36, background: color + "20", borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center" }}>
          {icon}
        </div>
      </div>
      <p style={{ fontSize: 34, fontWeight: 800, color: "var(--text)", lineHeight: 1 }}>
        {count}{suffix}
      </p>
      <div style={{ marginTop: 12, height: 2, background: `linear-gradient(90deg, ${color}, transparent)`, borderRadius: 1 }} />
    </GlassCard>
  );
}

function ProductivityRing({ score }: { score: number }) {
  const radius = 54;
  const circ = 2 * Math.PI * radius;
  const offset = circ - (score / 100) * circ;
  const color = score >= 80 ? "#10b981" : score >= 60 ? "#6366f1" : score >= 40 ? "#f59e0b" : "#ef4444";

  return (
    <div style={{ position: "relative", width: 140, height: 140 }}>
      <svg width="140" height="140" viewBox="0 0 140 140">
        <circle cx="70" cy="70" r={radius} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="10" />
        <motion.circle
          cx="70" cy="70" r={radius}
          fill="none" stroke={color} strokeWidth="10"
          strokeLinecap="round"
          strokeDasharray={circ}
          initial={{ strokeDashoffset: circ }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1.5, ease: [0.22, 1, 0.36, 1] }}
          transform="rotate(-90 70 70)"
          style={{ filter: `drop-shadow(0 0 8px ${color})` }}
        />
      </svg>
      <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
        <motion.p
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.5 }}
          style={{ fontSize: 28, fontWeight: 800, color }}
        >
          {score}
        </motion.p>
        <p style={{ fontSize: 10, color: "var(--text-3)", textTransform: "uppercase", letterSpacing: 1 }}>Score</p>
      </div>
    </div>
  );
}

function NavItem({ icon, label, active, onClick, badge }: any) {
  return (
    <motion.button
      onClick={onClick}
      whileHover={{ x: 3 }}
      whileTap={{ scale: 0.97 }}
      style={{
        display: "flex", alignItems: "center", gap: 10,
        width: "100%", padding: "10px 14px", borderRadius: 12,
        fontSize: 14, fontWeight: active ? 600 : 400,
        color: active ? "white" : "var(--text-2)",
        background: active ? "var(--gradient-1)" : "transparent",
        border: "none", cursor: "pointer",
        boxShadow: active ? "0 4px 20px rgba(99,102,241,0.3)" : "none",
        position: "relative",
        transition: "all 0.2s ease",
      }}
    >
      {icon}
      {label}
      {badge && (
        <span style={{ marginLeft: "auto", background: "rgba(255,255,255,0.2)", fontSize: 11, padding: "1px 7px", borderRadius: 10 }}>
          {badge}
        </span>
      )}
    </motion.button>
  );
}

function Modal({ title, onClose, children }: any) {
  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="modal-backdrop"
        onClick={(e) => e.target === e.currentTarget && onClose()}
      >
        <motion.div
          initial={{ opacity: 0, y: 40, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 40, scale: 0.9 }}
          transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
          style={{
            background: "rgba(19,19,31,0.95)", backdropFilter: "blur(40px)",
            border: "1px solid rgba(255,255,255,0.1)", borderRadius: 24,
            padding: 32, width: "100%", maxWidth: 480,
            boxShadow: "0 40px 80px rgba(0,0,0,0.6)",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
            <h3 style={{ fontSize: 20, fontWeight: 700, color: "var(--text)" }}>{title}</h3>
            <motion.button
              whileHover={{ rotate: 90 }}
              onClick={onClose}
              style={{ background: "rgba(255,255,255,0.06)", border: "1px solid var(--border)", borderRadius: 8, padding: 6, cursor: "pointer", color: "var(--text-2)", display: "flex" }}
            >
              <X size={16} />
            </motion.button>
          </div>
          {children}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

function DPInput({ label, ...props }: any) {
  return (
    <div style={{ marginBottom: 16 }}>
      {label && <label style={{ display: "block", fontSize: 13, color: "var(--text-2)", marginBottom: 7, fontWeight: 500 }}>{label}</label>}
      <input {...props} className="dp-input" />
    </div>
  );
}

function DPSelect({ label, children, ...props }: any) {
  return (
    <div style={{ marginBottom: 16 }}>
      {label && <label style={{ display: "block", fontSize: 13, color: "var(--text-2)", marginBottom: 7, fontWeight: 500 }}>{label}</label>}
      <select {...props} className="dp-input">{children}</select>
    </div>
  );
}

export default function Dashboard() {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
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

  const [aiSummary, setAiSummary] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>([]);

  // Live session timer
  const [timerRunning, setTimerRunning] = useState(false);
  const [timerSeconds, setTimerSeconds] = useState(0);
  const timerRef = useRef<any>(null);

  // Pomodoro
  const [pomMinutes, setPomMinutes] = useState(25);
  const [pomSeconds, setPomSeconds] = useState(0);
  const [pomRunning, setPomRunning] = useState(false);
  const [pomMode, setPomMode] = useState<"work" | "break">("work");
  const [pomSessions, setPomSessions] = useState(0);
  const pomRef = useRef<any>(null);

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
    if (timerRunning) {
      timerRef.current = setInterval(() => setTimerSeconds((s) => s + 1), 1000);
    } else {
      clearInterval(timerRef.current);
    }
    return () => clearInterval(timerRef.current);
  }, [timerRunning]);

  useEffect(() => {
    if (pomRunning) {
      pomRef.current = setInterval(() => {
        setPomSeconds((sec) => {
          if (sec > 0) return sec - 1;
          setPomMinutes((min) => {
            if (min > 0) { setPomSeconds(59); return min - 1; }
            setPomRunning(false);
            if (pomMode === "work") { setPomSessions((s) => s + 1); setPomMode("break"); setPomMinutes(5); }
            else { setPomMode("work"); setPomMinutes(25); }
            return 0;
          });
          return 0;
        });
      }, 1000);
    }
    return () => clearInterval(pomRef.current);
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
    const duration = sessionDuration || String(Math.round(timerSeconds / 60));
    const res = await createSession({
      title: sessionTitle, description: sessionDesc,
      duration_minutes: parseInt(duration),
      mood: sessionMood, project_id: sessionProject || undefined,
    });
    setSessions([...sessions, res.data]);
    setSessionTitle(""); setSessionDesc(""); setSessionDuration("");
    setTimerRunning(false); setTimerSeconds(0);
    setShowSessionModal(false);
  };

  const fetchAiSummary = async () => {
    setAiLoading(true);
    try {
      const [summary, titles] = await Promise.all([getWeeklySummary(), getSuggestedTitles()]);
      setAiSummary(summary.data.summary);
      setSuggestions(titles.data.suggestions);
    } finally { setAiLoading(false); }
  };

  const exportCSV = () => {
    const header = "Title,Description,Duration (min),Mood,Date\n";
    const rows = sessions.map((s) =>
      `"${s.title}","${s.description || ""}",${s.duration_minutes},${s.mood},${new Date(s.created_at).toLocaleDateString()}`
    ).join("\n");
    const blob = new Blob([header + rows], { type: "text/csv" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob); a.download = "devpulse-sessions.csv"; a.click();
  };

  const totalMinutes = sessions.reduce((acc, s) => acc + s.duration_minutes, 0);
  const totalHours = Math.round(totalMinutes / 60);
  const activeProjects = projects.filter((p) => p.status === "active").length;
  const todayMinutes = sessions.filter((s) => new Date(s.created_at).toDateString() === new Date().toDateString()).reduce((acc, s) => acc + s.duration_minutes, 0);
  const todayHours = Math.round(todayMinutes / 60 * 10) / 10;
  const goalProgress = Math.min((todayHours / goalHours) * 100, 100);

  const moodCounts: Record<string, number> = {};
  sessions.forEach((s) => { if (s.mood) moodCounts[s.mood] = (moodCounts[s.mood] || 0) + 1; });
  const moodData = Object.entries(moodCounts).map(([mood, count]) => ({ mood, count }));

  const labels = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const dailyMap: Record<string, number> = {};
  labels.forEach((d) => (dailyMap[d] = 0));
  sessions.forEach((s) => { const day = labels[new Date(s.created_at).getDay()]; dailyMap[day] += s.duration_minutes; });
  const dailyData = labels.map((day) => ({ day, hours: Math.round(dailyMap[day] / 60 * 10) / 10 }));

  const filteredSessions = sessions.filter((s) => {
    return s.title.toLowerCase().includes(searchQuery.toLowerCase()) &&
      (filterMood === "all" || s.mood === filterMood) &&
      (filterProject === "all" || s.project_id === filterProject);
  });

  const productivityScore = Math.min(100, Math.round(
    (sessions.length * 5) + (totalHours * 2) + (activeProjects * 10) + (goalProgress * 0.3)
  ));

  // Streak calculation
  const streak = (() => {
    let s = 0;
    let d = new Date();
    while (true) {
      const dayStr = d.toDateString();
      const hasSession = sessions.some((sess) => new Date(sess.created_at).toDateString() === dayStr);
      if (!hasSession) break;
      s++; d.setDate(d.getDate() - 1);
    }
    return s;
  })();

  const radius = 80;
  const circumference = 2 * Math.PI * radius;
  const pomElapsed = (pomMode === "work" ? 25 * 60 : 5 * 60) - (pomMinutes * 60 + pomSeconds);
  const pomTotal = pomMode === "work" ? 25 * 60 : 5 * 60;
  const strokeDashoffset = circumference * (1 - pomElapsed / pomTotal);

  const chartTheme = {
    contentStyle: { background: "rgba(19,19,31,0.95)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 12, color: "var(--text)", fontSize: 12 },
    labelStyle: { color: "var(--text)" },
  };

  const formatTimer = (secs: number) => {
    const m = Math.floor(secs / 60).toString().padStart(2, "0");
    const s = (secs % 60).toString().padStart(2, "0");
    return `${m}:${s}`;
  };

  if (loading) return (
    <div style={{ minHeight: "100vh", background: "var(--bg)", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <Particles />
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ textAlign: "center", position: "relative", zIndex: 1 }}>
        <div style={{ width: 48, height: 48, border: "3px solid rgba(99,102,241,0.2)", borderTop: "3px solid #6366f1", borderRadius: "50%", animation: "spin 0.8s linear infinite", margin: "0 auto 16px" }} />
        <p style={{ color: "var(--text-2)", fontSize: 14 }}>Loading DevPulse...</p>
      </motion.div>
    </div>
  );

  const navItems = [
    { key: "dashboard" as View, label: "Dashboard", icon: <LayoutDashboard size={16} />, badge: null },
    { key: "projects" as View, label: "Projects", icon: <FolderKanban size={16} />, badge: projects.length || null },
    { key: "sessions" as View, label: "Sessions", icon: <Clock size={16} />, badge: sessions.length || null },
    { key: "pomodoro" as View, label: "Pomodoro", icon: <Timer size={16} />, badge: pomSessions || null },
  ];

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg)", display: "flex" }}>
      <Particles />

      {/* Gradient orbs */}
      <div style={{ position: "fixed", top: -200, left: 200, width: 500, height: 500, borderRadius: "50%", background: "radial-gradient(circle, #6366f108 0%, transparent 70%)", pointerEvents: "none", zIndex: 0 }} />
      <div style={{ position: "fixed", bottom: -200, right: 100, width: 500, height: 500, borderRadius: "50%", background: "radial-gradient(circle, #8b5cf608 0%, transparent 70%)", pointerEvents: "none", zIndex: 0 }} />

      {/* Sidebar */}
      <motion.aside
        initial={{ x: -240 }}
        animate={{ x: 0 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        style={{
          width: 230, background: "rgba(13,13,20,0.8)", backdropFilter: "blur(20px)",
          borderRight: "1px solid rgba(255,255,255,0.06)",
          display: "flex", flexDirection: "column", position: "fixed", height: "100vh", zIndex: 10,
        }}
      >
        {/* Logo */}
        <div style={{ padding: "24px 20px 20px", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
            <div style={{ width: 34, height: 34, background: "var(--gradient-1)", borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 4px 16px rgba(99,102,241,0.4)" }}>
              <TrendingUp size={16} color="white" />
            </div>
            <span style={{ fontWeight: 800, fontSize: 17, background: "var(--gradient-1)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>DevPulse</span>
          </div>
          <p style={{ fontSize: 11, color: "var(--text-3)", marginLeft: 44 }}>{user?.email}</p>
        </div>

        {/* Nav */}
        <nav style={{ flex: 1, padding: "16px 12px", display: "flex", flexDirection: "column", gap: 4 }}>
          {navItems.map((item) => (
            <NavItem key={item.key} icon={item.icon} label={item.label} active={view === item.key} onClick={() => setView(item.key)} badge={item.badge} />
          ))}
        </nav>

        {/* Live timer */}
        {(timerRunning || timerSeconds > 0) && (
          <div style={{ margin: "0 12px 12px", padding: "12px 14px", background: "rgba(99,102,241,0.1)", border: "1px solid rgba(99,102,241,0.2)", borderRadius: 12 }}>
            <p style={{ fontSize: 11, color: "var(--text-3)", marginBottom: 4 }}>Live Session</p>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <span style={{ fontSize: 20, fontWeight: 700, fontFamily: "monospace", color: "var(--accent)" }}>{formatTimer(timerSeconds)}</span>
              <div style={{ display: "flex", gap: 6 }}>
                <button onClick={() => setTimerRunning(!timerRunning)} style={{ background: "rgba(99,102,241,0.2)", border: "none", borderRadius: 8, padding: 6, cursor: "pointer", color: "var(--accent)", display: "flex" }}>
                  {timerRunning ? <Square size={12} /> : <Play size={12} />}
                </button>
                <button onClick={() => { setShowSessionModal(true); }} style={{ background: "rgba(16,185,129,0.2)", border: "none", borderRadius: 8, padding: 6, cursor: "pointer", color: "#10b981", display: "flex" }}>
                  <Plus size={12} />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Bottom */}
        <div style={{ padding: "16px 12px", borderTop: "1px solid rgba(255,255,255,0.06)" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10, padding: "0 4px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6, color: "var(--text-2)", fontSize: 13 }}>
              {theme === "dark" ? <Moon size={14} /> : <Sun size={14} />}
              <span>{theme === "dark" ? "Dark" : "Light"}</span>
            </div>
            <button onClick={toggleTheme} className={`theme-toggle ${theme === "dark" ? "active" : ""}`}>
              <div className="theme-toggle-thumb" />
            </button>
          </div>
          <motion.button
            whileHover={{ background: "rgba(239,68,68,0.1)", color: "#ef4444" }}
            onClick={handleLogout}
            style={{ display: "flex", alignItems: "center", gap: 8, width: "100%", padding: "9px 12px", borderRadius: 10, background: "none", border: "none", cursor: "pointer", color: "var(--text-2)", fontSize: 13, transition: "all 0.2s" }}
          >
            <LogOut size={14} /> Logout
          </motion.button>
        </div>
      </motion.aside>

      {/* Main */}
      <main style={{ flex: 1, marginLeft: 230, minHeight: "100vh", position: "relative", zIndex: 1 }}>
        <AnimatePresence mode="wait">

          {/* DASHBOARD */}
          {view === "dashboard" && (
            <motion.div key="dashboard" variants={pageVariants} initial="initial" animate="animate" exit="exit" style={{ padding: "36px 40px", maxWidth: 1140 }}>

              {/* Header */}
              <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 32 }}>
                <div>
                  <h2 style={{ fontSize: 28, fontWeight: 800, color: "var(--text)", marginBottom: 4 }}>
                    Good day, {user?.full_name?.split(" ")[0]} 👋
                  </h2>
                  <p style={{ color: "var(--text-2)", fontSize: 14 }}>Here's your productivity overview</p>
                </div>
                <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                  {streak > 0 && (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 14px", background: "rgba(245,158,11,0.1)", border: "1px solid rgba(245,158,11,0.2)", borderRadius: 12 }}
                    >
                      <span style={{ fontSize: 16, filter: "drop-shadow(0 0 6px #f59e0b)" }}>🔥</span>
                      <span style={{ fontSize: 13, fontWeight: 600, color: "#f59e0b" }}>{streak} day streak</span>
                    </motion.div>
                  )}
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.97 }}
                    onClick={() => { setTimerRunning(!timerRunning); }}
                    className="dp-btn"
                    style={{ background: timerRunning ? "rgba(239,68,68,0.15)" : "rgba(16,185,129,0.15)", color: timerRunning ? "#ef4444" : "#10b981", border: `1px solid ${timerRunning ? "rgba(239,68,68,0.3)" : "rgba(16,185,129,0.3)"}` }}
                  >
                    {timerRunning ? <><Square size={14} /> Stop</> : <><Play size={14} /> Start Session</>}
                  </motion.button>
                </div>
              </motion.div>

              {/* Stats grid */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16, marginBottom: 24 }}>
                <StatCard label="Total Sessions" value={sessions.length} icon={<Clock size={16} color="#6366f1" />} color="#6366f1" delay={0} />
                <StatCard label="Hours Logged" value={totalHours} suffix="h" icon={<TrendingUp size={16} color="#10b981" />} color="#10b981" delay={1} />
                <StatCard label="Active Projects" value={activeProjects} icon={<FolderKanban size={16} color="#8b5cf6" />} color="#8b5cf6" delay={2} />
                <StatCard label="This Week" value={stats?.weekly_hours || 0} suffix="h" icon={<Flame size={16} color="#f59e0b" />} color="#f59e0b" delay={3} />
              </div>

              {/* Score + Goal */}
              <div style={{ display: "grid", gridTemplateColumns: "220px 1fr", gap: 16, marginBottom: 24 }}>
                <GlassCard delay={4} style={{ padding: 24, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
                  <ProductivityRing score={productivityScore} />
                  <p style={{ fontSize: 13, color: "var(--text-2)", marginTop: 12, fontWeight: 500 }}>Productivity Score</p>
                </GlassCard>

                <GlassCard delay={5} style={{ padding: "24px 28px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <Target size={16} color="var(--accent)" />
                      <span style={{ fontSize: 14, fontWeight: 600, color: "var(--text)" }}>Today's Goal</span>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <span style={{ fontSize: 13, color: "var(--text-2)" }}>{todayHours}h / {goalHours}h</span>
                      <input
                        type="number" min={1} max={12} value={goalHours}
                        onChange={(e) => { const v = parseInt(e.target.value); setGoalHours(v); localStorage.setItem("goalHours", String(v)); }}
                        className="dp-input"
                        style={{ width: 56, padding: "4px 8px", textAlign: "center", fontSize: 13 }}
                      />
                    </div>
                  </div>
                  <div className="progress-bar" style={{ marginBottom: 10 }}>
                    <motion.div
                      className="progress-fill"
                      initial={{ width: 0 }}
                      animate={{ width: `${goalProgress}%` }}
                      transition={{ duration: 1.5, ease: [0.22, 1, 0.36, 1] }}
                    />
                  </div>
                  <p style={{ fontSize: 12, color: "var(--text-3)" }}>
                    {goalProgress >= 100 ? "🎉 Goal reached! Incredible work today!" : `${Math.round(goalProgress)}% complete — keep going!`}
                  </p>

                  {/* Quick stats */}
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12, marginTop: 20 }}>
                    {[
                      { label: "Best Day", value: `${Math.max(...dailyData.map(d => d.hours), 0)}h` },
                      { label: "Avg/Day", value: `${sessions.length > 0 ? Math.round(totalMinutes / 7 / 60 * 10) / 10 : 0}h` },
                      { label: "Sessions", value: sessions.filter(s => new Date(s.created_at).toDateString() === new Date().toDateString()).length },
                    ].map((item) => (
                      <div key={item.label} style={{ textAlign: "center", padding: "12px 8px", background: "rgba(255,255,255,0.03)", borderRadius: 12, border: "1px solid var(--border)" }}>
                        <p style={{ fontSize: 20, fontWeight: 700, color: "var(--text)" }}>{item.value}</p>
                        <p style={{ fontSize: 11, color: "var(--text-3)", marginTop: 2 }}>{item.label}</p>
                      </div>
                    ))}
                  </div>
                </GlassCard>
              </div>

              {/* Charts */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 24 }}>
                <GlassCard delay={6} style={{ padding: "24px" }}>
                  <h3 style={{ fontSize: 14, fontWeight: 600, color: "var(--text)", marginBottom: 16 }}>Hours This Week</h3>
                  <ResponsiveContainer width="100%" height={180}>
                    <AreaChart data={dailyData}>
                      <defs>
                        <linearGradient id="grad1" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#6366f1" stopOpacity={0.4} />
                          <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <XAxis dataKey="day" stroke="var(--text-3)" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                      <YAxis stroke="var(--text-3)" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                      <Tooltip {...chartTheme} />
                      <Area type="monotone" dataKey="hours" stroke="#6366f1" strokeWidth={2} fill="url(#grad1)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </GlassCard>

                <GlassCard delay={7} style={{ padding: "24px" }}>
                  <h3 style={{ fontSize: 14, fontWeight: 600, color: "var(--text)", marginBottom: 16 }}>Mood Distribution</h3>
                  {moodData.length === 0 ? (
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: 180, color: "var(--text-3)", fontSize: 13 }}>Log sessions to see mood data</div>
                  ) : (
                    <ResponsiveContainer width="100%" height={180}>
                      <PieChart>
                        <Pie data={moodData} dataKey="count" nameKey="mood" cx="50%" cy="50%" outerRadius={70} innerRadius={35} paddingAngle={4}>
                          {moodData.map((entry) => <Cell key={entry.mood} fill={MOOD_COLORS[entry.mood] || "#6b7280"} />)}
                        </Pie>
                        <Tooltip {...chartTheme} />
                      </PieChart>
                    </ResponsiveContainer>
                  )}
                  <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 8 }}>
                    {moodData.map((m) => (
                      <span key={m.mood} className={`mood-${m.mood}`} style={{ fontSize: 12, padding: "3px 10px", borderRadius: 20 }}>
                        {MOOD_EMOJI[m.mood]} {m.mood} ({m.count})
                      </span>
                    ))}
                  </div>
                </GlassCard>
              </div>

              {/* Recent + AI */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                <GlassCard delay={8} style={{ padding: "24px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                    <h3 style={{ fontSize: 14, fontWeight: 600, color: "var(--text)" }}>Recent Sessions</h3>
                    <button onClick={() => setView("sessions")} style={{ fontSize: 12, color: "var(--accent)", background: "none", border: "none", cursor: "pointer" }}>View all</button>
                  </div>
                  {sessions.length === 0 ? (
                    <p style={{ color: "var(--text-3)", fontSize: 13 }}>No sessions yet.</p>
                  ) : (
                    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                      {[...sessions].reverse().slice(0, 4).map((s, i) => (
                        <motion.div key={s.id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingBottom: 10, borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
                          <div>
                            <p style={{ fontSize: 13, fontWeight: 500, color: "var(--text)" }}>{s.title}</p>
                            <p style={{ fontSize: 11, color: "var(--text-3)" }}>{new Date(s.created_at).toLocaleDateString()}</p>
                          </div>
                          <div style={{ display: "flex", gap: 6 }}>
                            <span style={{ fontSize: 11, padding: "3px 8px", borderRadius: 16, background: "rgba(255,255,255,0.06)", color: "var(--text-2)" }}>{s.duration_minutes}m</span>
                            <span className={`mood-${s.mood}`} style={{ fontSize: 11, padding: "3px 8px", borderRadius: 16 }}>{MOOD_EMOJI[s.mood || ""]}</span>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  )}
                </GlassCard>

                <GlassCard delay={9} style={{ padding: "24px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <div style={{ width: 28, height: 28, background: "rgba(139,92,246,0.2)", borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14 }}>✨</div>
                      <h3 style={{ fontSize: 14, fontWeight: 600, color: "var(--text)" }}>AI Summary</h3>
                    </div>
                    <motion.button
                      whileHover={{ scale: 1.03 }}
                      whileTap={{ scale: 0.97 }}
                      onClick={fetchAiSummary}
                      disabled={aiLoading}
                      className="dp-btn"
                      style={{ background: aiLoading ? "rgba(255,255,255,0.05)" : "rgba(139,92,246,0.2)", color: aiLoading ? "var(--text-3)" : "#8b5cf6", border: "1px solid rgba(139,92,246,0.3)", fontSize: 12, padding: "6px 14px" }}
                    >
                      {aiLoading ? <div style={{ width: 14, height: 14, border: "2px solid rgba(139,92,246,0.3)", borderTop: "2px solid #8b5cf6", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} /> : <><Zap size={12} /> Generate</>}
                    </motion.button>
                  </div>
                  {aiSummary ? (
                    <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ fontSize: 13, color: "var(--text-2)", lineHeight: 1.7, padding: "12px 14px", background: "rgba(139,92,246,0.06)", borderRadius: 12, border: "1px solid rgba(139,92,246,0.15)", marginBottom: 12 }}>
                      {aiSummary}
                    </motion.p>
                  ) : (
                    <p style={{ fontSize: 13, color: "var(--text-3)", marginBottom: 12 }}>Click Generate for your personalized AI weekly report.</p>
                  )}
                  {suggestions.length > 0 && (
                    <div>
                      <p style={{ fontSize: 11, color: "var(--text-3)", marginBottom: 8, textTransform: "uppercase", letterSpacing: 1 }}>Suggested titles</p>
                      <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                        {suggestions.map((s, i) => (
                          <motion.span
                            key={i}
                            whileHover={{ scale: 1.05, borderColor: "var(--accent)" }}
                            onClick={() => { setView("sessions"); setShowSessionModal(true); setSessionTitle(s); }}
                            style={{ fontSize: 11, padding: "4px 10px", borderRadius: 16, background: "rgba(255,255,255,0.04)", color: "var(--text-2)", cursor: "pointer", border: "1px solid var(--border)" }}
                          >
                            + {s}
                          </motion.span>
                        ))}
                      </div>
                    </div>
                  )}
                </GlassCard>
              </div>
            </motion.div>
          )}

          {/* PROJECTS */}
          {view === "projects" && (
            <motion.div key="projects" variants={pageVariants} initial="initial" animate="animate" exit="exit" style={{ padding: "36px 40px", maxWidth: 960 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 32 }}>
                <div>
                  <h2 style={{ fontSize: 26, fontWeight: 800, color: "var(--text)", marginBottom: 4 }}>Projects</h2>
                  <p style={{ color: "var(--text-2)", fontSize: 14 }}>{projects.length} total · {activeProjects} active</p>
                </div>
                <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }} onClick={() => setShowProjectModal(true)} className="dp-btn dp-btn-primary">
                  <Plus size={15} /> New Project
                </motion.button>
              </div>

              {projects.length === 0 ? (
                <GlassCard delay={0} style={{ padding: 60, textAlign: "center" }}>
                  <FolderKanban size={48} color="var(--text-3)" style={{ margin: "0 auto 16px" }} />
                  <p style={{ color: "var(--text-2)", fontSize: 15 }}>No projects yet.</p>
                  <p style={{ color: "var(--text-3)", fontSize: 13, marginTop: 4 }}>Create your first project to get started.</p>
                </GlassCard>
              ) : (
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                  {projects.map((p, i) => (
                    <GlassCard key={p.id} delay={i} style={{ padding: 24 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                        <div style={{ flex: 1 }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
                            <div style={{ width: 36, height: 36, background: "var(--gradient-1)", borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center" }}>
                              <FolderKanban size={16} color="white" />
                            </div>
                            <h4 style={{ fontSize: 16, fontWeight: 600, color: "var(--text)" }}>{p.name}</h4>
                          </div>
                          <p style={{ fontSize: 13, color: "var(--text-2)", marginBottom: 14, lineHeight: 1.5 }}>{p.description || "No description"}</p>
                          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                            <span style={{ fontSize: 11, padding: "3px 10px", borderRadius: 20, background: p.status === "active" ? "rgba(16,185,129,0.15)" : "rgba(255,255,255,0.05)", color: p.status === "active" ? "#10b981" : "var(--text-3)", border: `1px solid ${p.status === "active" ? "rgba(16,185,129,0.3)" : "var(--border)"}`, fontWeight: 500 }}>
                              {p.status}
                            </span>
                            <span style={{ fontSize: 12, color: "var(--text-3)" }}>
                              <BarChart3 size={12} style={{ display: "inline", marginRight: 4 }} />
                              {sessions.filter((s) => s.project_id === p.id).length} sessions
                            </span>
                          </div>
                        </div>
                        <motion.button
                          whileHover={{ color: "#ef4444", background: "rgba(239,68,68,0.1)" }}
                          onClick={() => deleteProject(p.id).then(() => setProjects(projects.filter(pr => pr.id !== p.id)))}
                          style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-3)", padding: 8, borderRadius: 8, display: "flex", transition: "all 0.2s" }}
                        >
                          <Trash2 size={15} />
                        </motion.button>
                      </div>
                    </GlassCard>
                  ))}
                </div>
              )}
            </motion.div>
          )}

          {/* SESSIONS */}
          {view === "sessions" && (
            <motion.div key="sessions" variants={pageVariants} initial="initial" animate="animate" exit="exit" style={{ padding: "36px 40px", maxWidth: 960 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
                <div>
                  <h2 style={{ fontSize: 26, fontWeight: 800, color: "var(--text)", marginBottom: 4 }}>Work Sessions</h2>
                  <p style={{ color: "var(--text-2)", fontSize: 14 }}>{sessions.length} total · {totalHours}h logged</p>
                </div>
                <div style={{ display: "flex", gap: 10 }}>
                  <motion.button whileHover={{ scale: 1.02 }} onClick={exportCSV} className="dp-btn dp-btn-secondary" style={{ fontSize: 13 }}>
                    <Download size={14} /> Export CSV
                  </motion.button>
                  <motion.button whileHover={{ scale: 1.02 }} onClick={() => setShowSessionModal(true)} className="dp-btn dp-btn-success">
                    <Plus size={15} /> Log Session
                  </motion.button>
                </div>
              </div>

              <GlassCard delay={0} style={{ padding: "14px 18px", marginBottom: 20, display: "flex", gap: 12, flexWrap: "wrap", alignItems: "center" }}>
                <input placeholder="Search sessions..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="dp-input" style={{ flex: 1, minWidth: 160 }} />
                <select value={filterMood} onChange={(e) => setFilterMood(e.target.value)} className="dp-input" style={{ width: "auto" }}>
                  <option value="all">All moods</option>
                  <option value="great">🔥 Great</option>
                  <option value="good">😊 Good</option>
                  <option value="okay">😐 Okay</option>
                  <option value="bad">😤 Bad</option>
                </select>
                <select value={filterProject} onChange={(e) => setFilterProject(e.target.value)} className="dp-input" style={{ width: "auto" }}>
                  <option value="all">All projects</option>
                  {projects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
              </GlassCard>

              {filteredSessions.length === 0 ? (
                <GlassCard delay={1} style={{ padding: 60, textAlign: "center" }}>
                  <Clock size={48} color="var(--text-3)" style={{ margin: "0 auto 16px" }} />
                  <p style={{ color: "var(--text-2)", fontSize: 15 }}>No sessions found.</p>
                </GlassCard>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  {[...filteredSessions].reverse().map((s, i) => (
                    <GlassCard key={s.id} delay={i % 6} style={{ padding: "16px 20px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <div>
                        <h4 style={{ fontSize: 15, fontWeight: 600, color: "var(--text)", marginBottom: 4 }}>{s.title}</h4>
                        {s.description && <p style={{ fontSize: 13, color: "var(--text-2)", marginBottom: 8 }}>{s.description}</p>}
                        <div style={{ display: "flex", gap: 8 }}>
                          <span style={{ fontSize: 12, padding: "3px 10px", borderRadius: 20, background: "rgba(255,255,255,0.05)", color: "var(--text-2)" }}>⏱ {s.duration_minutes}min</span>
                          {s.mood && <span className={`mood-${s.mood}`} style={{ fontSize: 12, padding: "3px 10px", borderRadius: 20 }}>{MOOD_EMOJI[s.mood]} {s.mood}</span>}
                          <span style={{ fontSize: 12, color: "var(--text-3)" }}>{new Date(s.created_at).toLocaleDateString()}</span>
                        </div>
                      </div>
                      <motion.button
                        whileHover={{ color: "#ef4444" }}
                        onClick={() => deleteSession(s.id).then(() => setSessions(sessions.filter(sess => sess.id !== s.id)))}
                        style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-3)", padding: 6, display: "flex" }}
                      >
                        <Trash2 size={15} />
                      </motion.button>
                    </GlassCard>
                  ))}
                </div>
              )}
            </motion.div>
          )}

          {/* POMODORO */}
          {view === "pomodoro" && (
            <motion.div key="pomodoro" variants={pageVariants} initial="initial" animate="animate" exit="exit" style={{ padding: "36px 40px", display: "flex", flexDirection: "column", alignItems: "center", minHeight: "80vh", justifyContent: "center" }}>
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} style={{ textAlign: "center", marginBottom: 40 }}>
                <h2 style={{ fontSize: 26, fontWeight: 800, color: "var(--text)", marginBottom: 4 }}>Pomodoro Timer</h2>
                <p style={{ color: "var(--text-2)", fontSize: 14 }}>{pomSessions} sessions completed today</p>
              </motion.div>

              <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ delay: 0.2 }} style={{ position: "relative", marginBottom: 36 }}>
                <svg width="240" height="240" viewBox="0 0 240 240">
                  <circle cx="120" cy="120" r={radius} fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="10" />
                  <motion.circle
                    cx="120" cy="120" r={radius}
                    fill="none"
                    stroke={pomMode === "work" ? "#6366f1" : "#10b981"}
                    strokeWidth="10"
                    strokeLinecap="round"
                    strokeDasharray={circumference}
                    animate={{ strokeDashoffset }}
                    transition={{ duration: 1, ease: "linear" }}
                    transform="rotate(-90 120 120)"
                    style={{ filter: `drop-shadow(0 0 12px ${pomMode === "work" ? "#6366f1" : "#10b981"})` }}
                  />
                </svg>
                <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
                  <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: 4, color: pomMode === "work" ? "#6366f1" : "#10b981", textTransform: "uppercase", marginBottom: 6 }}>
                    {pomMode === "work" ? "Focus" : "Break"}
                  </p>
                  <p style={{ fontSize: 52, fontWeight: 800, fontFamily: "monospace", color: "var(--text)" }}>
                    {String(pomMinutes).padStart(2, "0")}:{String(pomSeconds).padStart(2, "0")}
                  </p>
                </div>
              </motion.div>

              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }} style={{ display: "flex", gap: 12, marginBottom: 24 }}>
                <motion.button
                  whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                  onClick={() => setPomRunning(!pomRunning)}
                  className="dp-btn dp-btn-primary"
                  style={{ minWidth: 130, fontSize: 16, padding: "13px 24px" }}
                >
                  {pomRunning ? "Pause" : "Start"}
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                  onClick={() => { setPomRunning(false); clearInterval(pomRef.current); setPomMinutes(25); setPomSeconds(0); setPomMode("work"); }}
                  className="dp-btn dp-btn-secondary"
                  style={{ padding: "13px 20px" }}
                >
                  Reset
                </motion.button>
              </motion.div>

              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }} style={{ display: "flex", gap: 8, marginBottom: 40 }}>
                {[{ label: "25 min", min: 25 }, { label: "45 min", min: 45 }, { label: "60 min", min: 60 }].map((opt) => (
                  <motion.button key={opt.label} whileHover={{ scale: 1.05 }} onClick={() => { setPomRunning(false); clearInterval(pomRef.current); setPomMinutes(opt.min); setPomSeconds(0); setPomMode("work"); }} className="dp-btn dp-btn-secondary" style={{ fontSize: 13 }}>
                    {opt.label}
                  </motion.button>
                ))}
              </motion.div>

              <GlassCard delay={2} style={{ padding: "20px 28px", width: "100%", maxWidth: 440 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
                  <Award size={16} color="#f59e0b" />
                  <h3 style={{ fontSize: 14, fontWeight: 600, color: "var(--text)" }}>Today's Pomodoros</h3>
                </div>
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  {Array.from({ length: Math.max(pomSessions, 4) }).map((_, i) => (
                    <motion.div
                      key={i}
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ delay: i * 0.05 }}
                      style={{ width: 40, height: 40, borderRadius: 10, background: i < pomSessions ? "var(--gradient-1)" : "rgba(255,255,255,0.04)", border: `1px solid ${i < pomSessions ? "rgba(99,102,241,0.4)" : "var(--border)"}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, boxShadow: i < pomSessions ? "0 4px 16px rgba(99,102,241,0.3)" : "none" }}
                    >
                      {i < pomSessions ? "🍅" : ""}
                    </motion.div>
                  ))}
                </div>
              </GlassCard>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* PROJECT MODAL */}
      {showProjectModal && (
        <Modal title="New Project" onClose={() => setShowProjectModal(false)}>
          <form onSubmit={handleCreateProject}>
            <DPInput label="Project Name" value={projectName} onChange={(e: any) => setProjectName(e.target.value)} placeholder="My awesome project" required />
            <DPInput label="Description" value={projectDesc} onChange={(e: any) => setProjectDesc(e.target.value)} placeholder="What is this project about?" />
            <div style={{ display: "flex", gap: 10, marginTop: 8 }}>
              <button type="submit" className="dp-btn dp-btn-primary" style={{ flex: 1 }}>Create Project</button>
              <button type="button" className="dp-btn dp-btn-secondary" onClick={() => setShowProjectModal(false)}>Cancel</button>
            </div>
          </form>
        </Modal>
      )}

      {/* SESSION MODAL */}
      {showSessionModal && (
        <Modal title="Log Work Session" onClose={() => setShowSessionModal(false)}>
          <form onSubmit={handleCreateSession}>
            {timerSeconds > 0 && (
              <div style={{ padding: "10px 14px", background: "rgba(16,185,129,0.08)", border: "1px solid rgba(16,185,129,0.2)", borderRadius: 10, marginBottom: 16, fontSize: 13, color: "#10b981" }}>
                ⏱ Timer: {formatTimer(timerSeconds)} — will be used as duration if left empty
              </div>
            )}
            <DPInput label="What did you work on?" value={sessionTitle} onChange={(e: any) => setSessionTitle(e.target.value)} placeholder="Built the auth system..." required />
            <DPInput label="Notes (optional)" value={sessionDesc} onChange={(e: any) => setSessionDesc(e.target.value)} placeholder="Any blockers, wins, thoughts..." />
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <DPInput label={`Duration (min)${timerSeconds > 0 ? " — auto" : ""}`} type="number" value={sessionDuration} onChange={(e: any) => setSessionDuration(e.target.value)} placeholder={timerSeconds > 0 ? String(Math.round(timerSeconds / 60)) : "90"} />
              <DPSelect label="Mood" value={sessionMood} onChange={(e: any) => setSessionMood(e.target.value)}>
                <option value="great">🔥 Great</option>
                <option value="good">😊 Good</option>
                <option value="okay">😐 Okay</option>
                <option value="bad">😤 Bad</option>
              </DPSelect>
            </div>
            <DPSelect label="Project (optional)" value={sessionProject} onChange={(e: any) => setSessionProject(e.target.value)}>
              <option value="">No project</option>
              {projects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
            </DPSelect>
            <div style={{ display: "flex", gap: 10, marginTop: 8 }}>
              <button type="submit" className="dp-btn dp-btn-success" style={{ flex: 1 }}>Log Session</button>
              <button type="button" className="dp-btn dp-btn-secondary" onClick={() => setShowSessionModal(false)}>Cancel</button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}