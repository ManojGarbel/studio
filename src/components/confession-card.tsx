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
  Send,
  UserX,
} from 'lucide-react';
import { Avatar, AvatarFallback } from './ui/avatar';
import { useState, useTransition, useRef } from 'react';
import {
  handleLike,
  handleDislike,
  addComment,
  reportConfession,
  reportComment
} from '@/lib/actions';
import { Textarea } from './ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { Badge } from './ui/badge';
import { TypeAnimation } from 'react-type-animation';
import { anonCreateColor } from '@/lib/utils';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { MoreVertical } from 'lucide-react';


interface ConfessionCardProps {
  confession: Confession;
}

export function ConfessionCard({ confession: initialConfession }: ConfessionCardProps) {
  const { toast } = useToast();
  const [isPending, startTransition] = useTransition();
  const [showComments, setShowComments] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);
  
  // Use state to manage confession data to reflect UI changes instantly
  const [confession, setConfession] = useState(initialConfession);

  const timeAgo = formatDistanceToNow(new Date(confession.timestamp), {
    addSuffix: true,
  });

  const onLike = () => {
    startTransition(async () => {
      // Optimistic UI Update
      const originalInteraction = confession.userInteraction;
      const originalLikes = confession.likes;
      
      const newLikes = originalInteraction === 'like' ? originalLikes - 1 : originalLikes + 1;
      const newInteraction = originalInteraction === 'like' ? null : 'like';

      setConfession(prev => ({
        ...prev,
        likes: newLikes,
        dislikes: originalInteraction === 'dislike' ? prev.dislikes - 1 : prev.dislikes,
        userInteraction: newInteraction,
      }));

      await handleLike(confession.id);
    });
  };

  const onDislike = () => {
    startTransition(async () => {
      // Optimistic UI Update
      const originalInteraction = confession.userInteraction;
      const originalDislikes = confession.dislikes;

      const newDislikes = originalInteraction === 'dislike' ? originalDislikes - 1 : originalDislikes + 1;
      const newInteraction = originalInteraction === 'dislike' ? null : 'dislike';

      setConfession(prev => ({
        ...prev,
        dislikes: newDislikes,
        likes: originalInteraction === 'like' ? prev.likes - 1 : prev.likes,
        userInteraction: newInteraction,
      }));

      await handleDislike(confession.id);
    });
  };

  const onReport = (id: string, type: 'confession' | 'comment') => {
    startTransition(async () => {
      const action = type === 'confession' ? reportConfession : reportComment;
      const result = await action(id);
      if (result?.success) {
        toast({
          title: 'Reported',
          description: result.message,
        });
      } else if (result?.message) {
        toast({
          variant: 'destructive',
          title: 'Error',
          description: result.message,
        });
      }
    });
  };

  const handleCommentSubmit = async (formData: FormData) => {
    startTransition(async () => {
      const result = await addComment(confession.id, formData);
      if (result?.success) {
        formRef.current?.reset();
        // Here you might want to re-fetch confessions to show the new comment
      } else if (result?.message) {
        toast({
          variant: 'destructive',
          title: 'Error',
          description: result.message,
        });
      }
    });
  };

  return (
    <Card className="w-full">
      <CardHeader className="flex flex-row items-center gap-4">
        <Avatar className="border-2 border-primary/50">
           <AvatarFallback className="bg-secondary">
             <UserX className="h-5 w-5 text-muted-foreground" />
           </AvatarFallback>
        </Avatar>
        <div className="flex-grow flex items-center justify-between">
            <div>
              <p className="font-semibold text-primary">Anonymous</p>
              <p className="text-sm text-muted-foreground">{timeAgo}</p>
            </div>
             <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => onReport(confession.id, 'confession')} disabled={isPending}>
                  <Flag className="mr-2 h-4 w-4" />
                  <span>Report Confession</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
        </div>
      </CardHeader>
      <CardContent>
        <pre className="whitespace-pre-wrap break-words font-code text-base text-foreground/90">
          <code>
            <TypeAnimation
              sequence={[confession.text]}
              wrapper="span"
              speed={80}
              cursor={true}
              style={{ whiteSpace: 'pre-line' }}
            />
          </code>
        </pre>
      </CardContent>
      <CardFooter className="flex flex-col items-start gap-4">
        <div className="flex flex-wrap justify-between items-center w-full gap-2">
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
                  confession.userInteraction === 'like' ? 'text-accent fill-current' : 'text-muted-foreground'
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
              <ThumbsDown
                 className={`h-5 w-5 ${
                  confession.userInteraction === 'dislike' ? 'text-red-500 fill-current' : 'text-muted-foreground'
                }`}
              />
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
        </div>
        {showComments && (
          <div className="w-full pt-4 border-t border-primary/20">
            <form action={handleCommentSubmit} ref={formRef} className="flex gap-2">
              <Textarea
                name="comment"
                placeholder="Add a comment..."
                rows={1}
                required
                className="font-code flex-1 bg-background text-sm"
              />
              <Button type="submit" size="icon" disabled={isPending}>
                <Send className="h-4 w-4" />
              </Button>
            </form>
            <div className="mt-4 flex flex-col gap-4">
              {confession.comments.map((comment) => (
                <div key={comment.id} className="flex gap-3 group">
                  <Avatar className="h-8 w-8 border border-primary/30">
                    <AvatarFallback className="bg-secondary text-xs">
                       <UserX className="h-4 w-4 text-muted-foreground" />
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                       <div className="flex items-center gap-2 flex-wrap">
                          {comment.isAuthor ? (
                                <Badge variant="secondary" className="border border-accent/50 text-accent">Author</Badge>
                          ) : (
                               <span className="font-semibold text-sm" style={{ color: anonCreateColor(comment.anonHash) }}>
                                    Anonymous
                               </span>
                          )}
                        <span className="text-xs text-muted-foreground">
                          {formatDistanceToNow(new Date(comment.timestamp), { addSuffix: true })}
                        </span>
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity">
                                <MoreVertical className="h-4 w-4" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => onReport(comment.id, 'comment')} disabled={isPending}>
                                <Flag className="mr-2 h-4 w-4" />
                                <span>Report Comment</span>
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
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
