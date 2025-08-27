'use client';

import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import type { Confession as BaseConfession, Comment as BaseComment } from '@/lib/types';
import { formatDistanceToNow } from 'date-fns';
import { Heart, MessageSquare, Flag, ThumbsDown, Send, CornerDownRight } from 'lucide-react';
import { useState, useTransition, useRef, useEffect, useMemo, FormEvent, ChangeEvent } from 'react';
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
import { cn } from '@/lib/utils'; // Assuming you have a utility for conditional classes

// ✨ STYLE BLOCK FOR THEMED SCROLLBAR (NO PLUGIN NEEDED)
const ThemedScrollbarStyles = () => (
  <style>{`
    .themed-scrollbar::-webkit-scrollbar {
      width: 8px;
    }
    .themed-scrollbar::-webkit-scrollbar-track {
      background: transparent;
    }
    .themed-scrollbar::-webkit-scrollbar-thumb {
      background-color: rgba(57, 255, 20, 0.2);
      border-radius: 0px;
      border: 1px solid rgba(57, 255, 20, 0.3);
    }
    .themed-scrollbar::-webkit-scrollbar-thumb:hover {
      background-color: rgba(57, 255, 20, 0.4);
    }
  `}</style>
);


// --- TYPE DEFINITIONS ---
interface Comment extends BaseComment {
  parentId: string | null;
  replies: Comment[];
}
interface Confession extends BaseConfession {
  comments: Comment[];
}

// --- SYNTAX HIGHLIGHTER ---
const CodeSyntaxHighlighter = ({ text }: { text: string }) => {
    const KEYWORDS = ['fix', 'bug', 'error', 'pushed', 'main', 'production', 'friday', 'debug', 'console.log', 'git', 'commit', 'database', 'server', 'client', 'react', 'javascript', 'typescript', 'css', 'html', 'python', 'java', 'c#', 'c++', 'php', 'ruby', 'go', 'rust', 'sql'];
    return (
      <pre className="whitespace-pre-wrap break-words font-code text-sm leading-relaxed">
        <code>
          {text.split(/(\s+|[.,;!?()])/).map((word, i) => {
            const lower = word.toLowerCase();
            let color = "text-neon-green/80";
            if (KEYWORDS.includes(lower)) color = "text-neon-cyan";
            else if (!isNaN(Number(word))) color = "text-yellow-400";
            else if ((word.startsWith('"') && word.endsWith('"')) || (word.startsWith("'") && word.endsWith("'")))
              color = "text-neon-pink";
            return <span key={i} className={color}>{word}</span>;
          })}
        </code>
      </pre>
    );
};

// --- COMMENT FORM ---
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
  const textareaRef = useRef<HTMLTextAreaElement>(null);
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
        if (textareaRef.current) textareaRef.current.style.height = 'auto';
        onCommentAdded();
      } else if (result?.message) {
        toast({ variant: 'destructive', title: 'Error', description: result.message });
      }
    });
  };

  const handleTextareaInput = (event: ChangeEvent<HTMLTextAreaElement>) => {
    const textarea = event.currentTarget;
    textarea.style.height = 'auto';
    textarea.style.height = `${textarea.scrollHeight}px`;
  };

  return (
    <form onSubmit={handleSubmit} ref={formRef} className="flex w-full items-end gap-2">
      <div className="relative w-full">
        <Textarea
          ref={textareaRef}
          name="comment"
          placeholder={placeholder}
          rows={1}
          required
          disabled={isPending}
          onInput={handleTextareaInput}
          className="peer flex-1 rounded-none border-2 border-neon-green/30 bg-black/50 font-code text-sm text-neon-green !ring-0 !ring-offset-0 resize-none overflow-y-hidden placeholder:text-transparent focus:border-neon-green/80 focus:bg-black"
          style={{ maxHeight: '120px' }}
        />
        <div className="absolute top-3 left-3 text-sm font-code text-neon-green/40 select-none pointer-events-none peer-focus:hidden peer-valid:hidden">
          {placeholder}<span className="animate-blink">_</span>
        </div>
      </div>
      <Button type="submit" size="icon" disabled={isPending} className="bg-neon-green/10 hover:bg-neon-green/20 text-neon-green rounded-none h-11 w-11 shrink-0 border-2 border-neon-green/30 active:scale-90 transition-transform">
        <Send className="h-4 w-4" />
      </Button>
    </form>
  );
}

// --- COMMENT THREAD ---
function CommentThread({
  comment,
  onReport,
  confessionId,
  refresh,
}: {
  comment: Comment;
  onReport: (id: string, type: 'comment') => void;
  confessionId: string;
  refresh: () => void;
}) {
  const [isReplying, setIsReplying] = useState(false);
  return (
    <div className="flex flex-col animate-fade-in-slow">
      <div className="flex gap-3">
        <Avatar className="h-7 w-7 shrink-0 rounded-none mt-1">
          <AvatarFallback className="bg-neon-green/10 text-neon-green rounded-none">#</AvatarFallback>
        </Avatar>
        <div className="flex-1">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span className="font-medium text-accent hover:animate-glitch inline-block cursor-pointer">anon::{comment.anonHash.substring(0, 6)}</span>
            <span>•</span>
            <span>{formatDistanceToNow(new Date(comment.timestamp), { addSuffix: true })}</span>
          </div>
          <p className="mt-1 text-sm leading-relaxed text-foreground">{comment.text}</p>
          <div className="mt-2 flex gap-4 text-xs">
            <button onClick={() => setIsReplying(!isReplying)} className="flex items-center gap-1.5 text-muted-foreground hover:text-accent transition active:scale-95">
              <CornerDownRight className="h-3.5 w-3.5" />
              Reply
            </button>
            <button onClick={() => onReport(comment.id, 'comment')} className="flex items-center gap-1.5 text-muted-foreground hover:text-destructive transition active:scale-95">
              <Flag className="h-3.5 w-3.5" />
              Report
            </button>
          </div>
        </div>
      </div>
      <div className={`transition-all duration-300 ease-in-out grid ${isReplying ? 'grid-rows-[1fr] opacity-100 pt-3' : 'grid-rows-[0fr] opacity-0'}`}>
        <div className="overflow-hidden pl-[40px]">
          <CommentForm confessionId={confessionId} parentId={comment.id} onCommentAdded={() => { setIsReplying(false); refresh(); }} placeholder="> drafting reply..."/>
        </div>
      </div>
      {comment.replies?.length > 0 && (
        <div className="pl-[40px] mt-3 space-y-3 border-l-2 border-dotted border-neon-green/20">
          {comment.replies.map((reply) => (
            <div key={reply.id} className="pl-4">
              <CommentThread comment={reply} onReport={onReport} confessionId={confessionId} refresh={refresh} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// --- COMMENTS SECTION ---
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
      if (c.parentId && commentMap[c.parentId]) {
        commentMap[c.parentId].replies.push(commentMap[c.id]);
      } else {
        topLevel.push(commentMap[c.id]);
      }
    });
    topLevel.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    Object.values(commentMap).forEach(comment => {
        comment.replies.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
    });
    return topLevel;
  }, [confession.comments]);

  return (
    <div className="w-full space-y-4 pt-3 border-t-2 border-dashed border-neon-green/20 max-h-96 overflow-y-auto themed-scrollbar">
      <div className="flex items-start gap-2 pr-1">
        <Avatar className="h-7 w-7 shrink-0 mt-1.5 rounded-none">
          <AvatarFallback className="bg-neon-green/10 text-neon-green rounded-none">#</AvatarFallback>
        </Avatar>
        <CommentForm confessionId={confession.id} onCommentAdded={refresh} />
      </div>
      <div className="space-y-4">
        {nestedComments.map((comment) => (
          <CommentThread key={comment.id} comment={comment} onReport={onReport} confessionId={confession.id} refresh={refresh} />
        ))}
      </div>
    </div>
  );
}

// --- MAIN CONFESSION CARD ---
export function ConfessionCard({ confession: initialConfession }: { confession: Confession }) {
  const [isPending, startTransition] = useTransition();
  const [showComments, setShowComments] = useState(false);
  const [confession, setConfession] = useState(initialConfession);
  const playLikeSound = useSound(SOUNDS.like, 0.2);
  const playDislikeSound = useSound(SOUNDS.dislike, 0.2);
  const playReportSound = useSound(SOUNDS.report);
  const { toast } = useToast();

  useEffect(() => { setConfession(initialConfession); }, [initialConfession]);
  const refresh = () => setConfession(prev => ({...prev}));
  const timeAgo = useMemo(() => formatDistanceToNow(new Date(confession.timestamp), { addSuffix: true }), [confession.timestamp]);

  const onLike = () => { /* ... (no changes) ... */ };
  const onDislike = () => { /* ... (no changes) ... */ };
  const onReport = (id: string, type: 'confession' | 'comment') => { /* ... (no changes) ... */ };

  return (
    <>
      <ThemedScrollbarStyles />
      <Card className="w-full overflow-hidden rounded-none border-2 border-neon-green/20 bg-black/80 backdrop-blur-sm font-code shadow-neon-green transition-all duration-300 hover:shadow-neon-green-lg hover:border-neon-green/40 relative">
        <div className="absolute top-0 left-0 w-full h-full bg-scanlines pointer-events-none"></div>
        
        <CardHeader className="flex items-center justify-between px-4 py-2 text-xs border-b-2 border-neon-green/20">
          <div className="flex items-center gap-2">
            <Avatar className="h-6 w-6 rounded-none">
              <AvatarFallback className="bg-neon-green/10 text-neon-green rounded-none">#</AvatarFallback>
            </Avatar>
            <span className="truncate text-accent hover:animate-glitch inline-block cursor-pointer">anon::{confession.anonHash.substring(0, 6)}</span>
            <span className="text-muted-foreground">• {timeAgo}</span>
          </div>
        </CardHeader>

        <CardContent className="px-4 py-3">
          <CodeSyntaxHighlighter text={confession.text} />
        </CardContent>

        <CardFooter className="flex flex-col gap-3 p-2 border-t-2 border-neon-green/20">
          <div className="flex w-full items-center justify-between">
            <div className="flex items-center">
              <Button onClick={onLike} disabled={isPending} variant="ghost" className="flex h-10 w-16 items-center justify-center gap-2 rounded-none p-0 text-muted-foreground transition-all duration-200 hover:bg-neon-green/10 active:scale-90">
                <span className={cn('text-sm', confession.userInteraction === 'like' && 'text-neon-green')}>{confession.likes}</span>
                <Heart className={cn('h-4 w-4', confession.userInteraction === 'like' && 'fill-current text-neon-green')} />
              </Button>
              <Button onClick={onDislike} disabled={isPending} variant="ghost" className="flex h-10 w-16 items-center justify-center gap-2 rounded-none p-0 text-muted-foreground transition-all duration-200 hover:bg-destructive/10 active:scale-90">
                <span className={cn('text-sm', confession.userInteraction === 'dislike' && 'text-destructive')}>{confession.dislikes}</span>
                <ThumbsDown className={cn('h-4 w-4', confession.userInteraction === 'dislike' && 'fill-current text-destructive')} />
              </Button>
              <Button onClick={() => setShowComments(!showComments)} variant="ghost" className="flex h-10 w-16 items-center justify-center gap-2 rounded-none p-0 text-muted-foreground transition-all duration-200 hover:bg-neon-cyan/10 active:scale-90">
                <span className="text-sm tabular-nums">{confession.comments.length}</span>
                <MessageSquare className="h-4 w-4" />
              </Button>
            </div>
            <Button onClick={() => onReport(confession.id, 'confession')} disabled={isPending} variant="ghost" size="icon" className="h-10 w-10 rounded-none text-muted-foreground transition-all duration-200 hover:bg-destructive/10 hover:text-destructive active:scale-90">
              <Flag className="h-4 w-4" />
            </Button>
          </div>
          
          <div className={cn('w-full transition-all duration-500 ease-in-out overflow-hidden', showComments ? 'max-h-[500px] opacity-100' : 'max-h-0 opacity-0')}>
            {showComments && <CommentsSection confession={confession} onReport={onReport} refresh={refresh} />}
          </div>
        </CardFooter>
      </Card>
    </>
  );
}
