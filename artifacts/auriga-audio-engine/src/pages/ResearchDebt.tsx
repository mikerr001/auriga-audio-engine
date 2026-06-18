import { useState } from "react";
import { useGetResearchDebt, getGetResearchDebtQueryKey, useAddResearchDebt } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";

const CATEGORIES = ["speech-model", "priority-model", "cognitive-load", "hazard-detection", "user-study", "tts-integration", "multilingual", "failure-mode"];
const SEVERITIES = ["low", "medium", "high", "critical"];

function SeverityBadge({ sev }: { sev: string }) {
  const cfg: Record<string, string> = {
    low: "text-safe border-safe bg-safe/10",
    medium: "text-info border-info bg-info/10",
    high: "text-warning border-warning bg-warning/10",
    critical: "text-critical border-critical bg-critical/10",
  };
  return <span className={`font-mono text-[10px] px-1.5 py-0.5 rounded border ${cfg[sev] ?? "text-muted-foreground border-border"}`}>{sev.toUpperCase()}</span>;
}

export default function ResearchDebt() {
  const qc = useQueryClient();
  const { data, isLoading } = useGetResearchDebt({ query: { queryKey: getGetResearchDebtQueryKey() } });
  const addDebt = useAddResearchDebt();
  const [filterSev, setFilterSev] = useState("");
  const [filterCat, setFilterCat] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    category: "speech-model",
    title: "",
    description: "",
    severity: "medium",
    impact: "",
    assumptions: "",
    failureModes: "",
  });

  const entries = (data?.entries ?? []).filter((e) => {
    if (filterSev && e.severity !== filterSev) return false;
    if (filterCat && e.category !== filterCat) return false;
    return true;
  });

  const handleAdd = (ev: React.FormEvent) => {
    ev.preventDefault();
    if (!form.title.trim()) return;
    addDebt.mutate({
      data: {
        category: form.category as never,
        title: form.title,
        description: form.description,
        severity: form.severity as never,
        impact: form.impact,
        assumptions: form.assumptions.split("\n").filter(Boolean),
        failureModes: form.failureModes.split("\n").filter(Boolean),
      },
    }, {
      onSuccess: () => {
        qc.invalidateQueries({ queryKey: getGetResearchDebtQueryKey() });
        setForm({ category: "speech-model", title: "", description: "", severity: "medium", impact: "", assumptions: "", failureModes: "" });
        setShowForm(false);
      },
    });
  };

  const grouped: Record<string, typeof entries> = {};
  for (const e of entries) {
    if (!grouped[e.category]) grouped[e.category] = [];
    grouped[e.category].push(e);
  }

  const criticalCount = (data?.entries ?? []).filter((e) => e.severity === "critical").length;
  const highCount = (data?.entries ?? []).filter((e) => e.severity === "high").length;

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-mono text-lg font-bold tracking-wide">RESEARCH DEBT REGISTER</h1>
          <p className="text-xs text-muted-foreground font-mono mt-0.5">Unvalidated assumptions, open failure modes, and known limitations</p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="px-4 py-1.5 border border-info text-info font-mono text-xs rounded hover:bg-info/10 transition-all"
          data-testid="button-toggle-add-debt"
        >
          {showForm ? "CANCEL" : "+ ADD ENTRY"}
        </button>
      </div>

      <div className="grid grid-cols-4 gap-3">
        {[
          { label: "Total Entries", value: data?.entries.length ?? 0, color: "text-foreground" },
          { label: "Critical", value: criticalCount, color: criticalCount > 0 ? "text-critical" : "text-safe" },
          { label: "High", value: highCount, color: highCount > 0 ? "text-warning" : "text-safe" },
          { label: "Categories", value: Object.keys(grouped).length, color: "text-info" },
        ].map((stat) => (
          <div key={stat.label} className="bg-card border border-card-border rounded-lg p-3 text-center">
            <div className={`font-mono text-2xl font-bold ${stat.color}`}>{stat.value}</div>
            <div className="font-mono text-[10px] text-muted-foreground mt-0.5">{stat.label}</div>
          </div>
        ))}
      </div>

      {showForm && (
        <div className="bg-card border border-card-border rounded-lg p-4">
          <div className="font-mono text-xs text-muted-foreground mb-3 uppercase tracking-wider">Add Research Debt Entry</div>
          <form onSubmit={handleAdd} className="space-y-3" data-testid="form-add-debt">
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="font-mono text-xs text-muted-foreground block mb-1">Category</label>
                <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} className="w-full bg-background border border-input rounded px-2 py-1.5 font-mono text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-ring" data-testid="select-debt-category">
                  {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className="font-mono text-xs text-muted-foreground block mb-1">Severity</label>
                <select value={form.severity} onChange={(e) => setForm({ ...form, severity: e.target.value })} className="w-full bg-background border border-input rounded px-2 py-1.5 font-mono text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-ring" data-testid="select-debt-severity">
                  {SEVERITIES.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div>
                <label className="font-mono text-xs text-muted-foreground block mb-1">Title</label>
                <input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className="w-full bg-background border border-input rounded px-2 py-1.5 font-mono text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-ring" placeholder="Short title" data-testid="input-debt-title" />
              </div>
            </div>
            <div>
              <label className="font-mono text-xs text-muted-foreground block mb-1">Description</label>
              <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={2} className="w-full bg-background border border-input rounded px-2 py-1.5 font-mono text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-ring resize-none" placeholder="Detailed description of the debt" data-testid="textarea-debt-description" />
            </div>
            <div>
              <label className="font-mono text-xs text-muted-foreground block mb-1">Impact</label>
              <input value={form.impact} onChange={(e) => setForm({ ...form, impact: e.target.value })} className="w-full bg-background border border-input rounded px-2 py-1.5 font-mono text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-ring" placeholder="What is the consequence if unresolved?" data-testid="input-debt-impact" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="font-mono text-xs text-muted-foreground block mb-1">Assumptions (one per line)</label>
                <textarea value={form.assumptions} onChange={(e) => setForm({ ...form, assumptions: e.target.value })} rows={3} className="w-full bg-background border border-input rounded px-2 py-1.5 font-mono text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-ring resize-none" placeholder="Each assumption on its own line" data-testid="textarea-debt-assumptions" />
              </div>
              <div>
                <label className="font-mono text-xs text-muted-foreground block mb-1">Failure Modes (one per line)</label>
                <textarea value={form.failureModes} onChange={(e) => setForm({ ...form, failureModes: e.target.value })} rows={3} className="w-full bg-background border border-input rounded px-2 py-1.5 font-mono text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-ring resize-none" placeholder="Each failure mode on its own line" data-testid="textarea-debt-failure-modes" />
              </div>
            </div>
            <button type="submit" disabled={addDebt.isPending || !form.title.trim()} className="px-6 py-2 bg-info/10 border border-info text-info font-mono text-xs rounded hover:bg-info/20 transition-all disabled:opacity-50" data-testid="button-submit-debt">
              {addDebt.isPending ? "ADDING..." : "ADD ENTRY"}
            </button>
          </form>
        </div>
      )}

      <div className="flex gap-3">
        <select value={filterSev} onChange={(e) => setFilterSev(e.target.value)} className="bg-background border border-input rounded px-2 py-1.5 font-mono text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-ring" data-testid="select-filter-severity">
          <option value="">— all severities —</option>
          {SEVERITIES.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
        <select value={filterCat} onChange={(e) => setFilterCat(e.target.value)} className="bg-background border border-input rounded px-2 py-1.5 font-mono text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-ring" data-testid="select-filter-category">
          <option value="">— all categories —</option>
          {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
        <span className="font-mono text-xs text-muted-foreground self-center">{entries.length} entries shown</span>
      </div>

      {isLoading ? (
        <div className="font-mono text-xs text-muted-foreground">Loading...</div>
      ) : entries.length === 0 ? (
        <div className="bg-card border border-card-border rounded-lg p-8 text-center font-mono text-xs text-muted-foreground">
          No research debt entries found — run a simulation or add entries manually
        </div>
      ) : (
        <div className="space-y-6">
          {Object.entries(grouped).map(([cat, items]) => (
            <div key={cat}>
              <div className="font-mono text-xs text-info uppercase tracking-wider mb-2">{cat} ({items.length})</div>
              <div className="space-y-3">
                {items.map((entry) => (
                  <div key={entry.id} className="bg-card border border-card-border rounded-lg p-4">
                    <div className="flex items-start gap-3 mb-2">
                      <SeverityBadge sev={entry.severity} />
                      <div className="flex-1">
                        <div className="font-mono text-xs font-bold text-foreground">{entry.title}</div>
                        <div className="font-mono text-[10px] text-muted-foreground mt-0.5">{new Date(entry.createdAt).toLocaleDateString()}</div>
                      </div>
                    </div>
                    <div className="font-mono text-xs text-foreground mb-2">{entry.description}</div>
                    <div className="font-mono text-xs text-muted-foreground mb-2">
                      <span className="text-warning">Impact: </span>{entry.impact}
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      {entry.assumptions.length > 0 && (
                        <div>
                          <div className="font-mono text-[10px] text-muted-foreground uppercase mb-1">Assumptions</div>
                          {entry.assumptions.map((a, i) => (
                            <div key={i} className="font-mono text-[10px] text-foreground">◦ {a}</div>
                          ))}
                        </div>
                      )}
                      {entry.failureModes.length > 0 && (
                        <div>
                          <div className="font-mono text-[10px] text-muted-foreground uppercase mb-1">Failure Modes</div>
                          {entry.failureModes.map((f, i) => (
                            <div key={i} className="font-mono text-[10px] text-critical">▸ {f}</div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
