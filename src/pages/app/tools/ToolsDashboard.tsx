import { useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { AI_TOOLS } from '@/config/ai-tools';
import { Search, Sparkles, Zap, ChevronRight } from 'lucide-react';

export default function ToolsDashboard() {
  const [searchParams] = useSearchParams();
  const categoryFilter = searchParams.get('category');
  const [searchQuery, setSearchQuery] = useState('');

  const tools = Object.values(AI_TOOLS).filter(tool => {
    if (categoryFilter && tool.category !== categoryFilter) return false;
    if (searchQuery && !tool.name.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Sparkles className="text-primary" /> 
            AI Tool Suite
          </h1>
          <p className="text-muted-foreground mt-1">Supercharge your content with specialized AI agents.</p>
        </div>

        <div className="relative w-full md:w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
          <input
            type="text"
            placeholder="Search tools..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full h-10 pl-9 pr-4 rounded-lg border border-input bg-background focus:ring-2 focus:ring-ring outline-none"
          />
        </div>
      </div>

      {tools.length === 0 ? (
        <div className="text-center py-20 bg-card rounded-xl border border-border">
          <p className="text-muted-foreground">No tools found for this search.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {tools.map(tool => (
            <Link
              key={tool.id}
              to={`/dashboard/tools/${tool.id}`}
              className="group flex flex-col bg-card border border-border rounded-xl p-5 hover:border-primary/50 hover:shadow-md transition-all"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
                  <Sparkles size={18} />
                </div>
                <div className="flex items-center gap-1 bg-accent px-2 py-1 rounded-md text-[10px] font-medium text-muted-foreground">
                  <Zap size={10} className="text-yellow-500" />
                  {tool.creditCost}
                </div>
              </div>
              <h3 className="font-semibold mb-1 group-hover:text-primary transition-colors">{tool.name}</h3>
              <p className="text-xs text-muted-foreground line-clamp-2 flex-1">{tool.description}</p>
              
              <div className="mt-4 pt-4 border-t border-border flex items-center justify-between text-xs font-medium text-primary opacity-0 group-hover:opacity-100 transition-opacity">
                <span>Use tool</span>
                <ChevronRight size={14} />
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
