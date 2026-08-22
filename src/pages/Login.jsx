import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowUpRight, Loader2, AlertCircle } from "lucide-react";
import AuthLayout from "../components/AuthLayout";
import { useAuth } from "../context/AuthContext";

export default function Login() {
  const { signIn } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const onSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await signIn(form.email, form.password);
      navigate("/dashboard");
    } catch (err) {
      setError(err.message || "Couldn't sign you in — check your details and try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout
      title="Welcome back"
      subtitle="Log in to pick up your drafts where you left them."
      footer={
        <p className="text-sm text-brand-slate/70 mt-8">
          New to Cogial?{" "}
          <Link to="/signup" className="text-brand-violet hover:text-brass-300 font-medium">
            Start free
          </Link>
        </p>
      }
    >


      <form onSubmit={onSubmit} className="space-y-4">
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
          <div className="flex items-center justify-between mb-1.5">
            <label className="block text-xs font-mono uppercase tracking-wide text-brand-slate/70">Password</label>
            <a href="#" className="text-xs text-brand-violet hover:text-brass-300">Forgot?</a>
          </div>
          <input
            required
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            type="password"
            placeholder="••••••••"
            className="w-full rounded-lg border border-brand-slate/30 bg-brand-white px-3.5 py-2.5 text-sm text-brand-navy placeholder:text-paper-500/50 focus:border-brand-violet outline-none transition-colors"
          />
        </div>

        {error && <p className="text-sm text-rust-500">{error}</p>}

        <button
          type="submit"
          disabled={loading}
          className="w-full inline-flex items-center justify-center gap-2 rounded-full bg-brand-violet text-brand-white font-semibold px-5 py-3 hover:bg-brand-violet/90 transition-colors disabled:opacity-60"
        >
          {loading ? <Loader2 size={16} className="animate-spin" /> : <>Log in <ArrowUpRight size={16} /></>}
        </button>
      </form>
    </AuthLayout>
  );
}
