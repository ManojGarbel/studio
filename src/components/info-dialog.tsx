'use client';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from './ui/button';
import { ScrollArea } from './ui/scroll-area';
import useSound from '@/hooks/use-sound';
import { SOUNDS } from '@/lib/sounds';
import { useEffect } from 'react';

interface InfoDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function InfoDialog({ open, onOpenChange }: InfoDialogProps) {
  const playOpenSound = useSound(SOUNDS.dialogOpen, 0.2);

  useEffect(() => {
    if (open) {
      playOpenSound();
    }
  }, [open, playOpenSound]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg bg-black/90 border border-accent/40 shadow-[0_0_25px_#39ff14] text-foreground scanlines font-mono">
        {/* 🖥 Header */}
        <DialogHeader>
          <DialogTitle className="glitch text-2xl font-code text-accent">
            &lt;ConfessCode Terminal/&gt;
          </DialogTitle>
          <DialogDescription className="text-muted-foreground text-sm cursor-blink">
            _loading instructions...
          </DialogDescription>
        </DialogHeader>

        {/* 📜 Scrollable Content */}
        <ScrollArea className="max-h-[60vh] pr-4 mt-4">
          <div className="space-y-6 text-sm leading-relaxed">
            <section>
              <h3 className="text-keyword font-bold text-lg">What is this?</h3>
              <p className="text-default">
                ConfessCode is a <span className="text-string">safe space</span> for devs to anonymously
                share their coding sins, bugs, and late-night
                <span className="text-number"> coffee-driven commits</span>.
              </p>
            </section>

            <section>
              <h3 className="text-keyword font-bold text-lg">How it Works</h3>
              <pre className="bg-secondary/20 border border-secondary/40 rounded p-3 text-sm text-default">
{`1. Activate   -> use key 'WELCOME' to spawn anon_id;
2. Confess    -> submit story(); // sent for review
3. Engage     -> like(), comment(), share();`}
              </pre>
            </section>

            <section>
              <h3 className="text-keyword font-bold text-lg">Why Anonymous?</h3>
              <p>
                Your identity = <span className="text-string">anon_hash()</span>.  
                Stored only in <span className="text-tag">cookies</span>, never linked
                to <span className="text-number">IP / email / login</span>.  
                You stay safe & untraceable 🕶️.
              </p>
            </section>

            <section>
              <h3 className="text-keyword font-bold text-lg">Terms & Conditions</h3>
              <ul className="list-disc list-inside space-y-1 text-default">
                <li><span className="text-string">Respect()</span> → No hate / abuse / harassment.</li>
                <li><span className="text-string">NoPII()</span> → Don’t leak names, emails, numbers.</li>
                <li><span className="text-string">Moderation()</span> → All posts reviewed by admin.</li>
                <li><span className="text-string">Disclaimer()</span> → hobby project, use at own risk.</li>
              </ul>
            </section>
          </div>
        </ScrollArea>

        {/* 🚀 Footer */}
        <DialogFooter>
          <Button
            onClick={() => onOpenChange(false)}
            className="btn-hacker"
          >
            I Understand
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
