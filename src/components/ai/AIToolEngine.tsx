import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { AIToolConfig } from '@/config/ai-tools';
import { supabase } from '@/lib/supabase';
import { useWorkspace } from '@/context/WorkspaceContext';
import { toast } from 'sonner';
import { Loader2, Sparkles, Copy, Save, Download, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/Button'; // Assuming you have a UI Button component, otherwise use standard button
import { cn } from '@/lib/utils';

export function AIToolEngine({ tool }: { tool: AIToolConfig }) {
  const { workspace, credits, refreshCredits } = useWorkspace();
  const [isGenerating, setIsGenerating] = useState(false);
  const [result, setResult] = useState<any>(null);
  
  const { register, handleSubmit, formState: { errors } } = useForm();

  const onSubmit = async (data: any) => {
    if (!workspace) return toast.error('No active workspace');
    if (credits < tool.creditCost) return toast.error('Insufficient credits for this generation');

    setIsGenerating(true);
    setResult(null);

    try {
      const { data: session } = await supabase.auth.getSession();
      
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-${tool.provider}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.session?.access_token}`
        },
        body: JSON.stringify({
          workspaceId: workspace.id,
          toolId: tool.id,
          model: 'google/gemini-2.5-flash', // Using the fast/default model
          systemPrompt: tool.systemPrompt,
          userPrompt: JSON.stringify(data),
          creditCost: tool.creditCost,
          inputData: data
        })
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || 'Generation failed');
      }

      const resData = await response.json();
      setResult(resData.result);
      
      toast.success('Generation complete!');
      await refreshCredits(); // Sync the new credit balance
    } catch (error: any) {
      toast.error(error.message || 'Something went wrong');
    } finally {
      setIsGenerating(false);
    }
  };

  const copyToClipboard = () => {
    if (result) {
      navigator.clipboard.writeText(JSON.stringify(result, null, 2));
      toast.success('Copied to clipboard');
    }
  };

  return (
    <div className="flex flex-col lg:flex-row h-full gap-6">
      {/* Left Input Section */}
      <div className="w-full lg:w-1/3 flex flex-col bg-card border border-border rounded-xl p-5 shadow-sm overflow-y-auto">
        <div className="mb-6">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <Sparkles className="text-primary" size={20} />
            {tool.name}
          </h2>
          <p className="text-sm text-muted-foreground mt-1">{tool.description}</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 flex-1">
          {tool.inputs.map(input => (
            <div key={input.name}>
              <label className="block text-xs font-semibold mb-1.5">{input.label}</label>
              {input.type === 'textarea' ? (
                <textarea
                  {...register(input.name, { required: input.required })}
                  placeholder={input.placeholder}
                  className="w-full h-24 p-3 rounded-lg border border-input bg-background text-sm focus:ring-2 focus:ring-ring outline-none resize-none"
                />
              ) : input.type === 'select' ? (
                <select
                  {...register(input.name, { required: input.required })}
                  className="w-full h-10 px-3 rounded-lg border border-input bg-background text-sm focus:ring-2 focus:ring-ring outline-none"
                >
                  {input.options?.map(opt => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              ) : (
                <input
                  type={input.type}
                  {...register(input.name, { required: input.required })}
                  placeholder={input.placeholder}
                  className="w-full h-10 px-3 rounded-lg border border-input bg-background text-sm focus:ring-2 focus:ring-ring outline-none"
                />
              )}
            </div>
          ))}

          <div className="pt-4 mt-4 border-t border-border">
            <div className="flex justify-between items-center text-xs text-muted-foreground mb-4">
              <span>Estimated cost:</span>
              <span className="font-medium bg-primary/10 text-primary px-2 py-0.5 rounded-full">
                {tool.creditCost} credits
              </span>
            </div>
            
            <button
              type="submit"
              disabled={isGenerating}
              className="w-full h-11 bg-primary text-primary-foreground font-semibold rounded-lg flex items-center justify-center gap-2 hover:bg-primary/90 transition-colors disabled:opacity-50"
            >
              {isGenerating ? (
                <><Loader2 className="animate-spin" size={16} /> Generating...</>
              ) : (
                <><Sparkles size={16} /> Generate</>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* Right Result Section */}
      <div className="w-full lg:w-2/3 flex flex-col bg-card border border-border rounded-xl shadow-sm overflow-hidden">
        <div className="flex items-center justify-between p-4 border-b border-border bg-muted/30">
          <h3 className="font-semibold text-sm">Result</h3>
          {result && (
            <div className="flex items-center gap-2">
              <button onClick={copyToClipboard} className="p-1.5 rounded-md hover:bg-accent text-muted-foreground hover:text-foreground transition-colors" title="Copy">
                <Copy size={16} />
              </button>
              <button className="p-1.5 rounded-md hover:bg-accent text-muted-foreground hover:text-foreground transition-colors" title="Save to Library">
                <Save size={16} />
              </button>
              <button className="p-1.5 rounded-md hover:bg-accent text-muted-foreground hover:text-foreground transition-colors" title="Download">
                <Download size={16} />
              </button>
              <button onClick={handleSubmit(onSubmit)} className="p-1.5 rounded-md hover:bg-accent text-muted-foreground hover:text-foreground transition-colors" title="Regenerate">
                <RotateCcw size={16} />
              </button>
            </div>
          )}
        </div>
        
        <div className="flex-1 p-6 overflow-y-auto bg-background/50">
          {isGenerating ? (
            <div className="h-full flex flex-col items-center justify-center text-muted-foreground space-y-4">
              <Loader2 className="animate-spin w-8 h-8 text-primary" />
              <p className="animate-pulse">Crafting your content...</p>
            </div>
          ) : result ? (
            <div className="prose prose-sm dark:prose-invert max-w-none">
              {/* Basic JSON rendering for now. In production, we'd render this based on tool schema */}
              <pre className="p-4 rounded-lg bg-muted text-xs overflow-x-auto">
                {JSON.stringify(result, null, 2)}
              </pre>
            </div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-muted-foreground">
              <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
                <Sparkles className="w-8 h-8 opacity-50" />
              </div>
              <p>Fill out the form and click generate to see the magic.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
