import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { FileText, AlertCircle } from "lucide-react";
import DashboardLayout from "../components/DashboardLayout";
import { useAuth } from "../context/AuthContext";
import { db } from "../lib/firebase";
import { collection, query, where, orderBy, limit, getDocs } from "firebase/firestore";

export default function History() {
  const { user } = useAuth();
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      if (!user) {
        setLoading(false);
        return;
      }
      try {
        const q = query(
          collection(db, "generations"),
          where("user_id", "==", user.uid),
          orderBy("created_at", "desc"),
          limit(50)
        );
        const querySnapshot = await getDocs(q);
        const data = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setRows(data);
      } catch (err) {
        console.error("Failed to fetch history", err);
      }
      setLoading(false);
    };
    load();
  }, [user]);

  return (
    <DashboardLayout>
      <div className="max-w-4xl">
        <h1 className="font-heading text-3xl text-brand-navy mb-1.5">History</h1>
        <p className="text-brand-slate/70 text-sm mb-8">Everything that's come off the press for your account.</p>



        {loading ? (
          <p className="text-brand-slate/60 text-sm">Loading…</p>
        ) : rows.length === 0 ? (
          <div className="rounded-xl border border-dashed border-brand-slate/30 p-10 text-center">
            <FileText size={22} className="mx-auto text-paper-500/50 mb-3" />
            <p className="text-brand-slate/80 text-sm">Nothing's run yet — head to the tool room to generate your first draft.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {rows.map((row, i) => (
              <motion.div
                key={row.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.03 }}
                className="rounded-xl border border-brand-slate/20 bg-brand-white/50 p-5"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-mono uppercase tracking-wide text-brand-violet">{row.tool_name}</span>
                  <span className="text-xs text-paper-500/60">{new Date(row.created_at?.toDate ? row.created_at.toDate() : Date.now()).toLocaleString()}</span>
                </div>
                <p className="text-sm text-brand-ink mb-2">{row.prompt}</p>
                <p className="text-sm text-brand-slate/70 line-clamp-2">{row.output}</p>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
