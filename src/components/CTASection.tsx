import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { ArrowUpRight } from "lucide-react";
import Seal from "./Seal";

export default function CTASection() {
  return (
    <section className="py-28 px-6">
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.4 }}
        transition={{ duration: 0.6 }}
        className="max-w-5xl mx-auto rounded-3xl border border-brand-violet/30 bg-gradient-to-br from-ink-800 to-ink-900 p-12 sm:p-16 text-center relative overflow-hidden"
      >
        <div
          className="absolute -bottom-24 -right-24 w-72 h-72 rounded-full opacity-20 blur-3xl pointer-events-none"
          style={{ background: "radial-gradient(circle, #3F9D8F 0%, transparent 70%)" }}
        />
        <Seal size={48} className="mx-auto mb-6" />
        <h2 className="font-heading text-4xl sm:text-5xl text-brand-navy text-balance max-w-2xl mx-auto">
          Your next article is one keyword away.
        </h2>
        <p className="mt-4 text-brand-slate/75 max-w-xl mx-auto">
          Start on the free tier, no card required. Upgrade the moment your queue outgrows it.
        </p>
        <Link
          to="/signup"
          className="inline-flex items-center gap-2 mt-8 rounded-full bg-brand-violet text-brand-white font-semibold px-7 py-3.5 hover:bg-brand-violet/90 transition-all hover:-translate-y-0.5"
        >
          Start free <ArrowUpRight size={18} />
        </Link>
      </motion.div>
    </section>
  );
}
