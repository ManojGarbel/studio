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
    // Show InfoDialog only on first visit
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

    // Refresh confessions periodically
    const interval = setInterval(() => {
      const isActivated = Cookies.get('is_activated') === 'true';
      if (isActivated !== activated) {
        setActivated(isActivated);
      }
      fetchConfessionsAndStatus();
    }, 5000);

    return () => clearInterval(interval);

  }, [activated]);

  if (loading) {
    return (
      <div className="container max-w-2xl mx-auto py-16 px-4 text-center font-mono">
        <p className="glitch text-lg" data-text="booting::confessCode">
          booting::confessCode
        </p>
        <p className="cursor-blink mt-2 text-muted-foreground">
          initializing system modules...
        </p>
      </div>
    );
  }

  return (
    <>
      <InfoDialog open={isInfoOpen} onOpenChange={setIsInfoOpen} />
      <div className="container max-w-2xl mx-auto py-8 px-4">
        <div className="flex flex-col gap-10">

          {/* 🚀 Show Confession Form if Activated */}
          {activated ? (
            <ConfessionForm />
          ) : (
            <div className="text-center bg-muted/30 border border-destructive/50 rounded-lg p-8 shadow-[0_0_12px_rgba(255,0,70,0.2)]">
              <h2 className="glitch text-xl mb-2" data-text="system::locked">
                system::locked
              </h2>
              <p className="text-muted-foreground mb-4 font-mono">
                activate your account to start submitting confessions ▍
              </p>
              <Button asChild className="btn-hacker">
                <Link href="/activate">&gt; start_confessing()</Link>
              </Button>
            </div>
          )}

          {/* 📜 Confession Feed */}
          <div className="flex flex-col gap-6">
            {confessions.length > 0 ? (
              confessions.map((confession) => (
                <ConfessionCard key={confession.id} confession={confession} />
              ))
            ) : (
              <div className="text-center text-muted-foreground py-12 font-mono">
                <p>log::no_confessions_found()</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
