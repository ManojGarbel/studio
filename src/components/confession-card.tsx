'use client';

import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import type { Confession as BaseConfession, Comment as BaseComment } from '@/lib/types';
import { formatDistanceToNow } from 'date-fns';
import { Heart, MessageSquare, Flag, ThumbsDown, Send, CornerDownRight } from 'lucide-react';
import { useState, useTransition, useRef, useEffect, useMemo, FormEvent } from 'react';
import {
  handleLike,
  handleDislike,
  addComment,
  reportConfession,
  reportComment,
} from '@/lib/actions';
import { Textarea } from './ui/textarea';
import { useToast } from '@/hooks/use-toast';
import useSound from '@/hooks/use-sound';
import { SOUNDS } from '@/lib/sounds';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"; // ✅ for DP

// ---------------------------------------------------------------- //
// 📄 TYPE DEFINITIONS
// ---------------------------------------------------------------- //
interface Comment extends BaseComment {
  parentId: string | null;
  replies?: Comment[];
}

interface Confession extends BaseConfession {
  comments: Comment[];
}

// ---------------------------------------------------------------- //
// 🎨 SYNTAX HIGHLIGHTER
// ---------------------------------------------------------------- //
const SYNTAX_HIGHLIGHT_COLORS = { keyword: 'text-keyword', string: 'text-string', number: 'text-number', default: 'text-default' };
const KEYWORDS = ['Hakkan','fix','bug','error','pushed','main','production','friday','debug','console.log','git','commit','database','server','client','react','javascript','typescript','css','html','python','java','c#','c++','php','ruby','go','rust','sql'];
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

// ---------------------------------------------------------------- //
// 💬 COMMENT FORM
// ---------------------------------------------------------------- //
function CommentForm({
  confessionId,
  parentId = null,
  onCommentAdded,
  placeholder = "> add comment...",
}: {
  confessionId: string;
  parentId?: string | null;
  onCommentAdded: () => void;
  placeholder?: string;
}) {
  const formRef = useRef<HTMLFormElement>(null);
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();
  const playCommentSound = useSound(SOUNDS.comment);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const commentText = formData.get('comment') as string;

    if (!commentText.trim()) return;

    playCommentSound();
    startTransition(async () => {
      const result = await addComment(confessionId, formData, parentId);
      if (result?.success) {
        formRef.current?.reset();
        onCommentAdded();
      } else if (result?.message) {
        toast({ variant: 'destructive', title: 'Error', description: result.message });
      }
    });
  };

  return (
    <form onSubmit={handleSubmit} ref={formRef} className="flex w-full gap-2">
      <Textarea
        name="comment"
        placeholder={placeholder}
        rows={1}
        required
        disabled={isPending}
        className="flex-1 rounded-md border border-accent/30 bg-background font-code text-xs resize-none sm:text-sm"
      />
      <Button type="submit" size="icon" disabled={isPending} className="btn-hacker shrink-0">
        <Send className="h-4 w-4" />
      </Button>
    </form>
  );
}

// ---------------------------------------------------------------- //
// 🧵 COMMENT THREAD (Recursive)
// ---------------------------------------------------------------- //
function CommentThread({
  comment,
  onReport,
  confessionId,
}: {
  comment: Comment;
  onReport: (id: string, type: 'comment') => void;
  confessionId: string;
}) {
  const [isReplying, setIsReplying] = useState(false);

  return (
    <div className="flex flex-col">
      {/* Main Comment */}
      <div className="flex gap-3 rounded-lg bg-secondary/5 p-3 transition hover:bg-secondary/10">
        {/* Avatar */}
        <Avatar className="h-7 w-7 shrink-0">
          <AvatarImage src="/icon/dp.png" alt="anon" />
          <AvatarFallback>🕶️</AvatarFallback>
        </Avatar>

        {/* Content */}
        <div className="flex-1">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span className="font-medium text-accent">
              anon::{comment.anonHash.substring(0, 6)}
            </span>
            <span>•</span>
            <span>
              {formatDistanceToNow(new Date(comment.timestamp), { addSuffix: true })}
            </span>
          </div>

          <p className="mt-1 text-sm leading-relaxed text-default">{comment.text}</p>

          <div className="mt-2 flex gap-3 text-xs">
            <button
              onClick={() => setIsReplying(!isReplying)}
              className="flex items-center gap-1 text-muted-foreground hover:text-accent transition"
            >
              <CornerDownRight className="h-3 w-3" />
              Reply
            </button>
            <button
              onClick={() => onReport(comment.id, 'comment')}
              className="flex items-center gap-1 text-muted-foreground hover:text-destructive transition"
            >
              <Flag className="h-3 w-3" />
              Report
            </button>
          </div>
        </div>
      </div>

      {/* Replies */}
      {comment.replies && comment.replies.length > 0 && (
        <div className="ml-6 mt-3 space-y-3 border-l border-border pl-4">
          {comment.replies.map((reply) => (
            <CommentThread
              key={reply.id}
              comment={reply}
              onReport={onReport}
              confessionId={confessionId}
            />
          ))}
        </div>
      )}

      {/* Reply Form */}
      {isReplying && (
        <div className="ml-6 mt-3 border-l border-accent/20 pl-4">
          <CommentForm
            confessionId={confessionId}
            parentId={comment.id}
            onCommentAdded={() => setIsReplying(false)}
            placeholder="> drafting reply..."
          />
        </div>
      )}
    </div>
  );
}


// ---------------------------------------------------------------- //
// 🏛️ COMMENTS SECTION
// ---------------------------------------------------------------- //
function CommentsSection({
  confession,
  onReport,
}: {
  confession: Confession;
  onReport: (id: string, type: 'comment') => void;
}) {
  const nestedComments = useMemo(() => {
    const commentMap: Record<string, Comment> = {};
    const topLevelComments: Comment[] = [];

    for (const comment of confession.comments) {
      comment.replies = [];
      commentMap[comment.id] = comment;
    }

    for (const comment of confession.comments) {
      if (comment.parentId && commentMap[comment.parentId]) {
        commentMap[comment.parentId].replies?.push(comment);
      } else {
        topLevelComments.push(comment);
      }
    }
    return topLevelComments;
  }, [confession.comments]);

  return (
    <div className="w-full space-y-4 border-t border-accent/20 pt-4 max-h-96 overflow-y-auto scrollbar-thin scrollbar-thumb-accent/40">
      {/* Comment Input */}
      <div className="flex items-start gap-3">
        <Avatar className="h-7 w-7 shrink-0">
          <AvatarImage src="/icon/dp.png" alt="anon" />
          <AvatarFallback>🕶️</AvatarFallback>
        </Avatar>
        <CommentForm confessionId={confession.id} onCommentAdded={() => {}} />
      </div>

      {/* Thread */}
      <div className="space-y-4">
        {nestedComments.map((comment) => (
          <CommentThread
            key={comment.id}
            comment={comment}
            onReport={onReport}
            confessionId={confession.id}
          />
        ))}
      </div>
    </div>
  );
}


// ---------------------------------------------------------------- //
// 🃏 MAIN CONFESSION CARD
// ---------------------------------------------------------------- //
export function ConfessionCard({ confession: initialConfession }: { confession: Confession }) {
  const [isPending, startTransition] = useTransition();
  const [showComments, setShowComments] = useState(false);
  const [confession, setConfession] = useState(initialConfession);
  
  const playLikeSound = useSound(SOUNDS.like, 0.2);
  const playDislikeSound = useSound(SOUNDS.dislike, 0.2);
  const playReportSound = useSound(SOUNDS.report);
  const { toast } = useToast();

  useEffect(() => {
    setConfession(initialConfession);
  }, [initialConfession]);

  const timeAgo = useMemo(
    () => formatDistanceToNow(new Date(confession.timestamp), { addSuffix: true }),
    [confession.timestamp]
  );

  const onLike = () => {
    playLikeSound();
    startTransition(async () => {
      setConfession(prev => {
        let newLikes = prev.likes;
        let newDislikes = prev.dislikes;
        let newInteraction: 'like' | 'dislike' | null = 'like';

        if (prev.userInteraction === 'like') {
          newLikes--;
          newInteraction = null;
        } else if (prev.userInteraction === 'dislike') {
          newLikes++;
          newDislikes--;
        } else {
          newLikes++;
        }

        return { ...prev, likes: newLikes, dislikes: newDislikes, userInteraction: newInteraction };
      });
      await handleLike(confession.id);
    });
  };

  const onDislike = () => {
    playDislikeSound();
    startTransition(async () => {
      setConfession(prev => {
        let newLikes = prev.likes;
        let newDislikes = prev.dislikes;
        let newInteraction: 'like' | 'dislike' | null = 'dislike';

        if (prev.userInteraction === 'dislike') {
          newDislikes--;
          newInteraction = null;
        } else if (prev.userInteraction === 'like') {
          newDislikes++;
          newLikes--;
        } else {
          newDislikes++;
        }

        return { ...prev, likes: newLikes, dislikes: newDislikes, userInteraction: newInteraction };
      });
      await handleDislike(confession.id);
    });
  };

  const onReport = (id: string, type: 'confession' | 'comment') => {
    playReportSound();
    startTransition(async () => {
      const action = type === 'confession' ? reportConfession : reportComment;
      const result = await action(id);
      if (result?.success) toast({ title: 'Reported', description: result.message });
      else if (result?.message) toast({ variant: 'destructive', title: 'Error', description: result.message });
    });
  };

  return (
    <Card className="w-full overflow-hidden rounded-xl border border-accent/30 bg-black/80 font-mono shadow-[0_0_16px_#00ffe0]">
      <CardHeader className="flex items-center justify-between px-4 py-2 text-xs text-muted-foreground">
        <div className="flex items-center gap-2">
          <Avatar className="h-6 w-6">
            <AvatarImage src="/incognito.png" alt="anon" />
            <AvatarFallback>🕶️</AvatarFallback>
          </Avatar>
          <span className="truncate text-accent">
            anon::{confession.anonHash.substring(0, 6)}
          </span>
        </div>
        <span className="shrink-0">{timeAgo}</span>
      </CardHeader>

      <CardContent className="px-4 py-2">
        <CodeSyntaxHighlighter text={confession.text} />
      </CardContent>

      <CardFooter className="flex flex-col gap-3 px-4 py-3">
        <div className="flex w-full items-center gap-2">
          <Button onClick={onLike} disabled={isPending} variant="ghost" className="btn-hacker flex h-9 w-20 items-center justify-center gap-2 p-0">
            <span className="text-sm font-medium tabular-nums">{confession.likes}</span>
            <Heart className={`h-4 w-4 transition-colors ${confession.userInteraction === 'like' ? 'fill-current text-string' : 'text-muted-foreground'}`}/>
          </Button>
          <Button onClick={onDislike} disabled={isPending} variant="ghost" className="btn-hacker flex h-9 w-20 items-center justify-center gap-2 p-0">
            <span className="text-sm font-medium tabular-nums">{confession.dislikes}</span>
            <ThumbsDown className={`h-4 w-4 transition-colors ${confession.userInteraction === 'dislike' ? 'fill-current text-destructive' : 'text-muted-foreground'}`} />
          </Button>
          <Button onClick={() => setShowComments(!showComments)} variant="ghost" className="btn-hacker flex h-9 w-20 items-center justify-center gap-2 p-0">
            <span className="text-sm font-medium tabular-nums">{confession.comments.length}</span>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </Button>
          <Button onClick={() => onReport(confession.id, 'confession')} disabled={isPending} variant="ghost" className="btn-hacker ml-auto flex h-9 w-20 items-center justify-center p-0">
            <Flag className="h-4 w-4 text-muted-foreground transition-colors hover:text-destructive" />
          </Button>
        </div>

        {showComments && <CommentsSection confession={confession} onReport={onReport} />}
      </CardFooter>
    </Card>
  );
}
