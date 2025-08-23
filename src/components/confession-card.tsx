'use client';

import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import type { Confession, Comment } from '@/lib/types';
import { formatDistanceToNow } from 'date-fns';
import {
  Heart,
  MessageSquare,
  Flag,
  ThumbsDown,
  CornerDownRight,
  Send,
} from 'lucide-react';
import { Avatar, AvatarFallback } from './ui/avatar';
import { useState, useTransition, useRef } from 'react';
import { handleLike, handleDislike, addComment, reportConfession } from '@/lib/actions';
import { Textarea } from './ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { Badge } from './ui/badge';

interface ConfessionCardProps {
  confession: Confession;
}

export function ConfessionCard({ confession }: ConfessionCardProps) {
  const { toast } = useToast();
  const [isPending, startTransition] = useTransition();
  const [showComments, setShowComments] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);
  const timeAgo = formatDistanceToNow(new Date(confession.timestamp), {
    addSuffix: true,
  });

  const onLike = () => {
    startTransition(async () => {
      await handleLike(confession.id);
    });
  };

  const onDislike = () => {
    startTransition(async () => {
      await handleDislike(confession.id);
    });
  };

  const onReport = () => {
    startTransition(async () => {
        const result = await reportConfession(confession.id);
         if (result?.success) {
            toast({
                title: 'Reported',
                description: result.message
            });
        } else if (result?.message) {
            toast({
                variant: 'destructive',
                title: 'Error',
                description: result.message
            });
      }
    });
  };

  const handleCommentSubmit = async (formData: FormData) => {
    startTransition(async () => {
      const result = await addComment(confession.id, formData);
      if (result?.success) {
        formRef.current?.reset();
      } else if (result?.message) {
        toast({
            variant: 'destructive',
            title: 'Error',
            description: result.message
        });
      }
    });
  };

  return (
    <Card className="w-full">
      <CardHeader className="flex flex-row items-center gap-4">
        <Avatar className="border-2 border-primary/50">
          <AvatarFallback className="bg-secondary">{confession.anonHash.substring(0, 1)}</AvatarFallback>
        </Avatar>
        <div className="flex flex-col">
          <p className="font-semibold text-primary">Anonymous</p>
          <p className="text-sm text-muted-foreground">{timeAgo}</p>
        </div>
      </CardHeader>
      <CardContent>
        <pre className="whitespace-pre-wrap break-words font-code text-base text-foreground/90">
          <code>{confession.text}</code>
        </pre>
      </CardContent>
      <CardFooter className="flex flex-col items-start gap-4">
        <div className="flex justify-between items-center w-full">
          <div className="flex gap-1 items-center">
            <Button
              variant="ghost"
              size="sm"
              aria-label="Like"
              onClick={onLike}
              disabled={isPending}
              className="flex items-center gap-2 hover:text-accent"
            >
              <Heart
                className={`h-5 w-5 ${
                  confession.likes > 0 ? 'text-accent fill-current' : 'text-muted-foreground'
                }`}
              />
              <span>{confession.likes}</span>
            </Button>
            <Button
              variant="ghost"
              size="sm"
              aria-label="Dislike"
              onClick={onDislike}
              disabled={isPending}
              className="flex items-center gap-2 hover:text-red-500"
            >
              <ThumbsDown className="h-5 w-5 text-muted-foreground" />
              <span>{confession.dislikes}</span>
            </Button>
            <Button
              variant="ghost"
              size="sm"
              aria-label="Comment"
              onClick={() => setShowComments(!showComments)}
              className="flex items-center gap-2 hover:text-primary"
            >
              <MessageSquare className="h-5 w-5 text-muted-foreground" />
              <span>{confession.comments.length}</span>
            </Button>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="text-muted-foreground hover:text-destructive"
            aria-label="Report"
            onClick={onReport}
            disabled={isPending}
          >
            <Flag className="h-4 w-4 mr-2" />
            Report
          </Button>
        </div>
        {showComments && (
          <div className="w-full pt-4 border-t border-primary/20">
            <form action={handleCommentSubmit} ref={formRef} className="flex gap-2">
              <Textarea
                name="comment"
                placeholder="Add a comment..."
                rows={1}
                required
                className="font-code flex-1 bg-background"
              />
              <Button type="submit" size="icon" disabled={isPending}>
                <Send className="h-4 w-4" />
              </Button>
            </form>
            <div className="mt-4 flex flex-col gap-4">
                {confession.comments.map((comment) => (
                    <div key={comment.id} className="flex gap-3">
                        <Avatar className="h-8 w-8 border border-primary/30">
                            <AvatarFallback className="bg-secondary text-xs">{comment.anonHash.substring(0, 1)}</AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                            <div className="flex items-center gap-2">
                                <span className="font-semibold text-sm">
                                    {comment.isAuthor ? (
                                        <Badge variant="secondary" className="border border-accent/50 text-accent">Author</Badge>
                                    ) : (
                                        `Anon#${comment.anonHash.substring(0,4)}`
                                    )}
                                </span>
                                <span className="text-xs text-muted-foreground">
                                    {formatDistanceToNow(new Date(comment.timestamp), { addSuffix: true })}
                                </span>
                            </div>
                            <p className="text-sm mt-1 text-foreground/80">{comment.text}</p>
                        </div>
                    </div>
                ))}
            </div>
          </div>
        )}
      </CardFooter>
    </Card>
  );
}
