'use client';

import { useActionState } from 'react';
import { useFormStatus } from 'react-dom';
import { useEffect, useRef, useState } from 'react';

import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { submitConfession } from '@/lib/actions';
import { useToast } from '@/hooks/use-toast';
import { Terminal, Send } from 'lucide-react';
import useSound from '@/hooks/use-sound';
import { SOUNDS } from '@/lib/sounds';

const MAX_LENGTH = 1000;

/* 📊 Character Counter Component */
function CharacterCounter({ count }: { count: number }) {
  const isOverLimit = count > MAX_LENGTH;
  return (
    <div
      className={`text-xs font-mono transition-colors ${
        isOverLimit ? 'text-destructive' : 'text-muted-foreground'
      }`}
    >
      {count} / {MAX_LENGTH}
    </div>
  );
}

/* 🚀 Hacker Submit Button */
function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button
      type="submit"
      disabled={pending}
      className="btn-hacker w-full rounded-lg px-6 py-2 text-sm sm:w-auto sm:text-base"
    >
      {pending ? (
        <span className="flex items-center gap-2">
          <span className="h-4 w-4 animate-spin rounded-full border-2 border-t-transparent border-green-400"></span>
          <span className="cursor-blink">transmitting...</span>
        </span>
      ) : (
        <span className="flex items-center gap-2">
          <Send className="h-4 w-4" />
          <span className="cursor-blink">Confess()</span>
        </span>
      )}
    </Button>
  );
}

export default function ConfessionForm() {
  const { toast } = useToast();
  const [state, formAction] = useActionState(submitConfession, {
    message: '',
    success: false,
  });
  const formRef = useRef<HTMLFormElement>(null);
  const [content, setContent] = useState('');
  const playSubmitSound = useSound(SOUNDS.submit);

  useEffect(() => {
    if (state.message) {
      if (state.success) {
        playSubmitSound();
        toast({
          title: '✅ Transmission Complete!',
          description: state.message,
        });
        formRef.current?.reset();
        setContent(''); // Reset character counter state
      } else {
        toast({
          variant: 'destructive',
          title: '⚠️ Transmission Failed',
          description: state.message,
        });
      }
    }
  }, [state, toast, playSubmitSound]);

  return (
    <div className="w-full px-3 sm:px-0">
      <Card className="scanlines mx-auto max-w-lg rounded-2xl border border-accent/40 bg-black/90 font-mono shadow-[0_0_20px_#39ff14]">
        <form action={formAction} ref={formRef} className="flex flex-col gap-4">
          {/* 🖥️ Header */}
          <CardHeader className="px-4 pb-2 pt-4 text-center">
            <CardTitle className="glitch flex items-center justify-center gap-2 text-xl text-accent sm:text-2xl">
              <Terminal className="h-5 w-5" />
              <span>New Transmission</span>
            </CardTitle>
            <CardDescription className="cursor-blink text-xs text-muted-foreground sm:text-sm">
              root@dev:~# post_confession
            </CardDescription>
          </CardHeader>

          {/* 📝 Input */}
          <CardContent className="px-4">
            <Textarea
              name="confession"
              placeholder="> Mera best friend gay hai..."
              rows={5}
              required
              minLength={10}
              maxLength={MAX_LENGTH}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="font-code rounded-lg border border-accent/40 bg-black/70 p-3 text-sm text-string shadow-[0_0_12px_#39ff14] resize-none transition-shadow focus:border-accent/80 focus:shadow-[0_0_16px_#39ff14] focus:ring-accent/80 sm:text-base"
            />
          </CardContent>

          {/* 🚀 Footer */}
          <CardFooter className="flex items-center justify-between px-4 pb-4">
            <CharacterCounter count={content.length} />
            <SubmitButton />
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}