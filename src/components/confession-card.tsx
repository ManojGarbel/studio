import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import type { Confession } from '@/lib/types';
import { formatDistanceToNow } from 'date-fns';
import { Heart, MessageSquare, Flag, ThumbsDown } from 'lucide-react';
import { Avatar, AvatarFallback } from './ui/avatar';

interface ConfessionCardProps {
  confession: Confession;
}

export function ConfessionCard({ confession }: ConfessionCardProps) {
  const timeAgo = formatDistanceToNow(new Date(confession.timestamp), {
    addSuffix: true,
  });

  return (
    <Card className="w-full">
      <CardHeader className="flex flex-row items-center gap-4">
        <Avatar>
            <AvatarFallback>A</AvatarFallback>
        </Avatar>
        <div className="flex flex-col">
            <p className="font-semibold">Anonymous</p>
            <p className="text-sm text-muted-foreground">{timeAgo}</p>
        </div>
      </CardHeader>
      <CardContent>
        <pre className="whitespace-pre-wrap break-words font-code text-base">
          <code>{confession.text}</code>
        </pre>
      </CardContent>
      <CardFooter className="flex justify-between items-center gap-2">
        <div className="flex gap-1">
            <Button variant="ghost" size="icon" aria-label="Like">
                <Heart className="h-5 w-5 text-muted-foreground" />
            </Button>
            <Button variant="ghost" size="icon" aria-label="Dislike">
                <ThumbsDown className="h-5 w-5 text-muted-foreground" />
            </Button>
            <Button variant="ghost" size="icon" aria-label="Comment">
                <MessageSquare className="h-5 w-5 text-muted-foreground" />
            </Button>
        </div>
        <Button variant="ghost" size="sm" className="text-muted-foreground" aria-label="Report">
            <Flag className="h-4 w-4 mr-2" />
            Report
        </Button>
      </CardFooter>
    </Card>
  );
}
