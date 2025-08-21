'use client';

import ConfessionForm from '@/components/confession-form';
import { ConfessionCard } from '@/components/confession-card';
import type { Confession } from '@/lib/types';
import { getConfessions } from '@/lib/actions';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { useEffect, useState } from 'react';
import Cookies from 'js-cookie';

export default function Home() {
  const [confessions, setConfessions] = useState<Confession[]>([]);
  const [activated, setActivated] = useState<boolean | undefined>(undefined);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchConfessionsAndStatus = async () => {
      try {
        const fetchedConfessions = await getConfessions();
        setConfessions(fetchedConfessions);
        const isActivated = Cookies.get('is_activated') === 'true';
        setActivated(isActivated);
      } catch (error) {
        console.error("Failed to fetch confessions or activation status:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchConfessionsAndStatus();
    
    // Optional: set up an interval to check for cookie changes if needed
    const interval = setInterval(() => {
      const isActivated = Cookies.get('is_activated') === 'true';
      if (isActivated !== activated) {
        setActivated(isActivated);
        window.location.reload();
      }
    }, 1000);

    return () => clearInterval(interval);

  }, [activated]);

  if (loading) {
      return (
          <div className="container max-w-2xl mx-auto py-8 px-4 text-center">
              <p>Loading...</p>
          </div>
      )
  }

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
