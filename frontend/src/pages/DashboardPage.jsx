import { useRef, useState } from "react";
import { AnimatePresence, motion, useScroll, useTransform } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { clearStoredUser } from "../auth";
import Hero from "../components/Hero";
import Scene3D from "../components/Scene3D";
import UploadCard from "../components/UploadCard";
import Dashboard from "../components/Dashboard";
import JobRecommendations from "../components/JobRecommendations";
import ResultCard from "../components/ResultCard";
import Navbar from "../components/Navbar";
import AnalyzeLoading, { DashboardSkeleton } from "../components/AnalyzeLoading";
import FeaturesSection from "../components/FeaturesSection";
import SectionDivider from "../components/SectionDivider";

const API_URL = "http://127.0.0.1:8000/api/v1/analyze";

export default function DashboardPage({ user }) {
  const navigate = useNavigate();
  const containerRef = useRef(null);
  const mouseRef = useRef({ x: 0, y: 0 });
  const [file, setFile] = useState(null);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const { scrollYProgress } = useScroll();
  const parallaxY = useTransform(scrollYProgress, [0, 1], [0, -70]);

  const handleMouseMove = (e) => {
    const cx = window.innerWidth / 2;
    const cy = window.innerHeight / 2;
    mouseRef.current = { x: (e.clientX - cx) / cx, y: -(e.clientY - cy) / cy };
  };

  const handleLogout = () => {
    clearStoredUser();
    navigate("/login", { replace: true });
  };

  const handleUpload = async () => {
    if (!file) {
      setError("Please select a resume file first.");
      return;
    }
    setError("");
    setResult(null);
    setLoading(true);

    const formData = new FormData();
    formData.append("resume", file);

    try {
      const response = await fetch(API_URL, { method: "POST", body: formData });
      const data = await response.json();
      if (!response.ok) throw new Error(data?.detail || "Failed to analyze resume.");
      setResult(data);
    } catch (err) {
      setError(err.message || "Backend error.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div ref={containerRef} onMouseMove={handleMouseMove} className="relative overflow-x-hidden">
      <Scene3D mouse={mouseRef} />
      <div className="animated-gradient pointer-events-none fixed inset-0 -z-20 opacity-70" />
      <motion.main style={{ y: parallaxY }} className="mx-auto min-h-screen w-full max-w-7xl px-4 py-5 md:px-8 md:py-7">
        <Navbar userName={user?.name || "User"} onLogout={handleLogout} />
        <Hero />
        <FeaturesSection />
        <SectionDivider />

        <motion.div className="glass-card neon-ring p-4 md:p-5" initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.12, duration: 0.4 }} whileHover={{ scale: 1.01 }}>
          <UploadCard setFile={setFile} handleUpload={handleUpload} loading={loading} />
        </motion.div>

        {error ? (
          <motion.p initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="mt-3 rounded-lg border border-rose-500/40 bg-rose-500/10 px-3 py-2 text-sm text-rose-300">
            {error}
          </motion.p>
        ) : null}

        <AnalyzeLoading active={loading} />

        <AnimatePresence mode="wait">
          {loading ? (
            <DashboardSkeleton key="loading-skeleton" />
          ) : result ? (
            <motion.div key="dashboard" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.32 }} className="mt-1">
              <div className="mb-4">
                <h2 className="typo-section-title">Analysis Dashboard</h2>
                <p className="typo-subtitle text-sm">Interactive resume insights and structured details</p>
              </div>
              <Dashboard result={result} />
              <SectionDivider />
              <JobRecommendations jobs={result?.recommended_jobs || []} />
              <SectionDivider />
              <ResultCard result={result} />
            </motion.div>
          ) : null}
        </AnimatePresence>
      </motion.main>
    </div>
  );
}

