'use client';

import { Button } from '@/components/ui/button';
import { Code2, User, Power, Info } from 'lucide-react';
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
  const router = useRouter();

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
    if (logoClickCount === 5) {
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
        <div className="container max-w-2xl mx-auto flex items-center justify-between p-4">
          <div className="flex items-center gap-3">
              <div onClick={handleLogoClick} className="cursor-pointer" title="ConfessCode">
                 <Code2 className="h-8 w-8 md:h-10 md:w-10 text-primary animate-pulse" />
              </div>
              <Link
                href="/"
                className="text-xl md:text-2xl font-bold text-primary"
              >
                <h1 className="font-code tracking-tighter">
                  <TypeAnimation
                    sequence={[
                      './run <ConfessCode/>',
                      2000,
                      'cat /var/log/anonymous.log',
                      2000,
                      'git blame --guilt',
                      2000,
                    ]}
                    wrapper="span"
                    speed={50}
                    repeat={Infinity}
                    cursor={true}
                  />
                </h1>
              </Link>
          </div>
          <div className="flex items-center gap-2">
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
