import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useWorkspace } from '@/context/WorkspaceContext';
import { supabase } from '@/lib/supabase';
import { AI_TOOLS } from '@/config/ai-tools';
import {
  Search,
  FileText,
  Layers,
  BookTemplate,
  Wrench,
  Hash,
  X,
  Loader2,
  ArrowRight,
  Command,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface SearchResults {
  contents: Array<{ id: string; title: string; type: string; status: string }>;
  projects: Array<{ id: string; name: string; description: string | null }>;
  templates: Array<{ id: string; name: string; category: string }>;
  keywords: Array<{ id: string; keyword: string; intent: string | null }>;
}

export function CommandSearchDialog({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const { workspace } = useWorkspace();
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<SearchResults>({
    contents: [],
    projects: [],
    templates: [],
    keywords: [],
  });

  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Debounced search (250ms)
  useEffect(() => {
    if (!open || !workspace) return;
    if (query.trim().length < 2) {
      setResults({ contents: [], projects: [], templates: [], keywords: [] });
      setLoading(false);
      return;
    }

    setLoading(true);
    if (debounceTimer.current) clearTimeout(debounceTimer.current);

    debounceTimer.current = setTimeout(async () => {
      try {
        // @ts-ignore
        const { data, error } = await supabase.rpc('search_workspace', {
          p_workspace_id: workspace.id,
          p_query: query.trim(),
        });

        if (!error && data) {
          setResults(data as unknown as SearchResults);
        } else {
          // Graceful fallback if migration not run yet
          const [cRes, pRes] = await Promise.all([
            supabase
              .from('contents')
              .select('id, title, type, status')
              .eq('workspace_id', workspace.id)
              .ilike('title', `%${query.trim()}%`)
              .limit(5),
            supabase
              .from('projects')
              .select('id, name, description')
              .eq('workspace_id', workspace.id)
              .ilike('name', `%${query.trim()}%`)
              .limit(4),
          ]);

          setResults({
            contents: (cRes.data || []) as any,
            projects: (pRes.data || []) as any,
            templates: [],
            keywords: [],
          });
        }
      } catch (err) {
        console.error('Search error:', err);
      } finally {
        setLoading(false);
      }
    }, 280);

    return () => {
      if (debounceTimer.current) clearTimeout(debounceTimer.current);
    };
  }, [query, open, workspace]);

  // Match AI tools locally from registry for zero-latency discovery
  const matchingTools = Object.values(AI_TOOLS)
    .filter(t => query.trim().length >= 2 && (t.name.toLowerCase().includes(query.toLowerCase()) || t.category.toLowerCase().includes(query.toLowerCase())))
    .slice(0, 4);

  const handleSelect = (url: string) => {
    onClose();
    setQuery('');
    navigate(url);
  };

  const hasAnyResults =
    results.contents.length > 0 ||
    results.projects.length > 0 ||
    results.templates.length > 0 ||
    results.keywords.length > 0 ||
    matchingTools.length > 0;

  if (!open) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-start justify-center pt-16 sm:pt-24 px-4 bg-black/60 backdrop-blur-xs">
        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: -8 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: -8 }}
          transition={{ duration: 0.15 }}
          className="w-full max-w-2xl bg-popover border border-border rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[80vh]"
        >
          {/* Search Header Input */}
          <div className="flex items-center px-4 py-3.5 border-b border-border gap-3 bg-card">
            <Search size={18} className="text-muted-foreground flex-shrink-0" />
            <input
              autoFocus
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Search content, projects, templates, AI tools, keywords…"
              className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground/60"
            />
            {loading ? (
              <Loader2 size={16} className="animate-spin text-primary flex-shrink-0" />
            ) : query ? (
              <button onClick={() => setQuery('')} className="text-muted-foreground hover:text-foreground">
                <X size={15} />
              </button>
            ) : (
              <kbd className="hidden sm:inline-flex items-center gap-1 text-[10px] bg-muted border border-border rounded px-1.5 py-0.5 text-muted-foreground font-mono">
                ESC
              </kbd>
            )}
          </div>

          {/* Results List */}
          <div className="p-3 overflow-y-auto space-y-4 max-h-[60vh] divide-y divide-border/40">
            {query.trim().length < 2 ? (
              <div className="py-12 text-center text-xs text-muted-foreground">
                Type at least 2 characters to search across workspace resources…
              </div>
            ) : !loading && !hasAnyResults ? (
              <div className="py-12 text-center text-xs text-muted-foreground">
                No matching results found for <span className="font-semibold text-foreground">"{query}"</span>
              </div>
            ) : (
              <>
                {/* AI Tools */}
                {matchingTools.length > 0 && (
                  <div className="pt-2 first:pt-0">
                    <p className="px-2 pb-1.5 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                      AI Tools
                    </p>
                    <div className="space-y-1">
                      {matchingTools.map(tool => (
                        <button
                          key={tool.id}
                          onClick={() => handleSelect(`/dashboard/tools/${tool.id}`)}
                          className="w-full text-left p-2 rounded-xl hover:bg-accent/60 flex items-center justify-between transition-colors group"
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <div className="h-7 w-7 rounded-lg bg-primary/10 flex items-center justify-center text-primary flex-shrink-0">
                              <Wrench size={13} />
                            </div>
                            <div className="truncate">
                              <p className="text-xs font-semibold text-foreground group-hover:text-primary transition-colors">
                                {tool.name}
                              </p>
                              <p className="text-[10px] text-muted-foreground capitalize">{tool.category} tool</p>
                            </div>
                          </div>
                          <ArrowRight size={12} className="text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Content Library */}
                {results.contents.length > 0 && (
                  <div className="pt-2 first:pt-0">
                    <p className="px-2 pb-1.5 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                      Articles & Content
                    </p>
                    <div className="space-y-1">
                      {results.contents.map(c => (
                        <button
                          key={c.id}
                          onClick={() => handleSelect(`/dashboard/content/${c.id}`)}
                          className="w-full text-left p-2 rounded-xl hover:bg-accent/60 flex items-center justify-between transition-colors group"
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <div className="h-7 w-7 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-500 flex-shrink-0">
                              <FileText size={13} />
                            </div>
                            <div className="truncate">
                              <p className="text-xs font-semibold text-foreground group-hover:text-primary transition-colors">
                                {c.title}
                              </p>
                              <p className="text-[10px] text-muted-foreground capitalize">{c.type} · {c.status}</p>
                            </div>
                          </div>
                          <ArrowRight size={12} className="text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Projects */}
                {results.projects.length > 0 && (
                  <div className="pt-2 first:pt-0">
                    <p className="px-2 pb-1.5 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                      Projects
                    </p>
                    <div className="space-y-1">
                      {results.projects.map(p => (
                        <button
                          key={p.id}
                          onClick={() => handleSelect(`/dashboard/projects/${p.id}`)}
                          className="w-full text-left p-2 rounded-xl hover:bg-accent/60 flex items-center justify-between transition-colors group"
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <div className="h-7 w-7 rounded-lg bg-indigo-500/10 flex items-center justify-center text-indigo-500 flex-shrink-0">
                              <Layers size={13} />
                            </div>
                            <div className="truncate">
                              <p className="text-xs font-semibold text-foreground group-hover:text-primary transition-colors">
                                {p.name}
                              </p>
                              <p className="text-[10px] text-muted-foreground">{p.description || 'Project workspace'}</p>
                            </div>
                          </div>
                          <ArrowRight size={12} className="text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Templates */}
                {results.templates.length > 0 && (
                  <div className="pt-2 first:pt-0">
                    <p className="px-2 pb-1.5 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                      Templates
                    </p>
                    <div className="space-y-1">
                      {results.templates.map(t => (
                        <button
                          key={t.id}
                          onClick={() => handleSelect(`/dashboard/templates`)}
                          className="w-full text-left p-2 rounded-xl hover:bg-accent/60 flex items-center justify-between transition-colors group"
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <div className="h-7 w-7 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-500 flex-shrink-0">
                              <BookTemplate size={13} />
                            </div>
                            <div className="truncate">
                              <p className="text-xs font-semibold text-foreground group-hover:text-primary transition-colors">
                                {t.name}
                              </p>
                              <p className="text-[10px] text-muted-foreground capitalize">{t.category}</p>
                            </div>
                          </div>
                          <ArrowRight size={12} className="text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Keywords */}
                {results.keywords.length > 0 && (
                  <div className="pt-2 first:pt-0">
                    <p className="px-2 pb-1.5 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                      Keywords
                    </p>
                    <div className="space-y-1">
                      {results.keywords.map(k => (
                        <button
                          key={k.id}
                          onClick={() => handleSelect(`/dashboard/seo/keywords`)}
                          className="w-full text-left p-2 rounded-xl hover:bg-accent/60 flex items-center justify-between transition-colors group"
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <div className="h-7 w-7 rounded-lg bg-amber-500/10 flex items-center justify-center text-amber-500 flex-shrink-0">
                              <Hash size={13} />
                            </div>
                            <div className="truncate">
                              <p className="text-xs font-semibold text-foreground group-hover:text-primary transition-colors">
                                {k.keyword}
                              </p>
                              <p className="text-[10px] text-muted-foreground capitalize">{k.intent || 'Keyword research'}</p>
                            </div>
                          </div>
                          <ArrowRight size={12} className="text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>

          {/* Footer Navigation Hints */}
          <div className="px-4 py-2.5 border-t border-border bg-muted/20 flex items-center justify-between text-[11px] text-muted-foreground">
            <span>PressLine Command Intelligence</span>
            <div className="flex items-center gap-3">
              <span>Navigate with click</span>
              <kbd className="bg-background border border-border px-1.5 py-0.5 rounded text-[10px]">ESC</kbd> to exit
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
