import type { Metadata, Viewport } from 'next';
import { Inter, Source_Code_Pro } from 'next/font/google';
import './globals.css';
import { cn } from '@/lib/utils';
import { Toaster } from '@/components/ui/toaster';
import Header from '@/components/header';
import Link from 'next/link';

const fontBody = Inter({
  subsets: ['latin'],
  variable: '--font-body',
});

const fontCode = Source_Code_Pro({
  subsets: ['latin'],
  variable: '--font-code',
});

export const metadata: Metadata = {
  title: '<ConfessCode/>',
  description: 'Anonymously confess your coding sins.',
  manifest: '/manifest.webmanifest',
};

export const viewport: Viewport = {
  themeColor: '#00FFFF',
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
          'relative h-full antialiased font-code',
          fontBody.variable,
          fontCode.variable
        )}
      >
        <main className="relative flex flex-col min-h-screen">
          <Header />
          <div className="flex-grow flex-1">{children}</div>
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
