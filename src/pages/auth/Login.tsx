import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuth } from '@/context/AuthContext';
import { brand } from '@/config/brand';
import { Sparkles, Loader2, Eye, EyeOff, ArrowRight } from 'lucide-react';
import { toast } from 'sonner';
import { motion } from 'framer-motion';
import { isSupabaseConfigured } from '@/lib/supabase';

const schema = z.object({
  email: z.string().email('Enter a valid email'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});
type FormData = z.infer<typeof schema>;

export default function Login() {
  const { signIn, signInWithGoogle } = useAuth();
  const navigate = useNavigate();
  const [showPw, setShowPw] = useState(false);
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormData>({ resolver: zodResolver(schema) });

  const onSubmit = async (data: FormData) => {
    try {
      await signIn(data.email, data.password);
      navigate('/dashboard');
    } catch (e: unknown) {
      toast.error((e as Error).message || 'Sign in failed');
    }
  };

  return (
    <div className="min-h-screen flex bg-background">
      {/* Left visual */}
      <div className="hidden lg:flex flex-col justify-between w-1/2 bg-gradient-to-br from-violet-950 via-purple-900 to-indigo-900 p-12 relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,rgba(139,92,246,0.3),transparent_60%)]" />
        <div className="relative">
          <div className="flex items-center gap-2 mb-16">
            <div className="h-8 w-8 rounded-lg bg-white/20 flex items-center justify-center">
              <Sparkles size={16} className="text-white" />
            </div>
            <span className="text-white font-bold">{brand.name}</span>
          </div>
          <blockquote className="text-white/90 text-xl font-light leading-relaxed max-w-sm">
            "We went from two articles a week to two a day — and our editor still approves every one."
          </blockquote>
          <p className="mt-4 text-white/50 text-sm">Priya Nandakumar, Content Lead</p>
        </div>
        <div className="relative flex gap-6 text-white/40 text-xs">
          <span>10M+ words generated</span>
          <span>•</span>
          <span>Trusted by 5,000+ creators</span>
        </div>
      </div>

      {/* Right form */}
      <div className="flex-1 flex items-center justify-center p-8">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}
          className="w-full max-w-sm">
          <div className="flex items-center gap-2 mb-8 lg:hidden">
            <div className="h-7 w-7 rounded-lg bg-primary flex items-center justify-center">
              <Sparkles size={14} className="text-white" />
            </div>
            <span className="font-bold">{brand.name}</span>
          </div>
          <h1 className="text-2xl font-bold mb-1">Welcome back</h1>
          <p className="text-muted-foreground text-sm mb-6">Log in to continue creating.</p>

          {!isSupabaseConfigured && (
            <div className="mb-4 p-3 rounded-lg bg-yellow-500/10 border border-yellow-500/30 text-yellow-600 dark:text-yellow-400 text-xs">
              ⚠️ Supabase not configured. Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to your .env file.
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <label className="block text-xs font-medium mb-1.5">Email</label>
              <input {...register('email')} type="email" placeholder="you@company.com"
                className="w-full h-10 px-3 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring transition-shadow" />
              {errors.email && <p className="text-xs text-destructive mt-1">{errors.email.message}</p>}
            </div>
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-medium">Password</label>
                <Link to="/forgot-password" className="text-xs text-primary hover:underline">Forgot password?</Link>
              </div>
              <div className="relative">
                <input {...register('password')} type={showPw ? 'text' : 'password'} placeholder="••••••••"
                  className="w-full h-10 px-3 pr-10 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring transition-shadow" />
                <button type="button" onClick={() => setShowPw(v => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                  {showPw ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
              {errors.password && <p className="text-xs text-destructive mt-1">{errors.password.message}</p>}
            </div>
            <button type="submit" disabled={isSubmitting || !isSupabaseConfigured}
              className="w-full h-10 rounded-lg bg-primary text-primary-foreground font-semibold flex items-center justify-center gap-2 hover:bg-primary/90 transition-colors disabled:opacity-50">
              {isSubmitting ? <Loader2 size={16} className="animate-spin" /> : <>Sign in <ArrowRight size={15} /></>}
            </button>
          </form>

          <div className="relative my-5">
            <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-border" /></div>
            <div className="relative flex justify-center text-xs text-muted-foreground bg-background px-2">or</div>
          </div>

          <button onClick={() => signInWithGoogle().catch(e => toast.error(e.message))}
            className="w-full h-10 rounded-lg border border-border hover:bg-accent flex items-center justify-center gap-2 text-sm font-medium transition-colors">
            <svg viewBox="0 0 24 24" className="h-4 w-4"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>
            Continue with Google
          </button>

          <p className="text-center text-sm text-muted-foreground mt-6">
            Don't have an account?{' '}
            <Link to="/signup" className="text-primary font-medium hover:underline">Sign up free</Link>
          </p>
        </motion.div>
      </div>
    </div>
  );
}
