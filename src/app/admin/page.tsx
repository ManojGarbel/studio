import { getAllConfessionsForAdmin, signOutAdmin } from '@/lib/actions';
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
import { cookies } from 'next/headers';
import { Button } from '@/components/ui/button';
import { LogOut } from 'lucide-react';

export default async function AdminPage() {
  const cookieStore = cookies();
  const isAdmin = cookieStore.get('admin-auth')?.value === 'true';

  if (!isAdmin) {
    redirect('/admin/login');
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
    <div className="container mx-auto py-10 px-4 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="flex justify-between items-center mb-10">
        <h1 className="text-4xl font-extrabold bg-gradient-to-r from-purple-500 to-pink-500 bg-clip-text text-transparent">
          Admin Dashboard
        </h1>
        <form action={signOutAdmin}>
          <Button variant="destructive" size="sm" className="flex items-center gap-2 shadow-md">
            <LogOut className="h-4 w-4" />
            Sign Out
          </Button>
        </form>
      </div>

      {/* Confession List */}
      <div className="grid gap-8">
        {confessions.length > 0 ? (
          confessions.map(async (confession) => {
            const banned = await isUserBanned(confession.anonHash);
            return (
              <Card
                key={confession.id}
                className="hover:shadow-lg transition-shadow duration-200 rounded-2xl border border-border/50"
              >
                <CardHeader className="pb-4">
                  <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div className="flex-1">
                      <CardTitle className="text-xl flex items-center gap-3 flex-wrap">
                        <span className="font-semibold">
                          Confession #{confession.id.substring(0, 6)}
                        </span>
                        {banned && <Badge variant="destructive">Banned</Badge>}
                      </CardTitle>
                      <CardDescription className="text-sm text-muted-foreground mt-1">
                        {format(new Date(confession.timestamp), 'PPP p')}
                      </CardDescription>
                    </div>
                    <Badge
                      variant={getStatusVariant(confession.status)}
                      className="px-3 py-1 text-sm capitalize"
                    >
                      {confession.status}
                    </Badge>
                  </div>
                </CardHeader>

                <CardContent>
                  {/* Confession text */}
                  <p className="font-medium text-base leading-relaxed bg-muted/30 rounded-lg p-4 shadow-inner">
                    {confession.text}
                  </p>

                  {/* Stats */}
                  <div className="flex flex-wrap gap-3 mt-6 pt-4 border-t text-sm">
                    <Badge variant="outline">👍 Likes: {confession.likes}</Badge>
                    <Badge variant="outline">👎 Dislikes: {confession.dislikes}</Badge>
                    <Badge variant="outline">💬 Comments: {confession.comments.length}</Badge>
                  </div>

                  {/* Actions */}
                  <div className="mt-6">
                    <AdminActions
                      confessionId={confession.id}
                      anonHash={confession.anonHash}
                    />
                  </div>
                </CardContent>
              </Card>
            );
          })
        ) : (
          <div className="text-center text-muted-foreground py-16">
            <p className="text-lg">🚫 No confessions to review.</p>
          </div>
        )}
      </div>
    </div>
  );
}
