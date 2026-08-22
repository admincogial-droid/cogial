import DashboardLayout from '@/components/layout/DashboardLayout';
import { useWorkspace } from '@/context/WorkspaceContext';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabase';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { Loader2, FileSpreadsheet, Upload, Plus, Trash2, Download } from 'lucide-react';

const rowSchema = z.object({ topic: z.string().min(2), keyword: z.string().default(''), tone: z.string().default('professional'), language: z.string().default('en') });
type RowData = z.infer<typeof rowSchema>;

export default function BulkGenerator() {
  const { workspace, credits } = useWorkspace();
  const { user } = useAuth();
  const [rows, setRows] = useState<RowData[]>([{ topic: '', keyword: '', tone: 'professional', language: 'en' }]);
  const [batchName, setBatchName] = useState('');
  const [running, setRunning] = useState(false);
  const [results, setResults] = useState<{ topic: string; status: 'pending' | 'done' | 'error' }[]>([]);

  const addRow = () => setRows(p => [...p, { topic: '', keyword: '', tone: 'professional', language: 'en' }]);
  const removeRow = (i: number) => setRows(p => p.filter((_, idx) => idx !== i));
  const updateRow = (i: number, field: keyof RowData, val: string) => setRows(p => p.map((r, idx) => idx === i ? { ...r, [field]: val } : r));

  const start = async () => {
    const valid = rows.filter(r => r.topic.trim().length >= 2);
    if (valid.length === 0) { toast.error('Add at least one topic'); return; }
    if (credits < valid.length) { toast.error(`Need ${valid.length} credits, you have ${credits}`); return; }
    if (!workspace || !user) return;
    setRunning(true);
    setResults(valid.map(r => ({ topic: r.topic, status: 'pending' })));

    // Create batch record
    const { data: batch } = await supabase.from('batch_generations').insert({
      workspace_id: workspace.id, user_id: user.id,
      name: batchName || `Batch ${new Date().toLocaleDateString()}`,
      total_items: valid.length, status: 'processing',
      credits_reserved: valid.length, credits_used: 0,
    }).select().single();

    for (let i = 0; i < valid.length; i++) {
      const row = valid[i];
      try {
        const { data, error } = await supabase.functions.invoke('ai-generate', {
          body: { type: 'article', topic: row.topic, tone: row.tone, language: row.language, workspaceId: workspace.id },
        });
        if (error || !data?.success) throw new Error(data?.error?.message ?? 'Failed');
        // Save generated content
        await supabase.from('contents').insert({
          workspace_id: workspace.id, user_id: user.id,
          title: row.topic, type: 'article', status: 'generated',
          body: data.data.content, word_count: data.data.content.split(/\s+/).length,
        });
        setResults(prev => prev.map((r, idx) => idx === i ? { ...r, status: 'done' } : r));
      } catch {
        setResults(prev => prev.map((r, idx) => idx === i ? { ...r, status: 'error' } : r));
      }
    }

    if (batch) await supabase.from('batch_generations').update({ status: 'completed', completed_at: new Date().toISOString() }).eq('id', batch.id);
    toast.success('Bulk generation complete!');
    setRunning(false);
  };

  const exportCSV = () => {
    const csv = 'Topic,Status\n' + results.map(r => `"${r.topic}",${r.status}`).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'bulk-results.csv'; a.click();
  };

  return (
    <DashboardLayout>
      <div className="max-w-4xl">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Bulk Generator</h1>
            <p className="text-muted-foreground text-sm mt-1">Generate multiple articles simultaneously. Each uses 1 credit.</p>
          </div>
          {results.length > 0 && (
            <button onClick={exportCSV} className="flex items-center gap-2 h-9 px-3 rounded-lg border border-border text-sm hover:bg-accent transition-colors">
              <Download size={13} /> Export
            </button>
          )}
        </div>

        <div className="rounded-xl border border-border bg-card p-5 mb-6">
          <div className="mb-4">
            <label className="block text-xs font-medium mb-1.5">Batch Name (optional)</label>
            <input value={batchName} onChange={e => setBatchName(e.target.value)} placeholder="Q4 Blog Batch"
              className="w-full h-9 px-3 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
          </div>

          <div className="space-y-2 mb-4">
            <div className="grid grid-cols-[1fr_1fr_120px_90px_36px] gap-2 text-[11px] font-medium text-muted-foreground px-1">
              <span>Topic *</span><span>Keyword</span><span>Tone</span><span>Language</span><span />
            </div>
            {rows.map((row, i) => (
              <div key={i} className="grid grid-cols-[1fr_1fr_120px_90px_36px] gap-2">
                <input value={row.topic} onChange={e => updateRow(i, 'topic', e.target.value)} placeholder="Article topic"
                  className="h-8 px-2 rounded border border-input bg-background text-xs focus:outline-none focus:ring-1 focus:ring-ring" />
                <input value={row.keyword} onChange={e => updateRow(i, 'keyword', e.target.value)} placeholder="Focus keyword"
                  className="h-8 px-2 rounded border border-input bg-background text-xs focus:outline-none focus:ring-1 focus:ring-ring" />
                <select value={row.tone} onChange={e => updateRow(i, 'tone', e.target.value)}
                  className="h-8 px-1 rounded border border-input bg-background text-xs focus:outline-none">
                  {['professional','casual','friendly','authoritative'].map(t => <option key={t} value={t}>{t}</option>)}
                </select>
                <select value={row.language} onChange={e => updateRow(i, 'language', e.target.value)}
                  className="h-8 px-1 rounded border border-input bg-background text-xs focus:outline-none">
                  {[{c:'en',l:'EN'},{c:'es',l:'ES'},{c:'fr',l:'FR'},{c:'de',l:'DE'},{c:'pt',l:'PT'}].map(l => <option key={l.c} value={l.c}>{l.l}</option>)}
                </select>
                <button onClick={() => removeRow(i)} disabled={rows.length === 1} className="h-8 w-8 flex items-center justify-center rounded border border-border hover:bg-destructive/10 hover:text-destructive text-muted-foreground disabled:opacity-30">
                  <Trash2 size={12} />
                </button>
              </div>
            ))}
          </div>

          <div className="flex items-center gap-3">
            <button onClick={addRow} className="flex items-center gap-1.5 text-xs h-8 px-3 rounded-lg border border-border hover:bg-accent transition-colors">
              <Plus size={12} /> Add row
            </button>
            <span className="text-xs text-muted-foreground">{rows.filter(r => r.topic.trim()).length} articles · {rows.filter(r => r.topic.trim()).length} credits</span>
          </div>
        </div>

        <button onClick={start} disabled={running}
          className="flex items-center gap-2 h-10 px-6 rounded-lg bg-primary text-primary-foreground font-semibold hover:bg-primary/90 disabled:opacity-50 transition-colors mb-6">
          {running ? <><Loader2 size={15} className="animate-spin" /> Generating…</> : <><FileSpreadsheet size={15} /> Start Bulk Generation</>}
        </button>

        {results.length > 0 && (
          <div className="rounded-xl border border-border bg-card overflow-hidden">
            <div className="px-4 py-3 border-b border-border text-sm font-semibold">Results</div>
            {results.map((r, i) => (
              <div key={i} className="flex items-center gap-3 px-4 py-2.5 border-b border-border/50 last:border-0">
                <div className={`h-2 w-2 rounded-full flex-shrink-0 ${r.status === 'done' ? 'bg-green-500' : r.status === 'error' ? 'bg-red-500' : 'bg-yellow-500 animate-pulse'}`} />
                <p className="text-sm flex-1">{r.topic}</p>
                <span className={`text-xs capitalize font-medium ${r.status === 'done' ? 'text-green-500' : r.status === 'error' ? 'text-red-500' : 'text-yellow-500'}`}>{r.status}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
