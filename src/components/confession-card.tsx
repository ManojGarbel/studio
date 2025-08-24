
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

const SYNTAX_HIGHLIGHT_COLORS = {
    keyword: 'text-primary', // Neon Green for keywords
    string: 'text-accent', // Electric Purple for strings
    number: 'text-yellow-400',
    default: 'text-foreground/90' // Default text color
};

const KEYWORDS = ['fix', 'bug', 'error', 'pushed', 'main', 'production', 'friday', 'debug', 'console.log', 'git', 'commit', 'database', 'server', 'client', 'react', 'javascript', 'typescript', 'css', 'html', 'python', 'java', 'c#', 'c++', 'php', 'ruby', 'go', 'rust', 'sql'];


const IncognitoIcon = ({ className }: { className?: string }) => (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 16 16"
      className={className}
      fill="currentColor"
    >
        <path fillRule="evenodd" d="m4.736 1.968-.892 3.269-.014.058C2.113 5.568 1 6.006 1 6.5 1 7.328 4.134 8 8 8s7-.672 7-1.5c0-.494-1.113-.932-2.83-1.205l-.014-.058-.892-3.27c-.146-.533-.698-.849-1.239-.734C9.411 1.363 8.62 1.5 8 1.5s-1.411-.136-2.025-.267c-.541-.115-1.093.2-1.239.735m.015 3.867a.25.25 0 0 1 .274-.224c.9.092 1.91.143 2.975.143a30 30 0 0 0 2.975-.143.25.25 0 0 1 .05.498c-.918.093-1.944.145-3.025.145s-2.107-.052-3.025-.145a.25.25 0 0 1-.224-.274M3.5 10h2a.5.5 0 0 1 .5.5v1a1.5 1.5 0 0 1-3 0v-1a.5.5 0 0 1 .5-.5m-1.5.5q.001-.264.085-.5H2a.5.5 0 0 1 0-1h3.5a1.5 1.5 0 0 1 1.488 1.312 3.5 3.5 0 0 1 2.024 0A1.5 1.5 0 0 1 10.5 9H14a.5.5 0 0 1 0 1h-.085q.084.236.085.5v1a2.5 2.5 0 0 1-5 0v-.14l-.21-.07a2.5 2.5 0 0 0-1.58 0l-.21.07v.14a2.5 2.5 0 0 1-5 0zm8.5-.5h2a.5.5 0 0 1 .5.5v1a1.5 1.5 0 0 1-3 0v-1a.5.5 0 0 1 .5-.5"/>
    </svg>
);

const CodeSyntaxHighlighter = ({ text }: { text: string }) => {
    const words = text.split(/(\s+|[.,;!?()])/); // Split by whitespace and punctuation but keep them
    
    return (
        <pre className="whitespace-pre-wrap break-words font-code text-base">
            <code>
                {words.map((word, index) => {
                    const lowerWord = word.toLowerCase();
                    let colorClass = SYNTAX_HIGHLIGHT_COLORS.default;
                    
                    if (KEYWORDS.includes(lowerWord)) {
                        colorClass = SYNTAX_HIGHLIGHT_COLORS.keyword;
                    } else if (!isNaN(Number(word))) {
                        colorClass = SYNTAX_HIGHLIGHT_COLORS.number;
                    } else if ((word.startsWith('"') && word.endsWith('"')) || (word.startsWith("'") && word.endsWith("'"))) {
                        colorClass = SYNTAX_HIGHLIGHT_COLORS.string;
                    }

                    return <span key={index} className={colorClass}>{word}</span>;
                })}
            </code>
        </pre>
    );
};


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
    <Card className="w-full group">
      <CardHeader className="flex flex-row items-start gap-4">
        <Avatar className="border-2 border-primary/50 mt-1">
           <AvatarFallback className="bg-secondary">
              <IncognitoIcon className="h-6 w-6 text-muted-foreground" />
           </AvatarFallback>
        </Avatar>
        <div className="flex-grow flex items-start justify-between">
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <p className="font-semibold text-primary">
                  Anonymous
                  <span className="text-muted-foreground font-mono">#{confession.anonHash.substring(0, 6)}</span>
                </p>
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
        <CodeSyntaxHighlighter text={confession.text} />
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
                       <IncognitoIcon className="h-5 w-5 text-muted-foreground" />
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
                                        Anonymous<span className="text-muted-foreground font-mono">#{comment.anonHash.substring(0, 6)}</span>
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

    
