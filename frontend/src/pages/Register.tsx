import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { register } from "../api/auth";

export default function Register() {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await register({ email, password, full_name: fullName });
      navigate("/login");
    } catch {
      setError("Registration failed. Email may already exist.");
    }
  };

  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center">
      <div className="bg-gray-900 p-8 rounded-xl w-full max-w-md shadow-xl">
        <h1 className="text-2xl font-bold text-white mb-2">Create account</h1>
        <p className="text-gray-400 mb-6">Start tracking your work with DevPulse</p>
        {error && <p className="text-red-400 mb-4 text-sm">{error}</p>}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-gray-300 text-sm mb-1 block">Full Name</label>
            <input
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="w-full bg-gray-800 text-white rounded-lg px-4 py-2.5 outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Nour Faker"
              required
            />
          </div>
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
            Create account
          </button>
        </form>
        <p className="text-gray-400 text-sm mt-4 text-center">
          Already have an account?{" "}
          <Link to="/login" className="text-blue-400 hover:underline">Sign in</Link>
        </p>
      </div>
    </div>
  );
}