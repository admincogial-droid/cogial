import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { useWorkspace } from '@/context/WorkspaceContext';
import { brand } from '@/config/brand';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, ArrowRight, Loader2, Check } from 'lucide-react';
import { toast } from 'sonner';

const useCases = [
  { id: 'blogger', label: 'Blogger / Writer', emoji: '✍️' },
  { id: 'affiliate', label: 'Affiliate Marketer', emoji: '🔗' },
  { id: 'agency', label: 'Agency / Freelancer', emoji: '🏢' },
  { id: 'seo', label: 'SEO Professional', emoji: '📈' },
  { id: 'ecommerce', label: 'E-Commerce', emoji: '🛒' },
  { id: 'other', label: 'Other', emoji: '💡' },
];

const goals = [
  'Write blog articles faster',
  'Rank higher on Google',
  'Scale affiliate content',
  'Automate publishing',
  'Build content for clients',
  'Grow organic traffic',
];

type Step = 'welcome' | 'usecase' | 'workspace' | 'goal' | 'done';

export default function Onboarding() {
  const { profile } = useAuth();
  const { createWorkspace } = useWorkspace();
  const navigate = useNavigate();
  const [step, setStep] = useState<Step>('welcome');
  const [useCase, setUseCase] = useState('');
  const [wsName, setWsName] = useState('');
  const [selectedGoals, setSelectedGoals] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  const toggleGoal = (g: string) => setSelectedGoals(p => p.includes(g) ? p.filter(x => x !== g) : [...p, g]);

  const finish = async () => {
    setLoading(true);
    try {
      if (wsName.trim()) await createWorkspace(wsName.trim());
      navigate('/dashboard');
    } catch (e: unknown) {
      toast.error((e as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const steps: Step[] = ['welcome', 'usecase', 'workspace', 'goal', 'done'];
  const stepIdx = steps.indexOf(step);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-8">
      <div className="w-full max-w-lg">
        {/* Progress */}
        <div className="flex gap-1.5 mb-8">
          {steps.map((s, i) => (
            <div key={s} className={`h-1 flex-1 rounded-full transition-all duration-500 ${i <= stepIdx ? 'bg-primary' : 'bg-border'}`} />
          ))}
        </div>

        <AnimatePresence mode="wait">
          {step === 'welcome' && (
            <motion.div key="welcome" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
              <div className="h-12 w-12 rounded-2xl bg-primary/10 flex items-center justify-center mb-6">
                <Sparkles className="text-primary" size={24} />
              </div>
              <h1 className="text-3xl font-bold mb-2">Welcome to {brand.name}, {profile?.full_name?.split(' ')[0] ?? 'there'}! 👋</h1>
              <p className="text-muted-foreground mb-8">Let's get your workspace ready in 60 seconds.</p>
              <button onClick={() => setStep('usecase')}
                className="flex items-center gap-2 h-11 px-6 rounded-xl bg-primary text-primary-foreground font-semibold hover:bg-primary/90 transition-colors">
                Get started <ArrowRight size={16} />
              </button>
            </motion.div>
          )}

          {step === 'usecase' && (
            <motion.div key="usecase" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
              <h2 className="text-2xl font-bold mb-1">How will you use {brand.name}?</h2>
              <p className="text-muted-foreground text-sm mb-6">We'll tailor your experience to match.</p>
              <div className="grid grid-cols-2 gap-3 mb-6">
                {useCases.map(uc => (
                  <button key={uc.id} onClick={() => setUseCase(uc.id)}
                    className={`flex items-center gap-3 p-4 rounded-xl border text-left transition-all ${useCase === uc.id ? 'border-primary bg-accent text-primary' : 'border-border hover:border-primary/50 hover:bg-accent/50'}`}>
                    <span className="text-xl">{uc.emoji}</span>
                    <span className="text-sm font-medium">{uc.label}</span>
                    {useCase === uc.id && <Check size={14} className="ml-auto text-primary" />}
                  </button>
                ))}
              </div>
              <button onClick={() => setStep('workspace')} disabled={!useCase}
                className="flex items-center gap-2 h-11 px-6 rounded-xl bg-primary text-primary-foreground font-semibold hover:bg-primary/90 disabled:opacity-50 transition-colors">
                Continue <ArrowRight size={16} />
              </button>
            </motion.div>
          )}

          {step === 'workspace' && (
            <motion.div key="workspace" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
              <h2 className="text-2xl font-bold mb-1">Name your workspace</h2>
              <p className="text-muted-foreground text-sm mb-6">This is where all your projects and content live.</p>
              <input value={wsName} onChange={e => setWsName(e.target.value)} placeholder="e.g. My Blog, Agency Content..."
                className="w-full h-11 px-4 rounded-xl border border-input bg-background text-sm mb-6 focus:outline-none focus:ring-2 focus:ring-ring" />
              <div className="flex gap-3">
                <button onClick={() => setStep('goal')} disabled={!wsName.trim()}
                  className="flex items-center gap-2 h-11 px-6 rounded-xl bg-primary text-primary-foreground font-semibold hover:bg-primary/90 disabled:opacity-50">
                  Continue <ArrowRight size={16} />
                </button>
                <button onClick={() => setStep('goal')} className="h-11 px-4 rounded-xl border border-border text-sm hover:bg-accent">
                  Skip
                </button>
              </div>
            </motion.div>
          )}

          {step === 'goal' && (
            <motion.div key="goal" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
              <h2 className="text-2xl font-bold mb-1">What are your content goals?</h2>
              <p className="text-muted-foreground text-sm mb-6">Select all that apply.</p>
              <div className="grid grid-cols-2 gap-2 mb-6">
                {goals.map(g => (
                  <button key={g} onClick={() => toggleGoal(g)}
                    className={`flex items-center gap-2 p-3 rounded-xl border text-left text-sm transition-all ${selectedGoals.includes(g) ? 'border-primary bg-accent text-primary' : 'border-border hover:border-primary/50'}`}>
                    {selectedGoals.includes(g) && <Check size={13} className="text-primary flex-shrink-0" />}
                    {g}
                  </button>
                ))}
              </div>
              <button onClick={finish} disabled={loading}
                className="flex items-center gap-2 h-11 px-6 rounded-xl bg-primary text-primary-foreground font-semibold hover:bg-primary/90 disabled:opacity-50">
                {loading ? <Loader2 size={16} className="animate-spin" /> : <>Go to dashboard <ArrowRight size={16} /></>}
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
