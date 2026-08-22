import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus } from "lucide-react";
import { faqs } from "../data/pricing";

export default function FAQ() {
  const [openIndex, setOpenIndex] = useState(0);

  return (
    <section id="faq" className="py-28 px-6 bg-brand-white border-t border-brand-slate/20">
      <div className="max-w-3xl mx-auto">
        <div className="mb-14">
          <span className="text-xs font-mono uppercase tracking-wide text-brand-violet">Questions</span>
          <h2 className="font-heading text-4xl sm:text-5xl mt-3 text-brand-navy text-balance">
            Before you start.
          </h2>
        </div>

        <div className="divide-y divide-ink-700 border-t border-b border-brand-slate/20">
          {faqs.map((f, i) => {
            const isOpen = openIndex === i;
            return (
              <div key={f.q}>
                <button
                  onClick={() => setOpenIndex(isOpen ? -1 : i)}
                  className="w-full flex items-center justify-between gap-4 py-5 text-left"
                >
                  <span className="text-brand-navy font-medium">{f.q}</span>
                  <motion.span animate={{ rotate: isOpen ? 45 : 0 }} transition={{ duration: 0.25 }} className="shrink-0 text-brand-violet">
                    <Plus size={20} />
                  </motion.span>
                </button>
                <AnimatePresence initial={false}>
                  {isOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3 }}
                      className="overflow-hidden"
                    >
                      <p className="text-brand-slate/75 leading-relaxed pb-5 pr-8">{f.a}</p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
