import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";

export const metadata: Metadata = {
  title: "Soccercards",
  description: "Inventaris en listing-status van je voetbalkaarten",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="nl">
      <body className="min-h-screen antialiased">
        <header className="border-b border-black/10 dark:border-white/10">
          <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-4">
            <Link href="/" className="text-lg font-semibold">
              Soccercards
            </Link>
            <nav className="flex items-center gap-4 text-sm">
              <a href="/api/export" className="underline underline-offset-4">
                CSV export
              </a>
              <Link
                href="/cards/new"
                className="rounded-md bg-emerald-600 px-3 py-1.5 font-medium text-white hover:bg-emerald-700"
              >
                Kaart toevoegen
              </Link>
            </nav>
          </div>
        </header>
        <main className="mx-auto max-w-5xl px-4 py-8">{children}</main>
      </body>
    </html>
  );
}
