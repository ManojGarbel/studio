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
import { isUserBanned } from '@/lib/db';

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
        {confessions.map(async (confession) => {
          const banned = await isUserBanned(confession.anonHash);
          return (
            <Card key={confession.id}>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-lg mb-1 flex items-center gap-2">
                      <span>Confession #{confession.id.substring(0, 6)}</span>
                      {banned && <Badge variant="destructive">Banned</Badge>}
                    </CardTitle>
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
                <div className="text-sm text-muted-foreground mt-4 pt-4 border-t flex gap-4">
                  <span>Likes: {confession.likes}</span>
                  <span>Dislikes: {confession.dislikes}</span>
                  <span>Comments: {confession.comments.length}</span>
                </div>
                <AdminActions
                  confessionId={confession.id}
                  anonHash={confession.anonHash}
                />
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
