'use client';

import { useActionState } from 'react';
import { useFormStatus } from 'react-dom';
import { useRef } from 'react';
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
import { useToast } from '@/hooks/use-toast';
import { KeyRound } from 'lucide-react';
import { authenticateAdmin } from '@/lib/actions';

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button
      type="submit"
      disabled={pending}
      className="w-full bg-gradient-to-r from-purple-600 via-pink-500 to-red-500 text-white hover:opacity-90 transition rounded-xl shadow-lg"
    >
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
          Signing In...
        </>
      ) : (
        <>
          <KeyRound className="mr-2 h-4 w-4" />
          Sign In
        </>
      )}
    </Button>
  );
}

export default function AdminLoginPage() {
  const { toast } = useToast();
  const router = useRouter();
  const [state, formAction] = useActionState(authenticateAdmin, {
    message: '',
    success: false,
  });
  const formRef = useRef<HTMLFormElement>(null);

  if (state.success) {
    toast({
      title: '✅ Success!',
      description: state.message,
    });
    router.push('/admin');
  } else if (state.message) {
    toast({
      variant: 'destructive',
      title: '❌ Authentication Failed',
      description: state.message,
    });
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 via-black to-gray-800 p-4">
      <Card className="w-full max-w-md backdrop-blur-md bg-white/10 border border-white/20 shadow-2xl rounded-2xl">
        <form action={formAction} ref={formRef} className="p-6 space-y-6">
          <CardHeader className="text-center space-y-2">
            <CardTitle className="text-2xl font-bold text-white">
              🔑 Admin Access
            </CardTitle>
            <CardDescription className="text-gray-300">
              Enter your secret key to unlock the dashboard
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Input
              name="secretKey"
              type="password"
              placeholder="Enter secret key"
              className="bg-black/40 border border-white/20 text-white placeholder-gray-400 rounded-lg focus:ring-2 focus:ring-purple-500"
              required
            />
          </CardContent>
          <CardFooter>
            <SubmitButton />
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
