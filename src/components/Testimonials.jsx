import { motion } from "framer-motion";
import { Quote } from "lucide-react";
import { testimonials } from "../data/pricing";

export default function Testimonials() {
  return (
    <section className="py-28 px-6">
      <div className="max-w-7xl mx-auto">
        <div className="max-w-2xl mb-14">
          <span className="text-xs font-mono uppercase tracking-wide text-brand-violet">On the record</span>
          <h2 className="font-heading text-4xl sm:text-5xl mt-3 text-brand-navy text-balance">
            What our users achieve.
          </h2>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {testimonials.map((t, i) => (
            <motion.div
              key={t.name}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.3 }}
              transition={{ duration: 0.5, delay: i * 0.12 }}
              className="rounded-2xl border border-brand-slate/20 bg-brand-white/50 p-7"
            >
              <Quote size={22} className="text-brand-violet/60 mb-4" />
              <p className="text-brand-ink leading-relaxed mb-6">"{t.quote}"</p>
              <div>
                <p className="text-sm font-medium text-brand-navy">{t.name}</p>
                <p className="text-xs text-brand-slate/60 mt-0.5">{t.role}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
