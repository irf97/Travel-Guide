import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Social Travel Intelligence OS",
  description: "Social-context travel decision engine for cities, places, events, and routes."
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body>{children}</body>
    </html>
  );
}
