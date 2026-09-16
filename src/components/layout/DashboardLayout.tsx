import { type ReactNode } from 'react';
import AppSidebar from './AppSidebar';
import TopBar from './TopBar';
import { useWorkspace } from '@/context/WorkspaceContext';
import { Plus, Folder } from 'lucide-react';

export default function DashboardLayout({ children }: { children: ReactNode }) {
  const { workspace, loading } = useWorkspace();

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <AppSidebar />
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <TopBar />
        <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8 relative">
          {loading ? (
             <div className="flex items-center justify-center h-full">
               <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
             </div>
          ) : !workspace ? (
             <div className="flex flex-col items-center justify-center h-full max-w-md mx-auto text-center space-y-4">
               <div className="h-16 w-16 bg-muted rounded-full flex items-center justify-center">
                 <Folder size={32} className="text-muted-foreground" />
               </div>
               <h2 className="text-2xl font-bold">No Workspace Found</h2>
               <p className="text-muted-foreground text-sm">
                 You need a workspace to create content and manage tools. Use the dropdown in the sidebar top-left to create one.
               </p>
             </div>
          ) : (
            children
          )}
        </main>
      </div>
    </div>
  );
}
