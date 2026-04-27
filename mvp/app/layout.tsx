import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Social Travel Intelligence OS",
  description: "Social-context travel decision engine for cities, places, events, and routes."
};

const navLinks = [
  { href: "/", label: "Main OS", tone: "ghost" },
  { href: "/world", label: "World Globe", tone: "primary" },
  { href: "/admin", label: "Admin", tone: "ghost" },
  { href: "/lab", label: "Lab", tone: "ghost" },
  { href: "/portal", label: "Portal", tone: "ghost" },
  { href: "/privacy", label: "Privacy", tone: "ghost" },
  { href: "/terms", label: "Terms", tone: "ghost" }
];

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body>
        <nav className="fixed bottom-4 right-4 z-[80] flex max-w-[calc(100vw-2rem)] flex-wrap items-center justify-end gap-2 rounded-3xl border border-white/10 bg-slate-950/80 p-2 text-xs font-black text-white shadow-2xl shadow-sky-950/40 backdrop-blur-xl sm:rounded-full">
          {navLinks.map((link) => (
            <a
              key={link.href}
              className={link.tone === "primary" ? "rounded-full bg-sky-200 px-3 py-2 text-slate-950 transition hover:bg-emerald-200" : "rounded-full border border-white/10 px-3 py-2 text-slate-300 transition hover:border-sky-200/60 hover:text-white"}
              href={link.href}
            >
              {link.label}
            </a>
          ))}
        </nav>
        {children}
      </body>
    </html>
  );
}
