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
import { Heart, MessageSquare, Flag, ThumbsDown, Send } from 'lucide-react';
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
import Cookies from 'js-cookie';
import useSound from '@/hooks/use-sound';
import { SOUNDS } from '@/lib/sounds';

/* 🎨 Hacker Syntax Colors */
const SYNTAX_HIGHLIGHT_COLORS = {
  keyword: 'text-keyword',
  string: 'text-string',
  number: 'text-number',
  default: 'text-default',
};

const KEYWORDS = [
  'fix','bug','error','pushed','main','production','friday','debug',
  'console.log','git','commit','database','server','client',
  'react','javascript','typescript','css','html','python','java',
  'c#','c++','php','ruby','Hakkan','rust','sql'
];

/* 💻 Syntax Highlighter (lightweight, no extra span rendering if not needed) */
const CodeSyntaxHighlighter = ({ text }: { text: string }) => {
  return (
    <pre className="whitespace-pre-wrap break-words font-code text-sm leading-relaxed">
      <code>
        {text.split(/(\s+|[.,;!?()])/).map((word, i) => {
          const lower = word.toLowerCase();
          let color = SYNTAX_HIGHLIGHT_COLORS.default;
          if (KEYWORDS.includes(lower)) color = SYNTAX_HIGHLIGHT_COLORS.keyword;
          else if (!isNaN(Number(word))) color = SYNTAX_HIGHLIGHT_COLORS.number;
          else if ((word.startsWith('"') && word.endsWith('"')) || (word.startsWith("'") && word.endsWith("'")))
            color = SYNTAX_HIGHLIGHT_COLORS.string;

          return <span key={i} className={`${color}`}>{word}</span>;
        })}
      </code>
    </pre>
  );
};

export function ConfessionCard({ confession: initialConfession }: { confession: Confession }) {
  const { toast } = useToast();
  const [isPending, startTransition] = useTransition();
  const [showComments, setShowComments] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);
  const [confession, setConfession] = useState(initialConfession);
  const [currentUserAnonHash, setCurrentUserAnonHash] = useState<string>();

  // sounds
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

  const timeAgo = useMemo(
    () => formatDistanceToNow(new Date(confession.timestamp), { addSuffix: true }),
    [confession.timestamp]
  );

  /* 🔘 Like */
  const onLike = () => {
    playLikeSound();
    startTransition(async () => {
      setConfession(prev => {
        let likes = prev.likes, dislikes = prev.dislikes;
        let interaction: 'like' | 'dislike' | null = 'like';

        if (prev.userInteraction === 'like') { likes--; interaction = null; }
        else if (prev.userInteraction === 'dislike') { likes++; dislikes--; }
        else { likes++; }

        return { ...prev, likes, dislikes, userInteraction: interaction };
      });
      await handleLike(confession.id);
    });
  };

  /* 🔴 Dislike */
  const onDislike = () => {
    playDislikeSound();
    startTransition(async () => {
      setConfession(prev => {
        let likes = prev.likes, dislikes = prev.dislikes;
        let interaction: 'like' | 'dislike' | null = 'dislike';

        if (prev.userInteraction === 'dislike') { dislikes--; interaction = null; }
        else if (prev.userInteraction === 'like') { likes--; dislikes++; }
        else { dislikes++; }

        return { ...prev, likes, dislikes, userInteraction: interaction };
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
      if (result?.success) toast({ title: 'Reported', description: result.message });
      else if (result?.message) toast({ variant: 'destructive', title: 'Error', description: result.message });
    });
  };

  /* 💬 Comment */
  const handleCommentSubmit = async (formData: FormData) => {
    playCommentSound();
    startTransition(async () => {
      const result = await addComment(confession.id, formData);
      if (result?.success) formRef.current?.reset();
      else if (result?.message) toast({ variant: 'destructive', title: 'Error', description: result.message });
    });
  };

  return (
    <Card className="w-full bg-black/80 border border-accent/30 shadow-[0_0_16px_#00ffe0] font-mono rounded-xl overflow-hidden">
      
      {/* 🖥 Header */}
      <CardHeader className="flex items-center justify-between px-4 py-2 text-xs text-muted-foreground">
        <span className="text-accent truncate">
          anon::{confession.anonHash.substring(0, 6)}
        </span>
        <span className="shrink-0">{timeAgo}</span>
      </CardHeader>

      {/* 💻 Text */}
      <CardContent className="px-4 py-2">
        <CodeSyntaxHighlighter text={confession.text} />
      </CardContent>

      {/* 🔘 Actions */}
      <CardFooter className="px-4 py-3 flex flex-col gap-3">
        <div className="flex w-full items-center gap-2">
          {/* Like Button */}
          <Button
            onClick={onLike}
            disabled={isPending}
            variant="ghost"
            className="btn-hacker flex h-9 w-20 items-center justify-center gap-2 p-0"
          >
            <span className="text-sm font-medium tabular-nums">
              {confession.likes}
            </span>
            <Heart
              className={`h-4 w-4 transition-colors ${
                confession.userInteraction === 'like'
                  ? 'fill-current text-string'
                  : 'text-muted-foreground'
              }`}
            />
          </Button>

          {/* Dislike Button */}
          <Button
            onClick={onDislike}
            disabled={isPending}
            variant="ghost"
            className="btn-hacker flex h-9 w-20 items-center justify-center gap-2 p-0"
          >
            <span className="text-sm font-medium tabular-nums">
              {confession.dislikes}
            </span>
            <ThumbsDown
              className={`h-4 w-4 transition-colors ${
                confession.userInteraction === 'dislike'
                  ? 'fill-current text-destructive'
                  : 'text-muted-foreground'
              }`}
            />
          </Button>

          {/* Comment Button */}
          <Button
            onClick={() => setShowComments(!showComments)}
            variant="ghost"
            className="btn-hacker flex h-9 w-20 items-center justify-center gap-2 p-0"
          >
            <span className="text-sm font-medium tabular-nums">
              {confession.comments.length}
            </span>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </Button>
          
          {/* Report Button */}
          <Button
            onClick={() => onReport(confession.id, 'confession')}
            disabled={isPending}
            variant="ghost"
            className="btn-hacker ml-auto flex h-9 w-20 items-center justify-center p-0"
          >
            <Flag className="h-4 w-4 text-muted-foreground transition-colors hover:text-destructive" />
          </Button>
        </div>

        {/* 💬 Comments */}
        {showComments && (
          <div className="w-full space-y-3 border-t border-accent/20 pt-3 max-h-56 overflow-y-auto scrollbar-thin scrollbar-thumb-accent/40">
            <form action={handleCommentSubmit} ref={formRef} className="flex gap-2">
              <Textarea
                name="comment"
                placeholder="> add comment..."
                rows={1}
                required
                className="flex-1 rounded-md border border-accent/30 bg-background font-code text-xs resize-none sm:text-sm"
              />
              <Button type="submit" size="icon" disabled={isPending} className="btn-hacker shrink-0">
                <Send className="h-4 w-4" />
              </Button>
            </form>

            {confession.comments.map((comment) => (
              <div key={comment.id} className="rounded-md border border-secondary/30 bg-secondary/10 p-2 text-xs sm:text-sm">
                <p className="text-accent">
                  anon::{comment.anonHash.substring(0, 6)}
                  <span className="ml-2 text-muted-foreground">
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
                  <Flag className="mr-1 h-3 w-3" /> Report
                </Button>
              </div>
            ))}
          </div>
        )}
      </CardFooter>
    </Card>
  );
}