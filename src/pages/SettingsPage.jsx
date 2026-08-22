import DashboardLayout from "../components/DashboardLayout";
import { useAuth } from "../context/AuthContext";

export default function SettingsPage() {
  const { user } = useAuth();

  return (
    <DashboardLayout>
      <div className="max-w-2xl">
        <h1 className="font-heading text-3xl text-brand-navy mb-1.5">Settings</h1>
        <p className="text-brand-slate/70 text-sm mb-8">Your account and connected publishing sites.</p>

        <div className="rounded-xl border border-brand-slate/20 bg-brand-white/50 p-6 mb-5">
          <h2 className="text-brand-navy font-medium mb-4">Account</h2>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between border-b border-brand-slate/20 pb-3">
              <span className="text-brand-slate/70">Name</span>
              <span className="text-brand-ink">{user?.displayName || "—"}</span>
            </div>
            <div className="flex justify-between border-b border-brand-slate/20 pb-3">
              <span className="text-brand-slate/70">Email</span>
              <span className="text-brand-ink">{user?.email || "Not signed in"}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-brand-slate/70">Plan</span>
              <span className="text-brand-violet font-medium">Cub Press</span>
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-brand-slate/20 bg-brand-white/50 p-6">
          <h2 className="text-brand-navy font-medium mb-4">Connected sites</h2>
          <p className="text-sm text-brand-slate/70 mb-4">
            Connect a WordPress or Blogger site to publish drafts directly from the tool room.
          </p>
          <button className="rounded-full border border-brand-slate/30 text-brand-navy text-sm px-4 py-2 hover:border-brand-violet/50 transition-colors">
            + Connect a site
          </button>
        </div>
      </div>
    </DashboardLayout>
  );
}
