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
          "relative min-h-screen antialiased font-body flex flex-col bg-background text-foreground selection:bg-accent/30 selection:text-accent",
          fontBody.variable,
          fontCode.variable
        )}
      >
        {/* 🌌 Cyber Background */}
        <div id="stars1"></div>
        <div id="stars2"></div>
        <div id="stars3"></div>
        <div className="scanlines pointer-events-none"></div>
        <div className="fixed inset-0 bg-gradient-to-b from-black/80 via-transparent to-black/80 pointer-events-none"></div>

        {/* 🛰️ Floating Sticky Header */}
        <Header />

        {/* 📜 Main Content */}
        <main className="flex-1 w-full relative z-10 pt-24 pb-24">
          <div className="container max-w-2xl mx-auto px-4">
            {children}
          </div>
        </main>

        {/* ⚡ Hacker Footer (floating bar) */}
        <footer className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 w-[92%] max-w-2xl rounded-2xl bg-background/80 backdrop-blur-md border border-cyan-400/40 shadow-[0_0_20px_rgba(0,255,255,0.25)] px-4 py-3 flex flex-col md:flex-row items-center justify-between gap-2">
          <p className="text-xs font-mono text-muted-foreground cursor-blink">
            &gt; crafted by{" "}
            <a
              href="https://www.github.com/HakkanShah"
              target="_blank"
              rel="noopener noreferrer"
              className="underline decoration-dotted hover:text-primary transition-colors"
            >
              Hakkan
            </a>
          </p>
          <p className="text-[10px] text-muted-foreground font-mono opacity-70">
            system@v1.0.0 &nbsp;|&nbsp; status::online
          </p>
        </footer>

        {/* 🔔 Toast Notifications */}
        <Toaster />
      </body>
    </html>
  );
}
