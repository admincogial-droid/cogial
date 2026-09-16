import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import type { Content, ContentVersion } from '@/types';
import { toast } from 'sonner';
import { Save, ArrowLeft, Clock, ChevronDown, Sparkles, Loader2 } from 'lucide-react';
import { formatRelativeTime } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

export default function ContentEditor() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const [content, setContent] = useState<Content | null>(null);
  const [body, setBody] = useState('');
  const [title, setTitle] = useState('');
  const [saving, setSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [versions, setVersions] = useState<ContentVersion[]>([]);
  const [showVersions, setShowVersions] = useState(false);
  const [loading, setLoading] = useState(true);
  const autosaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!id) return;
    const load = async () => {
      const [{ data: c }, { data: v }] = await Promise.all([
        supabase.from('contents').select('*').eq('id', id).single(),
        supabase.from('content_versions').select('*').eq('content_id', id).order('created_at', { ascending: false }).limit(20),
      ]);
      if (c) { setContent(c as Content); setBody(c.body ?? ''); setTitle(c.title); }
      if (v) setVersions(v as ContentVersion[]);
      setLoading(false);
    };
    load();
  }, [id]);

  const save = useCallback(async (createVersion = false) => {
    if (!id || !user || saving) return;
    setSaving(true);
    setSaveStatus('saving');
    try {
      const wordCount = body.trim().split(/\s+/).filter(Boolean).length;
      await supabase.from('contents').update({ title, body, word_count: wordCount, updated_at: new Date().toISOString() }).eq('id', id);
      if (createVersion && body.trim()) {
        const nextVer = (versions[0]?.version_number ?? 0) + 1;
        const { data: nv } = await supabase.from('content_versions').insert({ content_id: id, user_id: user.id, body, word_count: wordCount, version_number: nextVer }).select().single();
        if (nv) setVersions(prev => [nv as ContentVersion, ...prev.slice(0, 19)]);
      }
      setSaveStatus('saved');
    } catch {
      setSaveStatus('error');
      toast.error('Failed to save');
    } finally {
      setSaving(false);
      setTimeout(() => setSaveStatus('idle'), 2000);
    }
  }, [id, user, title, body, saving, versions]);

  // Autosave debounce
  useEffect(() => {
    if (!content) return;
    if (autosaveTimer.current) clearTimeout(autosaveTimer.current);
    autosaveTimer.current = setTimeout(() => save(false), 3000);
    return () => { if (autosaveTimer.current) clearTimeout(autosaveTimer.current); };
  }, [body, title]);

  const restoreVersion = async (v: ContentVersion) => {
    setBody(v.body);
    setShowVersions(false);
    toast.success('Version restored — save to apply');
  };

  if (loading) return <DashboardLayout><div className="flex items-center justify-center h-64"><Loader2 className="animate-spin text-primary" size={24} /></div></DashboardLayout>;
  if (!content) return <DashboardLayout><div className="text-center py-20"><p>Content not found</p><Link to="/dashboard/content" className="text-primary hover:underline text-sm">Back to library</Link></div></DashboardLayout>;

  const wordCount = body.trim().split(/\s+/).filter(Boolean).length;

  return (
    <DashboardLayout>
      <div className="max-w-4xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-6 gap-3 flex-wrap">
          <Link to="/dashboard/content" className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft size={15} /> Content Library
          </Link>
          <div className="flex items-center gap-3">
            <span className={`text-xs ${saveStatus === 'saving' ? 'text-muted-foreground' : saveStatus === 'saved' ? 'text-green-500' : saveStatus === 'error' ? 'text-destructive' : 'text-transparent'}`}>
              {saveStatus === 'saving' ? 'Saving…' : saveStatus === 'saved' ? '✓ Saved' : saveStatus === 'error' ? '⚠ Save failed' : '.'}
            </span>
            <button onClick={() => { navigator.clipboard.writeText(`${title ? `# ${title}\n\n` : ''}${body}`); toast.success('Copied to clipboard'); }}
              className="flex items-center gap-1.5 text-xs h-8 px-2.5 rounded-lg border border-border hover:bg-accent transition-colors">
              Copy
            </button>
            <button onClick={() => setShowVersions(v => !v)}
              className="flex items-center gap-1.5 text-xs h-8 px-3 rounded-lg border border-border hover:bg-accent transition-colors">
              <Clock size={12} /> History <ChevronDown size={12} className={showVersions ? 'rotate-180' : ''} />
            </button>
            <button onClick={() => save(true)} disabled={saving}
              className="flex items-center gap-1.5 text-xs h-8 px-3 rounded-lg border border-border hover:bg-accent disabled:opacity-50 transition-colors">
              <Save size={12} /> {saving ? 'Saving…' : 'Save Version'}
            </button>
            <button onClick={async () => {
              if (!id) return;
              const newStatus = content.status === 'published' ? 'draft' : 'published';
              await supabase.from('contents').update({ status: newStatus, published_at: newStatus === 'published' ? new Date().toISOString() : null }).eq('id', id);
              setContent(prev => prev ? { ...prev, status: newStatus } : null);
              toast.success(newStatus === 'published' ? 'Published!' : 'Reverted to draft');
            }}
              className={`flex items-center gap-1.5 text-xs h-8 px-3 rounded-lg font-semibold transition-colors ${
                content.status === 'published'
                  ? 'bg-green-600 hover:bg-green-700 text-white'
                  : 'bg-primary hover:bg-primary/90 text-primary-foreground'
              }`}>
              {content.status === 'published' ? 'Published' : 'Publish'}
            </button>
          </div>
        </div>

        {/* Version History Panel */}
        <AnimatePresence>
          {showVersions && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
              className="mb-4 rounded-xl border border-border bg-card overflow-hidden">
              <div className="px-4 py-3 border-b border-border">
                <h3 className="text-sm font-medium">Version History</h3>
              </div>
              {versions.length === 0 ? (
                <p className="text-center py-4 text-sm text-muted-foreground">No saved versions yet</p>
              ) : (
                <div className="max-h-48 overflow-y-auto">
                  {versions.map(v => (
                    <div key={v.id} className="flex items-center justify-between px-4 py-2.5 border-b border-border/50 last:border-0 hover:bg-accent/30">
                      <div>
                        <p className="text-xs font-medium">Version {v.version_number}</p>
                        <p className="text-[11px] text-muted-foreground">{v.word_count} words · {formatRelativeTime(v.created_at)}</p>
                      </div>
                      <button onClick={() => restoreVersion(v)} className="text-xs text-primary hover:underline">Restore</button>
                    </div>
                  ))}
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Editor */}
        <div className="rounded-xl border border-border bg-card overflow-hidden">
          <div className="border-b border-border px-4 py-3">
            <input value={title} onChange={e => setTitle(e.target.value)}
              className="w-full text-xl font-bold bg-transparent focus:outline-none placeholder:text-muted-foreground/40"
              placeholder="Article title…" />
          </div>
          <textarea value={body} onChange={e => setBody(e.target.value)}
            className="w-full min-h-[600px] p-6 bg-transparent text-sm leading-7 resize-none focus:outline-none font-body prose-editor"
            placeholder="Start writing, or paste your content here…" />
        </div>

        {/* Footer stats */}
        <div className="flex items-center gap-4 mt-3 text-xs text-muted-foreground">
          <span>{wordCount} words</span>
          <span>{body.length} characters</span>
          <span>~{Math.ceil(wordCount / 200)} min read</span>
        </div>
      </div>
    </DashboardLayout>
  );
}
