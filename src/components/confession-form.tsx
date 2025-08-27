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
import { PenSquare, Send } from 'lucide-react';
import useSound from '@/hooks/use-sound';
import { SOUNDS } from '@/lib/sounds';

const MAX_LENGTH = 1000;

/* 📊 Character Counter Component */
function CharacterCounter({ count }: { count: number }) {
  const isOverLimit = count > MAX_LENGTH;
  return (
    <div
      className={`text-xs font-mono transition-colors ${
        isOverLimit ? 'text-red-400' : 'text-slate-400'
      }`}
    >
      {count} / {MAX_LENGTH}
    </div>
  );
}

/* 🚀 Submit Button Component */
function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button
      type="submit"
      disabled={pending}
      className="bg-sky-500 hover:bg-sky-600 text-white rounded-full px-6 py-2 text-sm font-semibold transition-all active:scale-95"
    >
      {pending ? (
        <span className="flex items-center gap-2">
          <span className="h-4 w-4 animate-spin rounded-full border-2 border-t-transparent border-white"></span>
          <span>Posting...</span>
        </span>
      ) : (
        <span className="flex items-center gap-2">
          <Send className="h-4 w-4" />
          <span>Confess</span>
        </span>
      )}
    </Button>
  );
}

/* 📝 Main Confession Form Component */
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
          title: '✅ Confession Submitted!',
          description: state.message,
        });
        formRef.current?.reset();
        setContent(''); // Reset character counter state
      } else {
        toast({
          variant: 'destructive',
          title: '⚠️ Submission Failed',
          description: state.message,
        });
      }
    }
  }, [state, toast, playSubmitSound]);

  return (
    <div className="w-full px-3 sm:px-0">
      <Card className="mx-auto max-w-lg rounded-2xl border border-slate-700/50 bg-black/70 backdrop-blur-xl font-body shadow-lg shadow-sky-500/10">
        <form action={formAction} ref={formRef} className="flex flex-col gap-4">
          {/* Header */}
          <CardHeader className="text-center p-4">
            <div className="flex justify-center items-center gap-2">
                <PenSquare className="h-6 w-6 text-sky-400" />
                <CardTitle className="text-2xl font-bold text-sky-400">
                    Share Your Confession
                </CardTitle>
            </div>
            <CardDescription className="text-sm text-slate-400 mt-1">
              Your identity will remain anonymous.
            </CardDescription>
          </CardHeader>

          {/* Input */}
          <CardContent className="px-4">
            <Textarea
              name="confession"
              placeholder="I once pushed directly to the main branch on a Friday..."
              rows={5}
              required
              minLength={10}
              maxLength={MAX_LENGTH}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="font-body rounded-lg border-2 border-slate-700 bg-slate-800/80 p-3 text-sm text-slate-200 resize-none transition-shadow focus:border-sky-500 focus:shadow-lg focus:shadow-sky-500/20 focus:ring-1 focus:ring-sky-500"
            />
          </CardContent>

          {/* Footer */}
          <CardFooter className="flex items-center justify-between p-4">
            <CharacterCounter count={content.length} />
            <SubmitButton />
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
