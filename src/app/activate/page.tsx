"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Cookies from "js-cookie";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { activateAccount } from "@/lib/actions";
import { useToast } from "@/hooks/use-toast";
import { KeyRound } from "lucide-react";
import useSound from "@/hooks/use-sound";
import { SOUNDS } from "@/lib/sounds";

/* 🔄 Submit Button with Loader */
function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending} className="btn-hacker w-full">
      {pending ? (
        <>
          <svg
            className="animate-spin -ml-1 mr-3 h-5 w-5 text-accent"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 
              0 5.373 0 12h4zm2 5.291A7.962 
              7.962 0 014 12H0c0 3.042 
              1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
          verifying...
        </>
      ) : (
        <>
          <KeyRound className="mr-2 h-4 w-4" />
          access system
        </>
      )}
    </Button>
  );
}

export default function ActivatePage() {
  const { toast } = useToast();
  const router = useRouter();
  const [state, formAction] = useActionState(activateAccount, {
    message: "",
    success: false,
    anonHash: null,
  });
  const formRef = useRef<HTMLFormElement>(null);
  const playSuccessSound = useSound(SOUNDS.notification);

  /* 🎯 Handle Success / Error */
  useEffect(() => {
    if (state.success && state.anonHash) {
      Cookies.set("is_activated", "true", { expires: 365 });
      Cookies.set("anon_hash", state.anonHash, { expires: 365 });

      playSuccessSound();
      toast({ title: "Access Granted", description: state.message });

      const timer = setTimeout(() => {
        router.push("/");
      }, 1500);

      return () => clearTimeout(timer);
    } else if (!state.success && state.message) {
      toast({
        variant: "destructive",
        title: "Access Denied",
        description: state.message,
      });
    }
  }, [state, toast, router, playSuccessSound]);

  return (
    <div className="container max-w-lg mx-auto py-12 px-4">
      <Card className="bg-background border border-border shadow-[0_0_12px_rgba(0,255,255,0.25)] scanlines">
        <form action={formAction} ref={formRef}>
          <CardHeader>
            <CardTitle
              className="glitch text-xl"
              data-text="system::activation"
            >
              system::activation
            </CardTitle>
            <CardDescription className="cursor-blink">
               enter secret access key to continue
            </CardDescription>
          </CardHeader>

          <CardContent>
            <Input
              name="activationKey"
              placeholder="> ********"
              required
              className="bg-muted text-foreground border border-border focus:ring-accent font-mono"
            />
          </CardContent>

          <CardFooter className="flex-col items-stretch gap-4">
            <SubmitButton />
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
