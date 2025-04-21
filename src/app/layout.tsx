import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";
import Link from "next/link";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "SEO Audit",
  description: "Working on SEO Audit",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    // suppress hydration warnings on html/body due to theme script injection
    <html lang="en" suppressHydrationWarning>
      <body suppressHydrationWarning className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <Providers>
          <div className="flex min-h-screen">
            <aside className="w-64 bg-white dark:bg-gray-900 border-r">
              <div className="p-4 border-b">
                <Link href="/audit" className="text-xl font-bold">SEO Audit</Link>
              </div>
              <nav className="p-4 space-y-2">
                <Link href="/audit" className="block px-4 py-2 rounded hover:bg-gray-100 dark:hover:bg-gray-800">Website Analysis</Link>
                <Link href="/history" className="block px-4 py-2 rounded hover:bg-gray-100 dark:hover:bg-gray-800">SEO History</Link>
                <Link href="/competitive" className="block px-4 py-2 rounded hover:bg-gray-100 dark:hover:bg-gray-800">Recommendations</Link>
                <Link href="/settings" className="block px-4 py-2 rounded hover:bg-gray-100 dark:hover:bg-gray-800">Settings</Link>
              </nav>
            </aside>
            <div className="flex-1 flex flex-col">
              <main className="flex-1 p-6">{children}</main>
            </div>
          </div>
        </Providers>
      </body>
    </html>
  );
}
