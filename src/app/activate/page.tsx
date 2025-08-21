'use client';

import { useActionState } from 'react';
import { useFormStatus } from 'react-dom';
import { useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';

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
import { AlertCircle, KeyRound } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

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
  const [state, formAction, isPending] = useActionState(activateAccount, {
    message: '',
    success: false,
  });
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (!isPending && state.message) {
      if (state.success) {
        toast({
          title: 'Success!',
          description: state.message,
        });
        setTimeout(() => {
            router.push('/');
            router.refresh();
        }, 1000);
      } else {
        toast({
          variant: 'destructive',
          title: 'Activation Error',
          description: state.message,
        });
      }
    }
  }, [state, isPending, toast, router]);

  return (
    <div className="container max-w-lg mx-auto py-12 px-4">
      <Card>
        <form action={formAction} ref={formRef}>
          <CardHeader>
            <CardTitle>Account Activation</CardTitle>
            <CardDescription>
              Enter the secret key provided by the admin to activate your
              account.
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
            {state?.message && !state.success && (
              <Alert variant="destructive" className="w-full p-2 text-sm border-none">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{state.message}</AlertDescription>
              </Alert>
            )}
            <SubmitButton />
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
