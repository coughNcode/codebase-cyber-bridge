import { createFileRoute } from "@tanstack/react-router";
import { Brain } from "lucide-react";
import { Bar, BarChart, CartesianGrid, Cell, Line, LineChart, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { FEATURES, FEATURE_WEIGHTS } from "@/lib/mock";
import { useStore } from "@/lib/store";
import { useNow } from "@/hooks/use-live";
import { Card, Chip, Dot, PageTitle, ago, scoreTone } from "@/components/ws/ui";

export const Route = createFileRoute("/ml")({
  head: () => ({
    meta: [
      { title: "ML Guard — WalletShield" },
      { name: "description", content: "Adaptive anomaly model: live risk gauge, feature importance and score timeline." },
      { property: "og:title", content: "ML Guard — WalletShield" },
      { property: "og:description", content: "Adaptive ML anomaly detection for AI payments." },
    ],
  }),
  component: MLGuard,
});

const tip = { background: "var(--card)", border: "1px solid var(--border)", fontFamily: "IBM Plex Mono", fontSize: 11 };

function MLGuard() {
  const { decisions, mlPhase, lastRetrain } = useStore();
  const now = useNow();
  const hot = mlPhase === "HOT";
  const current = decisions[0]?.ml_score ?? 0;
  const timeline = decisions.slice(0, 20).reverse().map((d, i) => ({ i: i + 1, score: +d.ml_score.toFixed(2) }));
  const feats = FEATURES.map((f, i) => ({ ...f, w: FEATURE_WEIGHTS[i] ?? 0 })).sort((a, b) => b.w - a.w);

  return (
    <>
      <PageTitle title="ML Guard" sub="adaptive anomaly detection sidecar :4033" />
      <Card>
        <div className="flex items-center gap-4">
          <Brain className="h-10 w-10 text-ml" />
          <div>
            <div className="flex items-center gap-3">
              <h2 className="text-2xl font-bold tracking-widest">ML GUARD</h2>
              {hot ? <Chip tone="safe"><Dot tone="safe" />HOT -- XGBClassifier</Chip> : <Chip tone="warn">WARM -- IsolationForest</Chip>}
            </div>
            <p className="mt-1 font-mono text-xs text-muted-foreground">
              Training samples: {hot ? 57 : 47} | Attack recall: 100% | Last retrained: {lastRetrain ? ago(lastRetrain, now) : "2m ago"}
            </p>
          </div>
        </div>
      </Card>
      <div className="mt-4 grid grid-cols-2 gap-4">
        <Card title="Live Risk Gauge"><Gauge score={current} /></Card>
        <Card title="Feature Importance">
          {hot ? (
            <div className="h-64">
              <ResponsiveContainer>
                <BarChart data={feats} layout="vertical" margin={{ left: 40 }}>
                  <XAxis type="number" hide />
                  <YAxis type="category" dataKey="name" width={150} tick={{ fill: "var(--muted)", fontSize: 10, fontFamily: "IBM Plex Mono" }} axisLine={false} tickLine={false} />
                  <Tooltip cursor={{ fill: "var(--panel)" }} contentStyle={tip} itemStyle={{ color: "var(--foreground)" }} formatter={(v, _n, p) => [`${v} — ${(p as { payload?: { info?: string } }).payload?.info ?? ""}`, "weight"]} />
                  <Bar dataKey="w" radius={[0, 3, 3, 0]}>
                    {feats.map((f) => <Cell key={f.name} fill={f.w > 0.15 ? "var(--accent)" : f.w > 0.08 ? "var(--ml)" : "var(--muted)"} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="flex h-64 items-center justify-center rounded border border-dashed text-center font-mono text-xs text-muted-foreground">
              Run the benchmark and retrain to see feature weights
            </div>
          )}
        </Card>
      </div>
      <Card className="mt-4" title="Risk Score Timeline">
        <div className="h-60">
          <ResponsiveContainer>
            <LineChart data={timeline}>
              <CartesianGrid stroke="var(--border)" strokeDasharray="2 4" />
              <XAxis dataKey="i" tick={{ fill: "var(--muted)", fontSize: 10 }} stroke="var(--border)" />
              <YAxis domain={[0, 1]} tick={{ fill: "var(--muted)", fontSize: 10 }} stroke="var(--border)" />
              <Tooltip contentStyle={tip} itemStyle={{ color: "var(--foreground)" }} />
              <ReferenceLine y={0.6} stroke="var(--warn)" strokeDasharray="5 5" />
              <ReferenceLine y={0.85} stroke="var(--danger)" strokeDasharray="5 5" />
              <Line type="monotone" dataKey="score" stroke="var(--accent)" strokeWidth={2} dot={{ r: 3, fill: "var(--accent)" }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </Card>
    </>
  );
}

function Gauge({ score }: { score: number }) {
  const R = 110, cx = 140, cy = 130;
  const tone = scoreTone(score);
  const color = { safe: "text-safe", warn: "text-warn", danger: "text-danger" }[tone];
  return (
    <div className={`flex flex-col items-center rounded-lg p-4 transition-shadow ${score > 0.85 ? "glow-danger" : score < 0.6 ? "glow-safe" : ""}`}>
      <svg viewBox="0 0 280 150" className="w-full max-w-sm">
        <defs>
          <linearGradient id="g" x1="0" x2="1">
            <stop offset="0" stopColor="var(--safe)" />
            <stop offset="0.6" stopColor="var(--warn)" />
            <stop offset="1" stopColor="var(--danger)" />
          </linearGradient>
        </defs>
        <path d={`M ${cx - R} ${cy} A ${R} ${R} 0 0 1 ${cx + R} ${cy}`} fill="none" stroke="url(#g)" strokeWidth="16" strokeLinecap="round" />
        <g style={{ transform: `rotate(${score * 180}deg)`, transformOrigin: `${cx}px ${cy}px`, transition: "transform 300ms ease-out" }}>
          <line x1={cx} y1={cy} x2={cx - R + 18} y2={cy} stroke="var(--foreground)" strokeWidth="3" strokeLinecap="round" />
        </g>
        <circle cx={cx} cy={cy} r="7" fill="var(--foreground)" />
      </svg>
      <div className={`font-mono text-5xl font-semibold ${color}`}>{score.toFixed(2)}</div>
      <div className="font-mono text-[11px] text-muted-foreground">risk score of latest payment</div>
    </div>
  );
}
