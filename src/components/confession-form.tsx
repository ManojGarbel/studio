"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { useEffect, useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { submitConfession } from "@/lib/actions";
import { useToast } from "@/hooks/use-toast";
import { Terminal, Send } from "lucide-react";
import useSound from "@/hooks/use-sound";
import { SOUNDS } from "@/lib/sounds";

const MAX_LENGTH = 1000;

/* 📊 Character Counter Component */
function CharacterCounter({ count }: { count: number }) {
  const isOverLimit = count > MAX_LENGTH;
  return (
    <div
      className={`text-xs font-mono transition-colors ${
        isOverLimit ? "text-red-500" : "text-green-400"
      }`}
    >
      {count} / {MAX_LENGTH}
    </div>
  );
}

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button
      type="submit"
      disabled={pending}
      className="rounded-md border border-green-500 bg-black px-4 py-1 text-green-400 font-mono hover:bg-green-500 hover:text-black transition-all"
    >
      {pending ? (
        <span className="flex items-center gap-2">
          <span className="h-4 w-4 animate-spin rounded-full border-2 border-t-transparent border-green-400"></span>
          <span className="cursor-blink">Posting...</span>
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
    message: "",
    success: false,
  });
  const formRef = useRef<HTMLFormElement>(null);
  const [content, setContent] = useState("");
  const playSubmitSound = useSound(SOUNDS.submit);

  useEffect(() => {
    if (state.message) {
      if (state.success) {
        playSubmitSound();
        toast({
          title: "✅ Submission Complete!",
          description: state.message,
        });
        formRef.current?.reset();
        setContent(""); // Reset character counter state
      } else {
        toast({
          variant: "destructive",
          title: "⚠️ Submission Failed",
          description: state.message,
        });
      }
    }
  }, [state, toast, playSubmitSound]);

  return (
    <div className="w-full px-3 sm:px-0">
      <form
        action={formAction}
        ref={formRef}
        className="flex flex-col gap-4 mx-auto max-w-lg font-mono"
      >
        {/* 🖥️ Header */}
        <div className="text-center mb-2">
          <h2 className="flex items-center justify-center gap-2 text-xl sm:text-2xl text-green-400">
            <Terminal className="h-5 w-5" />
            <span className="cursor-blink">Confess Now</span>
          </h2>
          <p className="text-xs text-green-600 sm:text-sm">
            just write your confession and hit 'Confess'
          </p>
        </div>

        {/* 📝 Input */}
        <Textarea
          name="confession"
          placeholder="> Mera best friend gay hai..."
          rows={5}
          required
          minLength={10}
          maxLength={MAX_LENGTH}
          value={content}
          onChange={(e) => setContent(e.target.value)}
          className="rounded-md border border-green-500 bg-black p-3 text-sm text-green-400 shadow-[0_0_10px_#39ff14] resize-none transition focus:shadow-[0_0_16px_#39ff14] focus:ring-green-400 sm:text-base"
        />

        {/* 🚀 Footer */}
        <div className="flex items-center justify-between">
          <CharacterCounter count={content.length} />
          <SubmitButton />
        </div>
      </form>
    </div>
  );
}
