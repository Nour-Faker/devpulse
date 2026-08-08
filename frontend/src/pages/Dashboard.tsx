import { useEffect, useState } from "react";
import type { WorkSession } from "../api/sessions";
import type { Project } from "../api/projects";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { getProjects, createProject, deleteProject } from "../api/projects";
import { getSessions, createSession, deleteSession } from "../api/sessions";
import { getStats } from "../api/stats";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend
} from "recharts";

const MOOD_COLORS: Record<string, string> = {
  great: "#22c55e",
  good: "#3b82f6",
  okay: "#f59e0b",
  bad: "#ef4444",
};

type View = "dashboard" | "projects" | "sessions" | "pomodoro";

export default function Dashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [view, setView] = useState<View>("dashboard");

  const [projects, setProjects] = useState<Project[]>([]);
  const [sessions, setSessions] = useState<WorkSession[]>([]);
  const [stats, setStats] = useState<any>(null);

  const [showProjectForm, setShowProjectForm] = useState(false);
  const [showSessionForm, setShowSessionForm] = useState(false);

  const [projectName, setProjectName] = useState("");
  const [projectDesc, setProjectDesc] = useState("");

  const [sessionTitle, setSessionTitle] = useState("");
  const [sessionDesc, setSessionDesc] = useState("");
  const [sessionDuration, setSessionDuration] = useState("");
  const [sessionMood, setSessionMood] = useState("great");
  const [sessionProject, setSessionProject] = useState("");

  const [loading, setLoading] = useState(true);

  const [pomMinutes, setPomMinutes] = useState(25);
  const [pomSeconds, setPomSeconds] = useState(0);
  const [pomRunning, setPomRunning] = useState(false);
  const [pomMode, setPomMode] = useState<"work" | "break">("work");

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
    if (!pomRunning) return;
    const interval = setInterval(() => {
      if (pomSeconds > 0) {
        setPomSeconds((s) => s - 1);
      } else if (pomMinutes > 0) {
        setPomMinutes((m) => m - 1);
        setPomSeconds(59);
      } else {
        setPomRunning(false);
        if (pomMode === "work") {
          setPomMode("break");
          setPomMinutes(5);
        } else {
          setPomMode("work");
          setPomMinutes(25);
        }
        setPomSeconds(0);
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [pomRunning, pomMinutes, pomSeconds, pomMode]);

  const handleLogout = () => { logout(); navigate("/login"); };

  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await createProject({ name: projectName, description: projectDesc });
    setProjects([...projects, res.data]);
    setProjectName(""); setProjectDesc(""); setShowProjectForm(false);
  };

  const handleCreateSession = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await createSession({
      title: sessionTitle, description: sessionDesc,
      duration_minutes: parseInt(sessionDuration),
      mood: sessionMood, project_id: sessionProject || undefined,
    });
    setSessions([...sessions, res.data]);
    setSessionTitle(""); setSessionDesc(""); setSessionDuration(""); setShowSessionForm(false);
  };

  const handleDeleteProject = async (id: string) => {
    await deleteProject(id);
    setProjects(projects.filter((p) => p.id !== id));
  };

  const handleDeleteSession = async (id: string) => {
    await deleteSession(id);
    setSessions(sessions.filter((s) => s.id !== id));
  };

  const totalHours = Math.round(sessions.reduce((acc, s) => acc + s.duration_minutes, 0) / 60);
  const activeProjects = projects.filter((p) => p.status === "active").length;

  const moodCounts: Record<string, number> = {};
  sessions.forEach((s) => { if (s.mood) moodCounts[s.mood] = (moodCounts[s.mood] || 0) + 1; });
  const moodData = Object.entries(moodCounts).map(([mood, count]) => ({ mood, count }));

  const dailyData = (() => {
    const days: Record<string, number> = {};
    const labels = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];
    labels.forEach((d) => (days[d] = 0));
    sessions.forEach((s) => {
      const day = labels[new Date(s.created_at).getDay()];
      days[day] = (days[day] || 0) + s.duration_minutes;
    });
    return labels.map((day) => ({ day, hours: Math.round((days[day] || 0) / 60 * 10) / 10 }));
  })();

  const navItems: { key: View; label: string; icon: string }[] = [
    { key: "dashboard", label: "Dashboard", icon: "▣" },
    { key: "projects", label: "Projects", icon: "◈" },
    { key: "sessions", label: "Sessions", icon: "◷" },
    { key: "pomodoro", label: "Pomodoro", icon: "◉" },
  ];

  if (loading) return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center text-white">
      Loading...
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-950 text-white flex">
      <aside className="w-56 bg-gray-900 border-r border-gray-800 flex flex-col">
        <div className="p-6 border-b border-gray-800">
          <h1 className="text-xl font-bold text-blue-400">DevPulse</h1>
          <p className="text-gray-500 text-xs mt-1">{user?.full_name}</p>
        </div>
        <nav className="flex-1 p-4 space-y-1">
          {navItems.map((item) => (
            <button
              key={item.key}
              onClick={() => setView(item.key)}
              className={`w-full text-left px-4 py-2.5 rounded-lg text-sm font-medium transition flex items-center gap-3 ${
                view === item.key
                  ? "bg-blue-600 text-white"
                  : "text-gray-400 hover:bg-gray-800 hover:text-white"
              }`}
            >
              <span>{item.icon}</span>
              {item.label}
            </button>
          ))}
        </nav>
        <div className="p-4 border-t border-gray-800">
          <button
            onClick={handleLogout}
            className="w-full text-left px-4 py-2.5 rounded-lg text-sm text-gray-400 hover:bg-gray-800 hover:text-white transition"
          >
            Logout
          </button>
        </div>
      </aside>

      <main className="flex-1 overflow-y-auto">
        {view === "dashboard" && (
          <div className="p-8">
            <h2 className="text-3xl font-bold mb-1">Good day, {user?.full_name?.split(" ")[0]}</h2>
            <p className="text-gray-400 mb-8">Here's your productivity overview</p>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
              {[
                { label: "Total Sessions", value: sessions.length },
                { label: "Hours Logged", value: totalHours },
                { label: "Active Projects", value: activeProjects },
                { label: "This Week", value: `${stats?.weekly_hours || 0}h` },
              ].map((s) => (
                <div key={s.label} className="bg-gray-900 rounded-xl p-5 border border-gray-800">
                  <p className="text-gray-400 text-sm mb-1">{s.label}</p>
                  <p className="text-3xl font-bold">{s.value}</p>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              <div className="bg-gray-900 rounded-xl p-6 border border-gray-800">
                <h3 className="text-sm font-semibold text-gray-300 mb-4">Hours This Week</h3>
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={dailyData}>
                    <XAxis dataKey="day" stroke="#6b7280" tick={{ fontSize: 12 }} />
                    <YAxis stroke="#6b7280" tick={{ fontSize: 12 }} />
                    <Tooltip contentStyle={{ backgroundColor: "#1f2937", border: "none", borderRadius: "8px" }} labelStyle={{ color: "#fff" }} />
                    <Bar dataKey="hours" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              <div className="bg-gray-900 rounded-xl p-6 border border-gray-800">
                <h3 className="text-sm font-semibold text-gray-300 mb-4">Mood Breakdown</h3>
                {moodData.length === 0 ? (
                  <div className="flex items-center justify-center h-48 text-gray-500 text-sm">No mood data yet</div>
                ) : (
                  <ResponsiveContainer width="100%" height={200}>
                    <PieChart>
                      <Pie data={moodData} dataKey="count" nameKey="mood" cx="50%" cy="50%" outerRadius={70} label={({ mood }) => mood}>
                        {moodData.map((entry) => (
                          <Cell key={entry.mood} fill={MOOD_COLORS[entry.mood] || "#6b7280"} />
                        ))}
                      </Pie>
                      <Legend />
                      <Tooltip contentStyle={{ backgroundColor: "#1f2937", border: "none", borderRadius: "8px" }} />
                    </PieChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>

            <div className="bg-gray-900 rounded-xl p-6 border border-gray-800">
              <h3 className="text-sm font-semibold text-gray-300 mb-4">Recent Sessions</h3>
              {sessions.length === 0 ? (
                <p className="text-gray-500 text-sm">No sessions yet.</p>
              ) : (
                <div className="space-y-3">
                  {sessions.slice(-5).reverse().map((s) => (
                    <div key={s.id} className="flex justify-between items-center py-2 border-b border-gray-800 last:border-0">
                      <div>
                        <p className="text-sm font-medium">{s.title}</p>
                        <p className="text-xs text-gray-500">{new Date(s.created_at).toLocaleDateString()}</p>
                      </div>
                      <div className="flex gap-2">
                        <span className="text-xs bg-gray-800 px-2 py-1 rounded">{s.duration_minutes}min</span>
                        <span className="text-xs px-2 py-1 rounded" style={{ backgroundColor: (MOOD_COLORS[s.mood || ""] || "#6b7280") + "33", color: MOOD_COLORS[s.mood || ""] || "#6b7280" }}>
                          {s.mood}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {view === "projects" && (
          <div className="p-8">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold">Projects</h2>
              <button onClick={() => setShowProjectForm(!showProjectForm)} className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-lg text-sm font-medium transition">+ New Project</button>
            </div>
            {showProjectForm && (
              <form onSubmit={handleCreateProject} className="bg-gray-900 border border-gray-800 rounded-xl p-6 mb-6 space-y-4">
                <div>
                  <label className="text-gray-300 text-sm mb-1 block">Project Name</label>
                  <input value={projectName} onChange={(e) => setProjectName(e.target.value)} className="w-full bg-gray-800 text-white rounded-lg px-4 py-2.5 outline-none focus:ring-2 focus:ring-blue-500" placeholder="My awesome project" required />
                </div>
                <div>
                  <label className="text-gray-300 text-sm mb-1 block">Description</label>
                  <input value={projectDesc} onChange={(e) => setProjectDesc(e.target.value)} className="w-full bg-gray-800 text-white rounded-lg px-4 py-2.5 outline-none focus:ring-2 focus:ring-blue-500" placeholder="What is this project about?" />
                </div>
                <div className="flex gap-3">
                  <button type="submit" className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-lg text-sm font-medium transition">Create</button>
                  <button type="button" onClick={() => setShowProjectForm(false)} className="bg-gray-800 hover:bg-gray-700 px-4 py-2 rounded-lg text-sm transition">Cancel</button>
                </div>
              </form>
            )}
            {projects.length === 0 ? (
              <p className="text-gray-500 text-sm">No projects yet.</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {projects.map((p) => (
                  <div key={p.id} className="bg-gray-900 border border-gray-800 rounded-xl p-5 flex justify-between items-start">
                    <div>
                      <h4 className="font-semibold">{p.name}</h4>
                      <p className="text-gray-400 text-sm mt-1">{p.description || "No description"}</p>
                      <span className="text-xs bg-blue-900 text-blue-300 px-2 py-0.5 rounded-full mt-2 inline-block">{p.status}</span>
                    </div>
                    <button onClick={() => handleDeleteProject(p.id)} className="text-gray-600 hover:text-red-400 text-sm transition">x</button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {view === "sessions" && (
          <div className="p-8">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold">Work Sessions</h2>
              <button onClick={() => setShowSessionForm(!showSessionForm)} className="bg-green-600 hover:bg-green-700 px-4 py-2 rounded-lg text-sm font-medium transition">+ Log Session</button>
            </div>
            {showSessionForm && (
              <form onSubmit={handleCreateSession} className="bg-gray-900 border border-gray-800 rounded-xl p-6 mb-6 space-y-4">
                <div>
                  <label className="text-gray-300 text-sm mb-1 block">Title</label>
                  <input value={sessionTitle} onChange={(e) => setSessionTitle(e.target.value)} className="w-full bg-gray-800 text-white rounded-lg px-4 py-2.5 outline-none focus:ring-2 focus:ring-green-500" placeholder="What did you work on?" required />
                </div>
                <div>
                  <label className="text-gray-300 text-sm mb-1 block">Description</label>
                  <input value={sessionDesc} onChange={(e) => setSessionDesc(e.target.value)} className="w-full bg-gray-800 text-white rounded-lg px-4 py-2.5 outline-none focus:ring-2 focus:ring-green-500" placeholder="Details..." />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-gray-300 text-sm mb-1 block">Duration (minutes)</label>
                    <input type="number" value={sessionDuration} onChange={(e) => setSessionDuration(e.target.value)} className="w-full bg-gray-800 text-white rounded-lg px-4 py-2.5 outline-none focus:ring-2 focus:ring-green-500" placeholder="90" required />
                  </div>
                  <div>
                    <label className="text-gray-300 text-sm mb-1 block">Mood</label>
                    <select value={sessionMood} onChange={(e) => setSessionMood(e.target.value)} className="w-full bg-gray-800 text-white rounded-lg px-4 py-2.5 outline-none focus:ring-2 focus:ring-green-500">
                      <option value="great">Great</option>
                      <option value="good">Good</option>
                      <option value="okay">Okay</option>
                      <option value="bad">Bad</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="text-gray-300 text-sm mb-1 block">Project (optional)</label>
                  <select value={sessionProject} onChange={(e) => setSessionProject(e.target.value)} className="w-full bg-gray-800 text-white rounded-lg px-4 py-2.5 outline-none focus:ring-2 focus:ring-green-500">
                    <option value="">No project</option>
                    {projects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
                  </select>
                </div>
                <div className="flex gap-3">
                  <button type="submit" className="bg-green-600 hover:bg-green-700 px-4 py-2 rounded-lg text-sm font-medium transition">Log Session</button>
                  <button type="button" onClick={() => setShowSessionForm(false)} className="bg-gray-800 hover:bg-gray-700 px-4 py-2 rounded-lg text-sm transition">Cancel</button>
                </div>
              </form>
            )}
            {sessions.length === 0 ? (
              <p className="text-gray-500 text-sm">No sessions logged yet.</p>
            ) : (
              <div className="space-y-3">
                {[...sessions].reverse().map((s) => (
                  <div key={s.id} className="bg-gray-900 border border-gray-800 rounded-xl p-5 flex justify-between items-start">
                    <div>
                      <h4 className="font-semibold">{s.title}</h4>
                      <p className="text-gray-400 text-sm mt-1">{s.description || "No description"}</p>
                      <div className="flex gap-2 mt-2">
                        <span className="text-xs bg-gray-800 text-gray-300 px-2 py-0.5 rounded-full">{s.duration_minutes} min</span>
                        <span className="text-xs px-2 py-0.5 rounded-full" style={{ backgroundColor: (MOOD_COLORS[s.mood || ""] || "#6b7280") + "33", color: MOOD_COLORS[s.mood || ""] || "#6b7280" }}>{s.mood}</span>
                      </div>
                    </div>
                    <button onClick={() => handleDeleteSession(s.id)} className="text-gray-600 hover:text-red-400 text-sm transition">x</button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {view === "pomodoro" && (
          <div className="p-8 flex flex-col items-center justify-center min-h-screen">
            <h2 className="text-2xl font-bold mb-2">Pomodoro Timer</h2>
            <p className="text-gray-400 mb-10">Stay focused, take breaks</p>
            <div className={`rounded-full w-64 h-64 flex flex-col items-center justify-center border-4 mb-8 ${pomMode === "work" ? "border-blue-500" : "border-green-500"}`}>
              <p className="text-sm text-gray-400 mb-2 uppercase tracking-widest">{pomMode === "work" ? "Focus" : "Break"}</p>
              <p className="text-6xl font-bold font-mono">{String(pomMinutes).padStart(2, "0")}:{String(pomSeconds).padStart(2, "0")}</p>
            </div>
            <div className="flex gap-4 mb-8">
              <button onClick={() => setPomRunning(!pomRunning)} className={`px-8 py-3 rounded-xl font-semibold text-lg transition ${pomRunning ? "bg-yellow-600 hover:bg-yellow-700" : "bg-blue-600 hover:bg-blue-700"}`}>
                {pomRunning ? "Pause" : "Start"}
              </button>
              <button onClick={() => { setPomRunning(false); setPomMinutes(25); setPomSeconds(0); setPomMode("work"); }} className="px-8 py-3 rounded-xl font-semibold text-lg bg-gray-800 hover:bg-gray-700 transition">
                Reset
              </button>
            </div>
            <div className="flex gap-3">
              {[{ label: "25 min", min: 25 }, { label: "45 min", min: 45 }, { label: "60 min", min: 60 }].map((opt) => (
                <button key={opt.label} onClick={() => { setPomRunning(false); setPomMinutes(opt.min); setPomSeconds(0); }} className="px-4 py-2 rounded-lg bg-gray-800 hover:bg-gray-700 text-sm transition">
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}