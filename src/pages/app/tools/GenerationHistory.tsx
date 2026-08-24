import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useWorkspace } from '@/context/WorkspaceContext';
import { AI_TOOLS } from '@/config/ai-tools';
import { Loader2, History, Sparkles, AlertCircle } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

export default function GenerationHistory() {
  const { workspace } = useWorkspace();
  const [generations, setGenerations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

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

  if (loading) {
    return (
      <div className="flex h-[50vh] items-center justify-center text-muted-foreground">
        <Loader2 className="animate-spin w-6 h-6 mr-2" /> Loading history...
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex items-center gap-2 mb-8">
        <History className="text-primary" size={24} />
        <h1 className="text-2xl font-bold text-foreground">Generation History</h1>
      </div>

      {generations.length === 0 ? (
        <div className="text-center py-20 bg-card rounded-xl border border-border">
          <History className="mx-auto h-12 w-12 text-muted-foreground/30 mb-4" />
          <p className="text-muted-foreground">No generation history yet.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {generations.map(gen => {
            const tool = AI_TOOLS[gen.tool_id];
            
            return (
              <div key={gen.id} className="bg-card border border-border rounded-xl p-5 shadow-sm">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center gap-2">
                    <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                      <Sparkles size={14} />
                    </div>
                    <div>
                      <h3 className="font-semibold text-sm">{tool?.name || gen.tool_id}</h3>
                      <p className="text-[10px] text-muted-foreground">
                        {formatDistanceToNow(new Date(gen.created_at), { addSuffix: true })}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium capitalize ${
                      gen.status === 'completed' ? 'bg-green-500/10 text-green-600' :
                      gen.status === 'failed' ? 'bg-destructive/10 text-destructive' :
                      'bg-yellow-500/10 text-yellow-600'
                    }`}>
                      {gen.status}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {gen.credits_used} credits
                    </span>
                  </div>
                </div>

                {gen.status === 'completed' && gen.output_data && (
                  <div className="bg-muted/50 p-4 rounded-lg overflow-x-auto text-xs">
                    <pre>{JSON.stringify(gen.output_data, null, 2)}</pre>
                  </div>
                )}
                
                {gen.status === 'failed' && (
                  <div className="flex items-center gap-2 text-destructive text-sm bg-destructive/5 p-3 rounded-lg">
                    <AlertCircle size={16} />
                    {gen.error_message || 'Generation failed'}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
