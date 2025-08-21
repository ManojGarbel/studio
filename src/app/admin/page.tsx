import { getAllConfessionsForAdmin } from '@/lib/actions';
import { Badge } from '@/components/ui/badge';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import { redirect } from 'next/navigation';
import AdminActions from './_components/admin-actions';
import { format } from 'date-fns';

export default async function AdminPage({
  searchParams,
}: {
  searchParams: { [key: string]: string | string[] | undefined };
}) {
  const secretKey = searchParams['secret'];

  if (secretKey !== process.env.ADMIN_SECRET_KEY) {
    redirect('/');
  }

  const confessions = await getAllConfessionsForAdmin();

  const getStatusVariant = (status: string) => {
    switch (status) {
      case 'approved':
        return 'default';
      case 'pending':
        return 'secondary';
      case 'rejected':
        return 'destructive';
      default:
        return 'outline';
    }
  };

  return (
    <div className="container mx-auto py-8 px-4">
      <h1 className="text-3xl font-bold mb-6">Admin Dashboard</h1>

      <div className="flex flex-col gap-6">
        {confessions.map((confession) => (
          <Card key={confession.id}>
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="text-lg mb-1">Confession #{confession.id.substring(0, 6)}</CardTitle>
                  <CardDescription>
                    {format(new Date(confession.timestamp), 'PPP p')}
                  </CardDescription>
                </div>
                <Badge variant={getStatusVariant(confession.status)}>
                  {confession.status}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <p className="font-code text-base">{confession.text}</p>
              {confession.status === 'pending' && (
                <AdminActions confessionId={confession.id} />
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
