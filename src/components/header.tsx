'use client';

import { Button } from '@/components/ui/button';
import { Code2, User, Power } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import Cookies from 'js-cookie';
import { TypeAnimation } from 'react-type-animation';

const Header = () => {
  const [isActivated, setIsActivated] = useState(false);
  const [anonHash, setAnonHash] = useState<string | undefined>(undefined);

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

  return (
    <header className="bg-background/80 border-b border-primary/30 backdrop-blur-sm sticky top-0 z-10 shadow-lg shadow-primary/10">
      <div className="container max-w-2xl mx-auto flex items-center justify-between p-4">
        <Link
          href="/"
          className="flex items-center gap-3 text-xl md:text-2xl font-bold text-primary"
        >
          <Code2 className="h-8 w-8 md:h-10 md:w-10 animate-pulse" />
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
        {isActivated && anonHash ? (
          <div className="flex items-center gap-2 text-xs md:text-sm font-mono text-cyan-400 bg-black/50 border border-cyan-400/30 px-3 py-1.5 rounded-md shadow-md shadow-cyan-400/10">
            <User className="h-4 w-4 text-cyan-400" />
            <span>usr_anon::{anonHash.substring(0, 6)}</span>
          </div>
        ) : (
          <Button asChild variant="outline">
            <Link href="/activate">
              <Power className="mr-2" />
              Activate
            </Link>
          </Button>
        )}
      </div>
    </header>
  );
};

export default Header;
