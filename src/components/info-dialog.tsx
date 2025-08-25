
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
    if(open) {
      playOpenSound();
    }
  }, [open, playOpenSound]);
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md md:max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-2xl text-primary font-code">
            Welcome to &lt;ConfessCode/&gt;
          </DialogTitle>
          <DialogDescription className="text-muted-foreground pt-2">
            Your anonymous hub for sharing coding confessions.
          </DialogDescription>
        </DialogHeader>
        <ScrollArea className="max-h-[60vh] pr-4">
            <div className="space-y-4 text-foreground/90 font-code text-sm">
            <h3 className="font-bold text-accent text-lg">What is this?</h3>
            <p>
                ConfessCode is a safe space for developers to anonymously share their
                coding mistakes, silly errors, and workplace stories. Ever pushed to the wrong branch on a Friday? Or spent hours debugging a typo? This is the place to share it.
            </p>

            <h3 className="font-bold text-accent text-lg">How it Works</h3>
            <p>
                1. <strong>Activate:</strong> Use the one-time activation key ('WELCOME') to create your anonymous identity.
                <br/>
                2. <strong>Confess:</strong> Share your story. Your post will be sent for a quick moderation check to filter out spam or harmful content.
                <br/>
                3. <strong>Engage:</strong> Read, like, and comment on other confessions.
            </p>
            
            <h3 className="font-bold text-accent text-lg">Why is it Anonymous?</h3>
            <p>
                Your privacy is paramount. When you activate, we generate a random, unique hash (e.g., `usr_anon::a1b2c3`) that is only stored in your browser's cookies. We do not link this hash to your IP address, email, or any other personal information. This hash ensures you have a consistent identity for commenting on your own posts without revealing who you are.
            </p>

            <h3 className="font-bold text-accent text-lg">Terms & Conditions</h3>
            <ul className="list-disc list-inside space-y-2">
                <li><strong>Be Respectful:</strong> Do not post hateful, discriminatory, or harassing content. Personal attacks are not tolerated.</li>
                <li><strong>No Personal Info:</strong> Do not share any Personally Identifiable Information (PII) about yourself or others. This includes names, emails, phone numbers, or specific company details that could identify someone.</li>
                <li><strong>Content Moderation:</strong> All submissions are reviewed by an admin. Submissions that violate these terms will be rejected. Egregious or repeated violations may result in your anonymous hash being banned.</li>
                <li><strong>No Guarantees:</strong> This is a hobby project. While we prioritize privacy, use it at your own risk.</li>
            </ul>
            </div>
        </ScrollArea>
        <DialogFooter>
          <Button onClick={() => onOpenChange(false)}>I Understand</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
