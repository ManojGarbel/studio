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
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

// ---------------------------------------------------------------- //
// 📄 TYPE DEFINITIONS
// ---------------------------------------------------------------- //
interface Comment extends BaseComment {
  parentId: string | null;
  replies: Comment[];
}
interface Confession extends BaseConfession {
  comments: Comment[];
}

// ---------------------------------------------------------------- //
// 🎨 SYNTAX HIGHLIGHTER
// ---------------------------------------------------------------- //
const KEYWORDS = [
  'fix', 'bug', 'error', 'pushed', 'main', 'production', 'friday', 'debug',
  'console.log', 'git', 'commit', 'database', 'server', 'client', 'react',
  'javascript', 'typescript', 'css', 'html', 'python', 'java', 'c#', 'c++',
  'php', 'ruby', 'go', 'rust', 'sql'
];
const CodeSyntaxHighlighter = ({ text }: { text: string }) => (
  <pre className="whitespace-pre-wrap break-words font-code text-sm leading-relaxed">
    <code>
      {text.split(/(\s+|[.,;!?()])/).map((word, i) => {
        const lower = word.toLowerCase();
        let color = "text-gray-200";
        if (KEYWORDS.includes(lower)) color = "text-green-400";
        else if (!isNaN(Number(word))) color = "text-purple-400";
        else if ((word.startsWith('"') && word.endsWith('"')) || (word.startsWith("'") && word.endsWith("'")))
          color = "text-yellow-400";
        return <span key={i} className={color}>{word}</span>;
      })}
    </code>
  </pre>
);

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
        className="flex-1 rounded-md border border-accent/30 bg-gray-900/60 font-code text-xs resize-none sm:text-sm focus:border-accent focus:ring-1 focus:ring-accent"
      />
      <Button type="submit" size="icon" disabled={isPending} className="bg-accent/20 hover:bg-accent/40 text-accent rounded-md">
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
  refresh,
  depth = 0,
}: {
  comment: Comment;
  onReport: (id: string, type: 'comment') => void;
  confessionId: string;
  refresh: () => void;
  depth?: number;
}) {
  const [isReplying, setIsReplying] = useState(false);

  return (
    <div className="flex flex-col">
      <div
        className={`flex gap-3 rounded-lg p-3 transition 
        ${depth === 0 ? "bg-gray-900/60 hover:bg-gray-900/80" : "bg-gray-800/50 hover:bg-gray-800/70"}`}
      >
        {/* Avatar + Name + Time */}
        <Avatar className="h-7 w-7 shrink-0">
          <AvatarImage src="/icons/dp.png" alt="anon" />
          <AvatarFallback>🕶️</AvatarFallback>
        </Avatar>
        <div className="flex-1">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span className="font-medium text-accent">anon::{comment.anonHash.substring(0, 6)}</span>
            <span>•</span>
            <span>{formatDistanceToNow(new Date(comment.timestamp), { addSuffix: true })}</span>
          </div>
          <p className="mt-1 text-sm leading-relaxed text-gray-200">{comment.text}</p>
          <div className="mt-2 flex gap-3 text-xs">
            <button
              onClick={() => setIsReplying(!isReplying)}
              className="flex items-center gap-1 text-gray-400 hover:text-accent transition"
            >
              <CornerDownRight className="h-3 w-3" />
              Reply
            </button>
            <button
              onClick={() => onReport(comment.id, 'comment')}
              className="flex items-center gap-1 text-gray-400 hover:text-red-500 transition"
            >
              <Flag className="h-3 w-3" />
              Report
            </button>
          </div>
        </div>
      </div>

      {isReplying && (
        <div className="ml-6 mt-3 pl-4 border-l border-accent/30">
          <CommentForm
            confessionId={confessionId}
            parentId={comment.id}
            onCommentAdded={() => {
              setIsReplying(false);
              refresh();
            }}
            placeholder="> drafting reply..."
          />
        </div>
      )}

      {comment.replies?.length > 0 && (
        <div className="ml-6 mt-3 space-y-3 border-l border-gray-700/40 pl-4">
          {comment.replies.map((reply) => (
            <CommentThread
              key={reply.id}
              comment={reply}
              onReport={onReport}
              confessionId={confessionId}
              refresh={refresh}
              depth={depth + 1}
            />
          ))}
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
  refresh,
}: {
  confession: Confession;
  onReport: (id: string, type: 'comment') => void;
  refresh: () => void;
}) {
  const nestedComments = useMemo(() => {
    const commentMap: Record<string, Comment> = {};
    const topLevel: Comment[] = [];
    confession.comments.forEach((c) => { commentMap[c.id] = { ...c, replies: [] }; });
    confession.comments.forEach((c) => {
      if (c.parentId && commentMap[c.parentId]) commentMap[c.parentId].replies.push(commentMap[c.id]);
      else topLevel.push(commentMap[c.id]);
    });
    return topLevel;
  }, [confession.comments]);

  return (
    <div className="w-full space-y-4 border-t border-accent/30 pt-4 max-h-96 overflow-y-auto scrollbar-thin scrollbar-thumb-accent/40">
      <div className="flex items-start gap-3">
        <Avatar className="h-7 w-7 shrink-0">
          <AvatarImage src="/icons/dp.png" alt="anon" />
          <AvatarFallback>🕶️</AvatarFallback>
        </Avatar>
        <CommentForm confessionId={confession.id} onCommentAdded={refresh} />
      </div>
      <div className="space-y-4">
        {nestedComments.map((comment) => (
          <CommentThread
            key={comment.id}
            comment={comment}
            onReport={onReport}
            confessionId={confession.id}
            refresh={refresh}
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

  useEffect(() => { setConfession(initialConfession); }, [initialConfession]);
  const refresh = () => setConfession((prev) => ({ ...prev }));

  const timeAgo = useMemo(
    () => formatDistanceToNow(new Date(confession.timestamp), { addSuffix: true }),
    [confession.timestamp]
  );

  const onLike = () => {
    playLikeSound();
    startTransition(async () => {
      setConfession(prev => {
        let newLikes = prev.likes, newDislikes = prev.dislikes;
        let newInteraction: 'like' | 'dislike' | null = 'like';
        if (prev.userInteraction === 'like') { newLikes--; newInteraction = null; }
        else if (prev.userInteraction === 'dislike') { newLikes++; newDislikes--; }
        else { newLikes++; }
        return { ...prev, likes: newLikes, dislikes: newDislikes, userInteraction: newInteraction };
      });
      await handleLike(confession.id);
    });
  };

  const onDislike = () => {
    playDislikeSound();
    startTransition(async () => {
      setConfession(prev => {
        let newLikes = prev.likes, newDislikes = prev.dislikes;
        let newInteraction: 'like' | 'dislike' | null = 'dislike';
        if (prev.userInteraction === 'dislike') { newDislikes--; newInteraction = null; }
        else if (prev.userInteraction === 'like') { newDislikes++; newLikes--; }
        else { newDislikes++; }
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
    <Card className="w-full overflow-hidden rounded-xl border border-accent/40 bg-black/90 font-mono shadow-[0_0_18px_#00ffe0]">
      {/* Header: DP + name + time */}
      <CardHeader className="flex items-center justify-between px-4 py-2 text-xs text-gray-400">
        <div className="flex items-center gap-2">
          <Avatar className="h-6 w-6">
            <AvatarImage src="/icons/dp.png" alt="anon" />
            <AvatarFallback>🕶️</AvatarFallback>
          </Avatar>
          <span className="truncate text-accent">anon::{confession.anonHash.substring(0, 6)}</span>
          <span className="text-gray-500">• {timeAgo}</span>
        </div>
      </CardHeader>

      <CardContent className="px-4 py-2">
        <CodeSyntaxHighlighter text={confession.text} />
      </CardContent>

      <CardFooter className="flex flex-col gap-3 px-4 py-3">
        <div className="flex w-full items-center gap-2">
          <Button onClick={onLike} disabled={isPending} variant="ghost"
            className="flex h-9 w-20 items-center justify-center gap-2 p-0 text-gray-400 hover:text-green-400">
            <span className="text-sm font-medium tabular-nums">{confession.likes}</span>
            <Heart className={`h-4 w-4 ${confession.userInteraction === 'like' ? 'fill-current text-green-400' : ''}`} />
          </Button>
          <Button onClick={onDislike} disabled={isPending} variant="ghost"
            className="flex h-9 w-20 items-center justify-center gap-2 p-0 text-gray-400 hover:text-red-400">
            <span className="text-sm font-medium tabular-nums">{confession.dislikes}</span>
            <ThumbsDown className={`h-4 w-4 ${confession.userInteraction === 'dislike' ? 'fill-current text-red-400' : ''}`} />
          </Button>
          <Button onClick={() => setShowComments(!showComments)} variant="ghost"
            className="flex h-9 w-20 items-center justify-center gap-2 p-0 text-gray-400 hover:text-cyan-400">
            <span className="text-sm font-medium tabular-nums">{confession.comments.length}</span>
            <MessageSquare className="h-4 w-4" />
          </Button>
          <Button onClick={() => onReport(confession.id, 'confession')} disabled={isPending} variant="ghost"
            className="ml-auto flex h-9 w-20 items-center justify-center p-0 text-gray-400 hover:text-red-500">
            <Flag className="h-4 w-4" />
          </Button>
        </div>

        {showComments && <CommentsSection confession={confession} onReport={onReport} refresh={refresh} />}
      </CardFooter>
    </Card>
  );
}
