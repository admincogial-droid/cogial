import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { AIToolConfig } from '@/config/ai-tools';
import { supabase } from '@/lib/supabase';
import { useWorkspace } from '@/context/WorkspaceContext';
import { toast } from 'sonner';
import { Loader2, Sparkles, Copy, Save, Download, RotateCcw, Check } from 'lucide-react';

export function AIToolEngine({ tool }: { tool: AIToolConfig }) {
  const { workspace, credits, refreshWorkspace } = useWorkspace();
  const [isGenerating, setIsGenerating] = useState(false);
  const [result, setResult] = useState<Record<string, unknown> | null>(null);
  const [copied, setCopied] = useState(false);

  const { register, handleSubmit } = useForm();

  const onSubmit = async (data: Record<string, string>) => {
    if (!workspace) return toast.error('No active workspace');
    if (credits < tool.creditCost) return toast.error(`Insufficient credits. Need ${tool.creditCost}, have ${credits}.`);

    setIsGenerating(true);
    setResult(null);

    try {
      const { data: resData, error } = await supabase.functions.invoke('ai-generate', {
        body: {
          type: tool.id,
          workspaceId: workspace.id,
          systemPrompt: tool.systemPrompt,
          userPrompt: `Generate output for the following tool: "${tool.name}".\nInputs:\n${Object.entries(data).map(([k, v]) => `${k}: ${v}`).join('\n')}`,
          creditCost: tool.creditCost,
          responseFormatJson: true,
        }
      });

      if (error || !resData?.success) {
        throw new Error(resData?.error?.message || error?.message || 'Generation failed');
      }

      setResult(resData.data.content);
      toast.success('Generation complete!');
      await refreshWorkspace();
    } catch (error: unknown) {
      toast.error((error as Error).message || 'Something went wrong');
    } finally {
      setIsGenerating(false);
    }
  };

  const getResultText = (): string => {
    if (!result) return '';
    return Object.entries(result)
      .map(([key, value]) => {
        const label = key.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
        if (typeof value === 'string' && value.startsWith('data:image/')) {
          return `${label}: [Generated AI Image]`;
        }
        if (Array.isArray(value)) {
          return `${label}:\n${value.map((v: unknown, i: number) => `  ${i + 1}. ${v}`).join('\n')}`;
        }
        return `${label}:\n${value}`;
      })
      .join('\n\n');
  };

  const copyToClipboard = () => {
    const text = getResultText();
    if (text) {
      navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
      toast.success('Copied to clipboard');
    }
  };

  const downloadResult = () => {
    const text = getResultText();
    if (!text) return;
    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${tool.id}-result.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const saveToLibrary = async () => {
    if (!result || !workspace) return;
    const text = getResultText();
    const imageVal = result.image || result.image_url || Object.values(result).find(v => typeof v === 'string' && (v.startsWith('data:image/') || v.startsWith('http')));

    const { error } = await supabase.from('contents').insert({
      workspace_id: workspace.id,
      title: `${tool.name} — ${new Date().toLocaleDateString()}`,
      type: tool.category,
      status: 'draft',
      body: text,
      featured_image: typeof imageVal === 'string' ? imageVal : null,
      word_count: text.split(/\s+/).filter(Boolean).length,
    });
    if (error) toast.error('Failed to save');
    else toast.success('Saved to Content Library');
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
              <label className="block text-xs font-semibold mb-1.5">
                {input.label}
                {input.required && <span className="text-destructive ml-1">*</span>}
              </label>
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
              <span>Cost:</span>
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
              <button onClick={copyToClipboard}
                className="flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-lg border border-border hover:bg-accent text-muted-foreground hover:text-foreground transition-colors">
                {copied ? <Check size={13} className="text-green-500" /> : <Copy size={13} />}
                {copied ? 'Copied' : 'Copy'}
              </button>
              <button onClick={saveToLibrary}
                className="flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-lg border border-border hover:bg-accent text-muted-foreground hover:text-foreground transition-colors">
                <Save size={13} /> Save
              </button>
              <button onClick={downloadResult}
                className="flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-lg border border-border hover:bg-accent text-muted-foreground hover:text-foreground transition-colors">
                <Download size={13} /> Download
              </button>
              <button onClick={() => handleSubmit(onSubmit)()}
                className="flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-lg border border-border hover:bg-accent text-muted-foreground hover:text-foreground transition-colors">
                <RotateCcw size={13} /> Redo
              </button>
            </div>
          )}
        </div>

        <div className="flex-1 p-6 overflow-y-auto bg-background/50">
          {isGenerating ? (
            <div className="h-full flex flex-col items-center justify-center text-muted-foreground space-y-4">
              <Loader2 className="animate-spin w-8 h-8 text-primary" />
              <p className="animate-pulse text-sm">Crafting your content...</p>
              <p className="text-xs">This usually takes 5-15 seconds</p>
            </div>
          ) : result ? (
            <div className="space-y-6">
              {Object.entries(result).map(([key, value]) => {
                const label = key.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
                if (!value || (Array.isArray(value) && value.length === 0)) return null;
                return (
                  <div key={key}>
                    <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
                      {label}
                    </h4>
                    {Array.isArray(value) ? (
                      <ul className="space-y-1.5">
                        {(value as unknown[]).map((item, i) => (
                          <li key={i} className="flex items-start gap-2 text-sm">
                            {typeof item === 'string' ? (
                              <>
                                <span className="text-primary mt-0.5 flex-shrink-0">•</span>
                                <span>{item}</span>
                              </>
                            ) : (
                              <pre className="text-xs bg-muted px-2 py-1 rounded overflow-x-auto w-full">
                                {JSON.stringify(item, null, 2)}
                              </pre>
                            )}
                          </li>
                        ))}
                      </ul>
                    ) : typeof value === 'string' ? (
                      value.startsWith('data:image/') || /^https?:\/\/.*\.(png|jpg|jpeg|webp|gif)/i.test(value) ? (
                        <div className="mt-2 space-y-3">
                          <div className="relative group max-w-xl rounded-xl overflow-hidden border border-border shadow-md bg-muted/40">
                            <img src={value} alt={label} className="w-full h-auto object-cover max-h-[480px]" />
                          </div>
                          <a
                            href={value}
                            download={`pressline-${tool.id}-${Date.now()}.png`}
                            className="inline-flex items-center gap-1.5 text-xs px-3 py-2 rounded-lg bg-primary text-primary-foreground font-medium hover:bg-primary/90 transition-colors shadow-sm"
                          >
                            <Download size={13} /> Download Image
                          </a>
                        </div>
                      ) : (
                        <p className="text-sm leading-relaxed whitespace-pre-wrap">{value}</p>
                      )
                    ) : typeof value === 'object' ? (
                      <pre className="text-xs bg-muted px-3 py-2 rounded-lg overflow-x-auto">
                        {JSON.stringify(value, null, 2)}
                      </pre>
                    ) : (
                      <p className="text-sm">{String(value)}</p>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-muted-foreground">
              <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
                <Sparkles className="w-8 h-8 opacity-50" />
              </div>
              <p className="text-sm">Fill out the form and click Generate</p>
              <p className="text-xs mt-1 text-muted-foreground/60">Your results will appear here</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
