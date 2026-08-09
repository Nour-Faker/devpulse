import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { register } from "../api/auth";
import { useTheme } from "../context/ThemeContext";
import { Eye, EyeOff, Sun, Moon, TrendingUp } from "lucide-react";
import Particles from "../components/Particles";

export default function Register() {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      await register({ email, password, full_name: fullName });
      navigate("/login");
    } catch {
      setError("Registration failed. Email may already exist.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg)", display: "flex", alignItems: "center", justifyContent: "center", position: "relative", overflow: "hidden" }}>
      <Particles />

      <div style={{ position: "fixed", top: -300, right: -300, width: 700, height: 700, borderRadius: "50%", background: "radial-gradient(circle, #8b5cf615 0%, transparent 70%)", pointerEvents: "none" }} />
      <div style={{ position: "fixed", bottom: -300, left: -300, width: 700, height: 700, borderRadius: "50%", background: "radial-gradient(circle, #06b6d415 0%, transparent 70%)", pointerEvents: "none" }} />

      <button
        onClick={toggleTheme}
        style={{ position: "fixed", top: 20, right: 20, zIndex: 10, background: "rgba(255,255,255,0.06)", border: "1px solid var(--border)", borderRadius: 12, padding: "8px 12px", cursor: "pointer", color: "var(--text-2)", display: "flex", alignItems: "center", backdropFilter: "blur(10px)" }}
      >
        {theme === "dark" ? <Sun size={16} /> : <Moon size={16} />}
      </button>

      <motion.div
        initial={{ opacity: 0, y: 40, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        style={{ background: "rgba(255,255,255,0.03)", backdropFilter: "blur(40px)", border: "1px solid var(--border)", borderRadius: 28, padding: 48, width: "100%", maxWidth: 460, position: "relative", zIndex: 1, boxShadow: "0 40px 80px rgba(0,0,0,0.4)" }}
      >
        {/* Logo */}
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 32 }}>
          <div style={{ width: 40, height: 40, background: "var(--gradient-1)", borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "var(--glow-accent)" }}>
            <TrendingUp size={20} color="white" />
          </div>
          <span style={{ fontSize: 22, fontWeight: 800, background: "var(--gradient-1)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>DevPulse</span>
        </div>

        <h2 style={{ fontSize: 24, fontWeight: 700, color: "var(--text)", marginBottom: 6 }}>Create account</h2>
        <p style={{ fontSize: 14, color: "var(--text-2)", marginBottom: 32 }}>Start tracking your developer journey</p>

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
          <div style={{ marginBottom: 16 }}>
            <label style={{ display: "block", fontSize: 13, fontWeight: 500, color: "var(--text-2)", marginBottom: 8 }}>Full Name</label>
            <input
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Nour Faker"
              required
              className="dp-input"
            />
          </div>

          <div style={{ marginBottom: 16 }}>
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
            ) : "Create account"}
          </button>
        </form>

        <p style={{ textAlign: "center", fontSize: 14, color: "var(--text-2)" }}>
          Already have an account?{" "}
          <Link to="/login" style={{ color: "var(--accent)", fontWeight: 500, textDecoration: "none" }}>
            Sign in
          </Link>
        </p>
      </motion.div>
    </div>
  );
}