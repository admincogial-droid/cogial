import Navbar from "@/components/Navbar";
import Features from "@/components/Features";
import Pricing from "@/components/Pricing";
import FAQ from "@/components/FAQ";
import CTASection from "@/components/CTASection";
import Footer from "@/components/Footer";
import { Link } from "react-router-dom";
import { useState } from "react";
import { toast } from "sonner";
import { Check, Mail, Send, ShieldCheck, HelpCircle, FileText, Sparkles, BookOpen } from "lucide-react";

export function FeaturesPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar />
      <main className="pt-12">
        <div className="max-w-4xl mx-auto px-6 text-center mb-12">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-primary/10 text-primary mb-4">
            <Sparkles size={12} /> Complete Feature Spectrum
          </span>
          <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight mb-4">
            Engineered for Modern Content Teams
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            From automated research and brand voice adaptation to multi-channel distribution and SEO intelligence.
          </p>
        </div>
        <Features />
        <CTASection />
      </main>
      <Footer />
    </div>
  );
}

export function PricingPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar />
      <main className="pt-12">
        <div className="max-w-4xl mx-auto px-6 text-center mb-6">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-primary/10 text-primary mb-4">
            Transparent Pricing
          </span>
          <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight mb-4">
            Predictable Plans for Every Creator
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            No surprise token charges. Unused credits roll over. Cancel or switch anytime.
          </p>
        </div>
        <Pricing />
        <FAQ />
        <CTASection />
      </main>
      <Footer />
    </div>
  );
}

export function FAQPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar />
      <main className="pt-12 pb-16">
        <FAQ />
        <CTASection />
      </main>
      <Footer />
    </div>
  );
}

export function AboutPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar />
      <main className="pt-16 pb-24">
        <div className="max-w-3xl mx-auto px-6">
          <span className="text-xs font-mono uppercase tracking-widest text-primary font-bold">About PressLine</span>
          <h1 className="text-4xl font-extrabold tracking-tight mt-2 mb-6">The Intelligence Engine for Modern Publishing</h1>
          
          <div className="prose prose-neutral dark:prose-invert space-y-6 text-muted-foreground leading-relaxed text-sm sm:text-base">
            <p>
              PressLine was created to bridge the gap between raw generative models and publication-ready editorial excellence. Too many AI tools produce generic, repetitive fluff that requires hours of human rewriting.
            </p>
            <p>
              Our platform operates on a strict editorial thesis:
            </p>
            <div className="grid sm:grid-cols-2 gap-4 my-8 not-prose">
              <div className="p-5 rounded-xl border border-border bg-card">
                <ShieldCheck size={20} className="text-primary mb-2" />
                <h3 className="font-semibold text-sm text-foreground mb-1">Zero Hallucinations</h3>
                <p className="text-xs text-muted-foreground">Deterministic constraints prevent fabricated claims, fake studies, or invented statistics.</p>
              </div>
              <div className="p-5 rounded-xl border border-border bg-card">
                <Sparkles size={20} className="text-primary mb-2" />
                <h3 className="font-semibold text-sm text-foreground mb-1">Brand Voice Fidelity</h3>
                <p className="text-xs text-muted-foreground">Every piece of generated content conforms to your tone, style rules, and vocabulary guidelines.</p>
              </div>
            </div>
            <p>
              Whether you are an independent affiliate marketer, a high-velocity SEO agency, or an enterprise content marketing team, PressLine equips you with the end-to-end tooling required to brainstorm, write, optimize, and distribute with confidence.
            </p>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}

export function ContactPage() {
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', subject: '', message: '' });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.email || !form.message) {
      toast.error('Please fill in all required fields');
      return;
    }
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setSubmitted(true);
      toast.success('Message sent! Our team will respond shortly.');
    }, 600);
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar />
      <main className="pt-16 pb-24">
        <div className="max-w-xl mx-auto px-6">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-extrabold tracking-tight mb-2">Get in Touch</h1>
            <p className="text-muted-foreground text-sm">Have questions about PressLine, API integration, or enterprise plans? We’re here to help.</p>
          </div>

          {submitted ? (
            <div className="p-8 rounded-2xl border border-border bg-card text-center space-y-3">
              <div className="h-12 w-12 rounded-full bg-green-500/10 text-green-500 flex items-center justify-center mx-auto">
                <Check size={24} />
              </div>
              <h2 className="text-lg font-bold">Message Received</h2>
              <p className="text-sm text-muted-foreground">Thank you for reaching out. We will review your message and reply to {form.email} within 24 hours.</p>
              <button onClick={() => setSubmitted(false)} className="text-xs text-primary underline mt-2">Send another message</button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="p-6 rounded-2xl border border-border bg-card space-y-4">
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold mb-1">Your Name *</label>
                  <input
                    type="text"
                    required
                    value={form.name}
                    onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                    className="w-full h-9 px-3 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                    placeholder="Jane Doe"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1">Work Email *</label>
                  <input
                    type="email"
                    required
                    value={form.email}
                    onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                    className="w-full h-9 px-3 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                    placeholder="jane@company.com"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold mb-1">Subject</label>
                <input
                  type="text"
                  value={form.subject}
                  onChange={e => setForm(f => ({ ...f, subject: e.target.value }))}
                  className="w-full h-9 px-3 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                  placeholder="Inquiry or feedback topic"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold mb-1">Message *</label>
                <textarea
                  required
                  rows={4}
                  value={form.message}
                  onChange={e => setForm(f => ({ ...f, message: e.target.value }))}
                  className="w-full p-3 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring resize-none"
                  placeholder="How can we help your team?"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full h-10 rounded-lg bg-primary text-primary-foreground font-semibold text-sm hover:bg-primary/90 transition-colors flex items-center justify-center gap-2"
              >
                {loading ? 'Sending…' : <><Send size={14} /> Send Message</>}
              </button>
            </form>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}

export function PrivacyPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar />
      <main className="pt-16 pb-24">
        <div className="max-w-3xl mx-auto px-6">
          <h1 className="text-3xl font-extrabold tracking-tight mb-2">Privacy Policy</h1>
          <p className="text-xs text-muted-foreground mb-8">Last updated: September 2026</p>
          <div className="space-y-6 text-sm text-muted-foreground leading-relaxed">
            <h2 className="text-base font-bold text-foreground">1. Data Ownership & Protection</h2>
            <p>Your inputs, prompts, brand voice guidelines, and generated content belong entirely to you. PressLine does not claim ownership of user-generated content or utilize proprietary customer content to train public AI foundation models.</p>
            <h2 className="text-base font-bold text-foreground">2. Security & Transmission</h2>
            <p>All client communications with Supabase and Edge Functions are encrypted in transit via TLS 1.3. Database storage is governed by Row Level Security (RLS) enforcing strict tenant and workspace boundaries.</p>
            <h2 className="text-base font-bold text-foreground">3. External AI Gateways</h2>
            <p>Generation requests are processed securely through OpenRouter endpoints using encrypted server-side requests. Client browsers never receive or expose secret credentials.</p>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}

export function TermsPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar />
      <main className="pt-16 pb-24">
        <div className="max-w-3xl mx-auto px-6">
          <h1 className="text-3xl font-extrabold tracking-tight mb-2">Terms of Service</h1>
          <p className="text-xs text-muted-foreground mb-8">Last updated: September 2026</p>
          <div className="space-y-6 text-sm text-muted-foreground leading-relaxed">
            <h2 className="text-base font-bold text-foreground">1. Acceptance of Terms</h2>
            <p>By creating an account or accessing PressLine, you agree to abide by these Terms of Service and all applicable copyright and fair use regulations.</p>
            <h2 className="text-base font-bold text-foreground">2. Acceptable Use</h2>
            <p>Users may not generate abusive, unlawful, defamatory, or harmful material. Automated scraping, reverse engineering, or attempting to bypass workspace rate limits is strictly prohibited.</p>
            <h2 className="text-base font-bold text-foreground">3. Credit Consumption</h2>
            <p>AI generations consume workspace credits according to the operation type. Credits are deducted atomically and refunded in the event of validated upstream API failure.</p>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}

export function RefundPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar />
      <main className="pt-16 pb-24">
        <div className="max-w-3xl mx-auto px-6">
          <h1 className="text-3xl font-extrabold tracking-tight mb-2">Refund Policy</h1>
          <p className="text-xs text-muted-foreground mb-8">Last updated: September 2026</p>
          <div className="space-y-6 text-sm text-muted-foreground leading-relaxed">
            <h2 className="text-base font-bold text-foreground">1. 14-Day Money-Back Guarantee</h2>
            <p>If you are dissatisfied with your PressLine subscription within the first 14 days of your initial purchase, contact our support team for a full refund of your subscription fee.</p>
            <h2 className="text-base font-bold text-foreground">2. Monthly & Annual Subscriptions</h2>
            <p>You can cancel recurring billing at any time from the Billing page. Cancellations take effect at the conclusion of the current billing cycle.</p>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}

export function BlogListPage() {
  const posts = [
    {
      slug: 'ai-content-workflows-2026',
      title: 'How High-Velocity Teams Scale Organic Content in 2026',
      excerpt: 'Moving past simple prompting: how structured data pipelines, brand voice constraints, and keyword clustering drive search growth.',
      date: 'Sep 12, 2026',
      readTime: '6 min read'
    },
    {
      slug: 'brand-voice-engineering',
      title: 'Engineering Deterministic Brand Voice in AI Systems',
      excerpt: 'Why generic models sound identical and how negative style rules and few-shot examples enforce unmistakable editorial tone.',
      date: 'Aug 28, 2026',
      readTime: '5 min read'
    },
    {
      slug: 'seo-topical-authority',
      title: 'Topical Authority vs Single-Keyword Targeting',
      excerpt: 'How clustering 100+ semantic keywords into comprehensive content silos outperforms isolated articles in search rankings.',
      date: 'Aug 15, 2026',
      readTime: '8 min read'
    }
  ];

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar />
      <main className="pt-16 pb-24">
        <div className="max-w-4xl mx-auto px-6">
          <div className="text-center mb-12">
            <span className="text-xs font-mono uppercase tracking-widest text-primary font-bold">PressLine Publication</span>
            <h1 className="text-4xl font-extrabold tracking-tight mt-2 mb-3">Insights, Guides & Strategy</h1>
            <p className="text-muted-foreground text-sm max-w-xl mx-auto">Tactical advice on AI publishing, semantic SEO, conversion copywriting, and editorial automation.</p>
          </div>

          <div className="grid gap-6">
            {posts.map(p => (
              <article key={p.slug} className="p-6 rounded-2xl border border-border bg-card hover:border-primary/40 transition-all group">
                <div className="flex items-center gap-3 text-xs text-muted-foreground mb-2">
                  <span>{p.date}</span>
                  <span>·</span>
                  <span>{p.readTime}</span>
                </div>
                <h2 className="text-xl font-bold text-foreground group-hover:text-primary transition-colors mb-2">
                  <Link to={`/blog/${p.slug}`}>{p.title}</Link>
                </h2>
                <p className="text-sm text-muted-foreground mb-4 leading-relaxed">{p.excerpt}</p>
                <Link to={`/blog/${p.slug}`} className="text-xs font-semibold text-primary hover:underline inline-flex items-center gap-1">
                  Read Article →
                </Link>
              </article>
            ))}
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}

export function BlogPostPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar />
      <main className="pt-16 pb-24">
        <div className="max-w-3xl mx-auto px-6">
          <Link to="/blog" className="text-xs text-muted-foreground hover:text-foreground mb-6 inline-block">← Back to Articles</Link>
          <div className="flex items-center gap-3 text-xs text-muted-foreground mb-3">
            <span>Published September 2026</span>
            <span>·</span>
            <span>6 min read</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight mb-6">
            How High-Velocity Teams Scale Organic Content in 2026
          </h1>
          <div className="prose prose-neutral dark:prose-invert space-y-5 text-muted-foreground leading-relaxed text-sm sm:text-base">
            <p>
              In the early days of generative AI, the competitive moat was simple access to language models. Today, foundation models are a utility commodity. The true differentiator in organic visibility is editorial orchestration.
            </p>
            <h3 className="text-lg font-bold text-foreground">1. Semantic Silos Over Fragmented Keywords</h3>
            <p>
              Search engines reward demonstrable subject matter authority. Rather than creating isolated 800-word articles for individual search terms, top growth teams map entire topic clusters—generating comprehensive pillar guides supported by detailed sub-topic articles.
            </p>
            <h3 className="text-lg font-bold text-foreground">2. Programmatic Brand Voice Injection</h3>
            <p>
              If your content sounds like default model output, readers disengage immediately. By establishing explicit brand voice parameters—including forbidden vocabulary, preferred phrasing, and targeted audience demographics—teams produce recognizable, authoritative content at scale.
            </p>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
