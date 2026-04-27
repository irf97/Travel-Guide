import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Social Travel Intelligence OS",
  description: "Social-context travel decision engine for cities, places, events, and routes."
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body>
        <nav className="fixed bottom-4 right-4 z-[80] flex flex-wrap items-center gap-2 rounded-full border border-white/10 bg-slate-950/80 p-2 text-xs font-black text-white shadow-2xl shadow-sky-950/40 backdrop-blur-xl">
          <a className="rounded-full border border-white/10 px-3 py-2 text-slate-300 transition hover:border-sky-200/60 hover:text-white" href="/">Main OS</a>
          <a className="rounded-full bg-sky-200 px-3 py-2 text-slate-950 transition hover:bg-emerald-200" href="/world">World Globe</a>
        </nav>
        {children}
      </body>
    </html>
  );
}
