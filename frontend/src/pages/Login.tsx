import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { login } from "../api/auth";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import { Eye, EyeOff, Sun, Moon, TrendingUp, Zap, Shield, BarChart3 } from "lucide-react";
import Particles from "../components/Particles";

const features = [
  { icon: <BarChart3 size={18} />, text: "Real-time productivity charts" },
  { icon: <Zap size={18} />, text: "AI-powered weekly insights" },
  { icon: <Shield size={18} />, text: "Secure JWT authentication" },
  { icon: <TrendingUp size={18} />, text: "Track streaks and goals" },
];

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { login: setToken } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await login({ username: email, password });
      setToken(res.data.access_token);
      navigate("/dashboard");
    } catch {
      setError("Invalid email or password");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg)", display: "flex", position: "relative", overflow: "hidden" }}>
      <Particles />

      {/* Gradient orbs */}
      <div style={{ position: "fixed", top: -200, left: -200, width: 600, height: 600, borderRadius: "50%", background: "radial-gradient(circle, #6366f120 0%, transparent 70%)", pointerEvents: "none" }} />
      <div style={{ position: "fixed", bottom: -200, right: -200, width: 600, height: 600, borderRadius: "50%", background: "radial-gradient(circle, #8b5cf620 0%, transparent 70%)", pointerEvents: "none" }} />

      {/* Theme toggle */}
      <button
        onClick={toggleTheme}
        style={{ position: "fixed", top: 20, right: 20, zIndex: 10, background: "rgba(255,255,255,0.06)", border: "1px solid var(--border)", borderRadius: 12, padding: "8px 12px", cursor: "pointer", color: "var(--text-2)", display: "flex", alignItems: "center", backdropFilter: "blur(10px)" }}
      >
        {theme === "dark" ? <Sun size={16} /> : <Moon size={16} />}
      </button>

      {/* Left panel */}
      <motion.div
        initial={{ opacity: 0, x: -40 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", padding: 60, position: "relative", zIndex: 1 }}
      >
        <div style={{ maxWidth: 400, width: "100%" }}>
          {/* Logo */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 48 }}
          >
            <div style={{ width: 48, height: 48, background: "var(--gradient-1)", borderRadius: 14, display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "var(--glow-accent)" }}>
              <TrendingUp size={24} color="white" />
            </div>
            <span style={{ fontSize: 28, fontWeight: 800, background: "var(--gradient-1)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
              DevPulse
            </span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            style={{ fontSize: 40, fontWeight: 800, color: "var(--text)", lineHeight: 1.2, marginBottom: 16 }}
          >
            Track your coding
            <br />
            <span style={{ background: "var(--gradient-1)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
              journey
            </span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            style={{ fontSize: 16, color: "var(--text-2)", marginBottom: 40, lineHeight: 1.7 }}
          >
            Log sessions, monitor productivity, and get AI-powered insights into your workflow.
          </motion.p>

          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {features.map((f, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.5 + i * 0.1 }}
                style={{ display: "flex", alignItems: "center", gap: 12 }}
              >
                <div style={{ width: 36, height: 36, background: "rgba(99,102,241,0.1)", borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center", color: "var(--accent)", flexShrink: 0 }}>
                  {f.icon}
                </div>
                <span style={{ fontSize: 14, color: "var(--text-2)" }}>{f.text}</span>
              </motion.div>
            ))}
          </div>
        </div>
      </motion.div>

      {/* Right panel */}
      <motion.div
        initial={{ opacity: 0, x: 40 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        style={{ width: 480, display: "flex", alignItems: "center", justifyContent: "center", padding: "48px 56px", position: "relative", zIndex: 1 }}
      >
        <div style={{ background: "rgba(255,255,255,0.03)", backdropFilter: "blur(40px)", border: "1px solid var(--border)", borderRadius: 28, padding: 40, width: "100%", boxShadow: "0 40px 80px rgba(0,0,0,0.4)" }}>
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
            <h2 style={{ fontSize: 24, fontWeight: 700, color: "var(--text)", marginBottom: 6 }}>Welcome back</h2>
            <p style={{ fontSize: 14, color: "var(--text-2)", marginBottom: 32 }}>Sign in to your DevPulse account</p>

            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)", borderRadius: 10, padding: "10px 14px", marginBottom: 20, fontSize: 13, color: "#ef4444" }}
              >
                {error}
              </motion.div>
            )}

            <form onSubmit={handleSubmit}>
              <div style={{ marginBottom: 18 }}>
                <label style={{ display: "block", fontSize: 13, fontWeight: 500, color: "var(--text-2)", marginBottom: 8 }}>Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  required
                  className="dp-input"
                />
              </div>

              <div style={{ marginBottom: 28, position: "relative" }}>
                <label style={{ display: "block", fontSize: 13, fontWeight: 500, color: "var(--text-2)", marginBottom: 8 }}>Password</label>
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="dp-input"
                  style={{ paddingRight: 44 }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{ position: "absolute", right: 14, top: 38, background: "none", border: "none", cursor: "pointer", color: "var(--text-3)" }}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="dp-btn dp-btn-primary"
                style={{ width: "100%", fontSize: 15, padding: "13px", marginBottom: 20, opacity: loading ? 0.7 : 1 }}
              >
                {loading ? (
                  <div style={{ width: 18, height: 18, border: "2px solid rgba(255,255,255,0.3)", borderTop: "2px solid white", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
                ) : "Sign in"}
              </button>
            </form>

            <p style={{ textAlign: "center", fontSize: 14, color: "var(--text-2)" }}>
              Don't have an account?{" "}
              <Link to="/register" style={{ color: "var(--accent)", fontWeight: 500, textDecoration: "none" }}>
                Create one
              </Link>
            </p>
          </motion.div>
        </div>
      </motion.div>
    </div>
  );
}