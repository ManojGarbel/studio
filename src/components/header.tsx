
'use client';

import { Button } from '@/components/ui/button';
import { Code2, User, Power, Info, Download } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import Cookies from 'js-cookie';
import { TypeAnimation } from 'react-type-animation';
import InfoDialog from './info-dialog';
import { useRouter } from 'next/navigation';

const Header = () => {
  const [isActivated, setIsActivated] = useState(false);
  const [anonHash, setAnonHash] = useState<string | undefined>(undefined);
  const [isInfoOpen, setIsInfoOpen] = useState(false);
  const [logoClickCount, setLogoClickCount] = useState(0);
  const [installPrompt, setInstallPrompt] = useState<any>(null);
  const router = useRouter();
  
  useEffect(() => {
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setInstallPrompt(e);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!installPrompt) return;
    installPrompt.prompt();
    const { outcome } = await installPrompt.userChoice;
    if (outcome === 'accepted') {
      setInstallPrompt(null);
    }
  };


  useEffect(() => {
    const checkActivation = () => {
      const activated = Cookies.get('is_activated') === 'true';
      const hash = Cookies.get('anon_hash');
      setIsActivated(activated);
      setAnonHash(hash);
    };

    checkActivation();

    // Check for cookie changes periodically to update UI across tabs
    const interval = setInterval(checkActivation, 500);
    return () => clearInterval(interval);
  }, []);
  
  useEffect(() => {
    if (logoClickCount === 3) {
      router.push('/admin/login');
      setLogoClickCount(0); // Reset count
    }

    const timer = setTimeout(() => {
      if (logoClickCount > 0) {
        setLogoClickCount(0);
      }
    }, 1500); // Reset count after 1.5 seconds of inactivity

    return () => clearTimeout(timer);
  }, [logoClickCount, router]);

  const handleLogoClick = () => {
    setLogoClickCount((prevCount) => prevCount + 1);
  };


  return (
    <>
      <header className="bg-background/80 border-b border-primary/30 backdrop-blur-sm sticky top-0 z-10 shadow-lg shadow-primary/10">
        <div className="container max-w-2xl mx-auto flex items-center justify-between p-4 min-h-[92px] md:min-h-0">
          <div className="flex items-center gap-3">
              <div onClick={handleLogoClick} className="cursor-pointer" title="ConfessCode">
                 <Code2 className="h-8 w-8 md:h-10 md:w-10 text-primary animate-pulse" />
              </div>
              <Link
                href="/"
                className="text-xl md:text-2xl font-bold text-primary"
              >
                <div className="h-[56px] md:h-auto flex items-center overflow-hidden">
                    <h1 className="font-code tracking-tighter">
                    <TypeAnimation
                        sequence={[
                            'Confess @ <ConfessCode/>', 2000,
                            'Spill @ <ConfessCode/>', 2000,
                            'Secret @ <ConfessCode/>', 2000,
                            'Whisper @ <ConfessCode/>', 2000,
                            'Expose @ <ConfessCode/>', 2000,
                            'Reveal @ <ConfessCode/>', 2000,
                            'Confession @ <ConfessCode/>', 2000,
                            'Truth @ <ConfessCode/>', 2000,
                            'Dump @ <ConfessCode/>', 2000,
                            'Unmask @ <ConfessCode/>', 2000,
                            'Admit @ <ConfessCode/>', 2000,
                            'Vent @ <ConfessCode/>', 2000,
                            'Release @ <ConfessCode/>', 2000,
                            'Unfold @ <ConfessCode/>', 2000,
                            'Drop @ <ConfessCode/>', 2000,
                            'Unveil @ <ConfessCode/>', 2000,
                            'Confide @ <ConfessCode/>', 2000,
                            'Leak @ <ConfessCode/>', 2000,
                            'Disclose @ <ConfessCode/>', 2000,
                            'Express @ <ConfessCode/>', 2000,
                        ]}
                        wrapper="span"
                        speed={50}
                        repeat={Infinity}
                        cursor={true}
                    />
                    </h1>
                </div>
              </Link>
          </div>
          <div className="flex items-center gap-2">
            {installPrompt && (
               <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleInstallClick}
                  aria-label="Install App"
                  title="Install ConfessCode"
                  className="hover:text-accent hover:shadow-[0_0_20px_theme(colors.accent)]"
                >
                  <Download />
                </Button>
            )}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsInfoOpen(true)}
              aria-label="Information"
              className="hover:text-accent hover:shadow-[0_0_20px_theme(colors.accent)]"
            >
              <Info />
            </Button>
            {isActivated && anonHash ? (
              <div className="hidden md:flex items-center gap-2 text-xs md:text-sm font-mono text-cyan-400 bg-black/50 border border-cyan-400/30 px-3 py-1.5 rounded-md shadow-md shadow-cyan-400/10">
                <User className="h-4 w-4 text-cyan-400" />
                <span>usr_anon::{anonHash.substring(0, 6)}</span>
              </div>
            ) : (
              <Button asChild variant="outline" className="hidden md:inline-flex">
                <Link href="/activate">
                  <Power className="mr-2" />
                  Activate
                </Link>
              </Button>
            )}
          </div>
        </div>
      </header>
      <InfoDialog open={isInfoOpen} onOpenChange={setIsInfoOpen} />
    </>
  );
};

export default Header;
