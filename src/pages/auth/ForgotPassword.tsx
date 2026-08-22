import { Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuth } from '@/context/AuthContext';
import { brand } from '@/config/brand';
import { Sparkles, Loader2, ArrowLeft, Mail } from 'lucide-react';
import { toast } from 'sonner';
import { motion } from 'framer-motion';
import { useState } from 'react';

const schema = z.object({ email: z.string().email('Enter a valid email') });
type FormData = z.infer<typeof schema>;

export default function ForgotPassword() {
  const { resetPassword } = useAuth();
  const [sent, setSent] = useState(false);
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormData>({ resolver: zodResolver(schema) });

  const onSubmit = async (data: FormData) => {
    try {
      await resetPassword(data.email);
      setSent(true);
    } catch (e: unknown) {
      toast.error((e as Error).message || 'Failed to send reset email');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-8 bg-background">
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-sm">
        <div className="flex items-center gap-2 mb-8">
          <div className="h-7 w-7 rounded-lg bg-primary flex items-center justify-center">
            <Sparkles size={14} className="text-white" />
          </div>
          <span className="font-bold">{brand.name}</span>
        </div>
        {sent ? (
          <div className="text-center">
            <div className="h-12 w-12 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center mx-auto mb-4">
              <Mail size={22} className="text-green-600 dark:text-green-400" />
            </div>
            <h1 className="text-xl font-bold mb-2">Check your inbox</h1>
            <p className="text-muted-foreground text-sm mb-6">We've sent a password reset link to your email address.</p>
            <Link to="/login" className="text-primary hover:underline text-sm font-medium">Back to sign in</Link>
          </div>
        ) : (
          <>
            <h1 className="text-2xl font-bold mb-1">Reset password</h1>
            <p className="text-muted-foreground text-sm mb-6">Enter your email and we'll send a reset link.</p>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div>
                <label className="block text-xs font-medium mb-1.5">Email</label>
                <input {...register('email')} type="email" placeholder="you@company.com"
                  className="w-full h-10 px-3 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
                {errors.email && <p className="text-xs text-destructive mt-1">{errors.email.message}</p>}
              </div>
              <button type="submit" disabled={isSubmitting}
                className="w-full h-10 rounded-lg bg-primary text-primary-foreground font-semibold flex items-center justify-center gap-2 hover:bg-primary/90 transition-colors disabled:opacity-50">
                {isSubmitting ? <Loader2 size={16} className="animate-spin" /> : 'Send reset link'}
              </button>
            </form>
            <Link to="/login" className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mt-4">
              <ArrowLeft size={14} /> Back to sign in
            </Link>
          </>
        )}
      </motion.div>
    </div>
  );
}
