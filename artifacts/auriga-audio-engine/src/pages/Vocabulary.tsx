import { useGetAudioVocabulary, getGetAudioVocabularyQueryKey } from "@workspace/api-client-react";
import { useCallback } from "react";

function playTone(frequency: number, duration: number, pattern: string) {
  try {
    const ctx = new AudioContext();
    const play = (freq: number, startTime: number, dur: number) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = "sine";
      osc.frequency.setValueAtTime(freq, startTime);
      gain.gain.setValueAtTime(0.3, startTime);
      gain.gain.exponentialRampToValueAtTime(0.001, startTime + dur / 1000);
      osc.start(startTime);
      osc.stop(startTime + dur / 1000);
    };

    const durS = duration / 1000;
    const now = ctx.currentTime;

    if (pattern === "single") {
      play(frequency, now, duration);
    } else if (pattern === "double") {
      play(frequency, now, duration * 0.6);
      play(frequency, now + durS * 0.7, duration * 0.6);
    } else if (pattern === "triple") {
      play(frequency, now, duration * 0.5);
      play(frequency, now + durS * 0.55, duration * 0.5);
      play(frequency, now + durS * 1.1, duration * 0.5);
    } else if (pattern === "ascending") {
      play(frequency, now, duration * 0.4);
      play(frequency * 1.25, now + durS * 0.45, duration * 0.4);
      play(frequency * 1.5, now + durS * 0.9, duration * 0.4);
    } else if (pattern === "descending") {
      play(frequency * 1.5, now, duration * 0.4);
      play(frequency * 1.25, now + durS * 0.45, duration * 0.4);
      play(frequency, now + durS * 0.9, duration * 0.4);
    } else {
      play(frequency, now, duration);
    }
  } catch {
    // AudioContext not available
  }
}

const TYPE_COLORS: Record<string, string> = {
  confirmation: "text-safe border-safe bg-safe/10",
  warning: "text-warning border-warning bg-warning/10",
  critical: "text-critical border-critical bg-critical/10",
  navigation: "text-info border-info bg-info/10",
  "state-change": "text-chart-5 border-chart-5 bg-chart-5/10",
  error: "text-critical border-critical bg-critical/10",
};

export default function Vocabulary() {
  const { data: vocab } = useGetAudioVocabulary({ query: { queryKey: getGetAudioVocabularyQueryKey() } });
  const alerts = vocab?.alerts ?? [];

  const handlePlay = useCallback((freq: number, dur: number, pattern: string) => {
    playTone(freq, dur, pattern);
  }, []);

  const grouped: Record<string, typeof alerts> = {};
  for (const a of alerts) {
    if (!grouped[a.alertType]) grouped[a.alertType] = [];
    grouped[a.alertType].push(a);
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-mono text-lg font-bold tracking-wide">AUDIO VOCABULARY</h1>
          <p className="text-xs text-muted-foreground font-mono mt-0.5">Complete auditory vocabulary — every sound has documented meaning</p>
        </div>
        <div className="font-mono text-xs text-muted-foreground">v{vocab?.version ?? "—"} — {alerts.length} tones defined</div>
      </div>

      {Object.entries(grouped).map(([type, items]) => (
        <div key={type} className="bg-card border border-card-border rounded-lg p-4">
          <div className={`font-mono text-xs mb-4 uppercase tracking-wider px-2 py-0.5 rounded border inline-block ${TYPE_COLORS[type] ?? "text-muted-foreground border-border"}`}>
            {type}
          </div>
          <div className="grid grid-cols-2 gap-3">
            {items.map((alert) => (
              <div key={alert.id} className={`border rounded-lg p-3 ${TYPE_COLORS[alert.alertType] ?? "border-border"}`}>
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1">
                    <div className="font-mono text-xs font-bold text-foreground">{alert.name}</div>
                    <div className="font-mono text-[10px] text-muted-foreground mt-0.5">{alert.id}</div>
                  </div>
                  <button
                    onClick={() => handlePlay(alert.frequency ?? 440, alert.duration ?? 300, alert.pattern ?? "single")}
                    className={`shrink-0 px-2.5 py-1 font-mono text-xs rounded border transition-all hover:opacity-80 ${TYPE_COLORS[alert.alertType] ?? "border-border text-muted-foreground"}`}
                    data-testid={`button-play-${alert.id}`}
                  >
                    PLAY
                  </button>
                </div>
                <div className="mt-2 space-y-1">
                  <div className="font-mono text-xs text-foreground leading-relaxed"><span className="text-muted-foreground">Meaning: </span>{alert.meaning}</div>
                  <div className="font-mono text-[10px] text-muted-foreground leading-relaxed"><span className="uppercase">Usage:</span> {alert.usage}</div>
                  <div className="flex gap-3 mt-1.5 font-mono text-[10px] text-muted-foreground">
                    {alert.frequency != null && <span>{alert.frequency} Hz</span>}
                    {alert.duration != null && <span>{alert.duration} ms</span>}
                    {alert.pattern && <span className="uppercase">{alert.pattern}</span>}
                    <span>Priority {alert.priority}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
