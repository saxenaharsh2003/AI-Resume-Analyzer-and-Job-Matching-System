import { useState } from "react";
import { motion } from "framer-motion";
import { Link, useNavigate } from "react-router-dom";
import { storeUser } from "../auth";

const API_BASE = "http://127.0.0.1:8000";

export default function SignupPage() {
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const validate = () => {
    if (name.trim().length < 2) return "Name must be at least 2 characters.";
    const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
    if (!emailOk) return "Enter a valid email address.";
    if (password.length < 6) return "Password must be at least 6 characters.";
    return "";
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    const message = validate();
    if (message) {
      setError(message);
      return;
    }
    setError("");
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/signup`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.detail || "Signup failed.");
      storeUser({ name: data.name, email: data.email, token: data.token });
      navigate("/dashboard", { replace: true });
    } catch (err) {
      setError(err.message || "Unable to create account.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center px-4">
      <div className="animated-gradient pointer-events-none fixed inset-0 -z-20 opacity-80" />
      <motion.form
        onSubmit={onSubmit}
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-card neon-ring w-full max-w-md space-y-4 p-7"
      >
        <h1 className="hero-glow-title typo-title text-transparent">Create Account</h1>
        <p className="typo-subtitle text-sm">Start with a professional resume dashboard.</p>

        <div className="space-y-2">
          <label className="typo-label">Name</label>
          <input value={name} onChange={(e) => setName(e.target.value)} className="w-full rounded-lg border border-white/20 bg-slate-900/70 px-3 py-2 text-slate-100 outline-none focus:border-cyan-300/60" placeholder="Your name" />
        </div>

        <div className="space-y-2">
          <label className="typo-label">Email</label>
          <input value={email} onChange={(e) => setEmail(e.target.value)} className="w-full rounded-lg border border-white/20 bg-slate-900/70 px-3 py-2 text-slate-100 outline-none focus:border-cyan-300/60" placeholder="you@example.com" />
        </div>

        <div className="space-y-2">
          <label className="typo-label">Password</label>
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full rounded-lg border border-white/20 bg-slate-900/70 px-3 py-2 text-slate-100 outline-none focus:border-cyan-300/60" placeholder="••••••••" />
        </div>

        {error ? <p className="text-sm text-rose-300">{error}</p> : null}

        <motion.button whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }} disabled={loading} className="w-full rounded-lg bg-gradient-to-r from-indigo-500 to-violet-500 px-4 py-2.5 font-semibold text-white disabled:opacity-60">
          {loading ? "Creating account..." : "Sign Up"}
        </motion.button>

        <p className="text-center text-sm text-slate-300">
          Already have an account?{" "}
          <Link className="text-cyan-300 hover:text-cyan-200" to="/login">
            Login
          </Link>
        </p>
      </motion.form>
    </div>
  );
}

