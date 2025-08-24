import type { Metadata, Viewport } from 'next';
import { Roboto_Mono, Fira_Code } from 'next/font/google';
import './globals.css';
import { cn } from '@/lib/utils';
import { Toaster } from '@/components/ui/toaster';
import Header from '@/components/header';
import Link from 'next/link';

const fontBody = Roboto_Mono({
  subsets: ['latin'],
  variable: '--font-body',
});

const fontCode = Fira_Code({
  subsets: ['latin'],
  variable: '--font-code',
});

export const metadata: Metadata = {
  title: '<ConfessCode/>',
  description: 'Anonymously confess your coding sins.',
  manifest: '/manifest.webmanifest',
};

export const viewport: Viewport = {
  themeColor: '#00ffe0',
};


export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full dark">
      <body
        className={cn(
          'relative h-full antialiased font-code stars-bg',
          fontBody.variable,
          fontCode.variable
        )}
      >
        <div id="stars1"></div>
        <div id="stars2"></div>
        <div id="stars3"></div>
        <Header />
        <main className="relative flex flex-col min-h-screen">
          <div className="flex-grow flex-1 pt-24 md:pt-32">{children}</div>
          <footer className="py-6 md:px-8 md:py-0">
            <div className="container flex flex-col items-center justify-between gap-4 md:h-24 md:flex-row">
              <p className="text-balance text-center text-sm leading-loose text-muted-foreground md:text-left">
                Built with 🖤. The source code is not yet available.
              </p>
            </div>
          </footer>
        </main>
        <Toaster />
      </body>
    </html>
  );
}
