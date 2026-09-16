import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'sonner';
import { AuthProvider } from './context/AuthContext';
import { WorkspaceProvider } from './context/WorkspaceContext';
import { ProtectedRoute, AdminRoute, GuestRoute } from './components/ProtectedRoute';
import { lazy, Suspense } from 'react';
import { Loader2 } from 'lucide-react';

// ─── Public Pages ─────────────────────────────────────────────────
import NotFound from './pages/NotFound';
import Landing from './pages/public/Landing';
import {
  FeaturesPage as Features,
  PricingPage as Pricing,
  AboutPage as About,
  ContactPage as Contact,
  FAQPage as FAQ,
  BlogListPage as BlogList,
  BlogPostPage as BlogPost,
  PrivacyPage as Privacy,
  TermsPage as Terms,
  RefundPage as Refund,
} from './pages/public/PublicPages';

// ─── Auth Pages ───────────────────────────────────────────────────
const Login = lazy(() => import('./pages/auth/Login'));
const Signup = lazy(() => import('./pages/auth/Signup'));
const ForgotPassword = lazy(() => import('./pages/auth/ForgotPassword'));
const ResetPassword = lazy(() => import('./pages/auth/ResetPassword'));
const Onboarding = lazy(() => import('./pages/auth/Onboarding'));

// ─── Dashboard Pages ──────────────────────────────────────────────
const DashboardHome = lazy(() => import('./pages/app/DashboardHome'));
const AIWriter = lazy(() => import('./pages/app/ai/AIWriter'));
const BulkGenerator = lazy(() => import('./pages/app/ai/BulkGenerator'));
const ContentLibrary = lazy(() => import('./pages/app/content/ContentLibrary'));
const ContentEditor = lazy(() => import('./pages/app/content/ContentEditor'));
const Templates = lazy(() => import('./pages/app/content/Templates'));
const BrandVoice = lazy(() => import('./pages/app/content/BrandVoice'));

const Projects = lazy(() => import('./pages/app/workspace/Projects'));
const ProjectDetail = lazy(() => import('./pages/app/workspace/ProjectDetail'));

const KeywordExplorer = lazy(() => import('./pages/app/seo/KeywordExplorer'));
const KeywordClustering = lazy(() => import('./pages/app/seo/KeywordClustering'));
const CompetitorAnalysis = lazy(() => import('./pages/app/seo/CompetitorAnalysis'));

const AffiliateHub = lazy(() => import('./pages/app/affiliate/AffiliateHub'));

const AutomationPage = lazy(() => import('./pages/app/automation/AutomationPage'));
const IntegrationsHub = lazy(() => import('./pages/app/integrations/IntegrationsHub'));
const AnalyticsDashboard = lazy(() => import('./pages/app/analytics/AnalyticsDashboard'));
const BillingPage = lazy(() => import('./pages/app/billing/BillingPage'));
const TeamPage = lazy(() => import('./pages/app/settings/TeamPage'));
const SettingsPage = lazy(() => import('./pages/app/settings/SettingsPage'));
const HelpPage = lazy(() => import('./pages/app/workspace/HelpPage'));
const ToolsDashboard = lazy(() => import('./pages/app/tools/ToolsDashboard'));
const ToolSlug = lazy(() => import('./pages/app/tools/ToolSlug'));
const GenerationHistory = lazy(() => import('./pages/app/tools/GenerationHistory'));

// ─── Admin Pages ──────────────────────────────────────────────────
const AdminDashboard = NotFound;
const AdminUsers = NotFound;
const AdminWorkspaces = NotFound;
const AdminAIUsage = NotFound;
const AdminFeatureFlags = NotFound;
const AdminBlog = NotFound;

const queryClient = new QueryClient({
  defaultOptions: { queries: { staleTime: 60 * 1000, retry: 1 } },
});

function PageLoader() {
  return (
    <div className="flex h-screen items-center justify-center">
      <Loader2 className="animate-spin text-primary" size={24} />
    </div>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <WorkspaceProvider>
          <BrowserRouter>
            <Suspense fallback={<PageLoader />}>
              <Routes>
                {/* Public */}
                <Route path="/" element={<Landing />} />
                <Route path="/features" element={<Features />} />
                <Route path="/pricing" element={<Pricing />} />
                <Route path="/about" element={<About />} />
                <Route path="/contact" element={<Contact />} />
                <Route path="/faq" element={<FAQ />} />
                <Route path="/blog" element={<BlogList />} />
                <Route path="/blog/:slug" element={<BlogPost />} />
                <Route path="/privacy" element={<Privacy />} />
                <Route path="/terms" element={<Terms />} />
                <Route path="/refund" element={<Refund />} />

                {/* Auth */}
                <Route path="/login" element={<GuestRoute><Login /></GuestRoute>} />
                <Route path="/signup" element={<GuestRoute><Signup /></GuestRoute>} />
                <Route path="/forgot-password" element={<GuestRoute><ForgotPassword /></GuestRoute>} />
                <Route path="/reset-password" element={<ResetPassword />} />
                <Route path="/onboarding" element={<ProtectedRoute><Onboarding /></ProtectedRoute>} />

                {/* Dashboard */}
                <Route path="/dashboard" element={<ProtectedRoute><DashboardHome /></ProtectedRoute>} />
                <Route path="/dashboard/ai-writer" element={<ProtectedRoute><AIWriter /></ProtectedRoute>} />
                <Route path="/dashboard/ai-writer/article" element={<ProtectedRoute><AIWriter /></ProtectedRoute>} />
                <Route path="/dashboard/ai-writer/review" element={<ProtectedRoute><AIWriter /></ProtectedRoute>} />
                <Route path="/dashboard/bulk" element={<ProtectedRoute><BulkGenerator /></ProtectedRoute>} />
                <Route path="/dashboard/content" element={<ProtectedRoute><ContentLibrary /></ProtectedRoute>} />
                <Route path="/dashboard/content/:id" element={<ProtectedRoute><ContentEditor /></ProtectedRoute>} />
                <Route path="/dashboard/templates" element={<ProtectedRoute><Templates /></ProtectedRoute>} />
                <Route path="/dashboard/brand-voice" element={<ProtectedRoute><BrandVoice /></ProtectedRoute>} />
                <Route path="/dashboard/tools" element={<ProtectedRoute><ToolsDashboard /></ProtectedRoute>} />
                <Route path="/dashboard/tools/:toolId" element={<ProtectedRoute><ToolSlug /></ProtectedRoute>} />
                <Route path="/dashboard/history" element={<ProtectedRoute><GenerationHistory /></ProtectedRoute>} />
                <Route path="/dashboard/projects" element={<ProtectedRoute><Projects /></ProtectedRoute>} />
                <Route path="/dashboard/projects/:id" element={<ProtectedRoute><ProjectDetail /></ProtectedRoute>} />
                <Route path="/dashboard/seo/keywords" element={<ProtectedRoute><KeywordExplorer /></ProtectedRoute>} />
                <Route path="/dashboard/seo/clusters" element={<ProtectedRoute><KeywordClustering /></ProtectedRoute>} />
                <Route path="/dashboard/seo/competitors" element={<ProtectedRoute><CompetitorAnalysis /></ProtectedRoute>} />
                <Route path="/dashboard/affiliate" element={<ProtectedRoute><AffiliateHub /></ProtectedRoute>} />
                <Route path="/dashboard/affiliate/links" element={<ProtectedRoute><AffiliateHub /></ProtectedRoute>} />
                <Route path="/dashboard/affiliate/products" element={<ProtectedRoute><AffiliateHub /></ProtectedRoute>} />
                <Route path="/dashboard/affiliate/campaigns" element={<ProtectedRoute><AffiliateHub /></ProtectedRoute>} />
                <Route path="/dashboard/automation" element={<ProtectedRoute><AutomationPage /></ProtectedRoute>} />
                <Route path="/dashboard/integrations" element={<ProtectedRoute><IntegrationsHub /></ProtectedRoute>} />
                <Route path="/dashboard/analytics" element={<ProtectedRoute><AnalyticsDashboard /></ProtectedRoute>} />
                <Route path="/dashboard/billing" element={<ProtectedRoute><BillingPage /></ProtectedRoute>} />
                <Route path="/dashboard/team" element={<ProtectedRoute><TeamPage /></ProtectedRoute>} />
                <Route path="/dashboard/settings" element={<ProtectedRoute><SettingsPage /></ProtectedRoute>} />
                <Route path="/dashboard/help" element={<ProtectedRoute><HelpPage /></ProtectedRoute>} />

                {/* Admin */}
                <Route path="/admin" element={<AdminRoute><AdminDashboard /></AdminRoute>} />
                <Route path="/admin/users" element={<AdminRoute><AdminUsers /></AdminRoute>} />
                <Route path="/admin/workspaces" element={<AdminRoute><AdminWorkspaces /></AdminRoute>} />
                <Route path="/admin/ai-usage" element={<AdminRoute><AdminAIUsage /></AdminRoute>} />
                <Route path="/admin/feature-flags" element={<AdminRoute><AdminFeatureFlags /></AdminRoute>} />
                <Route path="/admin/blog" element={<AdminRoute><AdminBlog /></AdminRoute>} />

                <Route path="*" element={<NotFound />} />
              </Routes>
            </Suspense>
          </BrowserRouter>
          <Toaster richColors position="top-right" />
        </WorkspaceProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}
