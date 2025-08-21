import ConfessionForm from '@/components/confession-form';
import { ConfessionCard } from '@/components/confession-card';
import { getConfessions } from '@/lib/actions';

export const dynamic = 'force-dynamic';

export default async function Home() {
  const confessions = await getConfessions();

  return (
    <div className="container max-w-2xl mx-auto py-8 px-4">
      <div className="flex flex-col gap-8">
        <ConfessionForm />

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
