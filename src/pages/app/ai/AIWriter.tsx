import { useState, useEffect, useRef, useCallback } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { useWorkspace } from '@/context/WorkspaceContext';
import { useAuth } from '@/context/AuthContext';
import { useBrandVoices } from '@/hooks/useBrandVoices';
import { useProjects } from '@/hooks/useProjects';
import { generateAI } from '@/lib/ai';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import {
  Sparkles,
  Copy,
  Check,
  Save,
  Wand2,
  ListPlus,
  ChevronDown,
  Download,
  Send,
  Loader2,
  CheckCircle2,
} from 'lucide-react';

const CONTENT_TYPES = [
  { id: 'article', label: 'Blog Article', desc: 'Full-length SEO article' },
  { id: 'review', label: 'Product Review', desc: 'Detailed review with pros/cons' },
  { id: 'guide', label: 'How-To Guide', desc: 'Step-by-step instructional piece' },
  { id: 'listicle', label: 'Listicle', desc: 'Ranked or categorized list' },
  { id: 'newsletter', label: 'Newsletter', desc: 'Engaging email newsletter' },
  { id: 'case_study', label: 'Case Study', desc: 'Problem, solution, and results' },
  { id: 'faq', label: 'FAQ Section', desc: 'Questions with expert answers' },
];

const TONES = [
  'professional',
  'conversational',
  'authoritative',
  'persuasive',
  'friendly',
  'analytical',
  'educational',
];

const LANGUAGES = [
  { code: 'English', label: 'English' },
  { code: 'Spanish', label: 'Spanish' },
  { code: 'French', label: 'French' },
  { code: 'German', label: 'German' },
  { code: 'Portuguese', label: 'Portuguese' },
  { code: 'Italian', label: 'Italian' },
  { code: 'Dutch', label: 'Dutch' },
];

export default function AIWriter() {
  const { user } = useAuth();
  const { workspace, credits, refreshWorkspace } = useWorkspace();
  const { data: brandVoices = [] } = useBrandVoices(workspace?.id);
  const { data: projects = [] } = useProjects(workspace?.id);

  // Form Configuration
  const [contentType, setContentType] = useState('article');
  const [topic, setTopic] = useState('');
  const [title, setTitle] = useState('');
  const [primaryKeyword, setPrimaryKeyword] = useState('');
  const [secondaryKeywords, setSecondaryKeywords] = useState('');
  const [audience, setAudience] = useState('');
  const [tone, setTone] = useState('professional');
  const [language, setLanguage] = useState('English');
  const [length, setLength] = useState<'short' | 'medium' | 'long'>('medium');
  const [brandVoiceId, setBrandVoiceId] = useState('');
  const [projectId, setProjectId] = useState('');
  const [instructions, setInstructions] = useState('');

  // Editor State
  const [contentId, setContentId] = useState<string | null>(null);
  const [body, setBody] = useState('');
  const [generating, setGenerating] = useState(false);
  const [generationAction, setGenerationAction] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'unsaved' | 'error'>('idle');
  const [status, setStatus] = useState<'draft' | 'published'>('draft');

  // Autosave
  const autosaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastSavedBody = useRef<string>('');
  const lastSavedTitle = useRef<string>('');

  // Calculate word & read stats
  const wordCount = body.trim() ? body.trim().split(/\s+/).filter(Boolean).length : 0;
  const readingTime = Math.max(1, Math.ceil(wordCount / 200));

  // Save/Persist to Supabase
  const saveToDb = useCallback(
    async (isPublish = false, createVersion = false) => {
      if (!workspace || !user || !title.trim() && !body.trim()) return;

      setSaveStatus('saving');
      const publishStatus = isPublish ? 'published' : status;

      try {
        const payload = {
          workspace_id: workspace.id,
          user_id: user.id,
          title: title.trim() || `${contentType.toUpperCase()} — ${new Date().toLocaleDateString()}`,
          body,
          type: contentType,
          status: publishStatus,
          word_count: wordCount,
          reading_time: readingTime,
          character_count: body.length,
          project_id: projectId || null,
          primary_keyword: primaryKeyword || null,
          secondary_keywords: secondaryKeywords ? secondaryKeywords.split(',').map(k => k.trim()).filter(Boolean) : [],
          published_at: isPublish ? new Date().toISOString() : undefined,
          updated_at: new Date().toISOString(),
        };

        if (contentId) {
          const { error } = await supabase.from('contents').update(payload).eq('id', contentId);
          if (error) throw error;
        } else {
          const { data, error } = await supabase.from('contents').insert(payload).select('id').single();
          if (error) throw error;
          if (data) setContentId(data.id);
        }

        // Versioning on major saves
        if (createVersion && contentId && body.trim()) {
          const { data: latestVer } = await supabase
            .from('content_versions')
            .select('version_number')
            .eq('content_id', contentId)
            .order('version_number', { ascending: false })
            .limit(1)
            .single();

          const nextNum = (latestVer?.version_number ?? 0) + 1;
          await supabase.from('content_versions').insert({
            content_id: contentId,
            user_id: user.id,
            body,
            word_count: wordCount,
            version_number: nextNum,
          });
        }

        lastSavedBody.current = body;
        lastSavedTitle.current = title;
        setSaveStatus('saved');
        if (isPublish) {
          setStatus('published');
          toast.success('Article published to Content Library!');
        }
      } catch (err: unknown) {
        console.error('Save error:', err);
        setSaveStatus('error');
        toast.error('Failed to save document');
      }
    },
    [workspace, user, title, body, contentType, status, wordCount, readingTime, projectId, primaryKeyword, secondaryKeywords, contentId]
  );

  // Debounced Autosave (800ms)
  useEffect(() => {
    if (!title && !body) return;
    if (body === lastSavedBody.current && title === lastSavedTitle.current) return;

    setSaveStatus('unsaved');
    if (autosaveTimer.current) clearTimeout(autosaveTimer.current);

    autosaveTimer.current = setTimeout(() => {
      saveToDb(false, false);
    }, 800);

    return () => {
      if (autosaveTimer.current) clearTimeout(autosaveTimer.current);
    };
  }, [body, title, saveToDb]);

  // AI Full Article or Outline Generation
  const handleGenerate = async (generateOutlineOnly = false) => {
    if (!workspace) return toast.error('No active workspace selected');
    if (!topic.trim()) return toast.error('Please enter a topic or focus keywords');
    if (credits < 2) return toast.error(`Insufficient credits. You have ${credits}.`);

    setGenerating(true);
    setGenerationAction(generateOutlineOnly ? 'Generating outline...' : 'Generating article...');

    try {
      const promptInstructions = [
        instructions,
        primaryKeyword ? `Focus primary keyword: "${primaryKeyword}"` : '',
        secondaryKeywords ? `Secondary keywords: "${secondaryKeywords}"` : '',
        generateOutlineOnly ? 'GENERATE OUTLINE ONLY with clear sections and headings.' : '',
      ].filter(Boolean).join('\n');

      const result = await generateAI<string>({
        workspaceId: workspace.id,
        type: generateOutlineOnly ? 'outline' : contentType,
        topic,
        tone,
        language,
        audience,
        length,
        instructions: promptInstructions,
        brandVoiceId: brandVoiceId || undefined,
        creditCost: generateOutlineOnly ? 1 : (length === 'long' ? 3 : 2),
      });

      if (!title) {
        setTitle(topic.replace(/^["']|["']$/g, '').slice(0, 100));
      }

      setBody(result.content);
      toast.success(generateOutlineOnly ? 'Outline generated!' : 'Article drafted successfully!');
      await refreshWorkspace();
      setTimeout(() => saveToDb(false, true), 300);
    } catch (err: unknown) {
      toast.error((err as Error).message || 'Generation failed');
    } finally {
      setGenerating(false);
      setGenerationAction(null);
    }
  };

  // In-Editor AI Transformation Tools
  const transformContent = async (action: string, promptInstruction: string) => {
    if (!workspace) return;
    if (!body.trim()) return toast.error('Editor is empty. Write or generate content first.');
    if (credits < 1) return toast.error('Insufficient credits for transformation.');

    setGenerating(true);
    setGenerationAction(action);

    try {
      const result = await generateAI<string>({
        workspaceId: workspace.id,
        type: 'custom',
        userPrompt: `${promptInstruction}\n\nExisting Content:\n"""\n${body}\n"""`,
        creditCost: 1,
        brandVoiceId: brandVoiceId || undefined,
      });

      setBody(result.content);
      toast.success(`${action} applied!`);
      await refreshWorkspace();
    } catch (err: unknown) {
      toast.error((err as Error).message || 'Action failed');
    } finally {
      setGenerating(false);
      setGenerationAction(null);
    }
  };

  // Copy & Export
  const copyContent = async () => {
    await navigator.clipboard.writeText(`${title ? `# ${title}\n\n` : ''}${body}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
    toast.success('Copied to clipboard');
  };

  const exportText = (format: 'markdown' | 'txt' | 'html') => {
    let outputData = body;
    let filename = `${(title || 'article').toLowerCase().replace(/\s+/g, '-')}.${format === 'markdown' ? 'md' : format}`;

    if (format === 'html') {
      outputData = `<!DOCTYPE html><html><head><title>${title}</title></head><body><h1>${title}</h1>\n${body.split('\n\n').map(p => `<p>${p}</p>`).join('\n')}</body></html>`;
    } else if (format === 'markdown') {
      outputData = `# ${title}\n\n${body}`;
    }

    const blob = new Blob([outputData], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.click();
    URL.revokeObjectURL(url);
    toast.success(`Exported as ${format.toUpperCase()}`);
  };

  return (
    <DashboardLayout>
      <div className="max-w-[1600px] mx-auto space-y-5">
        {/* Top Action Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-border">
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-bold flex items-center gap-2">
              <Sparkles size={18} className="text-primary" /> AI Writer Studio
            </h1>
            <span className="text-xs px-2.5 py-0.5 rounded-full border border-border bg-card font-medium text-muted-foreground capitalize">
              {contentType.replace('_', ' ')}
            </span>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {/* Save Status Indicator */}
            <span className="text-xs text-muted-foreground mr-2 flex items-center gap-1.5">
              {saveStatus === 'saving' && <Loader2 size={12} className="animate-spin text-primary" />}
              {saveStatus === 'saved' && <CheckCircle2 size={12} className="text-green-500" />}
              {saveStatus === 'unsaved' && <span className="h-1.5 w-1.5 rounded-full bg-yellow-500" />}
              {saveStatus === 'saving'
                ? 'Autosaving…'
                : saveStatus === 'saved'
                ? 'All changes saved'
                : saveStatus === 'unsaved'
                ? 'Unsaved changes'
                : saveStatus === 'error'
                ? 'Save error'
                : ''}
            </span>

            {/* Quick Export / Copy */}
            <button
              onClick={copyContent}
              disabled={!body}
              className="h-8 px-2.5 rounded-lg border border-border text-xs font-medium hover:bg-accent flex items-center gap-1.5 disabled:opacity-40 transition-colors"
            >
              {copied ? <Check size={13} className="text-green-500" /> : <Copy size={13} />}
              {copied ? 'Copied' : 'Copy'}
            </button>

            <div className="relative group">
              <button
                disabled={!body}
                className="h-8 px-2.5 rounded-lg border border-border text-xs font-medium hover:bg-accent flex items-center gap-1 disabled:opacity-40 transition-colors"
              >
                <Download size={13} /> Export <ChevronDown size={11} />
              </button>
              <div className="absolute right-0 top-full mt-1 hidden group-hover:flex flex-col bg-popover border border-border rounded-lg shadow-lg py-1 w-32 z-30">
                <button onClick={() => exportText('markdown')} className="px-3 py-1.5 text-xs text-left hover:bg-accent">Markdown (.md)</button>
                <button onClick={() => exportText('txt')} className="px-3 py-1.5 text-xs text-left hover:bg-accent">Plain Text (.txt)</button>
                <button onClick={() => exportText('html')} className="px-3 py-1.5 text-xs text-left hover:bg-accent">HTML (.html)</button>
              </div>
            </div>

            <button
              onClick={() => saveToDb(false, true)}
              disabled={!body}
              className="h-8 px-3 rounded-lg border border-border text-xs font-medium hover:bg-accent flex items-center gap-1.5 transition-colors disabled:opacity-40"
            >
              <Save size={13} /> Save Version
            </button>

            <button
              onClick={() => saveToDb(true, true)}
              disabled={!body}
              className={`h-8 px-3.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-sm ${
                status === 'published'
                  ? 'bg-green-600 hover:bg-green-700 text-white'
                  : 'bg-primary hover:bg-primary/90 text-primary-foreground'
              }`}
            >
              <Send size={12} /> {status === 'published' ? 'Published' : 'Publish'}
            </button>
          </div>
        </div>

        {/* Studio Workspace Layout */}
        <div className="grid lg:grid-cols-[360px_1fr] gap-6 items-start">
          {/* Left Configuration Sidebar */}
          <div className="bg-card border border-border rounded-xl p-5 shadow-sm space-y-4 max-h-[85vh] overflow-y-auto">
            <div>
              <label className="block text-xs font-semibold mb-1.5">Content Type</label>
              <select
                value={contentType}
                onChange={e => setContentType(e.target.value)}
                className="w-full h-9 px-3 rounded-lg border border-input bg-background text-xs focus:ring-2 focus:ring-ring outline-none"
              >
                {CONTENT_TYPES.map(t => (
                  <option key={t.id} value={t.id}>{t.label} — {t.desc}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold mb-1.5">
                Topic / Concept <span className="text-destructive">*</span>
              </label>
              <textarea
                value={topic}
                onChange={e => setTopic(e.target.value)}
                placeholder="e.g. 10 Best Productivity Tools for Remote Teams in 2025"
                rows={3}
                className="w-full p-2.5 rounded-lg border border-input bg-background text-xs focus:ring-2 focus:ring-ring outline-none resize-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold mb-1">Primary Keyword</label>
                <input
                  value={primaryKeyword}
                  onChange={e => setPrimaryKeyword(e.target.value)}
                  placeholder="e.g. productivity tools"
                  className="w-full h-8 px-2.5 rounded-lg border border-input bg-background text-xs focus:ring-2 focus:ring-ring outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1">Secondary Keywords</label>
                <input
                  value={secondaryKeywords}
                  onChange={e => setSecondaryKeywords(e.target.value)}
                  placeholder="remote work, software"
                  className="w-full h-8 px-2.5 rounded-lg border border-input bg-background text-xs focus:ring-2 focus:ring-ring outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold mb-1">Tone</label>
                <select
                  value={tone}
                  onChange={e => setTone(e.target.value)}
                  className="w-full h-8 px-2 rounded-lg border border-input bg-background text-xs capitalize outline-none"
                >
                  {TONES.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1">Language</label>
                <select
                  value={language}
                  onChange={e => setLanguage(e.target.value)}
                  className="w-full h-8 px-2 rounded-lg border border-input bg-background text-xs outline-none"
                >
                  {LANGUAGES.map(l => <option key={l.code} value={l.code}>{l.label}</option>)}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold mb-1">Desired Length</label>
                <select
                  value={length}
                  onChange={e => setLength(e.target.value as any)}
                  className="w-full h-8 px-2 rounded-lg border border-input bg-background text-xs outline-none"
                >
                  <option value="short">Short (300-500w)</option>
                  <option value="medium">Medium (800-1200w)</option>
                  <option value="long">Long (1500-2500w)</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1">Brand Voice</label>
                <select
                  value={brandVoiceId}
                  onChange={e => setBrandVoiceId(e.target.value)}
                  className="w-full h-8 px-2 rounded-lg border border-input bg-background text-xs outline-none"
                >
                  <option value="">Default Brand Voice</option>
                  {brandVoices.map(bv => <option key={bv.id} value={bv.id}>{bv.name}</option>)}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold mb-1">Target Project</label>
              <select
                value={projectId}
                onChange={e => setProjectId(e.target.value)}
                className="w-full h-8 px-2 rounded-lg border border-input bg-background text-xs outline-none"
              >
                <option value="">No Project Assigned</option>
                {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold mb-1">Target Audience</label>
              <input
                value={audience}
                onChange={e => setAudience(e.target.value)}
                placeholder="e.g. SaaS founders and marketing managers"
                className="w-full h-8 px-2.5 rounded-lg border border-input bg-background text-xs focus:ring-2 focus:ring-ring outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold mb-1">Special Directives (Optional)</label>
              <textarea
                value={instructions}
                onChange={e => setInstructions(e.target.value)}
                placeholder="e.g. Include real case examples, avoid buzzwords"
                rows={2}
                className="w-full p-2 rounded-lg border border-input bg-background text-xs focus:ring-2 focus:ring-ring outline-none resize-none"
              />
            </div>

            {/* Generate Trigger Buttons */}
            <div className="pt-3 border-t border-border space-y-2">
              <button
                onClick={() => handleGenerate(false)}
                disabled={generating || !topic.trim()}
                className="w-full h-10 rounded-xl bg-primary text-primary-foreground font-semibold text-xs flex items-center justify-center gap-2 hover:bg-primary/90 disabled:opacity-50 transition-all shadow-sm"
              >
                {generating && generationAction?.includes('article') ? (
                  <><Loader2 size={14} className="animate-spin" /> Drafting Article…</>
                ) : (
                  <><Sparkles size={14} /> Write Full Article ({length === 'long' ? '3 credits' : '2 credits'})</>
                )}
              </button>

              <button
                onClick={() => handleGenerate(true)}
                disabled={generating || !topic.trim()}
                className="w-full h-8 rounded-lg border border-border text-xs font-medium hover:bg-accent flex items-center justify-center gap-1.5 disabled:opacity-50 transition-colors"
              >
                {generating && generationAction?.includes('outline') ? (
                  <><Loader2 size={12} className="animate-spin" /> Generating Outline…</>
                ) : (
                  <><ListPlus size={13} /> Generate Outline First (1 credit)</>
                )}
              </button>
            </div>
          </div>

          {/* Right Editor & Transformation Toolbar */}
          <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden flex flex-col min-h-[750px]">
            {/* Title Header */}
            <div className="p-4 border-b border-border bg-muted/20">
              <input
                value={title}
                onChange={e => setTitle(e.target.value)}
                placeholder="Untitled Article Title…"
                className="w-full text-lg sm:text-xl font-bold bg-transparent outline-none placeholder:text-muted-foreground/40"
              />
            </div>

            {/* In-Editor AI Transformation Toolbar */}
            <div className="px-4 py-2 border-b border-border bg-muted/30 flex items-center gap-1.5 flex-wrap text-xs">
              <span className="text-[11px] font-semibold text-muted-foreground mr-1 flex items-center gap-1">
                <Wand2 size={12} className="text-primary" /> AI Refine:
              </span>

              <button
                onClick={() => transformContent('Rewrite Content', 'Rewrite this article to make it cleaner, punchier, and more engaging while retaining all facts.')}
                disabled={generating || !body}
                className="px-2.5 py-1 rounded-md border border-border/80 bg-background hover:bg-accent hover:border-primary/40 disabled:opacity-40 transition-colors"
              >
                Rewrite
              </button>

              <button
                onClick={() => transformContent('Expand Details', 'Expand each major section with deeper explanations, actionable takeaways, and concrete examples.')}
                disabled={generating || !body}
                className="px-2.5 py-1 rounded-md border border-border/80 bg-background hover:bg-accent hover:border-primary/40 disabled:opacity-40 transition-colors"
              >
                Expand
              </button>

              <button
                onClick={() => transformContent('Shorten & Condense', 'Condense this article to be concise and straight to the point without losing key insights.')}
                disabled={generating || !body}
                className="px-2.5 py-1 rounded-md border border-border/80 bg-background hover:bg-accent hover:border-primary/40 disabled:opacity-40 transition-colors"
              >
                Shorten
              </button>

              <button
                onClick={() => transformContent('Simplify Language', 'Simplify the vocabulary and sentence structure so it is effortless to read for general readers.')}
                disabled={generating || !body}
                className="px-2.5 py-1 rounded-md border border-border/80 bg-background hover:bg-accent hover:border-primary/40 disabled:opacity-40 transition-colors"
              >
                Simplify
              </button>

              <button
                onClick={() => transformContent('Fix Grammar & Flow', 'Correct all grammatical errors, typos, and improve the transitions between paragraphs.')}
                disabled={generating || !body}
                className="px-2.5 py-1 rounded-md border border-border/80 bg-background hover:bg-accent hover:border-primary/40 disabled:opacity-40 transition-colors"
              >
                Fix Grammar
              </button>

              <button
                onClick={() => transformContent('Continue Writing', 'Continue writing the article naturally from the last point, adding further relevant insights and sections.')}
                disabled={generating || !body}
                className="px-2.5 py-1 rounded-md border border-border/80 bg-background hover:bg-accent hover:border-primary/40 disabled:opacity-40 transition-colors"
              >
                Continue Writing
              </button>
            </div>

            {/* Document Body Area */}
            <div className="relative flex-1 flex flex-col p-5 sm:p-6">
              {generating && (
                <div className="absolute inset-0 bg-background/70 backdrop-blur-sm z-20 flex flex-col items-center justify-center gap-3">
                  <Loader2 size={28} className="animate-spin text-primary" />
                  <p className="text-sm font-semibold">{generationAction || 'PressLine AI is thinking…'}</p>
                </div>
              )}

              <textarea
                value={body}
                onChange={e => setBody(e.target.value)}
                placeholder="Your generated article or outline will appear here. You can also write or paste existing drafts directly…"
                className="w-full flex-1 bg-transparent text-sm sm:text-base leading-7 outline-none resize-none font-sans"
              />
            </div>

            {/* Bottom Meta & Word Count Stats */}
            <div className="px-5 py-3 border-t border-border bg-muted/10 flex items-center justify-between text-xs text-muted-foreground">
              <div className="flex items-center gap-4">
                <span>{wordCount.toLocaleString()} words</span>
                <span>{body.length.toLocaleString()} characters</span>
                <span>~{readingTime} min read</span>
              </div>
              <div className="flex items-center gap-2">
                {primaryKeyword && <span className="hidden sm:inline bg-accent px-2 py-0.5 rounded text-[10px]">Keyword: {primaryKeyword}</span>}
                <span className="capitalize">{status}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
