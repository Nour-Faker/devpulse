import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { login } from "../api/auth";
import { useAuth } from "../context/AuthContext";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const { login: setToken } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await login({ username: email, password });
      setToken(res.data.access_token);
      navigate("/dashboard");
    } catch {
      setError("Invalid email or password");
    }
  };

  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center">
      <div className="bg-gray-900 p-8 rounded-xl w-full max-w-md shadow-xl">
        <h1 className="text-2xl font-bold text-white mb-2">Welcome back</h1>
        <p className="text-gray-400 mb-6">Sign in to DevPulse</p>
        {error && <p className="text-red-400 mb-4 text-sm">{error}</p>}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-gray-300 text-sm mb-1 block">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-gray-800 text-white rounded-lg px-4 py-2.5 outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="you@example.com"
              required
            />
          </div>
          <div>
            <label className="text-gray-300 text-sm mb-1 block">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-gray-800 text-white rounded-lg px-4 py-2.5 outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="••••••••"
              required
            />
          </div>
          <button
            type="submit"
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2.5 rounded-lg transition"
          >
            Sign in
          </button>
        </form>
        <p className="text-gray-400 text-sm mt-4 text-center">
          Don't have an account?{" "}
          <Link to="/register" className="text-blue-400 hover:underline">Register</Link>
        </p>
      </div>
    </div>
  );
}