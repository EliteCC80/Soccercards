import "./globals.css";
import Link from "next/link";
import type { ReactNode } from "react";

export const metadata = { title: "Soccercards — kansinschattingen met openbaar trackrecord", description: "Elke voorspelling wordt vóór de aftrap vastgelegd in een controleerbare keten. Ook de foute." };

export default function Layout({ children }: { children: ReactNode }) {
  return (
    <html lang="nl">
      <body className="min-h-screen font-sans antialiased">
        <header className="border-b border-stone-200 bg-white">
          <nav className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
            <Link href="/" className="font-semibold">Soccercards</Link>
            <Link href="/trackrecord" className="text-sm text-stone-700 hover:underline">Trackrecord</Link>
          </nav>
        </header>
        <main className="mx-auto max-w-5xl px-4 py-8">{children}</main>
        <footer className="mx-auto max-w-5xl px-4 py-8 text-xs text-stone-500">
          Kansinschattingen, geen financieel advies en geen winstbelofte. 18+. Gokken kan verslavend zijn.
        </footer>
      </body>
    </html>
  );
}
