import type { Metadata } from "next";
import { ThemeSwitcher } from "@/components/theme-switcher";
import "./globals.css";

export const metadata: Metadata = {
  title: "Social Travel Intelligence OS",
  description: "Social-context travel decision engine for cities, places, events, and routes."
};

const navLinks = [
  { href: "/", label: "World", tone: "primary" },
  { href: "/rankings", label: "Rankings", tone: "ghost" },
  { href: "/trips", label: "Trips", tone: "ghost" },
  { href: "/cities/barcelona-spain", label: "City", tone: "ghost" },
  { href: "/lab", label: "Lab", tone: "ghost" },
  { href: "/portal", label: "Portal", tone: "ghost" },
  { href: "/admin", label: "Admin", tone: "ghost" }
];

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark" data-theme="cosmic">
      <body>
        <div className="fixed right-4 top-4 z-[90]"><ThemeSwitcher /></div>
        <nav className="fixed bottom-3 left-1/2 z-[80] flex max-w-[calc(100vw-1rem)] -translate-x-1/2 flex-wrap items-center justify-center gap-2 rounded-3xl border border-white/10 bg-slate-950/85 p-2 text-xs font-black text-white shadow-2xl shadow-sky-950/40 backdrop-blur-xl sm:bottom-4 sm:rounded-full">
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
