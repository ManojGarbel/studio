'use client';

import ConfessionForm from '@/components/confession-form';
import { ConfessionCard } from '@/components/confession-card';
import type { Confession } from '@/lib/types';
import { getConfessions } from '@/lib/actions';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { useEffect, useState } from 'react';
import Cookies from 'js-cookie';
import InfoDialog from '@/components/info-dialog';

export default function Home() {
  const [confessions, setConfessions] = useState<Confession[]>([]);
  const [activated, setActivated] = useState<boolean | undefined>(undefined);
  const [loading, setLoading] = useState(true);
  const [isInfoOpen, setIsInfoOpen] = useState(false);


  useEffect(() => {
    // Check if it's the user's first visit
    const hasVisited = localStorage.getItem('hasVisitedConfessCode');
    if (!hasVisited) {
      setIsInfoOpen(true);
      localStorage.setItem('hasVisitedConfessCode', 'true');
    }

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
    
    // Set up an interval to check for cookie changes
    // This ensures the page updates if activation happens in another tab
    const interval = setInterval(() => {
      const isActivated = Cookies.get('is_activated') === 'true';
      if (isActivated !== activated) {
        setActivated(isActivated);
        // We don't need to reload, React state change will handle the UI update
      }
    }, 1000);

    return () => clearInterval(interval);

  }, [activated]);

  if (loading) {
      return (
          <div className="container max-w-2xl mx-auto py-8 px-4 text-center">
              <p>Loading confessions...</p>
          </div>
      )
  }

  return (
    <>
      <InfoDialog open={isInfoOpen} onOpenChange={setIsInfoOpen} />
      <div className="container max-w-2xl mx-auto py-8 px-4">
        <div className="flex flex-col gap-8">
          {activated ? (
            <ConfessionForm />
          ) : (
            <div className="text-center bg-card border border-primary/20 rounded-lg p-8 shadow-lg shadow-primary/10">
              <h2 className="text-xl font-semibold mb-2 text-primary">Activate Your Account</h2>
              <p className="text-muted-foreground mb-4">
                Please activate your account to start sharing confessions.
              </p>
              <Button asChild>
                <Link href="/activate">Start Confessing</Link>
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
                <p>No confessions yet. Be the first to share one!</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

    