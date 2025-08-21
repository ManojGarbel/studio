import { Code2 } from 'lucide-react';

const Header = () => {
  return (
    <header className="bg-card border-b sticky top-0 z-10">
      <div className="container max-w-2xl mx-auto flex items-center justify-center p-4">
        <div className="flex items-center gap-2 text-2xl font-bold text-primary">
          <Code2 className="h-7 w-7" />
          <h1 className="font-headline tracking-tighter">
            &lt;Confess<span className="text-foreground">Code</span>/&gt;
          </h1>
        </div>
      </div>
    </header>
  );
};

export default Header;
