'use client';

import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import type { Confession } from '@/lib/types';
import { formatDistanceToNow } from 'date-fns';
import {
  Heart,
  MessageSquare,
  Flag,
  ThumbsDown,
  Send,
  MoreVertical,
} from 'lucide-react';
import { Avatar, AvatarFallback } from './ui/avatar';
import { useState, useTransition, useRef, useEffect, useMemo } from 'react';
import {
  handleLike,
  handleDislike,
  addComment,
  reportConfession,
  reportComment,
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
import Cookies from 'js-cookie';
import useSound from '@/hooks/use-sound';
import { SOUNDS } from '@/lib/sounds';

interface ConfessionCardProps {
  confession: Confession;
}

/* 🎨 Hacker Syntax Colors */
const SYNTAX_HIGHLIGHT_COLORS = {
  keyword: 'text-keyword',
  string: 'text-string',
  number: 'text-number',
  tag: 'text-tag',
  default: 'text-default',
};

const KEYWORDS = [
  'fix', 'bug', 'error', 'pushed', 'main', 'production', 'friday', 'debug',
  'console.log', 'git', 'commit', 'database', 'server', 'client',
  'react', 'javascript', 'typescript', 'css', 'html', 'python', 'java',
  'c#', 'c++', 'php', 'ruby', 'go', 'rust', 'sql'
];

/* 💻 Syntax Highlighter */
const CodeSyntaxHighlighter = ({ text }: { text: string }) => {
  const words = text.split(/(\s+|[.,;!?()])/);

  return (
    <pre className="whitespace-pre-wrap break-words font-code text-sm leading-relaxed">
      <code>
        {words.map((word, index) => {
          const lowerWord = word.toLowerCase();
          let colorClass = SYNTAX_HIGHLIGHT_COLORS.default;

          if (KEYWORDS.includes(lowerWord)) {
            colorClass = SYNTAX_HIGHLIGHT_COLORS.keyword;
          } else if (!isNaN(Number(word))) {
            colorClass = SYNTAX_HIGHLIGHT_COLORS.number;
          } else if (
            (word.startsWith('"') && word.endsWith('"')) ||
            (word.startsWith("'") && word.endsWith("'"))
          ) {
            colorClass = SYNTAX_HIGHLIGHT_COLORS.string;
          }

          return (
            <span key={index} className={`${colorClass} tracking-tight`}>
              {word}
            </span>
          );
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

  const playLikeSound = useSound(SOUNDS.like, 0.2);
  const playDislikeSound = useSound(SOUNDS.dislike, 0.2);
  const playCommentSound = useSound(SOUNDS.comment);
  const playReportSound = useSound(SOUNDS.report);

  useEffect(() => {
    setCurrentUserAnonHash(Cookies.get('anon_hash'));
  }, []);

  useEffect(() => {
    setConfession(initialConfession);
  }, [initialConfession]);

  const timeAgo = formatDistanceToNow(new Date(confession.timestamp), { addSuffix: true });
  const isAuthor = confession.anonHash === currentUserAnonHash;

  /* 🔘 Like */
  const onLike = () => {
    playLikeSound();
    startTransition(async () => {
      setConfession((prev) => {
        let newLikes = prev.likes;
        let newDislikes = prev.dislikes;
        let newInteraction: 'like' | 'dislike' | null = 'like';

        if (prev.userInteraction === 'like') {
          newLikes -= 1;
          newInteraction = null;
        } else if (prev.userInteraction === 'dislike') {
          newLikes += 1;
          newDislikes -= 1;
        } else {
          newLikes += 1;
        }
        return { ...prev, likes: newLikes, dislikes: newDislikes, userInteraction: newInteraction };
      });
      await handleLike(confession.id);
    });
  };

  /* 🔴 Dislike */
  const onDislike = () => {
    playDislikeSound();
    startTransition(async () => {
      setConfession((prev) => {
        let newLikes = prev.likes;
        let newDislikes = prev.dislikes;
        let newInteraction: 'like' | 'dislike' | null = 'dislike';

        if (prev.userInteraction === 'dislike') {
          newDislikes -= 1;
          newInteraction = null;
        } else if (prev.userInteraction === 'like') {
          newLikes -= 1;
          newDislikes += 1;
        } else {
          newDislikes += 1;
        }
        return { ...prev, likes: newLikes, dislikes: newDislikes, userInteraction: newInteraction };
      });
      await handleDislike(confession.id);
    });
  };

  /* 🚩 Report */
  const onReport = (id: string, type: 'confession' | 'comment') => {
    playReportSound();
    startTransition(async () => {
      const action = type === 'confession' ? reportConfession : reportComment;
      const result = await action(id);
      if (result?.success) {
        toast({ title: 'Reported', description: result.message });
      } else if (result?.message) {
        toast({ variant: 'destructive', title: 'Error', description: result.message });
      }
    });
  };

  /* 💬 Comment */
  const handleCommentSubmit = async (formData: FormData) => {
    playCommentSound();
    startTransition(async () => {
      const result = await addComment(confession.id, formData);
      if (result?.success) {
        formRef.current?.reset();
      } else if (result?.message) {
        toast({ variant: 'destructive', title: 'Error', description: result.message });
      }
    });
  };

  return (
    <Card className="w-full bg-black/70 border border-primary/40 shadow-[0_0_20px_#00ffe0] font-mono scanlines">
      {/* 🖥 Header */}
      <CardHeader className="flex flex-row justify-between items-center text-xs text-muted-foreground">
        <p className="text-accent">
          anon::{confession.anonHash.substring(0, 6)}
        </p>
        <span>{timeAgo}</span>
      </CardHeader>

      {/* 💻 Confession Text */}
      <CardContent className="mt-2">
        <CodeSyntaxHighlighter text={confession.text} />
      </CardContent>

      {/* 🔘 Footer Actions */}
      <CardFooter className="flex flex-col gap-4">
        <div className="flex gap-2">
          <Button
            variant="ghost"
            size="sm"
            aria-label="Like"
            onClick={onLike}
            disabled={isPending}
            className="btn-hacker flex items-center gap-2"
          >
            <Heart className={confession.userInteraction === 'like' ? 'text-string fill-current' : 'text-muted-foreground'} />
            <span>{confession.likes}</span>
          </Button>
          <Button
            variant="ghost"
            size="sm"
            aria-label="Dislike"
            onClick={onDislike}
            disabled={isPending}
            className="btn-hacker flex items-center gap-2"
          >
            <ThumbsDown className={confession.userInteraction === 'dislike' ? 'text-destructive fill-current' : 'text-muted-foreground'} />
            <span>{confession.dislikes}</span>
          </Button>
          <Button
            variant="ghost"
            size="sm"
            aria-label="Comment"
            onClick={() => setShowComments(!showComments)}
            className="btn-hacker flex items-center gap-2"
          >
            <MessageSquare className="h-4 w-4" />
            <span>{confession.comments.length}</span>
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="btn-hacker">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => onReport(confession.id, 'confession')}>
                <Flag className="mr-2 h-4 w-4" /> Report
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* 💬 Comments */}
        {showComments && (
          <div className="w-full border-t border-primary/20 pt-4">
            <form action={handleCommentSubmit} ref={formRef} className="flex gap-2">
              <Textarea
                name="comment"
                placeholder="> add comment..."
                rows={1}
                required
                className="font-code flex-1 bg-background text-sm border border-accent/30"
              />
              <Button type="submit" size="icon" disabled={isPending} className="btn-hacker">
                <Send className="h-4 w-4" />
              </Button>
            </form>

            <div className="mt-4 flex flex-col gap-3">
              {confession.comments.map((comment) => (
                <div key={comment.id} className="text-sm bg-secondary/10 p-2 rounded border border-secondary/30">
                  <p className="text-accent">
                    anon::{comment.anonHash.substring(0, 6)}
                    <span className="text-muted-foreground ml-2">
                      {formatDistanceToNow(new Date(comment.timestamp), { addSuffix: true })}
                    </span>
                  </p>
                  <p className="mt-1 text-default">{comment.text}</p>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="btn-hacker mt-1"
                    onClick={() => onReport(comment.id, 'comment')}
                  >
                    <Flag className="h-4 w-4 mr-1" /> Report
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardFooter>
    </Card>
  );
}
