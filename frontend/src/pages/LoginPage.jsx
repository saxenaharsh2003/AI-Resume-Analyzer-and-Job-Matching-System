import { useState } from "react";
import { motion } from "framer-motion";
import { Link, useNavigate } from "react-router-dom";
import { apiUrl, formatFastApiDetail, getApiBase, readJsonOrTextBody } from "../apiConfig";
import { storeUser } from "../auth";

export default function LoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const validate = () => {
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
      const loginUrl = apiUrl("/api/v1/login");
      if (import.meta.env.DEV) {
        console.log("[login] POST", loginUrl, "| API base", getApiBase());
      }
      const res = await fetch(loginUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      if (import.meta.env.DEV) {
        console.log("[login] response status", res.status);
      }
      const data = await readJsonOrTextBody(res);
      if (import.meta.env.DEV) {
        console.log("[login] response body", data);
      }
      if (!res.ok) throw new Error(formatFastApiDetail(data) || "Login failed.");
      storeUser({ name: data.name, email: data.email, token: data.token });
      navigate("/dashboard", { replace: true });
    } catch (err) {
      const fallback =
        err instanceof TypeError && err.message.includes("fetch")
          ? "Cannot reach API. Check VITE_API_URL (e.g. http://127.0.0.1:8000) and that the backend is running."
          : "Unable to login.";
      setError(err.message || fallback);
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
        <h1 className="hero-glow-title typo-title text-transparent">Welcome Back</h1>
        <p className="typo-subtitle text-sm">Sign in to continue to your dashboard.</p>

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
          {loading ? "Signing in..." : "Login"}
        </motion.button>

        <p className="text-center text-sm text-slate-300">
          New here?{" "}
          <Link className="text-cyan-300 hover:text-cyan-200" to="/signup">
            Create account
          </Link>
        </p>
      </motion.form>
    </div>
  );
}

