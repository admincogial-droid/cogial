import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, FileText, CheckCircle2 } from "lucide-react";

const runs = [
  { keyword: "best trail running shoes 2026", stage: 0 },
  { keyword: "no-fee travel credit cards", stage: 0 },
  { keyword: "standing desk buying guide", stage: 0 },
];

const stageLabels = ["Reading keyword", "Drafting sections", "Ready to publish"];

export default function PressConsole() {
  const [runIndex, setRunIndex] = useState(0);
  const [stage, setStage] = useState(0);

  useEffect(() => {
    const t = setInterval(() => {
      setStage((s) => {
        if (s >= 2) {
          setRunIndex((r) => (r + 1) % runs.length);
          return 0;
        }
        return s + 1;
      });
    }, 1400);
    return () => clearInterval(t);
  }, []);

  const current = runs[runIndex];

  return (
    <div className="relative rounded-2xl border border-brand-slate/20 bg-brand-white/80 shadow-2xl shadow-black/40 overflow-hidden">
      <div className="flex items-center gap-2 px-5 py-3.5 border-b border-brand-slate/20 bg-brand-white">
        <span className="h-2.5 w-2.5 rounded-full bg-rust-500/80" />
        <span className="h-2.5 w-2.5 rounded-full bg-brand-violet/80" />
        <span className="h-2.5 w-2.5 rounded-full bg-teal-500/80" />
        <span className="ml-3 text-xs font-mono text-brand-slate/60">cogial-workspace — bulk run</span>
      </div>

      <div className="p-6 space-y-5">
        <div className="flex items-center justify-between text-xs font-mono text-brand-slate/60 uppercase tracking-wide">
          <span>Keyword queue</span>
          <span>{runIndex + 1} / {runs.length}</span>
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={runIndex}
            initial={{ opacity: 0, x: 16 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -16 }}
            transition={{ duration: 0.4 }}
            className="rounded-xl border border-brand-slate/30 bg-brand-cloud p-4"
          >
            <p className="font-mono text-sm text-brand-ink">"{current.keyword}"</p>
          </motion.div>
        </AnimatePresence>

        <div className="space-y-3">
          {stageLabels.map((label, i) => (
            <div key={label} className="flex items-center gap-3">
              <div
                className={`h-6 w-6 rounded-full flex items-center justify-center border transition-colors duration-300 ${
                  i < stage
                    ? "bg-teal-500 border-teal-500"
                    : i === stage
                    ? "border-brand-violet bg-brand-violet/10"
                    : "border-brand-slate/30"
                }`}
              >
                {i < stage ? (
                  <CheckCircle2 size={14} className="text-brand-white" />
                ) : i === stage ? (
                  <Sparkles size={12} className="text-brand-violet" />
                ) : null}
              </div>
              <span className={`text-sm transition-colors duration-300 ${i <= stage ? "text-brand-ink" : "text-paper-500/50"}`}>
                {label}
              </span>
              {i === stage && (
                <motion.div
                  className="h-1 flex-1 rounded-full bg-ink-700 overflow-hidden ml-2"
                >
                  <motion.div
                    key={`${runIndex}-${stage}`}
                    initial={{ width: "0%" }}
                    animate={{ width: "100%" }}
                    transition={{ duration: 1.3, ease: "easeInOut" }}
                    className="h-full bg-brand-violet"
                  />
                </motion.div>
              )}
            </div>
          ))}
        </div>

        <div className="rounded-xl border border-dashed border-brand-slate/30 p-4 flex items-start gap-3">
          <FileText size={18} className="text-brand-violet mt-0.5 shrink-0" />
          <div>
            <p className="text-sm text-brand-ink font-medium">1,340-word draft, 6 headers</p>
            <p className="text-xs text-brand-slate/60 mt-0.5">SEO title, meta description and FAQ block included</p>
          </div>
        </div>
      </div>
    </div>
  );
}
