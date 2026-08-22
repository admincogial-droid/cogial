import { motion } from "framer-motion";
import { workflowSteps } from "../data/features";

export default function Workflow() {
  return (
    <section id="workflow" className="relative py-28 px-6 bg-brand-white border-y border-brand-slate/20">
      <div className="max-w-7xl mx-auto">
        <div className="max-w-2xl mb-16">
          <span className="text-xs font-mono uppercase tracking-wide text-brand-violet">How it works</span>
          <h2 className="font-heading text-4xl sm:text-5xl mt-3 text-brand-navy text-balance">
            Built for your workflow.
          </h2>
        </div>

        <div className="relative">
          <div className="hidden md:block absolute top-11 left-0 right-0 h-px bg-ink-700" />
          <motion.div
            initial={{ scaleX: 0 }}
            whileInView={{ scaleX: 1 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ duration: 1.2, ease: "easeInOut" }}
            style={{ transformOrigin: "left" }}
            className="hidden md:block absolute top-11 left-0 right-0 h-px bg-gradient-to-r from-brass-500 via-teal-500 to-brass-500"
          />

          <div className="grid md:grid-cols-4 gap-10 md:gap-6 relative">
            {workflowSteps.map((s, i) => (
              <motion.div
                key={s.step}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.4 }}
                transition={{ duration: 0.5, delay: i * 0.15 }}
                className="relative"
              >
                <div className="h-[88px] w-[88px] rounded-full border-2 border-brand-violet bg-brand-cloud flex items-center justify-center mb-6 relative z-10">
                  <span className="font-heading text-lg text-brand-violet">{s.step}</span>
                </div>
                <h3 className="font-heading text-xl text-brand-navy mb-2">{s.title}</h3>
                <p className="text-sm text-brand-slate/75 leading-relaxed">{s.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
