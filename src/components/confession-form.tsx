'use client';

import { useActionState } from 'react';
import { useFormStatus } from 'react-dom';
import { useEffect, useRef } from 'react';

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
import { Send } from 'lucide-react';
import useSound from '@/hooks/use-sound';
import { SOUNDS } from '@/lib/sounds';

/* 🚀 Hacker Submit Button */
function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending} className="btn-hacker">
      {pending ? (
        <span className="flex items-center gap-2">
          <span className="animate-spin h-4 w-4 border-2 border-t-transparent border-green-400 rounded-full"></span>
          <span className="cursor-blink">transmitting...</span>
        </span>
      ) : (
        <span className="flex items-center gap-2">
          <Send className="h-4 w-4" />
          <span className="cursor-blink">confess()</span>
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
  const playSubmitSound = useSound(SOUNDS.submit);

  useEffect(() => {
    if (state.message) {
      if (state.success) {
        playSubmitSound();
        toast({
          title: '✅ Success!',
          description: state.message,
        });
        formRef.current?.reset();
      } else {
        toast({
          variant: 'destructive',
          title: '⚠️ Error',
          description: state.message,
        });
      }
    }
  }, [state, toast, playSubmitSound]);

  return (
    <Card className="bg-black/80 border border-accent/40 shadow-[0_0_25px_#39ff14] font-mono scanlines">
      <form action={formAction} ref={formRef}>
        {/* 🖥 Header */}
        <CardHeader>
          <CardTitle className="glitch text-accent text-xl">
            Confession Now 
          </CardTitle>
          <CardDescription className="text-muted-foreground cursor-blink">
            _type your secret below and hit enter...
          </CardDescription>
        </CardHeader>

        {/* 📝 Input */}
        <CardContent>
          <Textarea
            name="confession"
            placeholder="> I once pushed to main on a Friday night..."
            rows={5}
            required
            minLength={10}
            maxLength={1000}
            className="font-code bg-black/60 text-string border border-accent/30 focus:ring-accent/80 focus:border-accent/80 shadow-[0_0_15px_#39ff14] resize-none"
          />
        </CardContent>

        {/* 🚀 Footer */}
        <CardFooter className="flex justify-end">
          <SubmitButton />
        </CardFooter>
      </form>
    </Card>
  );
}
