import { cn } from "@/lib/utils";

export function Card({ className, children }: { className?: string; children: React.ReactNode }) {
  return <div className={cn("glass rounded-2xl p-5", className)}>{children}</div>;
}

export function SoftCard({ className, children }: { className?: string; children: React.ReactNode }) {
  return <div className={cn("soft-card rounded-2xl p-5", className)}>{children}</div>;
}

export function Button({ className, children, ...props }: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      className={cn(
        "rounded-full bg-gradient-to-r from-emerald-300 via-sky-300 to-purple-300 px-4 py-2 font-black text-slate-950 transition hover:scale-[1.01]",
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
}

export function GhostButton({ className, children, ...props }: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      className={cn(
        "rounded-full border border-white/15 bg-white/10 px-4 py-2 font-bold text-white transition hover:border-sky-300/60",
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
}

export function Chip({ children, tone = "default" }: { children: React.ReactNode; tone?: "default" | "good" | "warn" | "risk" }) {
  const tones = {
    default: "border-sky-200/20 bg-sky-300/10 text-sky-100",
    good: "border-emerald-200/20 bg-emerald-300/20 text-emerald-100",
    warn: "border-amber-200/20 bg-amber-300/20 text-amber-100",
    risk: "border-rose-200/20 bg-rose-300/20 text-rose-100"
  };
  return <span className={cn("inline-flex rounded-full border px-2.5 py-1 text-xs font-bold", tones[tone])}>{children}</span>;
}

export function ScoreBar({ label, score, meta }: { label: string; score: number; meta?: string }) {
  return (
    <div className="grid grid-cols-[minmax(120px,240px)_1fr_52px] items-center gap-3">
      <div className="truncate text-sm font-bold text-white">{label}</div>
      <div className="h-3 overflow-hidden rounded-full border border-white/10 bg-white/10">
        <div className="score-fill h-full rounded-full" style={{ width: `${Math.max(0, Math.min(100, score))}%` }} />
      </div>
      <div className="text-right text-sm font-black text-white">{score}</div>
      {meta ? <div className="col-span-3 text-xs text-slate-400">{meta}</div> : null}
    </div>
  );
}
