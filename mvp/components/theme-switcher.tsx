"use client";

import { useEffect, useState } from "react";

const themes = [
  { id: "cosmic", label: "Cosmic" },
  { id: "ocean", label: "Ocean" },
  { id: "sunset", label: "Sunset" },
  { id: "forest", label: "Forest" }
] as const;

type ThemeId = typeof themes[number]["id"];

export function ThemeSwitcher() {
  const [theme, setTheme] = useState<ThemeId>("cosmic");

  useEffect(() => {
    const saved = window.localStorage.getItem("stio-theme") as ThemeId | null;
    const next = themes.some((item) => item.id === saved) ? saved! : "cosmic";
    setTheme(next);
    document.documentElement.dataset.theme = next;
  }, []);

  function changeTheme(next: ThemeId) {
    setTheme(next);
    document.documentElement.dataset.theme = next;
    window.localStorage.setItem("stio-theme", next);
  }

  return <div className="flex items-center gap-1 rounded-full border border-white/10 bg-slate-950/75 p-1 shadow-xl shadow-black/30 backdrop-blur-xl">
    {themes.map((item) => <button key={item.id} onClick={() => changeTheme(item.id)} className={theme === item.id ? "rounded-full bg-sky-200 px-2.5 py-1.5 text-[10px] font-black text-slate-950" : "rounded-full px-2.5 py-1.5 text-[10px] font-black text-slate-300 hover:bg-white/10"}>{item.label}</button>)}
  </div>;
}
