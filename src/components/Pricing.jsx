import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { Check } from "lucide-react";
import { pricingTiers } from "../data/pricing";

export default function Pricing() {
  return (
    <section id="pricing" className="py-28 px-6 bg-brand-white border-y border-brand-slate/20">
      <div className="max-w-7xl mx-auto">
        <div className="max-w-2xl mb-14">
          <span className="text-xs font-mono uppercase tracking-wide text-brand-violet">Pricing</span>
          <h2 className="font-heading text-4xl sm:text-5xl mt-3 text-brand-navy text-balance">
            Affordable scaling for everyone.
          </h2>
          <p className="mt-4 text-brand-slate/75 leading-relaxed">
            Every plan includes access to our intelligent workspace. Choose the capacity that fits your content goals. All payments are securely processed by Paddle.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {pricingTiers.map((tier, i) => (
            <motion.div
              key={tier.name}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.3 }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
              className={`relative rounded-2xl p-7 flex flex-col ${
                tier.highlight
                  ? "border-2 border-brand-violet bg-brand-white shadow-card shadow-brand-violet/10 md:-translate-y-3"
                  : "border border-brand-slate/20 bg-brand-cloud"
              }`}
            >
              {tier.highlight && (
                <span className="absolute -top-3 left-7 rounded-full bg-brand-violet text-brand-white text-xs font-semibold px-3 py-1">
                  Most run
                </span>
              )}
              <h3 className="font-heading text-xl text-brand-navy">{tier.name}</h3>
              <p className="text-sm text-brand-slate/70 mt-1.5 mb-6">{tier.tagline}</p>
              <div className="flex items-baseline gap-1 mb-6">
                <span className="font-heading text-4xl text-brand-navy">${tier.price}</span>
                <span className="text-brand-slate/60 text-sm">/{tier.period}</span>
              </div>
              <ul className="space-y-3 mb-8 flex-1">
                {tier.features.map((f) => (
                  <li key={f} className="flex items-start gap-2.5 text-sm text-brand-slate/85">
                    <Check size={16} className="text-brand-violet mt-0.5 shrink-0" />
                    {f}
                  </li>
                ))}
              </ul>
              <Link
                to="/signup"
                className={`text-center rounded-full px-5 py-3 text-sm font-semibold transition-colors ${
                  tier.highlight
                    ? "bg-brand-violet text-brand-white hover:bg-brand-violet/90"
                    : "border border-brand-slate/30 text-brand-navy hover:border-brand-violet/50"
                }`}
              >
                {tier.cta}
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
