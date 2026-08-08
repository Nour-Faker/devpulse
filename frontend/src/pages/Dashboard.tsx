import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import type { Project } from "../api/projects";
import { getProjects, createProject, deleteProject } from "../api/projects";
import type { WorkSession } from "../api/sessions";
import { getSessions, createSession, deleteSession } from "../api/sessions";
export default function Dashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [projects, setProjects] = useState<Project[]>([]);
  const [sessions, setSessions] = useState<WorkSession[]>([]);
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

  useEffect(() => {
    Promise.all([getProjects(), getSessions()])
      .then(([p, s]) => {
        setProjects(p.data);
        setSessions(s.data);
      })
      .finally(() => setLoading(false));
  }, []);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await createProject({ name: projectName, description: projectDesc });
    setProjects([...projects, res.data]);
    setProjectName("");
    setProjectDesc("");
    setShowProjectForm(false);
  };

  const handleCreateSession = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await createSession({
      title: sessionTitle,
      description: sessionDesc,
      duration_minutes: parseInt(sessionDuration),
      mood: sessionMood,
      project_id: sessionProject || undefined,
    });
    setSessions([...sessions, res.data]);
    setSessionTitle("");
    setSessionDesc("");
    setSessionDuration("");
    setShowSessionForm(false);
  };

  const handleDeleteProject = async (id: string) => {
    await deleteProject(id);
    setProjects(projects.filter((p) => p.id !== id));
  };

  const handleDeleteSession = async (id: string) => {
    await deleteSession(id);
    setSessions(sessions.filter((s) => s.id !== id));
  };

  const totalHours = Math.round(
    sessions.reduce((acc, s) => acc + s.duration_minutes, 0) / 60
  );

  const activeProjects = projects.filter((p) => p.status === "active").length;

  if (loading)
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center text-white">
        Loading...
      </div>
    );

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      {/* Navbar */}
      <nav className="bg-gray-900 border-b border-gray-800 px-6 py-4 flex justify-between items-center">
        <h1 className="text-xl font-bold text-blue-400">DevPulse</h1>
        <div className="flex items-center gap-4">
          <span className="text-gray-400 text-sm">{user?.full_name}</span>
          <button
            onClick={handleLogout}
            className="text-sm bg-gray-800 hover:bg-gray-700 px-4 py-2 rounded-lg transition"
          >
            Logout
          </button>
        </div>
      </nav>

      <main className="max-w-6xl mx-auto px-6 py-10">
        {/* Header */}
        <h2 className="text-3xl font-bold mb-2">
          Good day, {user?.full_name?.split(" ")[0]}
        </h2>
        <p className="text-gray-400 mb-10">Here's your productivity overview</p>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
          <div className="bg-gray-900 rounded-xl p-6 border border-gray-800">
            <p className="text-gray-400 text-sm mb-1">Total Sessions</p>
            <p className="text-4xl font-bold">{sessions.length}</p>
          </div>
          <div className="bg-gray-900 rounded-xl p-6 border border-gray-800">
            <p className="text-gray-400 text-sm mb-1">Hours Logged</p>
            <p className="text-4xl font-bold">{totalHours}</p>
          </div>
          <div className="bg-gray-900 rounded-xl p-6 border border-gray-800">
            <p className="text-gray-400 text-sm mb-1">Active Projects</p>
            <p className="text-4xl font-bold">{activeProjects}</p>
          </div>
        </div>

        {/* Projects Section */}
        <div className="mb-10">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-xl font-semibold">Projects</h3>
            <button
              onClick={() => setShowProjectForm(!showProjectForm)}
              className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-lg text-sm font-medium transition"
            >
              + New Project
            </button>
          </div>

          {showProjectForm && (
            <form
              onSubmit={handleCreateProject}
              className="bg-gray-900 border border-gray-800 rounded-xl p-6 mb-4 space-y-4"
            >
              <div>
                <label className="text-gray-300 text-sm mb-1 block">Project Name</label>
                <input
                  value={projectName}
                  onChange={(e) => setProjectName(e.target.value)}
                  className="w-full bg-gray-800 text-white rounded-lg px-4 py-2.5 outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="My awesome project"
                  required
                />
              </div>
              <div>
                <label className="text-gray-300 text-sm mb-1 block">Description</label>
                <input
                  value={projectDesc}
                  onChange={(e) => setProjectDesc(e.target.value)}
                  className="w-full bg-gray-800 text-white rounded-lg px-4 py-2.5 outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="What is this project about?"
                />
              </div>
              <div className="flex gap-3">
                <button
                  type="submit"
                  className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-lg text-sm font-medium transition"
                >
                  Create
                </button>
                <button
                  type="button"
                  onClick={() => setShowProjectForm(false)}
                  className="bg-gray-800 hover:bg-gray-700 px-4 py-2 rounded-lg text-sm transition"
                >
                  Cancel
                </button>
              </div>
            </form>
          )}

          {projects.length === 0 ? (
            <p className="text-gray-500 text-sm">No projects yet. Create your first one.</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {projects.map((p) => (
                <div
                  key={p.id}
                  className="bg-gray-900 border border-gray-800 rounded-xl p-5 flex justify-between items-start"
                >
                  <div>
                    <h4 className="font-semibold text-white">{p.name}</h4>
                    <p className="text-gray-400 text-sm mt-1">
                      {p.description || "No description"}
                    </p>
                    <span className="text-xs bg-blue-900 text-blue-300 px-2 py-0.5 rounded-full mt-2 inline-block">
                      {p.status}
                    </span>
                  </div>
                  <button
                    onClick={() => handleDeleteProject(p.id)}
                    className="text-gray-600 hover:text-red-400 text-sm transition"
                  >
                    x
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Sessions Section */}
        <div>
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-xl font-semibold">Work Sessions</h3>
            <button
              onClick={() => setShowSessionForm(!showSessionForm)}
              className="bg-green-600 hover:bg-green-700 px-4 py-2 rounded-lg text-sm font-medium transition"
            >
              + Log Session
            </button>
          </div>

          {showSessionForm && (
            <form
              onSubmit={handleCreateSession}
              className="bg-gray-900 border border-gray-800 rounded-xl p-6 mb-4 space-y-4"
            >
              <div>
                <label className="text-gray-300 text-sm mb-1 block">Title</label>
                <input
                  value={sessionTitle}
                  onChange={(e) => setSessionTitle(e.target.value)}
                  className="w-full bg-gray-800 text-white rounded-lg px-4 py-2.5 outline-none focus:ring-2 focus:ring-green-500"
                  placeholder="What did you work on?"
                  required
                />
              </div>
              <div>
                <label className="text-gray-300 text-sm mb-1 block">Description</label>
                <input
                  value={sessionDesc}
                  onChange={(e) => setSessionDesc(e.target.value)}
                  className="w-full bg-gray-800 text-white rounded-lg px-4 py-2.5 outline-none focus:ring-2 focus:ring-green-500"
                  placeholder="Details..."
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-gray-300 text-sm mb-1 block">
                    Duration (minutes)
                  </label>
                  <input
                    type="number"
                    value={sessionDuration}
                    onChange={(e) => setSessionDuration(e.target.value)}
                    className="w-full bg-gray-800 text-white rounded-lg px-4 py-2.5 outline-none focus:ring-2 focus:ring-green-500"
                    placeholder="90"
                    required
                  />
                </div>
                <div>
                  <label className="text-gray-300 text-sm mb-1 block">Mood</label>
                  <select
                    value={sessionMood}
                    onChange={(e) => setSessionMood(e.target.value)}
                    className="w-full bg-gray-800 text-white rounded-lg px-4 py-2.5 outline-none focus:ring-2 focus:ring-green-500"
                  >
                    <option value="great">Great</option>
                    <option value="good">Good</option>
                    <option value="okay">Okay</option>
                    <option value="bad">Bad</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="text-gray-300 text-sm mb-1 block">
                  Project (optional)
                </label>
                <select
                  value={sessionProject}
                  onChange={(e) => setSessionProject(e.target.value)}
                  className="w-full bg-gray-800 text-white rounded-lg px-4 py-2.5 outline-none focus:ring-2 focus:ring-green-500"
                >
                  <option value="">No project</option>
                  {projects.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex gap-3">
                <button
                  type="submit"
                  className="bg-green-600 hover:bg-green-700 px-4 py-2 rounded-lg text-sm font-medium transition"
                >
                  Log Session
                </button>
                <button
                  type="button"
                  onClick={() => setShowSessionForm(false)}
                  className="bg-gray-800 hover:bg-gray-700 px-4 py-2 rounded-lg text-sm transition"
                >
                  Cancel
                </button>
              </div>
            </form>
          )}

          {sessions.length === 0 ? (
            <p className="text-gray-500 text-sm">No sessions logged yet.</p>
          ) : (
            <div className="space-y-3">
              {sessions.map((s) => (
                <div
                  key={s.id}
                  className="bg-gray-900 border border-gray-800 rounded-xl p-5 flex justify-between items-start"
                >
                  <div>
                    <h4 className="font-semibold text-white">{s.title}</h4>
                    <p className="text-gray-400 text-sm mt-1">
                      {s.description || "No description"}
                    </p>
                    <div className="flex gap-3 mt-2">
                      <span className="text-xs bg-gray-800 text-gray-300 px-2 py-0.5 rounded-full">
                        {s.duration_minutes} min
                      </span>
                      <span className="text-xs bg-gray-800 text-gray-300 px-2 py-0.5 rounded-full">
                        {s.mood}
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={() => handleDeleteSession(s.id)}
                    className="text-gray-600 hover:text-red-400 text-sm transition"
                  >
                    x
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}