'use client';

import { Button } from '@/components/ui/button';
import { Code2, User } from 'lucide-react';
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
    
    const interval = setInterval(checkActivation, 500);
    return () => clearInterval(interval);

  }, []);

  return (
    <header className="bg-background/80 border-b border-primary/30 backdrop-blur-sm sticky top-0 z-10 shadow-lg shadow-primary/10">
      <div className="container max-w-2xl mx-auto flex items-center justify-between p-4">
        <Link href="/" className="flex items-center gap-2 text-xl md:text-2xl font-bold text-primary">
          <Code2 className="h-6 w-6 md:h-7 md:w-7" />
          <h1 className="font-code tracking-tighter">
            <TypeAnimation
              sequence={[
                '<ConfessCode/>',
                2000,
                '<Anonymous_Log/>',
                2000,
                '<Git_Guilt/>',
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
          <div className="flex items-center gap-2 text-sm font-mono text-muted-foreground bg-secondary px-3 py-1.5 rounded-md border border-primary/30 shadow-md shadow-primary/10">
            <User className="h-4 w-4 text-primary" />
            <span>{anonHash.substring(0, 6)}...</span>
          </div>
        ) : (
          <Button asChild>
            <Link href="/activate">Activate</Link>
          </Button>
        )}
      </div>
    </header>
  );
};

export default Header;
