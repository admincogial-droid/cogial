import { Link } from "react-router-dom";
import Seal from "./Seal";
import { Send, Globe, Mail } from "lucide-react";

export default function Footer() {
  return (
    <footer className="border-t border-brand-slate/20 px-6 py-14">
      <div className="max-w-7xl mx-auto grid md:grid-cols-[1.4fr_1fr_1fr_1fr] gap-10">
        <div>
          <Link to="/" className="flex items-center gap-2.5 mb-4">
            <img src="/logo-dark.png" alt="Cogial Logo" className="h-7 w-auto object-contain" />
          </Link>
          <p className="text-sm text-brand-slate/65 max-w-xs leading-relaxed">
            The unified AI workspace for creators, students, professionals, marketers, developers and teams.
          </p>
          <div className="flex gap-4 mt-5 text-brand-slate/60">
            <a href="#" aria-label="Follow updates" className="hover:text-brand-violet transition-colors"><Send size={17} /></a>
            <a href="#" aria-label="Community" className="hover:text-brand-violet transition-colors"><Globe size={17} /></a>
            <a href="#" aria-label="Email us" className="hover:text-brand-violet transition-colors"><Mail size={17} /></a>
          </div>
        </div>

        <div>
          <p className="text-xs font-mono uppercase tracking-wide text-brand-slate mb-4">Product</p>
          <ul className="space-y-2.5 text-sm text-brand-slate/75">
            <li><a href="#features" className="hover:text-brand-navy transition-colors">Features</a></li>
            <li><a href="#pricing" className="hover:text-brand-navy transition-colors">Pricing</a></li>
            <li><a href="#workflow" className="hover:text-brand-navy transition-colors">How it works</a></li>
          </ul>
        </div>

        <div>
          <p className="text-xs font-mono uppercase tracking-wide text-paper-500 mb-4">Company</p>
          <ul className="space-y-2.5 text-sm text-brand-slate/75">
            <li><a href="#" className="hover:text-brand-navy transition-colors">About</a></li>
            <li><a href="#" className="hover:text-brand-navy transition-colors">Careers</a></li>
            <li><a href="#" className="hover:text-brand-navy transition-colors">Contact</a></li>
          </ul>
        </div>

        <div>
          <p className="text-xs font-mono uppercase tracking-wide text-paper-500 mb-4">Legal</p>
          <ul className="space-y-2.5 text-sm text-brand-slate/75">
            <li><a href="#" className="hover:text-brand-navy transition-colors">Privacy</a></li>
            <li><a href="#" className="hover:text-brand-navy transition-colors">Terms</a></li>
            <li><a href="#" className="hover:text-brand-navy transition-colors">Refunds</a></li>
          </ul>
        </div>
      </div>

      <div className="max-w-7xl mx-auto mt-12 pt-6 border-t border-brand-slate/20 text-xs text-paper-500/60">
        © {new Date().getFullYear()} Cogial. All rights reserved.
      </div>
    </footer>
  );
}
