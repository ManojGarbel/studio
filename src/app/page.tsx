import ConfessionForm from '@/components/confession-form';
import { ConfessionCard } from '@/components/confession-card';
import { getConfessions } from '@/lib/actions';
import { cookies } from 'next/headers';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

export const dynamic = 'force-dynamic';

export default async function Home() {
  const confessions = await getConfessions();
  const activated = cookies().has('is_activated');

  return (
    <div className="container max-w-2xl mx-auto py-8 px-4">
      <div className="flex flex-col gap-8">
        {activated ? (
          <ConfessionForm />
        ) : (
          <div className="text-center bg-card border rounded-lg p-8">
            <h2 className="text-xl font-semibold mb-2">Activate Your Account</h2>
            <p className="text-muted-foreground mb-4">
              Please activate your account to start sharing confessions.
            </p>
            <Button asChild>
              <Link href="/activate">Activate Now</Link>
            </Button>
          </div>
        )}

        <div className="flex flex-col gap-6">
          {confessions.length > 0 ? (
            confessions.map((confession) => (
              <ConfessionCard key={confession.id} confession={confession} />
            ))
          ) : (
            <div className="text-center text-muted-foreground py-12">
              <p>No confessions yet.</p>
              <p>Be the first to share your coding secret!</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
