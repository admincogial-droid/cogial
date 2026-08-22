import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowUpRight, Loader2, AlertCircle } from "lucide-react";
import AuthLayout from "../components/AuthLayout";
import { useAuth } from "../context/AuthContext";

export default function Signup() {
  const { signUp } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);

  const onSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await signUp(form.email, form.password, form.name);
      setDone(true);
      setTimeout(() => navigate("/dashboard"), 900);
    } catch (err) {
      setError(err.message || "Something went wrong creating your account.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout
      title="Start free"
      subtitle="5 article credits a month, no card required."
      footer={
        <p className="text-sm text-brand-slate/70 mt-8">
          Already have an account?{" "}
          <Link to="/login" className="text-brand-violet hover:text-brass-300 font-medium">
            Log in
          </Link>
        </p>
      }
    >


      <form onSubmit={onSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-mono uppercase tracking-wide text-brand-slate/70 mb-1.5">Full name</label>
          <input
            required
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            type="text"
            placeholder="Ada Okafor"
            className="w-full rounded-lg border border-brand-slate/30 bg-brand-white px-3.5 py-2.5 text-sm text-brand-navy placeholder:text-paper-500/50 focus:border-brand-violet outline-none transition-colors"
          />
        </div>
        <div>
          <label className="block text-xs font-mono uppercase tracking-wide text-brand-slate/70 mb-1.5">Email</label>
          <input
            required
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            type="email"
            placeholder="you@studio.com"
            className="w-full rounded-lg border border-brand-slate/30 bg-brand-white px-3.5 py-2.5 text-sm text-brand-navy placeholder:text-paper-500/50 focus:border-brand-violet outline-none transition-colors"
          />
        </div>
        <div>
          <label className="block text-xs font-mono uppercase tracking-wide text-brand-slate/70 mb-1.5">Password</label>
          <input
            required
            minLength={6}
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            type="password"
            placeholder="At least 6 characters"
            className="w-full rounded-lg border border-brand-slate/30 bg-brand-white px-3.5 py-2.5 text-sm text-brand-navy placeholder:text-paper-500/50 focus:border-brand-violet outline-none transition-colors"
          />
        </div>

        {error && <p className="text-sm text-rust-500">{error}</p>}
        {done && <p className="text-sm text-brand-violet">Account created — taking you in…</p>}

        <button
          type="submit"
          disabled={loading}
          className="w-full inline-flex items-center justify-center gap-2 rounded-full bg-brand-violet text-brand-white font-semibold px-5 py-3 hover:bg-brand-violet/90 transition-colors disabled:opacity-60"
        >
          {loading ? <Loader2 size={16} className="animate-spin" /> : <>Create account <ArrowUpRight size={16} /></>}
        </button>
      </form>
    </AuthLayout>
  );
}
