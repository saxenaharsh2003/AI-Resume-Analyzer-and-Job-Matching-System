import { motion } from "framer-motion";
import { BarChart3, ShieldCheck, Sparkles, Zap } from "lucide-react";

const FEATURES = [
  {
    title: "AI-Powered Parsing",
    description: "Extracts structured resume insights with scoring and feedback.",
    icon: Sparkles,
    accent: "from-cyan-400 to-blue-500",
  },
  {
    title: "Role Match Analytics",
    description: "Visualize job match strength and skill coverage instantly.",
    icon: BarChart3,
    accent: "from-indigo-400 to-violet-500",
  },
  {
    title: "Secure User Sessions",
    description: "Simple login flow with protected dashboard experience.",
    icon: ShieldCheck,
    accent: "from-emerald-400 to-cyan-500",
  },
  {
    title: "Fast Experience",
    description: "Smooth transitions, subtle motion, and non-blocking loading states.",
    icon: Zap,
    accent: "from-fuchsia-400 to-indigo-500",
  },
];

export default function FeaturesSection() {
  return (
    <section className="mt-8">
      <div className="mb-4 flex items-end justify-between">
        <h2 className="typo-section-title">Platform Highlights</h2>
        <p className="typo-label md:text-sm">Designed for modern resume workflows</p>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {FEATURES.map((feature, idx) => {
          const Icon = feature.icon;
          return (
            <motion.article
              key={feature.title}
              initial={{ opacity: 0, y: 14 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.35 }}
              transition={{ duration: 0.35, delay: idx * 0.06 }}
              whileHover={{ scale: 1.015 }}
              className="glass-card neon-ring group p-4"
            >
              <div className="mb-3 flex items-center gap-3">
                <div className={`rounded-xl bg-gradient-to-r ${feature.accent} p-2 text-slate-900 shadow-[0_0_18px_rgba(99,102,241,0.5)]`}>
                  <Icon size={18} />
                </div>
                <h3 className="text-base font-semibold leading-tight text-slate-100">{feature.title}</h3>
              </div>
              <p className="typo-subtitle text-sm">{feature.description}</p>
            </motion.article>
          );
        })}
      </div>
    </section>
  );
}

