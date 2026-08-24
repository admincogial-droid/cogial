import { useParams, Link } from 'react-router-dom';
import { AI_TOOLS } from '@/config/ai-tools';
import { AIToolEngine } from '@/components/ai/AIToolEngine';
import { ArrowLeft } from 'lucide-react';

export default function ToolSlug() {
  const { toolId } = useParams<{ toolId: string }>();
  const tool = toolId ? AI_TOOLS[toolId] : undefined;

  if (!tool) {
    return (
      <div className="p-6 max-w-7xl mx-auto text-center">
        <h1 className="text-2xl font-bold mb-4">Tool not found</h1>
        <Link to="/dashboard/tools" className="text-primary hover:underline">
          &larr; Back to Tools
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full p-4 lg:p-6 max-w-[1600px] mx-auto w-full">
      <div className="mb-6 flex items-center gap-4">
        <Link 
          to="/dashboard/tools" 
          className="p-2 -ml-2 rounded-lg hover:bg-accent text-muted-foreground transition-colors"
        >
          <ArrowLeft size={18} />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-foreground">{tool.name}</h1>
          <p className="text-sm text-muted-foreground">{tool.description}</p>
        </div>
      </div>
      
      <div className="flex-1 min-h-0">
        <AIToolEngine tool={tool} />
      </div>
    </div>
  );
}
