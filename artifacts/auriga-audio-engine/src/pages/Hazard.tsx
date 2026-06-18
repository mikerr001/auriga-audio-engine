import { useState } from "react";
import { useGenerateHazardMessage } from "@workspace/api-client-react";

const HAZARD_TYPES = ["obstacle", "drop-off", "stairs-down", "stairs-up", "door", "narrow-passage", "surface-change", "unknown"];
const SEVERITIES = ["low", "moderate", "high", "critical"];
const DIRECTIONS = ["ahead", "left", "right", "slightly-left", "slightly-right", "behind"];
const URGENCIES = ["low", "moderate", "high", "immediate"];

function PriorityBar({ value }: { value: number }) {
  const color = value >= 80 ? "bg-destructive glow-critical" : value >= 60 ? "bg-warning glow-warning" : value >= 40 ? "bg-info glow-info" : "bg-chart-2";
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 bg-muted rounded-full h-2">
        <div className={`h-2 rounded-full transition-all ${color}`} style={{ width: `${value}%` }} />
      </div>
      <span className="font-mono text-xs text-foreground w-8 text-right">{value}</span>
    </div>
  );
}

function InterruptBadge({ level }: { level: string }) {
  const colors: Record<string, string> = {
    "non-interruptible": "text-muted-foreground border-border",
    important: "text-info border-info bg-info",
    urgent: "text-warning border-warning bg-warning",
    critical: "text-critical border-critical bg-critical glow-critical",
  };
  return (
    <span className={`font-mono text-xs px-2 py-0.5 rounded border ${colors[level] ?? ""}`}>
      {level.toUpperCase()}
    </span>
  );
}

export default function Hazard() {
  const generate = useGenerateHazardMessage();
  const [form, setForm] = useState({
    hazardType: "obstacle",
    severity: "moderate",
    distance: "2.0",
    direction: "ahead",
    confidence: "0.85",
    urgency: "moderate",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    generate.mutate({
      data: {
        hazardType: form.hazardType as never,
        severity: form.severity as never,
        distance: parseFloat(form.distance),
        direction: form.direction as never,
        confidence: parseFloat(form.confidence),
        urgency: form.urgency as never,
      },
    });
  };

  const msg = generate.data;

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="font-mono text-lg font-bold tracking-wide">HAZARD COMMUNICATOR</h1>
        <p className="text-xs text-muted-foreground font-mono mt-0.5">Generate hazard communication messages with severity, direction, and urgency</p>
      </div>

      <div className="grid grid-cols-2 gap-6">
        <div className="bg-card border border-card-border rounded-lg p-5">
          <div className="font-mono text-xs text-muted-foreground mb-4 uppercase tracking-wider">Hazard Parameters</div>
          <form onSubmit={handleSubmit} className="space-y-4" data-testid="form-hazard">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="font-mono text-xs text-muted-foreground block mb-1">Hazard Type</label>
                <select
                  value={form.hazardType}
                  onChange={(e) => setForm({ ...form, hazardType: e.target.value })}
                  className="w-full bg-background border border-input rounded px-2 py-1.5 font-mono text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
                  data-testid="select-hazard-type"
                >
                  {HAZARD_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div>
                <label className="font-mono text-xs text-muted-foreground block mb-1">Severity</label>
                <select
                  value={form.severity}
                  onChange={(e) => setForm({ ...form, severity: e.target.value })}
                  className="w-full bg-background border border-input rounded px-2 py-1.5 font-mono text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
                  data-testid="select-hazard-severity"
                >
                  {SEVERITIES.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div>
                <label className="font-mono text-xs text-muted-foreground block mb-1">Direction</label>
                <select
                  value={form.direction}
                  onChange={(e) => setForm({ ...form, direction: e.target.value })}
                  className="w-full bg-background border border-input rounded px-2 py-1.5 font-mono text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
                  data-testid="select-hazard-direction"
                >
                  {DIRECTIONS.map((d) => <option key={d} value={d}>{d}</option>)}
                </select>
              </div>
              <div>
                <label className="font-mono text-xs text-muted-foreground block mb-1">Urgency</label>
                <select
                  value={form.urgency}
                  onChange={(e) => setForm({ ...form, urgency: e.target.value })}
                  className="w-full bg-background border border-input rounded px-2 py-1.5 font-mono text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
                  data-testid="select-hazard-urgency"
                >
                  {URGENCIES.map((u) => <option key={u} value={u}>{u}</option>)}
                </select>
              </div>
              <div>
                <label className="font-mono text-xs text-muted-foreground block mb-1">Distance (m)</label>
                <input
                  type="number" step="0.1" min="0" max="20"
                  value={form.distance}
                  onChange={(e) => setForm({ ...form, distance: e.target.value })}
                  className="w-full bg-background border border-input rounded px-2 py-1.5 font-mono text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
                  data-testid="input-hazard-distance"
                />
              </div>
              <div>
                <label className="font-mono text-xs text-muted-foreground block mb-1">Confidence (0–1)</label>
                <input
                  type="number" step="0.05" min="0" max="1"
                  value={form.confidence}
                  onChange={(e) => setForm({ ...form, confidence: e.target.value })}
                  className="w-full bg-background border border-input rounded px-2 py-1.5 font-mono text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
                  data-testid="input-hazard-confidence"
                />
              </div>
            </div>
            <button
              type="submit"
              disabled={generate.isPending}
              className="w-full py-2 bg-destructive/20 border border-critical text-critical font-mono text-xs rounded hover:bg-destructive/30 transition-all disabled:opacity-50"
              data-testid="button-generate-hazard"
            >
              {generate.isPending ? "GENERATING..." : "GENERATE HAZARD MESSAGE"}
            </button>
          </form>
        </div>

        <div className="bg-card border border-card-border rounded-lg p-5">
          <div className="font-mono text-xs text-muted-foreground mb-4 uppercase tracking-wider">Generated Message</div>
          {!msg ? (
            <div className="text-xs text-muted-foreground font-mono text-center py-12">
              Configure hazard parameters and generate
            </div>
          ) : (
            <div className="space-y-4">
              <div className="bg-background border border-critical/40 rounded-lg p-4 glow-critical">
                <div className="font-mono text-sm font-bold text-foreground leading-relaxed">{msg.text}</div>
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs text-muted-foreground">Priority</span>
                  <div className="w-48"><PriorityBar value={msg.priority} /></div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs text-muted-foreground">Confidence</span>
                  <span className="font-mono text-xs text-foreground">{Math.round(msg.confidence * 100)}%</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs text-muted-foreground">Interruptibility</span>
                  <InterruptBadge level={msg.interruptibility} />
                </div>
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs text-muted-foreground">Type</span>
                  <span className="font-mono text-xs text-info uppercase">{msg.type}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs text-muted-foreground">Verbosity</span>
                  <span className="font-mono text-xs text-foreground uppercase">{msg.verbosityLevel}</span>
                </div>
                {msg.expiresAt && (
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs text-muted-foreground">Expires</span>
                    <span className="font-mono text-xs text-warning">{new Date(msg.expiresAt).toLocaleTimeString()}</span>
                  </div>
                )}
              </div>
              <div className="border-t border-border pt-3">
                <div className="font-mono text-xs text-muted-foreground mb-1">Reasoning</div>
                <div className="font-mono text-xs text-foreground leading-relaxed">{msg.reasoning}</div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
