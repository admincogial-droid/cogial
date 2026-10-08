import { useEffect, useState } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { supabase } from '@/lib/supabase';
import { useWorkspace } from '@/context/WorkspaceContext';
import { AI_TOOLS } from '@/config/ai-tools';
import { Loader2, History, Sparkles, AlertCircle, Copy, Check } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { cleanAiText } from '@/lib/text-cleaner';
import { toast } from 'sonner';

export default function GenerationHistory() {
  const { workspace } = useWorkspace();
  const [generations, setGenerations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  useEffect(() => {
    if (!workspace) return;

    const fetchHistory = async () => {
      const { data, error } = await supabase
        .from('ai_generations')
        .select('*')
        .eq('workspace_id', workspace.id)
        .order('created_at', { ascending: false })
        .limit(50);

      if (!error && data) {
        setGenerations(data);
      }
      setLoading(false);
    };

    fetchHistory();
  }, [workspace]);

  const copyResult = async (id: string, text: string) => {
    await navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 1500);
    toast.success('Copied to clipboard');
  };

  const formatOutput = (outputData: any): string => {
    if (!outputData) return '';
    if (typeof outputData === 'string') return cleanAiText(outputData);
    if (outputData.content && typeof outputData.content === 'string') return cleanAiText(outputData.content);
    if (typeof outputData === 'object') {
      const entries = Object.entries(outputData).map(([k, v]) => {
        const valStr = typeof v === 'string' ? cleanAiText(v) : JSON.stringify(v, null, 2);
        return `${k.replace(/_/g, ' ').toUpperCase()}:\n${valStr}`;
      });
      return entries.join('\n\n');
    }
    return JSON.stringify(outputData, null, 2);
  };

  return (
    <DashboardLayout>
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex items-center gap-2 mb-4">
          <div className="h-9 w-9 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
            <History size={20} />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Generation History</h1>
            <p className="text-xs text-muted-foreground">Audit log of all AI requests, token metrics, and outputs.</p>
          </div>
        </div>

        {loading ? (
          <div className="flex h-[50vh] items-center justify-center text-muted-foreground">
            <Loader2 className="animate-spin w-6 h-6 mr-2 text-primary" /> Loading generation history...
          </div>
        ) : generations.length === 0 ? (
          <div className="text-center py-20 bg-card rounded-2xl border border-border shadow-sm">
            <History className="mx-auto h-12 w-12 text-muted-foreground/30 mb-3" />
            <p className="text-sm font-medium text-foreground">No generation history yet</p>
            <p className="text-xs text-muted-foreground mt-1">
              Start writing or use any AI tool to see your generated records here.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {generations.map((gen) => {
              const tool = AI_TOOLS[gen.tool_id];
              const textOutput = formatOutput(gen.output_data);

              return (
                <div key={gen.id} className="bg-card border border-border rounded-2xl p-5 shadow-sm space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="flex items-center gap-2.5">
                      <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                        <Sparkles size={14} />
                      </div>
                      <div>
                        <h3 className="font-semibold text-sm text-foreground">{tool?.name || gen.tool_id}</h3>
                        <p className="text-[11px] text-muted-foreground">
                          {formatDistanceToNow(new Date(gen.created_at), { addSuffix: true })} · Model: {gen.model || 'OpenRouter'}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 self-start sm:self-auto">
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[10px] font-semibold capitalize ${
                          gen.status === 'completed'
                            ? 'bg-green-500/10 text-green-600 dark:text-green-400 border border-green-500/20'
                            : gen.status === 'failed'
                            ? 'bg-destructive/10 text-destructive border border-destructive/20'
                            : 'bg-yellow-500/10 text-yellow-600 border border-yellow-500/20'
                        }`}
                      >
                        {gen.status}
                      </span>
                      <span className="text-xs font-medium text-muted-foreground px-2 py-0.5 bg-muted rounded-md">
                        {gen.credits_used} credits
                      </span>
                      {textOutput && (
                        <button
                          onClick={() => copyResult(gen.id, textOutput)}
                          className="p-1.5 rounded-lg border border-border hover:bg-accent text-muted-foreground hover:text-foreground transition-colors"
                          title="Copy output"
                        >
                          {copiedId === gen.id ? <Check size={12} className="text-green-500" /> : <Copy size={12} />}
                        </button>
                      )}
                    </div>
                  </div>

                  {gen.status === 'completed' && textOutput && (
                    <div className="bg-muted/40 p-4 rounded-xl border border-border/50 overflow-x-auto text-xs leading-relaxed text-foreground whitespace-pre-wrap max-h-64 overflow-y-auto">
                      {textOutput}
                    </div>
                  )}

                  {gen.status === 'failed' && (
                    <div className="flex items-center gap-2 text-destructive text-xs bg-destructive/5 p-3 rounded-xl border border-destructive/20">
                      <AlertCircle size={14} />
                      <span>{gen.error_message || 'Generation failed'}</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
