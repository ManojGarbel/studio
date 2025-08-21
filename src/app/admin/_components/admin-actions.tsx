'use client';
import { Button } from '@/components/ui/button';
import { updateConfessionStatus } from '@/lib/actions';
import { CheckCircle, XCircle } from 'lucide-react';
import { useTransition } from 'react';

export default function AdminActions({
  confessionId,
}: {
  confessionId: string;
}) {
  const [isPending, startTransition] = useTransition();

  const handleApprove = () => {
    startTransition(async () => {
      await updateConfessionStatus(confessionId, 'approved');
    });
  };

  const handleReject = () => {
    startTransition(async () => {
      await updateConfessionStatus(confessionId, 'rejected');
    });
  };

  return (
    <div className="flex justify-end gap-2 mt-4 border-t pt-4">
      <Button
        variant="outline"
        size="sm"
        onClick={handleReject}
        disabled={isPending}
      >
        <XCircle className="mr-2 h-4 w-4" />
        Reject
      </Button>
      <Button size="sm" onClick={handleApprove} disabled={isPending}>
        <CheckCircle className="mr-2 h-4 w-4" />
        Approve
      </Button>
    </div>
  );
}
