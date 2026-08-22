import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuth } from '@/context/AuthContext';
import { Loader2, Eye, EyeOff } from 'lucide-react';
import { toast } from 'sonner';
import { brand } from '@/config/brand';

const schema = z.object({
  password: z.string().min(8, 'Password must be at least 8 characters'),
  confirm: z.string(),
}).refine(d => d.password === d.confirm, { message: 'Passwords do not match', path: ['confirm'] });
type FormData = z.infer<typeof schema>;

export default function ResetPassword() {
  const { updatePassword } = useAuth();
  const navigate = useNavigate();
  const [showPw, setShowPw] = useState(false);
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormData>({ resolver: zodResolver(schema) });

  const onSubmit = async (data: FormData) => {
    try {
      await updatePassword(data.password);
      toast.success('Password updated!');
      navigate('/dashboard');
    } catch (e: unknown) {
      toast.error((e as Error).message || 'Failed to update password');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-8 bg-background">
      <div className="w-full max-w-sm">
        <h1 className="text-2xl font-bold mb-1">Set new password</h1>
        <p className="text-muted-foreground text-sm mb-6">Enter and confirm your new password.</p>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="block text-xs font-medium mb-1.5">New Password</label>
            <div className="relative">
              <input {...register('password')} type={showPw ? 'text' : 'password'} placeholder="Min 8 characters"
                className="w-full h-10 px-3 pr-10 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
              <button type="button" onClick={() => setShowPw(v => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                {showPw ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>
            {errors.password && <p className="text-xs text-destructive mt-1">{errors.password.message}</p>}
          </div>
          <div>
            <label className="block text-xs font-medium mb-1.5">Confirm Password</label>
            <input {...register('confirm')} type="password" placeholder="Repeat password"
              className="w-full h-10 px-3 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
            {errors.confirm && <p className="text-xs text-destructive mt-1">{errors.confirm.message}</p>}
          </div>
          <button type="submit" disabled={isSubmitting}
            className="w-full h-10 rounded-lg bg-primary text-primary-foreground font-semibold flex items-center justify-center gap-2 hover:bg-primary/90 disabled:opacity-50">
            {isSubmitting ? <Loader2 size={16} className="animate-spin" /> : 'Update password'}
          </button>
        </form>
      </div>
    </div>
  );
}
