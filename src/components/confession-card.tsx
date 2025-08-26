'use client';

import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import type { Confession as BaseConfession, Comment as BaseComment } from '@/lib/types'; // Assuming types are in lib/types
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
import Cookies from 'js-cookie';
import useSound from '@/hooks/use-sound';
import { SOUNDS } from '@/lib/sounds';

// ---------------------------------------------------------------- //
// 📄 TYPE DEFINITIONS (Updated to support replies)
// ---------------------------------------------------------------- //
// NOTE: Your actual types in '@/lib/types' should be updated to match this structure.
interface Comment extends BaseComment {
  parentId: string | null;
  replies?: Comment[]; // Added for nesting on the client-side
}

interface Confession extends BaseConfession {
  comments: Comment[];
}

// ---------------------------------------------------------------- //
// 🎨 SYNTAX HIGHLIGHTER (No changes)
// ---------------------------------------------------------------- //
const SYNTAX_HIGHLIGHT_COLORS = { keyword: 'text-keyword', string: 'text-string', number: 'text-number', default: 'text-default' };
const KEYWORDS = ['fix','bug','error','pushed','main','production','friday','debug','console.log','git','commit','database','server','client','react','javascript','typescript','css','html','python','java','c#','c++','php','ruby','go','rust','sql'];
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
// 💬 NEW: COMMENT FORM COMPONENT
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
      // Assumes `addComment` is updated to accept a parentId
      const result = await addComment(confessionId, formData, parentId);
      if (result?.success) {
        formRef.current?.reset();
        onCommentAdded(); // Callback to close the reply form
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
// 🧵 NEW: COMMENT THREAD COMPONENT
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
            <div className="rounded-md border border-secondary/30 bg-secondary/10 p-2 text-xs sm:text-sm">
                <p className="text-accent">
                    anon::{comment.anonHash.substring(0, 6)}
                    <span className="ml-2 text-muted-foreground">
                        {formatDistanceToNow(new Date(comment.timestamp), { addSuffix: true })}
                    </span>
                </p>
                <p className="mt-1 text-default">{comment.text}</p>
                <div className="mt-1 flex gap-2">
                    <Button variant="ghost" size="sm" className="btn-hacker h-auto p-1 text-xs" onClick={() => setIsReplying(!isReplying)}>
                        <CornerDownRight className="mr-1 h-3 w-3" /> Reply
                    </Button>
                    <Button variant="ghost" size="sm" className="btn-hacker h-auto p-1 text-xs" onClick={() => onReport(comment.id, 'comment')}>
                        <Flag className="mr-1 h-3 w-3" /> Report
                    </Button>
                </div>
            </div>

            {/* Replies Section */}
            {comment.replies && comment.replies.length > 0 && (
                <div className="ml-4 mt-2 space-y-2 border-l-2 border-accent/20 pl-4">
                    {comment.replies.map((reply) => (
                        <div key={reply.id} className="rounded-md border border-secondary/30 bg-secondary/20 p-2 text-xs">
                             <p className="text-accent">
                                anon::{reply.anonHash.substring(0, 6)}
                                <span className="ml-2 text-muted-foreground">
                                    {formatDistanceToNow(new Date(reply.timestamp), { addSuffix: true })}
                                </span>
                            </p>
                            <p className="mt-1 text-default">{reply.text}</p>
                        </div>
                    ))}
                </div>
            )}
            
            {/* Reply Form */}
            {isReplying && (
                <div className="ml-4 mt-2 border-l-2 border-accent/20 pl-4">
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
// 🏛️ NEW: COMMENTS SECTION COMPONENT
// ---------------------------------------------------------------- //
function CommentsSection({
  confession,
  onReport,
}: {
  confession: Confession;
  onReport: (id: string, type: 'comment') => void;
}) {
  // Memoized logic to nest comments
  const nestedComments = useMemo(() => {
    const commentMap: Record<string, Comment> = {};
    const topLevelComments: Comment[] = [];

    // First pass: create a map of all comments by their ID
    for (const comment of confession.comments) {
        comment.replies = []; // Initialize replies array
        commentMap[comment.id] = comment;
    }

    // Second pass: link replies to their parents
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
    <div className="w-full space-y-3 border-t border-accent/20 pt-3 max-h-96 overflow-y-auto scrollbar-thin scrollbar-thumb-accent/40">
      {/* Form for new top-level comments */}
      <CommentForm confessionId={confession.id} onCommentAdded={() => {}} />

      {/* Render comment threads */}
      <div className="space-y-3">
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
// 🃏 MAIN CONFESSION CARD COMPONENT (Updated)
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
  
  // ✅ FIXED: Like handler with optimistic UI update
  const onLike = () => {
    playLikeSound();
    startTransition(async () => {
      // Update UI immediately
      setConfession(prev => {
        let newLikes = prev.likes;
        let newDislikes = prev.dislikes;
        let newInteraction: 'like' | 'dislike' | null = 'like';

        if (prev.userInteraction === 'like') { // Case 1: User is un-liking
          newLikes--;
          newInteraction = null;
        } else if (prev.userInteraction === 'dislike') { // Case 2: User changes from dislike to like
          newLikes++;
          newDislikes--;
        } else { // Case 3: User is liking for the first time
          newLikes++;
        }

        return { ...prev, likes: newLikes, dislikes: newDislikes, userInteraction: newInteraction };
      });
      // Send request to server
      await handleLike(confession.id);
    });
  };

  // ✅ FIXED: Dislike handler with optimistic UI update
  const onDislike = () => {
    playDislikeSound();
    startTransition(async () => {
      // Update UI immediately
      setConfession(prev => {
        let newLikes = prev.likes;
        let newDislikes = prev.dislikes;
        let newInteraction: 'like' | 'dislike' | null = 'dislike';

        if (prev.userInteraction === 'dislike') { // Case 1: User is un-disliking
          newDislikes--;
          newInteraction = null;
        } else if (prev.userInteraction === 'like') { // Case 2: User changes from like to dislike
          newDislikes++;
          newLikes--;
        } else { // Case 3: User is disliking for the first time
          newDislikes++;
        }

        return { ...prev, likes: newLikes, dislikes: newDislikes, userInteraction: newInteraction };
      });
      // Send request to server
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
        <span className="truncate text-accent">
          anon::{confession.anonHash.substring(0, 6)}
        </span>
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