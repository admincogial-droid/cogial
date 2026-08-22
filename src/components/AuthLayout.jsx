import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import Seal from "./Seal";

export default function AuthLayout({ title, subtitle, children, footer }) {
  return (
    <div className="min-h-screen grid lg:grid-cols-2">
      <div className="hidden lg:flex flex-col justify-between p-12 bg-brand-white border-r border-brand-slate/20 relative overflow-hidden">
        <div
          className="absolute -top-32 -left-32 w-96 h-96 rounded-full opacity-[0.12] blur-3xl pointer-events-none"
          style={{ background: "radial-gradient(circle, #E8A33D 0%, transparent 65%)" }}
        />
        <Link to="/" className="flex items-center gap-2.5 relative">
          <Seal size={30} />
          <span className="font-heading text-xl text-brand-navy">Cogial</span>
        </Link>

        <motion.blockquote
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="relative"
        >
          <p className="font-heading text-3xl text-brand-navy leading-snug text-balance">
            "We went from two articles a week to two a day — and the editor still signs off on every one."
          </p>
          <footer className="mt-4 text-sm text-brand-slate/70">Priya Nandakumar, Content Lead</footer>
        </motion.blockquote>

        <p className="text-xs font-mono text-paper-500/50 relative">© {new Date().getFullYear()} Cogial</p>
      </div>

      <div className="flex items-center justify-center p-8 sm:p-12">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-sm"
        >
          <Link to="/" className="lg:hidden flex items-center gap-2.5 mb-10">
            <Seal size={28} />
            <span className="font-heading text-lg text-brand-navy">Cogial</span>
          </Link>

          <h1 className="font-heading text-3xl text-brand-navy mb-2">{title}</h1>
          <p className="text-sm text-brand-slate/70 mb-8">{subtitle}</p>

          {children}

          {footer}
        </motion.div>
      </div>
    </div>
  );
}
