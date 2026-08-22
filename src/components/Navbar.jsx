import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X, ArrowUpRight } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import Seal from "./Seal";

const links = [
  { href: "#features", label: "Features" },
  { href: "#workflow", label: "How it runs" },
  { href: "#pricing", label: "Pricing" },
  { href: "#faq", label: "FAQ" },
];

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={`fixed top-0 inset-x-0 z-50 transition-all duration-300 ${
        scrolled ? "bg-brand-cloud/85 backdrop-blur-md border-b border-brand-slate/20" : "bg-transparent border-b border-transparent"
      }`}
    >
      <nav className="max-w-7xl mx-auto flex items-center justify-between px-6 py-4">
        <Link to="/" className="flex items-center gap-2.5 group">
          <img src="/logo-dark.png" alt="Cogial Logo" className="h-8 w-auto object-contain" />
        </Link>

        <div className="hidden md:flex items-center gap-8">
          {links.map((l) => (
            <a key={l.href} href={l.href} className="text-sm text-brand-slate/80 hover:text-brand-violet transition-colors">
              {l.label}
            </a>
          ))}
        </div>

        <div className="hidden md:flex items-center gap-3">
          {user ? (
            <button
              onClick={() => navigate("/dashboard")}
              className="inline-flex items-center gap-1.5 rounded-full bg-brand-violet text-brand-white text-sm font-semibold px-4 py-2 hover:bg-brand-violet/90 transition-colors"
            >
              Dashboard <ArrowUpRight size={15} />
            </button>
          ) : (
            <>
              <Link to="/login" className="text-sm text-brand-slate/80 hover:text-brand-navy transition-colors px-3 py-2">
                Log in
              </Link>
              <Link
                to="/signup"
                className="inline-flex items-center gap-1.5 rounded-full bg-brand-violet text-brand-white text-sm font-semibold px-4 py-2 hover:bg-brand-violet/90 transition-colors"
              >
                Start free <ArrowUpRight size={15} />
              </Link>
            </>
          )}
        </div>

        <button className="md:hidden text-brand-navy" onClick={() => setOpen((o) => !o)} aria-label="Toggle menu">
          {open ? <X size={22} /> : <Menu size={22} />}
        </button>
      </nav>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="md:hidden overflow-hidden bg-brand-cloud border-b border-brand-slate/20"
          >
            <div className="px-6 py-4 flex flex-col gap-4">
              {links.map((l) => (
                <a key={l.href} href={l.href} onClick={() => setOpen(false)} className="text-brand-ink text-sm">
                  {l.label}
                </a>
              ))}
              <div className="flex gap-3 pt-2">
                {user ? (
                  <Link to="/dashboard" className="flex-1 text-center rounded-full bg-brand-violet text-brand-white text-sm font-semibold px-4 py-2">
                    Dashboard
                  </Link>
                ) : (
                  <>
                    <Link to="/login" className="flex-1 text-center rounded-full border border-brand-slate/30 text-brand-ink text-sm px-4 py-2">
                      Log in
                    </Link>
                    <Link to="/signup" className="flex-1 text-center rounded-full bg-brand-violet text-brand-white text-sm font-semibold px-4 py-2">
                      Start free
                    </Link>
                  </>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
