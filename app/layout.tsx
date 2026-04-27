import './globals.css';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'World Intelligence',
  description: 'Open-data travel and investor intelligence platform.'
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
