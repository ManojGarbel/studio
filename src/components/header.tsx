import { Button } from '@/components/ui/button';
import { Code2, User } from 'lucide-react';
import Link from 'next/link';
import { cookies } from 'next/headers';

const Header = () => {
  const isActivated = cookies().get('is_activated')?.value === 'true';
  const anonHash = cookies().get('anon_hash')?.value;

  return (
    <header className="bg-card border-b sticky top-0 z-10">
      <div className="container max-w-2xl mx-auto flex items-center justify-between p-4">
        <div className="flex items-center gap-2 text-2xl font-bold text-primary">
          <Code2 className="h-7 w-7" />
          <h1 className="font-headline tracking-tighter">
            &lt;Confess<span className="text-foreground">Code</span>/&gt;
          </h1>
        </div>
        {isActivated && anonHash ? (
          <div className="flex items-center gap-2 text-sm font-mono text-muted-foreground bg-secondary px-3 py-1.5 rounded-md">
            <User className="h-4 w-4" />
            <span>{anonHash.substring(0, 6)}...</span>
          </div>
        ) : (
          <Button asChild variant="secondary">
            <Link href="/activate">Sign Up</Link>
          </Button>
        )}
      </div>
    </header>
  );
};

export default Header;
