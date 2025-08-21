'use client';

import { Button } from '@/components/ui/button';
import { Code2, User } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import Cookies from 'js-cookie';


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
    
    // Check for cookie changes periodically
    const interval = setInterval(checkActivation, 1000);
    return () => clearInterval(interval);

  }, []);

  return (
    <header className="bg-card border-b sticky top-0 z-10">
      <div className="container max-w-2xl mx-auto flex items-center justify-between p-4">
        <Link href="/" className="flex items-center gap-2 text-2xl font-bold text-primary">
          <Code2 className="h-7 w-7" />
          <h1 className="font-headline tracking-tighter">
            &lt;Confess<span className="text-foreground">Code</span>/&gt;
          </h1>
        </Link>
        {isActivated && anonHash ? (
          <div className="flex items-center gap-2 text-sm font-mono text-muted-foreground bg-secondary px-3 py-1.5 rounded-md">
            <User className="h-4 w-4" />
            <span>{anonHash.substring(0, 6)}...</span>
          </div>
        ) : (
          <Button asChild>
            <Link href="/activate">Sign Up</Link>
          </Button>
        )}
      </div>
    </header>
  );
};

export default Header;
