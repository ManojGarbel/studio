'use client';

import { useActionState } from 'react';
import { useFormStatus } from 'react-dom';
import { useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Cookies from 'js-cookie';

import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { activateAccount } from '@/lib/actions';
import { useToast } from '@/hooks/use-toast';
import { KeyRound } from 'lucide-react';

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending}>
      {pending ? (
        <>
          <svg
            className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
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
            ></circle>
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            ></path>
          </svg>
          Activating...
        </>
      ) : (
        <>
          <KeyRound className="mr-2 h-4 w-4" />
          Activate Account
        </>
      )}
    </Button>
  );
}

export default function ActivatePage() {
  const { toast } = useToast();
  const router = useRouter();
  const [state, formAction] = useActionState(activateAccount, {
    message: '',
    success: false,
    anonHash: null,
  });
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    // This effect runs when the 'state' object from the server action changes.
    if (state.success && state.anonHash) {
      // Set cookies on the client side for immediate UI update across the app.
      Cookies.set('is_activated', 'true', { expires: 365 });
      Cookies.set('anon_hash', state.anonHash, { expires: 365 });

      toast({
        title: 'Success!',
        description: state.message,
      });

      // Redirect after a short delay to allow the user to see the message.
      const timer = setTimeout(() => {
        router.push('/');
      }, 1500);
      
      return () => clearTimeout(timer);

    } else if (!state.success && state.message) {
      // This handles both validation errors and incorrect key errors.
      toast({
        variant: 'destructive',
        title: 'Activation Error',
        description: state.message,
      });
    }
  }, [state, toast, router]);

  return (
    <div className="container max-w-lg mx-auto py-12 px-4">
      <Card>
        <form action={formAction} ref={formRef}>
          <CardHeader>
            <CardTitle>Account Activation</CardTitle>
            <CardDescription>
              Enter the secret key provided by the admin to activate your
              account. The key is "WELCOME".
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Input
              name="activationKey"
              placeholder="Enter your activation key"
              required
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
