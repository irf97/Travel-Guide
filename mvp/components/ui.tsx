import { cn } from "@/lib/utils";

export function Card({ className, children }: { className?: string; children: React.ReactNode }) {
  return <div className={cn("glass rounded-[1.75rem] p-5 md:p-6", className)}>{children}</div>;
}

export function SoftCard({ className, children }: { className?: string; children: React.ReactNode }) {
  return <div className={cn("soft-card rounded-[1.5rem] p-5", className)}>{children}</div>;
}

export function SectionHeader({ eyebrow, title, body }: { eyebrow?: string; title: string; body?: string }) {
  return (
    <div className="mb-6 max-w-4xl">
      {eyebrow ? <p className="mb-2 text-xs font-black uppercase tracking-[0.24em] text-sky-200/80">{eyebrow}</p> : null}
      <h1 className="text-3xl font-black tracking-[-0.045em] text-white md:text-5xl">{title}</h1>
      {body ? <p className="mt-3 max-w-3xl text-base leading-7 text-slate-300 md:text-lg">{body}</p> : null}
    </div>
  );
}

export function Button({ className, children, ...props }: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      className={cn(
        "rounded-full bg-gradient-to-r from-emerald-200 via-sky-200 to-purple-200 px-4 py-2.5 font-black text-slate-950 shadow-[0_18px_50px_rgba(125,211,252,0.14)] transition hover:scale-[1.01] hover:shadow-[0_18px_60px_rgba(125,211,252,0.22)]",
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
        "rounded-full border border-white/12 bg-white/[0.06] px-4 py-2.5 font-bold text-slate-100 transition hover:border-sky-200/50 hover:bg-white/[0.09]",
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
}

export function Chip({ children, tone = "default" }: { children: React.ReactNode; tone?: "default" | "good" | "warn" | "risk" | "muted" }) {
  const tones = {
    default: "border-sky-200/20 bg-sky-300/10 text-sky-100",
    good: "border-emerald-200/20 bg-emerald-300/18 text-emerald-100",
    warn: "border-amber-200/20 bg-amber-300/16 text-amber-100",
    risk: "border-rose-200/20 bg-rose-300/16 text-rose-100",
    muted: "border-white/10 bg-white/[0.05] text-slate-300"
  };
  return <span className={cn("inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-bold", tones[tone])}>{children}</span>;
}

export function FieldLabel({ children }: { children: React.ReactNode }) {
  return <label className="mb-1.5 block text-xs font-black uppercase tracking-[0.18em] text-slate-400">{children}</label>;
}

export function JsonPanel({ children, className }: { children: React.ReactNode; className?: string }) {
  return <pre className={cn("max-h-[540px] overflow-auto rounded-2xl border border-white/10 bg-slate-950/55 p-4 text-xs leading-5 text-sky-100/90", className)}>{children}</pre>;
}

export function ScoreBar({ label, score, meta }: { label: string; score: number; meta?: string }) {
  return (
    <div className="rounded-2xl border border-white/8 bg-white/[0.035] p-3">
      <div className="grid grid-cols-[minmax(96px,240px)_1fr_48px] items-center gap-3">
        <div className="truncate text-sm font-bold text-slate-100">{label}</div>
        <div className="h-3 overflow-hidden rounded-full border border-white/10 bg-white/10">
          <div className="score-fill h-full rounded-full" style={{ width: `${Math.max(0, Math.min(100, score))}%` }} />
        </div>
        <div className="text-right text-sm font-black text-white">{score}</div>
      </div>
      {meta ? <div className="mt-2 text-xs leading-5 text-slate-400">{meta}</div> : null}
    </div>
  );
}
