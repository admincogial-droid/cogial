import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { ArrowUpRight, PlayCircle } from "lucide-react";
import PressConsole from "./PressConsole";

export default function Hero() {
  return (
    <section className="relative overflow-hidden pt-40 pb-28 px-6">
      <div className="absolute inset-0 bg-brand-cloud pointer-events-none" />
      <div
        className="absolute -top-40 left-1/2 -translate-x-1/2 w-[900px] h-[900px] rounded-full opacity-[0.10] blur-3xl pointer-events-none"
        style={{ background: "radial-gradient(circle, #6C4DFF 0%, transparent 65%)" }}
      />

      <div className="max-w-7xl mx-auto grid lg:grid-cols-[1.1fr_0.9fr] gap-16 items-center relative">
        <div>
          <motion.div
            initial={{ opacity: 0, scale: 2.2, rotate: -8 }}
            animate={{ opacity: 1, scale: 1, rotate: -8 }}
            transition={{ duration: 0.7, ease: [0.2, 0.9, 0.3, 1.2] }}
            className="inline-flex items-center gap-2 rounded-full border border-brand-violet/50 bg-brand-violet/10 px-4 py-1.5 mb-8"
          >
            <span className="h-1.5 w-1.5 rounded-full bg-brand-violet" />
            <span className="text-xs tracking-wide uppercase text-brand-violet font-mono">Cogial v1.1 — The AI Workspace</span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.15 }}
            className="text-brand-navy"
          >
            One Platform.
            <br />
            <span className="text-brand-violet">Unlimited</span> Possibilities.
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.3 }}
            className="mt-6 text-lg text-brand-slate max-w-lg leading-relaxed"
          >
            The all-in-one AI workspace for creators, students, professionals, marketers, developers and teams. Bring your ideas, files and workflows together — and let Cogial help you move them forward.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.45 }}
            className="mt-9 flex flex-wrap items-center gap-4"
          >
            <Link
              to="/signup"
              className="inline-flex items-center gap-2 rounded-full bg-brand-violet text-brand-white font-semibold px-6 py-3.5 hover:bg-brand-violet/90 transition-all hover:-translate-y-0.5 hover:shadow-card hover:shadow-brand-violet/20"
            >
              Start for free <ArrowUpRight size={18} />
            </Link>
            <a
              href="#workflow"
              className="inline-flex items-center gap-2 text-brand-ink font-medium px-2 py-3.5 hover:text-brand-violet transition-colors"
            >
              <PlayCircle size={20} /> See how it works
            </a>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.7, delay: 0.6 }}
            className="mt-12 flex items-center gap-6 text-brand-slate text-xs font-mono uppercase tracking-wide"
          >
            <span>10M+ Tasks Automated</span>
            <span className="h-3 w-px bg-brand-slate/30" />
            <span>Trusted Globally</span>
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.3 }}
          className="animate-drift"
        >
          <PressConsole />
        </motion.div>
      </div>
    </section>
  );
}
