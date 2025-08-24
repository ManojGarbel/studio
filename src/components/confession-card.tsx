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
  User,
  UserX,
} from 'lucide-react';
import { Avatar, AvatarFallback } from './ui/avatar';
import { useState, useTransition, useRef, useEffect, useMemo } from 'react';
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { MoreVertical } from 'lucide-react';
import Cookies from 'js-cookie';


interface ConfessionCardProps {
  confession: Confession;
}

const COMMENT_COLOR_PALETTE = [
  '#FF6B6B', '#4ECDC4', '#45B7D1', '#FED766', '#8A63D2',
  '#F7786B', '#A2D4AB', '#F9A828', '#2AB7CA', '#F56991'
];


export function ConfessionCard({ confession: initialConfession }: ConfessionCardProps) {
  const { toast } = useToast();
  const [isPending, startTransition] = useTransition();
  const [showComments, setShowComments] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);
  
  const [confession, setConfession] = useState(initialConfession);
  const [currentUserAnonHash, setCurrentUserAnonHash] = useState<string | undefined>(undefined);

  useEffect(() => {
    setCurrentUserAnonHash(Cookies.get('anon_hash'));
  }, []);

  const commentColorMap = useMemo(() => {
    const map = new Map<string, string>();
    const availableColors = [...COMMENT_COLOR_PALETTE];

    confession.comments.forEach(comment => {
      if (!map.has(comment.anonHash)) {
        if (availableColors.length > 0) {
          const colorIndex = Math.floor(Math.random() * availableColors.length);
          map.set(comment.anonHash, availableColors[colorIndex]);
          availableColors.splice(colorIndex, 1);
        } else {
          // Fallback if more commenters than colors
          map.set(comment.anonHash, COMMENT_COLOR_PALETTE[Math.floor(Math.random() * COMMENT_COLOR_PALETTE.length)]);
        }
      }
    });
    return map;
  }, [confession.comments]);
  
  // Re-sync with server-provided props if they change
  useEffect(() => {
    setConfession(initialConfession);
  }, [initialConfession]);

  const timeAgo = formatDistanceToNow(new Date(confession.timestamp), {
    addSuffix: true,
  });

  const isAuthor = confession.anonHash === currentUserAnonHash;

  const getStatusBadge = () => {
    if (!isAuthor) return null;

    switch (confession.status) {
      case 'pending':
        return <Badge variant="secondary">Pending</Badge>;
      case 'approved':
        return <Badge variant="default">Approved</Badge>;
      // 'rejected' status posts are filtered out by the backend for authors, but we can handle it just in case
      case 'rejected':
         return <Badge variant="destructive">Rejected</Badge>;
      default:
        return null;
    }
  };


  const onLike = () => {
    startTransition(async () => {
      setConfession((prev) => {
        const currentInteraction = prev.userInteraction;
        let newLikes = prev.likes;
        let newDislikes = prev.dislikes;
        let newInteraction: 'like' | 'dislike' | null = 'like';

        if (currentInteraction === 'like') {
          // Undo like
          newLikes -= 1;
          newInteraction = null;
        } else if (currentInteraction === 'dislike') {
          // Switch from dislike to like
          newLikes += 1;
          newDislikes -= 1;
          newInteraction = 'like';
        } else {
          // New like
          newLikes += 1;
          newInteraction = 'like';
        }

        return { ...prev, likes: newLikes, dislikes: newDislikes, userInteraction: newInteraction };
      });
      await handleLike(confession.id);
    });
  };

  const onDislike = () => {
    startTransition(async () => {
      setConfession((prev) => {
        const currentInteraction = prev.userInteraction;
        let newLikes = prev.likes;
        let newDislikes = prev.dislikes;
        let newInteraction: 'like' | 'dislike' | null = 'dislike';

        if (currentInteraction === 'dislike') {
          // Undo dislike
          newDislikes -= 1;
          newInteraction = null;
        } else if (currentInteraction === 'like') {
          // Switch from like to dislike
          newDislikes += 1;
          newLikes -= 1;
          newInteraction = 'dislike';
        } else {
          // New dislike
          newDislikes += 1;
          newInteraction = 'dislike';
        }

        return { ...prev, likes: newLikes, dislikes: newDislikes, userInteraction: newInteraction };
      });
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
        // The page will be revalidated by the server action
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
      <CardHeader className="flex flex-row items-start gap-4">
        <Avatar className="border-2 border-primary/50 mt-1">
           <AvatarFallback className="bg-secondary">
             <UserX className="h-5 w-5 text-muted-foreground" />
           </AvatarFallback>
        </Avatar>
        <div className="flex-grow flex items-start justify-between">
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <p className="font-semibold text-primary">Anonymous</p>
                {getStatusBadge()}
              </div>
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
                    <AvatarFallback className="bg-secondary">
                       <User className="h-4 w-4 text-muted-foreground" />
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                       <div className="flex items-center gap-2 flex-wrap">
                          {comment.isAuthor ? (
                                <Badge variant="secondary" className="border border-accent/50 text-accent">Author</Badge>
                          ) : (
                               <div className="flex items-center gap-2">
                                    <div 
                                        className="w-2.5 h-2.5 rounded-full" 
                                        style={{ backgroundColor: commentColorMap.get(comment.anonHash) || '#888' }}>
                                    </div>
                                    <span className="font-semibold text-sm text-foreground">
                                        Anonymous
                                    </span>
                               </div>
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
