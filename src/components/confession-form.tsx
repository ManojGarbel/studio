'use client';

import { useActionState } from 'react';
import { useFormStatus } from 'react-dom';
import { useEffect, useRef, useState } from 'react';

import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { submitConfession } from '@/lib/actions';
import { useToast } from '@/hooks/use-toast';
import useSound from '@/hooks/use-sound';
import { SOUNDS } from '@/lib/sounds';

const MAX_LENGTH = 1000;

/* 📊 Terminal-style Character Counter */
function CharacterCounter({ count }: { count: number }) {
  const isOverLimit = count > MAX_LENGTH;
  return (
    <div
      className={`font-mono text-xs transition-colors ${
        isOverLimit ? 'text-red-500' : 'text-green-400/70'
      }`}
    >
      <span>char_count: {count}/{MAX_LENGTH}</span>
    </div>
  );
}

/* 🚀 Mobile-friendly CLI Submit Button */
function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button
      type="submit"
      disabled={pending}
      className="w-full sm:w-auto font-mono text-sm text-black bg-green-400 border border-green-500 
                 rounded-xl px-4 py-2 transition-all shadow-[0_0_12px_rgba(57,255,20,0.6)]
                 hover:bg-green-300 hover:shadow-[0_0_18px_rgba(57,255,20,0.8)]
                 active:translate-y-[2px] active:shadow-none disabled:opacity-60"
    >
      {pending ? (
        <span className="flex items-center gap-2">
          <span className="h-4 w-4 animate-spin rounded-full border-2 border-t-transparent border-black"></span>
          <span>sending...</span>
        </span>
      ) : (
        <span className="tracking-wider">[ Submit ]</span>
      )}
    </Button>
  );
}

/* 📝 Main Hacker Terminal Form */
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
    <div className="w-full max-w-3xl mx-auto p-6 font-mono">
      <form
        action={formAction}
        ref={formRef}
        className="flex flex-col gap-4 rounded-2xl border border-green-500/40 bg-[#0d0d0d]/95 
                   shadow-[0_0_25px_rgba(57,255,20,0.4)] p-6"
      >
        {/* Terminal Header */}
        <label
          htmlFor="confession-input"
          className="text-green-400 text-base sm:text-lg tracking-wide"
        >
          $ enter_confession:
        </label>

        {/* Terminal Input */}
        <Textarea
          id="confession-input"
          name="confession"
          placeholder="> I once pushed directly to main on Friday..."
          rows={6}
          required
          minLength={10}
          maxLength={MAX_LENGTH}
          value={content}
          onChange={(e) => setContent(e.target.value)}
          className="bg-transparent border-2 border-green-500/40 rounded-xl p-3 text-base text-green-300 resize-none
                     shadow-[0_0_12px_rgba(57,255,20,0.2)]
                     focus:border-green-400 focus:shadow-[0_0_20px_rgba(57,255,20,0.6)]
                     focus:ring-0 focus:outline-none transition-all duration-300"
        />

        {/* Footer */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          <CharacterCounter count={content.length} />
          <SubmitButton />
        </div>
      </form>
    </div>
  );
}
