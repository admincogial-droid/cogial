import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuth } from '@/context/AuthContext';
import { brand } from '@/config/brand';
import { Sparkles, Loader2, Eye, EyeOff, ArrowRight, Check } from 'lucide-react';
import { toast } from 'sonner';
import { motion } from 'framer-motion';
import { isSupabaseConfigured } from '@/lib/supabase';

const schema = z.object({
  fullName: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Enter a valid email'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
});
type FormData = z.infer<typeof schema>;

const perks = [
  '5 free AI generations to start',
  'No credit card required',
  'Cancel anytime',
];

export default function Signup() {
  const { signUp } = useAuth();
  const navigate = useNavigate();
  const [showPw, setShowPw] = useState(false);
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormData>({ resolver: zodResolver(schema) });

  const onSubmit = async (data: FormData) => {
    try {
      await signUp(data.email, data.password, data.fullName);
      toast.success('Account created! Check your email to confirm.');
      navigate('/onboarding');
    } catch (e: unknown) {
      toast.error((e as Error).message || 'Sign up failed');
    }
  };

  return (
    <div className="min-h-screen flex bg-background">
      <div className="hidden lg:flex flex-col justify-between w-1/2 bg-gradient-to-br from-violet-950 via-purple-900 to-indigo-900 p-12 relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_right,rgba(99,102,241,0.3),transparent_60%)]" />
        <div className="relative">
          <div className="flex items-center gap-2 mb-16">
            <div className="h-8 w-8 rounded-lg bg-white/20 flex items-center justify-center">
              <Sparkles size={16} className="text-white" />
            </div>
            <span className="text-white font-bold">{brand.name}</span>
          </div>
          <h2 className="text-white text-3xl font-bold mb-4 leading-snug">Your AI workspace for content, SEO and growth.</h2>
          <div className="space-y-3 mt-8">
            {perks.map(p => (
              <div key={p} className="flex items-center gap-3">
                <div className="h-5 w-5 rounded-full bg-green-400/20 flex items-center justify-center flex-shrink-0">
                  <Check size={12} className="text-green-400" />
                </div>
                <span className="text-white/80 text-sm">{p}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="relative text-white/30 text-xs">© {new Date().getFullYear()} {brand.companyName}</div>
      </div>

      <div className="flex-1 flex items-center justify-center p-8">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}
          className="w-full max-w-sm">
          <div className="flex items-center gap-2 mb-8 lg:hidden">
            <div className="h-7 w-7 rounded-lg bg-primary flex items-center justify-center">
              <Sparkles size={14} className="text-white" />
            </div>
            <span className="font-bold">{brand.name}</span>
          </div>
          <h1 className="text-2xl font-bold mb-1">Create your account</h1>
          <p className="text-muted-foreground text-sm mb-6">Start free, no credit card required.</p>

          {!isSupabaseConfigured && (
            <div className="mb-4 p-3 rounded-lg bg-yellow-500/10 border border-yellow-500/30 text-yellow-600 dark:text-yellow-400 text-xs">
              ⚠️ Supabase not configured. Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to your .env file.
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <label className="block text-xs font-medium mb-1.5">Full Name</label>
              <input {...register('fullName')} placeholder="Alex Johnson"
                className="w-full h-10 px-3 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring transition-shadow" />
              {errors.fullName && <p className="text-xs text-destructive mt-1">{errors.fullName.message}</p>}
            </div>
            <div>
              <label className="block text-xs font-medium mb-1.5">Email</label>
              <input {...register('email')} type="email" placeholder="you@company.com"
                className="w-full h-10 px-3 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring transition-shadow" />
              {errors.email && <p className="text-xs text-destructive mt-1">{errors.email.message}</p>}
            </div>
            <div>
              <label className="block text-xs font-medium mb-1.5">Password</label>
              <div className="relative">
                <input {...register('password')} type={showPw ? 'text' : 'password'} placeholder="Min 8 characters"
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
              {isSubmitting ? <Loader2 size={16} className="animate-spin" /> : <>Create account <ArrowRight size={15} /></>}
            </button>
          </form>

          <p className="text-center text-xs text-muted-foreground mt-4">
            By signing up you agree to our{' '}
            <Link to="/terms" className="underline">Terms</Link> and{' '}
            <Link to="/privacy" className="underline">Privacy Policy</Link>.
          </p>
          <p className="text-center text-sm text-muted-foreground mt-4">
            Already have an account?{' '}
            <Link to="/login" className="text-primary font-medium hover:underline">Sign in</Link>
          </p>
        </motion.div>
      </div>
    </div>
  );
}
