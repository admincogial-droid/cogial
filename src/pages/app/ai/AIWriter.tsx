import { useState } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { useWorkspace } from '@/context/WorkspaceContext';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { Loader2, Sparkles, Copy, Check, RefreshCw, Save } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { motion, AnimatePresence } from 'framer-motion';
import { isSupabaseConfigured } from '@/lib/supabase';

const schema = z.object({
  topic: z.string().min(3, 'Enter a topic or keyword'),
  tone: z.string().default('professional'),
  language: z.string().default('en'),
  audience: z.string().default(''),
  length: z.enum(['short', 'medium', 'long']).default('medium'),
  instructions: z.string().default(''),
});
type FormData = z.infer<typeof schema>;

const tones = ['professional', 'casual', 'friendly', 'authoritative', 'conversational', 'persuasive'];
const languages = [
  { code: 'en', label: 'English' }, { code: 'es', label: 'Spanish' },
  { code: 'fr', label: 'French' }, { code: 'de', label: 'German' },
  { code: 'pt', label: 'Portuguese' }, { code: 'it', label: 'Italian' },
  { code: 'hi', label: 'Hindi' },
];
const tools = [
  { id: 'article', label: 'Blog Article', desc: 'Full SEO-optimized article' },
  { id: 'intro', label: 'Introduction', desc: 'Compelling opening paragraph' },
  { id: 'outline', label: 'Article Outline', desc: 'Structured content plan' },
  { id: 'rewrite', label: 'Rewrite', desc: 'Improve existing content' },
  { id: 'conclusion', label: 'Conclusion', desc: 'Strong closing paragraph' },
  { id: 'faq', label: 'FAQ Section', desc: 'Common questions & answers' },
  { id: 'meta', label: 'Meta Tags', desc: 'SEO title & description' },
  { id: 'social', label: 'Social Post', desc: 'Engaging social content' },
];

export default function AIWriter() {
  const { user } = useAuth();
  const { workspace, credits } = useWorkspace();
  const [activeTool, setActiveTool] = useState('article');
  const [output, setOutput] = useState('');
  const [copied, setCopied] = useState(false);
  const [generating, setGenerating] = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm({
    resolver: zodResolver(schema),
    defaultValues: { topic: '', tone: 'professional', language: 'en', audience: '', length: 'medium' as const, instructions: '' },
  });

  const generate = async (data: FormData) => {
    if (!workspace || !user) return;
    if (credits <= 0) { toast.error('No credits remaining. Upgrade your plan.'); return; }
    if (!isSupabaseConfigured) { toast.error('Supabase not configured. Add credentials to .env'); return; }

    setGenerating(true);
    setOutput('');

    try {
      // Create generation record
      const { data: gen, error: genErr } = await supabase.from('generations').insert({
        workspace_id: workspace.id, user_id: user.id, type: activeTool,
        provider: 'openai', model: 'gpt-4o-mini', prompt_version: 'v1',
        credits_used: 1, status: 'processing',
      }).select().single();

      if (genErr) throw genErr;

      // Call edge function
      const { data: result, error: fnErr } = await supabase.functions.invoke('ai-generate', {
        body: { type: activeTool, topic: data.topic, tone: data.tone, language: data.language,
          audience: data.audience, length: data.length, instructions: data.instructions,
          generationId: gen.id, workspaceId: workspace.id },
      });

      if (fnErr || !result?.success) {
        // Update generation as failed
        await supabase.from('generations').update({ status: 'failed', error: fnErr?.message ?? 'Generation failed' }).eq('id', gen.id);
        throw new Error(result?.error?.message ?? fnErr?.message ?? 'AI generation failed');
      }

      setOutput(result.data.content);
      await supabase.from('generations').update({
        status: 'completed', completed_at: new Date().toISOString(),
        output_tokens: result.data.output_tokens ?? null,
      }).eq('id', gen.id);
      toast.success('Content generated!');
    } catch (e: unknown) {
      const msg = (e as Error).message;
      if (msg.includes('not configured') || msg.includes('AI provider')) {
        setOutput('⚠️ AI provider not configured.\n\nTo enable real AI generation:\n1. Add your OPENAI_API_KEY (or GEMINI_API_KEY) to Supabase Edge Function secrets\n2. Deploy the ai-generate Edge Function\n3. See README.md for setup instructions');
        toast.warning('AI provider not configured — see output for setup steps');
      } else {
        toast.error(msg || 'Generation failed');
      }
    } finally {
      setGenerating(false);
    }
  };

  const copy = async () => {
    await navigator.clipboard.writeText(output);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const save = async () => {
    if (!output || !workspace || !user) return;
    const { error } = await supabase.from('contents').insert({
      workspace_id: workspace.id, user_id: user.id,
      title: `${activeTool} — ${new Date().toLocaleDateString()}`,
      type: activeTool, status: 'draft', body: output,
      word_count: output.split(/\s+/).length,
    });
    if (error) toast.error('Failed to save'); else toast.success('Saved to content library');
  };

  return (
    <DashboardLayout>
      <div className="max-w-7xl">
        <div className="mb-6">
          <h1 className="text-2xl font-bold">AI Writer</h1>
          <p className="text-muted-foreground text-sm mt-1">Select a tool, enter your topic, and generate.</p>
        </div>

        {/* Tool Selector */}
        <div className="flex gap-2 flex-wrap mb-6">
          {tools.map(t => (
            <button key={t.id} onClick={() => setActiveTool(t.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                activeTool === t.id ? 'bg-primary text-primary-foreground border-primary' : 'border-border hover:border-primary/40 hover:bg-accent'
              }`}>
              {t.label}
            </button>
          ))}
        </div>

        <div className="grid lg:grid-cols-[340px_1fr] gap-6">
          {/* Settings Panel */}
          <form onSubmit={handleSubmit(generate)} className="rounded-xl border border-border bg-card p-5 space-y-4 h-fit">
            <div>
              <label className="block text-xs font-medium mb-1.5">Topic / Keyword <span className="text-destructive">*</span></label>
              <input {...register('topic')} placeholder="e.g. best espresso machines for home"
                className="w-full h-9 px-3 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
              {errors.topic && <p className="text-xs text-destructive mt-1">{errors.topic.message}</p>}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium mb-1.5">Tone</label>
                <select {...register('tone')} className="w-full h-9 px-2 rounded-lg border border-input bg-background text-xs focus:outline-none focus:ring-2 focus:ring-ring">
                  {tones.map(t => <option key={t} value={t} className="capitalize">{t.charAt(0).toUpperCase() + t.slice(1)}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium mb-1.5">Language</label>
                <select {...register('language')} className="w-full h-9 px-2 rounded-lg border border-input bg-background text-xs focus:outline-none focus:ring-2 focus:ring-ring">
                  {languages.map(l => <option key={l.code} value={l.code}>{l.label}</option>)}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium mb-1.5">Length</label>
              <div className="flex gap-2">
                {(['short', 'medium', 'long'] as const).map(l => (
                  <label key={l} className="flex-1 cursor-pointer">
                    <input {...register('length')} type="radio" value={l} className="sr-only" />
                    <div className={`text-center py-1.5 rounded-lg border text-xs font-medium transition-all ${
                      l === 'medium' ? 'border-primary bg-accent text-primary' : 'border-border hover:bg-accent'
                    }`}>
                      {l.charAt(0).toUpperCase() + l.slice(1)}
                    </div>
                  </label>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium mb-1.5">Target Audience (optional)</label>
              <input {...register('audience')} placeholder="e.g. home cooks, beginners"
                className="w-full h-9 px-3 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
            </div>

            <div>
              <label className="block text-xs font-medium mb-1.5">Additional Instructions (optional)</label>
              <textarea {...register('instructions')} rows={2} placeholder="Include specific points, style notes..."
                className="w-full px-3 py-2 rounded-lg border border-input bg-background text-sm resize-none focus:outline-none focus:ring-2 focus:ring-ring" />
            </div>

            <div className="flex items-center justify-between text-xs text-muted-foreground pt-1 border-t border-border">
              <span>Credits remaining: <strong className="text-foreground">{credits}</strong></span>
              <span>~1 credit per generation</span>
            </div>

            <button type="submit" disabled={generating || credits <= 0}
              className="w-full h-10 rounded-lg bg-primary text-primary-foreground font-semibold flex items-center justify-center gap-2 hover:bg-primary/90 disabled:opacity-50 transition-colors">
              {generating ? <><Loader2 size={15} className="animate-spin" /> Generating…</> : <><Sparkles size={15} /> Generate</>}
            </button>
          </form>

          {/* Output Panel */}
          <div className="rounded-xl border border-border bg-card flex flex-col min-h-[500px]">
            <div className="flex items-center justify-between px-5 py-3 border-b border-border">
              <span className="text-sm font-medium">Output</span>
              {output && (
                <div className="flex items-center gap-2">
                  <button onClick={copy} className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border border-border hover:bg-accent transition-colors">
                    {copied ? <Check size={12} className="text-green-500" /> : <Copy size={12} />}
                    {copied ? 'Copied' : 'Copy'}
                  </button>
                  <button onClick={save} className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border border-border hover:bg-accent transition-colors">
                    <Save size={12} /> Save
                  </button>
                  <button onClick={() => setOutput('')} className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border border-border hover:bg-accent transition-colors">
                    <RefreshCw size={12} /> Clear
                  </button>
                </div>
              )}
            </div>
            <div className="flex-1 p-5">
              {generating ? (
                <div className="flex flex-col items-center justify-center h-full text-center">
                  <Loader2 size={28} className="animate-spin text-primary mb-3" />
                  <p className="text-sm text-muted-foreground">Generating your content…</p>
                  <p className="text-xs text-muted-foreground mt-1">This usually takes 10–30 seconds</p>
                </div>
              ) : output ? (
                <AnimatePresence>
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="prose-editor text-sm leading-relaxed whitespace-pre-wrap h-full overflow-y-auto">
                    {output}
                  </motion.div>
                </AnimatePresence>
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground">
                  <Sparkles size={32} className="opacity-20 mb-3" />
                  <p className="text-sm">Fill in the settings and click Generate</p>
                  <p className="text-xs mt-1">Your content will appear here</p>
                </div>
              )}
            </div>
            {output && (
              <div className="px-5 py-2 border-t border-border text-xs text-muted-foreground flex items-center gap-4">
                <span>{output.split(/\s+/).filter(Boolean).length} words</span>
                <span>{output.length} characters</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
