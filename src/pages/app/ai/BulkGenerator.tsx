import { useState } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { useWorkspace } from '@/context/WorkspaceContext';
import { useAuth } from '@/context/AuthContext';
import { useBrandVoices } from '@/hooks/useBrandVoices';
import { generateAI } from '@/lib/ai';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import {
  Plus,
  Trash2,
  Download,
  Loader2,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  Clock,
  Sparkles,
  Upload,
} from 'lucide-react';

interface BatchRow {
  id: string;
  topic: string;
  keyword: string;
  tone: string;
  language: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  error?: string;
  contentId?: string;
}

export default function BulkGenerator() {
  const { workspace, credits, refreshWorkspace } = useWorkspace();
  const { user } = useAuth();
  const { data: brandVoices = [] } = useBrandVoices(workspace?.id);

  const [batchName, setBatchName] = useState('');
  const [brandVoiceId, setBrandVoiceId] = useState('');
  const [running, setRunning] = useState(false);
  const [activeConcurrency, setActiveConcurrency] = useState(2);

  const [rows, setRows] = useState<BatchRow[]>([
    { id: '1', topic: '', keyword: '', tone: 'professional', language: 'English', status: 'pending' },
    { id: '2', topic: '', keyword: '', tone: 'professional', language: 'English', status: 'pending' },
    { id: '3', topic: '', keyword: '', tone: 'professional', language: 'English', status: 'pending' },
  ]);

  const addRow = () => {
    setRows(prev => [
      ...prev,
      { id: crypto.randomUUID(), topic: '', keyword: '', tone: 'professional', language: 'English', status: 'pending' },
    ]);
  };

  const removeRow = (id: string) => {
    setRows(prev => prev.filter(r => r.id !== id));
  };

  const updateRow = (id: string, field: keyof BatchRow, val: string) => {
    setRows(prev => prev.map(r => (r.id === id ? { ...r, [field]: val } : r)));
  };

  // CSV Import handler
  const handleCsvUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = event => {
      const text = event.target?.result as string;
      if (!text) return;

      const lines = text.split('\n').map(l => l.trim()).filter(Boolean);
      const newRows: BatchRow[] = [];

      lines.forEach((line, index) => {
        if (index === 0 && (line.toLowerCase().includes('topic') || line.toLowerCase().includes('title'))) return;
        const cols = line.split(',').map(c => c.replace(/^["']|["']$/g, '').trim());
        if (cols[0]) {
          newRows.push({
            id: crypto.randomUUID(),
            topic: cols[0],
            keyword: cols[1] || '',
            tone: 'professional',
            language: 'English',
            status: 'pending',
          });
        }
      });

      if (newRows.length > 0) {
        setRows(newRows);
        toast.success(`Imported ${newRows.length} topics from CSV`);
      } else {
        toast.error('No valid rows found in CSV');
      }
    };
    reader.readAsText(file);
  };

  // Controlled concurrency batch runner
  const runBatch = async () => {
    const validRows = rows.filter(r => r.topic.trim().length >= 2);
    if (validRows.length === 0) return toast.error('Please add at least one topic with 2+ characters');
    if (credits < validRows.length) {
      return toast.error(`Insufficient credits. You need ${validRows.length} credits, but have ${credits}.`);
    }
    if (!workspace || !user) return;

    setRunning(true);

    // Initialize pending status
    setRows(prev =>
      prev.map(r => (r.topic.trim().length >= 2 ? { ...r, status: 'pending', error: undefined } : r))
    );

    // Create batch record in Supabase
    const { data: batchRecord } = await supabase
      .from('batch_generations')
      .insert({
        workspace_id: workspace.id,
        user_id: user.id,
        name: batchName || `Bulk Batch — ${new Date().toLocaleDateString()}`,
        total_items: validRows.length,
        status: 'processing',
        credits_reserved: validRows.length,
        credits_used: 0,
      })
      .select()
      .single();

    // Process with controlled concurrency pool (e.g. 2 workers)
    const queue = [...validRows];
    let completedCount = 0;
    let failedCount = 0;

    const worker = async () => {
      while (queue.length > 0) {
        const row = queue.shift();
        if (!row) break;

        // Mark processing
        setRows(prev => prev.map(r => (r.id === row.id ? { ...r, status: 'processing' } : r)));

        try {
          const result = await generateAI<string>({
            workspaceId: workspace.id,
            type: 'article',
            topic: row.topic,
            tone: row.tone,
            language: row.language,
            length: 'medium',
            instructions: row.keyword ? `Focus target keyword: "${row.keyword}"` : '',
            brandVoiceId: brandVoiceId || undefined,
            creditCost: 1,
          });

          // Save generated content
          const wordCount = result.content.trim().split(/\s+/).filter(Boolean).length;
          const { data: savedContent } = await supabase
            .from('contents')
            .insert({
              workspace_id: workspace.id,
              user_id: user.id,
              title: row.topic,
              type: 'article',
              status: 'generated',
              body: result.content,
              word_count: wordCount,
              primary_keyword: row.keyword || null,
            })
            .select('id')
            .single();

          completedCount++;
          setRows(prev =>
            prev.map(r => (r.id === row.id ? { ...r, status: 'completed', contentId: savedContent?.id } : r))
          );
        } catch (err: unknown) {
          failedCount++;
          const message = (err as Error).message || 'Generation failed';
          setRows(prev => prev.map(r => (r.id === row.id ? { ...r, status: 'failed', error: message } : r)));
        }
      }
    };

    // Run parallel workers based on concurrency setting
    const workers = Array.from({ length: activeConcurrency }, () => worker());
    await Promise.all(workers);

    // Update batch record
    if (batchRecord) {
      await supabase
        .from('batch_generations')
        .update({
          status: failedCount === validRows.length ? 'failed' : 'completed',
          completed_items: completedCount,
          failed_items: failedCount,
          credits_used: completedCount,
          completed_at: new Date().toISOString(),
        })
        .eq('id', batchRecord.id);
    }

    await refreshWorkspace();
    setRunning(false);
    toast.success(`Batch complete: ${completedCount} generated, ${failedCount} failed.`);
  };

  // Retry failed rows
  const retryFailed = async () => {
    const failedRows = rows.filter(r => r.status === 'failed');
    if (failedRows.length === 0) return toast.info('No failed rows to retry');
    // Re-queue failed items
    setRows(prev => prev.map(r => (r.status === 'failed' ? { ...r, status: 'pending', error: undefined } : r)));
    runBatch();
  };

  // Export Results
  const exportCsv = () => {
    const header = 'Topic,Keyword,Tone,Status,Error\n';
    const csvContent = rows
      .map(r => `"${r.topic}","${r.keyword}","${r.tone}","${r.status}","${r.error || ''}"`)
      .join('\n');

    const blob = new Blob([header + csvContent], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `bulk-results-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    toast.success('Exported results');
  };

  const pendingCount = rows.filter(r => r.topic.trim().length >= 2).length;

  return (
    <DashboardLayout>
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Bulk Article Generator</h1>
            <p className="text-muted-foreground text-xs sm:text-sm mt-1">
              Batch generate up to dozens of articles simultaneously with controlled concurrency.
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <label className="h-9 px-3 rounded-xl border border-border text-xs font-medium hover:bg-accent flex items-center gap-1.5 cursor-pointer transition-colors">
              <Upload size={13} /> Import CSV
              <input type="file" accept=".csv,.txt" onChange={handleCsvUpload} className="hidden" />
            </label>

            {rows.some(r => r.status === 'completed') && (
              <button
                onClick={exportCsv}
                className="h-9 px-3 rounded-xl border border-border text-xs font-medium hover:bg-accent flex items-center gap-1.5 transition-colors"
              >
                <Download size={13} /> Export CSV
              </button>
            )}
          </div>
        </div>

        {/* Configuration Bar */}
        <div className="grid sm:grid-cols-3 gap-3 p-4 bg-card border border-border rounded-xl shadow-sm">
          <div>
            <label className="block text-xs font-semibold mb-1">Batch Name (Optional)</label>
            <input
              value={batchName}
              onChange={e => setBatchName(e.target.value)}
              placeholder="e.g. Q4 SEO Keyword Cluster Batch"
              className="w-full h-8 px-2.5 rounded-lg border border-input bg-background text-xs outline-none"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold mb-1">Brand Voice</label>
            <select
              value={brandVoiceId}
              onChange={e => setBrandVoiceId(e.target.value)}
              className="w-full h-8 px-2.5 rounded-lg border border-input bg-background text-xs outline-none"
            >
              <option value="">Default Brand Voice</option>
              {brandVoices.map(bv => <option key={bv.id} value={bv.id}>{bv.name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold mb-1">Concurrency (Workers)</label>
            <select
              value={activeConcurrency}
              onChange={e => setActiveConcurrency(Number(e.target.value))}
              className="w-full h-8 px-2.5 rounded-lg border border-input bg-background text-xs outline-none"
            >
              <option value={2}>2 Parallel Requests (Safe)</option>
              <option value={3}>3 Parallel Requests</option>
              <option value={4}>4 Parallel Requests (Fast)</option>
            </select>
          </div>
        </div>

        {/* Rows Grid */}
        <div className="bg-card border border-border rounded-xl p-4 shadow-sm space-y-3">
          <div className="grid grid-cols-[1fr_180px_120px_100px_40px] gap-2 text-[11px] font-semibold text-muted-foreground px-1 hidden sm:grid">
            <span>Article Topic *</span>
            <span>Focus Keyword</span>
            <span>Tone</span>
            <span>Status</span>
            <span />
          </div>

          <div className="space-y-2 max-h-[500px] overflow-y-auto pr-1">
            {rows.map((row, i) => (
              <div
                key={row.id}
                className="grid grid-cols-1 sm:grid-cols-[1fr_180px_120px_100px_40px] gap-2 items-center p-2 rounded-lg border border-border/80 bg-background text-xs"
              >
                <input
                  value={row.topic}
                  disabled={running}
                  onChange={e => updateRow(row.id, 'topic', e.target.value)}
                  placeholder={`Topic ${i + 1} (e.g. Best Mechanical Keyboards for Coders)`}
                  className="h-8 px-2.5 rounded border border-input bg-background focus:ring-1 focus:ring-ring outline-none"
                />

                <input
                  value={row.keyword}
                  disabled={running}
                  onChange={e => updateRow(row.id, 'keyword', e.target.value)}
                  placeholder="Focus keyword (optional)"
                  className="h-8 px-2.5 rounded border border-input bg-background focus:ring-1 focus:ring-ring outline-none"
                />

                <select
                  value={row.tone}
                  disabled={running}
                  onChange={e => updateRow(row.id, 'tone', e.target.value)}
                  className="h-8 px-2 rounded border border-input bg-background outline-none capitalize"
                >
                  {['professional', 'conversational', 'authoritative', 'persuasive'].map(t => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>

                <div className="flex items-center gap-1.5 px-2">
                  {row.status === 'processing' ? (
                    <span className="text-yellow-600 flex items-center gap-1 font-medium">
                      <Loader2 size={12} className="animate-spin" /> Running
                    </span>
                  ) : row.status === 'completed' ? (
                    <span className="text-green-600 flex items-center gap-1 font-medium">
                      <CheckCircle2 size={12} /> Done
                    </span>
                  ) : row.status === 'failed' ? (
                    <span className="text-destructive flex items-center gap-1 font-medium" title={row.error}>
                      <AlertCircle size={12} /> Failed
                    </span>
                  ) : (
                    <span className="text-muted-foreground flex items-center gap-1">
                      <Clock size={12} /> Ready
                    </span>
                  )}
                </div>

                <div className="flex justify-end">
                  <button
                    onClick={() => removeRow(row.id)}
                    disabled={running || rows.length <= 1}
                    className="h-8 w-8 rounded border border-border flex items-center justify-center text-muted-foreground hover:text-destructive hover:bg-destructive/10 disabled:opacity-30 transition-colors"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div className="flex items-center justify-between pt-2">
            <button
              onClick={addRow}
              disabled={running}
              className="h-8 px-3 rounded-lg border border-border text-xs font-medium hover:bg-accent flex items-center gap-1.5 disabled:opacity-40 transition-colors"
            >
              <Plus size={13} /> Add Row
            </button>

            <span className="text-xs text-muted-foreground">
              {pendingCount} valid topic{pendingCount !== 1 ? 's' : ''} · {pendingCount} credits required
            </span>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-3 flex-wrap">
          <button
            onClick={runBatch}
            disabled={running || pendingCount === 0}
            className="h-10 px-6 rounded-xl bg-primary text-primary-foreground font-semibold text-xs flex items-center gap-2 hover:bg-primary/90 disabled:opacity-50 transition-colors shadow-sm"
          >
            {running ? (
              <><Loader2 size={15} className="animate-spin" /> Generating Batch Items…</>
            ) : (
              <><Sparkles size={15} /> Start Bulk Generation ({pendingCount} credits)</>
            )}
          </button>

          {rows.some(r => r.status === 'failed') && !running && (
            <button
              onClick={retryFailed}
              className="h-10 px-4 rounded-xl border border-destructive/40 text-destructive text-xs font-medium hover:bg-destructive/10 flex items-center gap-1.5 transition-colors"
            >
              <RefreshCw size={13} /> Retry Failed Rows
            </button>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
