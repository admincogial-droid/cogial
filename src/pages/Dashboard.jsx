import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, Loader2, Copy, Check, X } from "lucide-react";
import DashboardLayout from "../components/DashboardLayout";
import { featureCategories } from "../data/features";
import { useAuth } from "../context/AuthContext";
import { db } from "../lib/firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";

const allTools = featureCategories.flatMap((c) => c.tools.map((t) => ({ ...t, category: c.label })));

function fakeGenerate(toolName, prompt) {
  const openers = [
    `Here's a draft angle for "${prompt}":`,
    `Running "${prompt}" through the ${toolName} plate —`,
    `First pass on "${prompt}":`,
  ];
  const body = [
    "the piece opens by naming the exact problem the reader has, then narrows to the three factors that actually decide the outcome.",
    "the structure leads with a clear recommendation, backs it with two supporting points, and closes with a next step the reader can take today.",
    "each section is built around one claim, one piece of evidence, and one takeaway — no padding between them.",
  ];
  const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
  return `${pick(openers)} ${pick(body)}\n\nThis is a simulated AI preview — connect a generation model in Firebase Functions to produce real drafts.`;
}

export default function Dashboard() {
  const { user } = useAuth();
  const [selected, setSelected] = useState(null);
  const [prompt, setPrompt] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState("");
  const [copied, setCopied] = useState(false);

  const runTool = async (e) => {
    e.preventDefault();
    if (!prompt.trim()) return;
    setLoading(true);
    setResult("");

    await new Promise((r) => setTimeout(r, 1200));
    const output = fakeGenerate(selected.name, prompt);
    setResult(output);
    setLoading(false);

    if (user) {
      try {
        await addDoc(collection(db, "generations"), {
          user_id: user.uid,
          tool_name: selected.name,
          prompt,
          output,
          created_at: serverTimestamp()
        });
      } catch (err) {
        console.error("Failed to save generation", err);
      }
    }
  };

  const copy = () => {
    navigator.clipboard.writeText(result);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <DashboardLayout>
      <div className="max-w-6xl">
        <div className="flex items-end justify-between mb-8">
          <div>
            <h1 className="font-heading text-3xl text-brand-navy">Tool room</h1>
            <p className="text-brand-slate/70 mt-1.5 text-sm">
              Pick a machine, hand it a prompt, pull a draft.
            </p>
          </div>
          <div className="text-right hidden sm:block">
            <p className="text-2xl font-heading text-brand-violet">5</p>
            <p className="text-xs text-brand-slate/60 font-mono uppercase tracking-wide">credits left</p>
          </div>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {allTools.map((tool) => {
            const Icon = tool.icon;
            return (
              <button
                key={tool.name}
                onClick={() => {
                  setSelected(tool);
                  setPrompt("");
                  setResult("");
                }}
                className="text-left rounded-xl border border-brand-slate/20 bg-brand-white/50 p-5 hover:border-brand-violet/40 hover:bg-brand-white transition-all duration-200 group"
              >
                <div className="h-10 w-10 rounded-lg bg-brand-lavender border border-brand-violet/20 flex items-center justify-center mb-4 group-hover:bg-brand-violet/10 group-hover:border-brand-violet/40 transition-colors">
                  <Icon size={18} className="text-brand-violet group-hover:text-brand-violet transition-colors" />
                </div>
                <p className="text-[11px] font-mono uppercase tracking-wide text-paper-500/60 mb-1">{tool.category}</p>
                <h3 className="text-brand-navy font-medium mb-1.5">{tool.name}</h3>
                <p className="text-sm text-brand-slate/70 leading-relaxed">{tool.desc}</p>
              </button>
            );
          })}
        </div>
      </div>

      <AnimatePresence>
        {selected && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-brand-white/70 backdrop-blur-sm z-50 flex items-center justify-center p-6"
            onClick={() => setSelected(null)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: 12 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 12 }}
              transition={{ duration: 0.25 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-xl rounded-2xl border border-brand-slate/20 bg-brand-cloud shadow-2xl overflow-hidden"
            >
              <div className="flex items-center justify-between px-6 py-4 border-b border-brand-slate/20">
                <div className="flex items-center gap-2.5">
                  <selected.icon size={17} className="text-brand-violet" />
                  <h3 className="font-heading text-lg text-brand-navy">{selected.name}</h3>
                </div>
                <button onClick={() => setSelected(null)} className="text-brand-slate/60 hover:text-brand-navy">
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={runTool} className="p-6 space-y-4">
                <div>
                  <label className="block text-xs font-mono uppercase tracking-wide text-brand-slate/70 mb-1.5">
                    Keyword or brief
                  </label>
                  <textarea
                    required
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    rows={3}
                    placeholder="e.g. best budget espresso machines"
                    className="w-full rounded-lg border border-brand-slate/30 bg-brand-white px-3.5 py-2.5 text-sm text-brand-navy placeholder:text-paper-500/50 focus:border-brand-violet outline-none transition-colors resize-none"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full inline-flex items-center justify-center gap-2 rounded-full bg-brand-violet text-brand-white font-semibold px-5 py-3 hover:bg-brand-violet/90 transition-colors disabled:opacity-60"
                >
                  {loading ? <Loader2 size={16} className="animate-spin" /> : <><Sparkles size={16} /> Run it</>}
                </button>

                {result && (
                  <motion.div
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="relative rounded-lg border border-brand-slate/30 bg-brand-white p-4 text-sm text-brand-ink leading-relaxed whitespace-pre-line"
                  >
                    <button
                      type="button"
                      onClick={copy}
                      className="absolute top-3 right-3 text-brand-slate/60 hover:text-brand-violet transition-colors"
                      aria-label="Copy result"
                    >
                      {copied ? <Check size={15} className="text-brand-violet" /> : <Copy size={15} />}
                    </button>
                    {result}
                  </motion.div>
                )}
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </DashboardLayout>
  );
}
