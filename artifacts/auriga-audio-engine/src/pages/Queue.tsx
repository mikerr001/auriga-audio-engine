import { useState } from "react";
import { useGetQueue, getGetQueueQueryKey, useEnqueueMessage, useDequeueMessage, useClearQueue } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";

const MSG_TYPES = ["hazard", "guidance", "status", "confidence", "alert", "system"];
const INTERRUPT_LEVELS = ["non-interruptible", "important", "urgent", "critical"];
const SEVERITIES = ["", "low", "moderate", "high", "critical"];

function InterruptBadge({ level }: { level: string }) {
  const cfg: Record<string, string> = {
    "non-interruptible": "text-muted-foreground border-border",
    important: "text-info border-info bg-info/10",
    urgent: "text-warning border-warning bg-warning/10",
    critical: "text-critical border-critical bg-critical/10 glow-critical",
  };
  return <span className={`font-mono text-[10px] px-1.5 py-0.5 rounded border ${cfg[level] ?? ""}`}>{level.replace("non-interruptible", "NON-INT").toUpperCase()}</span>;
}

function PriorityDot({ value }: { value: number }) {
  const color = value >= 80 ? "bg-destructive" : value >= 60 ? "bg-warning" : value >= 40 ? "bg-info" : "bg-chart-2";
  return <span className={`inline-block w-2 h-2 rounded-full ${color} shrink-0`} />;
}

export default function Queue() {
  const qc = useQueryClient();
  const { data: queue, isLoading } = useGetQueue({ query: { queryKey: getGetQueueQueryKey(), refetchInterval: 3000 } });
  const enqueue = useEnqueueMessage();
  const dequeue = useDequeueMessage();
  const clearQueue = useClearQueue();

  const [form, setForm] = useState({
    text: "",
    type: "hazard",
    confidence: "0.85",
    severity: "",
    interruptibility: "important",
    ttlSeconds: "",
  });

  const invalidate = () => qc.invalidateQueries({ queryKey: getGetQueueQueryKey() });

  const handleEnqueue = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.text.trim()) return;
    enqueue.mutate({
      data: {
        text: form.text,
        type: form.type as never,
        confidence: parseFloat(form.confidence),
        severity: (form.severity as never) || null,
        interruptibility: form.interruptibility as never,
        ttlSeconds: form.ttlSeconds ? parseInt(form.ttlSeconds) : null,
      },
    }, { onSuccess: () => { setForm({ ...form, text: "" }); invalidate(); } });
  };

  const handleDequeue = (id: string) => {
    dequeue.mutate({ messageId: id }, { onSuccess: invalidate });
  };

  const handleClear = () => {
    clearQueue.mutate({}, { onSuccess: invalidate });
  };

  const messages = queue?.messages ?? [];

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-mono text-lg font-bold tracking-wide">QUEUE MANAGER</h1>
          <p className="text-xs text-muted-foreground font-mono mt-0.5">Real-time message queue with priority sorting, deduplication, and TTL</p>
        </div>
        <div className="flex items-center gap-3">
          {queue?.overloadRisk && (
            <span className="font-mono text-xs text-critical border border-critical px-2 py-1 rounded glow-critical">OVERLOAD RISK</span>
          )}
          <div className="font-mono text-xs text-muted-foreground">
            {queue?.totalCount ?? 0} queued — {queue?.criticalCount ?? 0} critical — {(queue?.estimatedDuration ?? 0).toFixed(1)}s
          </div>
          <button
            onClick={handleClear}
            disabled={clearQueue.isPending || messages.length === 0}
            className="px-3 py-1.5 border border-warning text-warning font-mono text-xs rounded hover:bg-warning/10 transition-all disabled:opacity-40"
            data-testid="button-clear-queue"
          >
            CLEAR NON-CRITICAL
          </button>
        </div>
      </div>

      <div className="bg-card border border-card-border rounded-lg p-4">
        <div className="font-mono text-xs text-muted-foreground mb-3 uppercase tracking-wider">Enqueue Message</div>
        <form onSubmit={handleEnqueue} className="flex flex-wrap gap-2 items-end" data-testid="form-enqueue">
          <div className="flex-1 min-w-48">
            <label className="font-mono text-xs text-muted-foreground block mb-1">Message Text</label>
            <input
              value={form.text}
              onChange={(e) => setForm({ ...form, text: e.target.value })}
              placeholder="e.g. Obstacle ahead immediately."
              className="w-full bg-background border border-input rounded px-2 py-1.5 font-mono text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-ring placeholder:text-muted-foreground"
              data-testid="input-enqueue-text"
            />
          </div>
          <div>
            <label className="font-mono text-xs text-muted-foreground block mb-1">Type</label>
            <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })} className="bg-background border border-input rounded px-2 py-1.5 font-mono text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-ring" data-testid="select-enqueue-type">
              {MSG_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
          <div>
            <label className="font-mono text-xs text-muted-foreground block mb-1">Interrupt.</label>
            <select value={form.interruptibility} onChange={(e) => setForm({ ...form, interruptibility: e.target.value })} className="bg-background border border-input rounded px-2 py-1.5 font-mono text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-ring" data-testid="select-enqueue-interruptibility">
              {INTERRUPT_LEVELS.map((l) => <option key={l} value={l}>{l}</option>)}
            </select>
          </div>
          <div className="w-24">
            <label className="font-mono text-xs text-muted-foreground block mb-1">Confidence</label>
            <input type="number" step="0.05" min="0" max="1" value={form.confidence} onChange={(e) => setForm({ ...form, confidence: e.target.value })} className="w-full bg-background border border-input rounded px-2 py-1.5 font-mono text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-ring" data-testid="input-enqueue-confidence" />
          </div>
          <div className="w-20">
            <label className="font-mono text-xs text-muted-foreground block mb-1">TTL (s)</label>
            <input type="number" min="1" value={form.ttlSeconds} onChange={(e) => setForm({ ...form, ttlSeconds: e.target.value })} placeholder="∞" className="w-full bg-background border border-input rounded px-2 py-1.5 font-mono text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-ring placeholder:text-muted-foreground" data-testid="input-enqueue-ttl" />
          </div>
          <button type="submit" disabled={enqueue.isPending || !form.text.trim()} className="py-1.5 px-4 bg-info/10 border border-info text-info font-mono text-xs rounded hover:bg-info/20 transition-all disabled:opacity-40" data-testid="button-enqueue-submit">
            {enqueue.isPending ? "..." : "ENQUEUE"}
          </button>
        </form>
      </div>

      <div className="bg-card border border-card-border rounded-lg">
        <div className="p-3 border-b border-border flex items-center gap-4 font-mono text-xs text-muted-foreground">
          <span className="w-10">PRI</span>
          <span className="w-24">INTERRUPT</span>
          <span className="flex-1">MESSAGE</span>
          <span className="w-20">TYPE</span>
          <span className="w-14">CONF</span>
          <span className="w-20">EXPIRES</span>
          <span className="w-16"></span>
        </div>
        {isLoading ? (
          <div className="p-6 text-center font-mono text-xs text-muted-foreground">Loading queue...</div>
        ) : messages.length === 0 ? (
          <div className="p-6 text-center font-mono text-xs text-muted-foreground">Queue is empty</div>
        ) : (
          <div className="divide-y divide-border">
            {messages.map((msg) => (
              <div key={msg.id} className="px-3 py-2.5 flex items-center gap-4 hover:bg-muted/30 transition-colors">
                <div className="w-10 flex items-center gap-1.5">
                  <PriorityDot value={msg.priority} />
                  <span className="font-mono text-xs text-foreground">{msg.priority}</span>
                </div>
                <div className="w-24"><InterruptBadge level={msg.interruptibility} /></div>
                <div className="flex-1 font-mono text-xs text-foreground truncate" data-testid={`text-queue-msg-${msg.id}`}>{msg.text}</div>
                <div className="w-20 font-mono text-xs text-info uppercase">{msg.type}</div>
                <div className="w-14 font-mono text-xs text-foreground">{Math.round(msg.confidence * 100)}%</div>
                <div className="w-20 font-mono text-xs text-muted-foreground">
                  {msg.expiresAt ? new Date(msg.expiresAt).toLocaleTimeString("en-US", { hour12: false, hour: "2-digit", minute: "2-digit" }) : "∞"}
                </div>
                <div className="w-16">
                  <button
                    onClick={() => handleDequeue(msg.id)}
                    className="font-mono text-xs text-critical hover:text-destructive transition-colors"
                    data-testid={`button-dequeue-${msg.id}`}
                  >
                    REMOVE
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
