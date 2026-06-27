import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";
export const metadata: Metadata = {
  title: "Modern MC JVM tuning · tuning.wfrz.eu",
  description: "Opinionated guide to JVM tuning for Minecraft servers in 2026. Stop blindly using Aikar's flags — pick the right collector for your heap and Java version.",
};
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500;600&display=swap" />
      </head>
      <body>
        <nav className="border-b border-border/60 bg-surface/60 backdrop-blur sticky top-0 z-10">
          <div className="max-w-4xl mx-auto px-5 py-3 flex items-center justify-between">
            <Link href="/" className="font-extrabold text-lg">tuning<span className="text-brand">.</span>wfrz<span className="text-dim">.eu</span></Link>
            <div className="flex gap-4 text-sm text-dim">
              <Link href="/aikar" className="hover:text-text">Stop using Aikar verbatim</Link>
              <Link href="/zgc" className="hover:text-text">ZGC for big heaps</Link>
              <Link href="/openj9" className="hover:text-text">OpenJ9 low-RAM</Link>
              <a href="https://aikar.wfrz.eu" className="text-brand hover:underline">Generator →</a>
            </div>
          </div>
        </nav>
        {children}
        <footer className="border-t border-border/70 py-8 text-sm text-dim">
          <div className="max-w-4xl mx-auto px-5 flex items-center justify-between flex-wrap gap-4">
            <div>Opinionated. Tested. <a className="hover:text-text" href="https://github.com/WhiteFreezing/tuning-wfrz">Source on GitHub</a>.</div>
            <a href="https://aikar.wfrz.eu" className="text-brand hover:underline">Generate your flags →</a>
          </div>
        </footer>
      </body>
    </html>
  );
}
