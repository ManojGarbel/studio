import type { Metadata, Viewport } from "next";
import { Inter, Source_Code_Pro } from "next/font/google";
import "./globals.css";
import { cn } from "@/lib/utils";
import { Toaster } from "@/components/ui/toaster";
import Header from "@/components/header";

const fontBody = Inter({
  subsets: ["latin"],
  variable: "--font-body",
});

const fontCode = Source_Code_Pro({
  subsets: ["latin"],
  variable: "--font-code",
  weight: ["400", "600", "700"],
});

export const metadata: Metadata = {
  title: "<ConfessCode/>",
  description: "Anonymously confess your coding sins.",
  manifest: "/manifest.webmanifest",
};

export const viewport: Viewport = {
  themeColor: "#00ffe0",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark h-full">
      <body
        className={cn(
          "relative min-h-screen antialiased font-body flex flex-col bg-background text-foreground",
          fontBody.variable,
          fontCode.variable
        )}
      >
        {/* 🌌 Animated Space Background */}
        <div id="stars1"></div>
        <div id="stars2"></div>
        <div id="stars3"></div>
        <div className="scanlines pointer-events-none"></div>

        {/* 🛰️ Sticky Header */}
        <Header />

        {/* 📜 Main Content (scrollable) */}
        <main className="flex-1 w-full py-8">
          <div className="container max-w-2xl mx-auto px-4">
            {children}
          </div>
        </main>

        {/* ⚡ Hacker Footer */}
        <footer className="py-6 border-t border-border bg-background/80 backdrop-blur-md shadow-[0_-0_12px_rgba(0,255,255,0.2)]">
          <div className="container flex flex-col items-center justify-between gap-4 md:h-16 md:flex-row">
            <p className="text-xs font-mono text-muted-foreground cursor-blink">
              &gt; built with 🖤 :: source code classified
            </p>
          </div>
        </footer>

        {/* 🔔 Toast Notifications */}
        <Toaster />
      </body>
    </html>
  );
}
