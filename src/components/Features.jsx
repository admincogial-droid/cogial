import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { featureCategories } from "../data/features";

export default function Features() {
  const [active, setActive] = useState(featureCategories[0].id);
  const cat = featureCategories.find((c) => c.id === active);

  return (
    <section id="features" className="py-28 px-6">
      <div className="max-w-7xl mx-auto">
        <div className="max-w-2xl mb-14">
          <span className="text-xs font-mono uppercase tracking-wide text-brand-violet">Intelligent Workspace</span>
          <h2 className="font-heading text-4xl sm:text-5xl mt-3 text-brand-navy text-balance">
            Everything you need to create.
          </h2>
          <p className="mt-4 text-brand-slate/75 leading-relaxed">
            From bulk AI article generation to sentence correction and Amazon reviews, Cogial brings every essential tool into one unified workspace to help you scale your content seamlessly.
          </p>
        </div>

        <div className="flex flex-wrap gap-2 mb-10">
          {featureCategories.map((c) => (
            <button
              key={c.id}
              onClick={() => setActive(c.id)}
              className={`px-4 py-2 rounded-full text-sm font-medium border transition-colors ${
                active === c.id
                  ? "bg-brand-violet text-brand-white border-brand-violet"
                  : "border-brand-slate/30 text-brand-slate/80 hover:border-brand-violet/50 hover:text-brand-navy"
              }`}
            >
              {c.label}
            </button>
          ))}
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={active}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.35 }}
          >
            <div className="mb-8">
              <h3 className="font-heading text-2xl text-brand-navy">{cat.title}</h3>
              <p className="text-brand-slate/70 mt-1.5">{cat.blurb}</p>
            </div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {cat.tools.map((tool, i) => {
                const Icon = tool.icon;
                return (
                  <motion.div
                    key={tool.name}
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: i * 0.05 }}
                    className="group rounded-xl border border-brand-slate/20 bg-brand-white/50 p-5 hover:border-brand-violet/40 hover:bg-brand-white transition-all duration-300"
                  >
                    <div className="h-10 w-10 rounded-lg bg-brand-lavender border border-brand-violet/20 flex items-center justify-center mb-4 group-hover:bg-brand-violet/10 group-hover:border-brand-violet/40 transition-colors duration-300">
                      <Icon size={18} className="text-brand-violet group-hover:text-brand-violet transition-colors duration-300" />
                    </div>
                    <h4 className="text-brand-navy font-medium mb-1.5">{tool.name}</h4>
                    <p className="text-sm text-brand-slate/70 leading-relaxed">{tool.desc}</p>
                  </motion.div>
                );
              })}
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
    </section>
  );
}
