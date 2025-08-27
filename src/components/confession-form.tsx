'use client';

import { useActionState } from 'react';
import { useFormStatus } from 'react-dom';
import { useEffect, useRef, useState } from 'react';

import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { submitConfession } from '@/lib/actions';
import { useToast } from '@/hooks/use-toast';
import { Terminal } from 'lucide-react';
import useSound from '@/hooks/use-sound';
import { SOUNDS } from '@/lib/sounds';

const MAX_LENGTH = 1000;

/* 📊 Terminal-style Character Counter */
function CharacterCounter({ count }: { count: number }) {
  const isOverLimit = count > MAX_LENGTH;
  return (
    <div
      className={`font-mono text-xs transition-colors ${
        isOverLimit ? 'text-red-500' : 'text-green-500/60'
      }`}
    >
      <span>char_count: {count}/{MAX_LENGTH}</span>
    </div>
  );
}

/* 🚀 CLI-style Submit Button */
function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button
      type="submit"
      disabled={pending}
      className="font-mono text-sm text-green-300 bg-green-900/50 border border-green-500/30 rounded-md h-auto px-6 py-2 
                 hover:bg-green-500/20 hover:border-green-400 hover:text-green-200 hover:shadow-[0_0_15px_rgba(57,255,20,0.5)] 
                 active:scale-95 transition-all duration-300"
    >
      {pending ? (
        <span className="flex items-center gap-2">
          <span className="h-4 w-4 animate-spin rounded-full border-2 border-t-transparent border-green-400"></span>
          <span>submitting...</span>
        </span>
      ) : (
        <span>Transmit</span>
      )}
    </Button>
  );
}

/* 📝 Main Hacker Terminal Form Component */
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
          title: '✅ Transmission Complete',
          description: state.message,
        });
        formRef.current?.reset();
        setContent('');
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
    <div className="w-full max-w-2xl mx-auto p-4 font-mono bg-[#0a0a0a] rounded-lg border border-green-500/20">
      <form action={formAction} ref={formRef} className="flex flex-col gap-4">
        {/* Terminal Header */}
        <div className="flex items-center gap-2 text-xl sm:text-2xl text-green-400">
            <Terminal className="h-5 w-5" />
            <h2 className="cursor-blink">Confess Now</h2>
        </div>
        <p className="text-xs text-green-600 sm:text-sm -mt-2">
            Your transmission is anonymous and encrypted.
        </p>

        {/* Terminal Input Area */}
        <Textarea
          name="confession"
          placeholder="> I once pushed directly to the main branch on a Friday..."
          rows={5}
          required
          minLength={10}
          maxLength={MAX_LENGTH}
          value={content}
          onChange={(e) => setContent(e.target.value)}
          className="bg-transparent border-2 border-green-400/30 rounded-md p-3 text-base text-green-300 resize-none
                     shadow-[0_0_10px_rgba(57,255,20,0.2)]
                     focus:border-green-400 focus:shadow-[0_0_20px_rgba(57,255,20,0.5)]
                     focus:ring-0 focus:outline-none transition-all duration-300"
        />

        {/* Terminal Footer */}
        <div className="flex items-center justify-between mt-2">
          <CharacterCounter count={content.length} />
          <SubmitButton />
        </div>
      </form>
    </div>
  );
}
