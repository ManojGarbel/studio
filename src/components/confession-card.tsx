'use client';

import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import type { Confession as BaseConfession, Comment as BaseComment } from '@/lib/types';
import { formatDistanceToNow } from 'date-fns';
// ✨ MODIFIED: Imported new icons for Share and MoreVertical
import { Heart, MessageSquare, Flag, ThumbsDown, Send, CornerDownRight, MoreVertical, Share2 } from 'lucide-react';
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
import { cn } from '@/lib/utils';

// --- TYPE DEFINITIONS ---
interface Comment extends BaseComment {
  parentId: string | null;
  replies: Comment[];
}
interface Confession extends BaseConfession {
  comments: Comment[];
}

// --- SYNTAX HIGHLIGHTER (Updated with new "Cosmic Night" colors) ---
const CodeSyntaxHighlighter = ({ text }: { text: string }) => {
    const KEYWORDS = ['fix', 'bug', 'error', 'pushed', 'main', 'production', 'friday', 'debug', 'console.log', 'git', 'commit', 'database', 'server', 'client', 'react', 'javascript', 'typescript', 'css', 'html', 'python', 'java', 'c#', 'c++', 'php', 'ruby', 'go', 'rust', 'sql'];
    return (
      <pre className="whitespace-pre-wrap break-words font-code text-sm leading-relaxed">
        <code>
          {text.split(/(\s+|[.,;!?()])/).map((word, i) => {
            const lower = word.toLowerCase();
            let color = "text-slate-300"; // Default text
            if (KEYWORDS.includes(lower)) color = "text-sky-400"; // Keywords
            else if (!isNaN(Number(word))) color = "text-fuchsia-400"; // Numbers
            else if ((word.startsWith('"') && word.endsWith('"')) || (word.startsWith("'") && word.endsWith("'")))
              color = "text-amber-400"; // Strings
            return <span key={i} className={color}>{word}</span>;
          })}
        </code>
      </pre>
    );
};

// --- COMMENT FORM (Redesigned with rounded shapes and new colors) ---
function CommentForm({
  confessionId,
  parentId = null,
  onCommentAdded,
  placeholder = "Add a comment...",
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
      <Textarea
        ref={textareaRef}
        name="comment"
        placeholder={placeholder}
        rows={1}
        required
        disabled={isPending}
        onInput={handleTextareaInput}
        className="flex-1 rounded-full border-2 border-slate-700 bg-slate-800/80 px-4 py-1.5 font-body text-sm text-slate-200 resize-none overflow-y-hidden focus:border-sky-500 focus:ring-1 focus:ring-sky-500"
        style={{ maxHeight: '120px' }}
      />
      <Button type="submit" size="icon" disabled={isPending} 
        className="bg-sky-500 hover:bg-sky-600 text-white rounded-full h-9 w-9 shrink-0 active:scale-90 transition-all">
        <Send className="h-4 w-4" />
      </Button>
    </form>
  );
}

// --- COMMENT THREAD (Redesigned for clarity and new theme) ---
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
        <Avatar className="h-9 w-9 shrink-0">
          <AvatarImage src="/icons/dp.png" alt="User Avatar" />
          <AvatarFallback>🕶️</AvatarFallback>
        </Avatar>
        <div className="flex-1 rounded-2xl bg-slate-800/60 p-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs text-slate-400">
                <span className="font-semibold text-sky-400">anon::{comment.anonHash.substring(0, 6)}</span>
                <span>•</span>
                <span>{formatDistanceToNow(new Date(comment.timestamp), { addSuffix: true })}</span>
            </div>
            {/* ✨ NEW: Report button for individual comments */}
            <button onClick={() => onReport(comment.id, 'comment')} className="text-slate-500 hover:text-red-400 transition active:scale-95">
                <Flag className="h-3.5 w-3.5" />
            </button>
          </div>
          <p className="mt-1 text-sm leading-relaxed text-slate-200">{comment.text}</p>
          <div className="mt-2 flex gap-4 text-xs">
            <button onClick={() => setIsReplying(!isReplying)} className="flex items-center gap-1.5 text-slate-400 hover:text-sky-400 transition active:scale-95">
              <CornerDownRight className="h-3.5 w-3.5" />
              Reply
            </button>
          </div>
        </div>
      </div>
      <div className={`transition-all duration-300 ease-in-out grid ${isReplying ? 'grid-rows-[1fr] opacity-100 pt-3' : 'grid-rows-[0fr] opacity-0'}`}>
        <div className="overflow-hidden pl-[48px]">
          <CommentForm confessionId={confessionId} parentId={comment.id} onCommentAdded={() => { setIsReplying(false); refresh(); }} placeholder="Drafting reply..."/>
        </div>
      </div>
      {comment.replies?.length > 0 && (
        <div className="pl-[24px] mt-3 space-y-3 border-l-2 border-slate-700/50">
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

// --- COMMENTS SECTION (With smooth scrolling) ---
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
    <div className="w-full space-y-4 pt-4 border-t border-slate-700/50 max-h-96 overflow-y-auto" style={{ scrollBehavior: 'smooth' }}>
      <div className="flex items-start gap-2 pr-1">
        <Avatar className="h-9 w-9 shrink-0">
          <AvatarImage src="/icons/dp.png" alt="User Avatar" />
          <AvatarFallback>🕶️</AvatarFallback>
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

// --- MAIN CONFESSION CARD (Completely Redesigned) ---
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
  
  // ✨ NEW: Placeholder function for the share button
  const onShare = () => {
    toast({
      title: "Share Feature",
      description: "This is where the share functionality will be implemented.",
    });
    // You can add navigator.share logic here in the future
  };

  return (
    <Card className="w-full overflow-hidden rounded-2xl border border-slate-700/50 bg-black/70 backdrop-blur-xl font-body shadow-lg shadow-sky-500/10">
      {/* ✨ MODIFIED: Header now includes the report button */}
      <CardHeader className="flex flex-row items-center justify-between p-4">
        <div className="flex items-center gap-3">
            <Avatar className="h-10 w-10">
              <AvatarImage src="/icons/dp.png" alt="User Avatar" />
              <AvatarFallback>🕶️</AvatarFallback>
            </Avatar>
            <div className="text-sm">
              <p className="font-semibold text-sky-400">anon::{confession.anonHash.substring(0, 6)}</p>
              <p className="text-slate-400">{timeAgo}</p>
            </div>
        </div>
        <Button onClick={() => onReport(confession.id, 'confession')} disabled={isPending} variant="ghost" size="icon" className="h-10 w-10 rounded-full text-slate-400 transition-all duration-200 hover:bg-red-500/10 hover:text-red-400 active:scale-90">
            <MoreVertical className="h-5 w-5" />
        </Button>
      </CardHeader>

      <CardContent className="px-4 pb-2">
        <CodeSyntaxHighlighter text={confession.text} />
      </CardContent>

      <CardFooter className="flex flex-col gap-3 p-4">
        {/* ✨ MODIFIED: Share button replaces the old report button */}
        <div className="flex w-full items-center">
          <div className="flex items-center gap-1">
            <Button onClick={onLike} disabled={isPending} variant="ghost" className="flex h-10 w-16 items-center justify-center gap-2 rounded-full p-0 text-slate-400 transition-all duration-200 hover:bg-green-500/10 active:scale-90">
              <span className={cn('text-sm font-medium', confession.userInteraction === 'like' && 'text-green-400')}>{confession.likes}</span>
              <Heart className={cn('h-5 w-5', confession.userInteraction === 'like' && 'fill-current text-green-400')} />
            </Button>
            <Button onClick={onDislike} disabled={isPending} variant="ghost" className="flex h-10 w-16 items-center justify-center gap-2 rounded-full p-0 text-slate-400 transition-all duration-200 hover:bg-red-500/10 active:scale-90">
              <span className={cn('text-sm font-medium', confession.userInteraction === 'dislike' && 'text-red-400')}>{confession.dislikes}</span>
              <ThumbsDown className={cn('h-5 w-5', confession.userInteraction === 'dislike' && 'fill-current text-red-400')} />
            </Button>
            <Button onClick={() => setShowComments(!showComments)} variant="ghost" className="flex h-10 w-16 items-center justify-center gap-2 rounded-full p-0 text-slate-400 transition-all duration-200 hover:bg-sky-500/10 active:scale-90">
              <span className="text-sm tabular-nums">{confession.comments.length}</span>
              <MessageSquare className="h-5 w-5" />
            </Button>
          </div>
          <div className="ml-auto">
            <Button onClick={onShare} disabled={isPending} variant="ghost" size="icon" className="h-10 w-10 rounded-full text-slate-400 transition-all duration-200 hover:bg-sky-500/10 hover:text-sky-400 active:scale-90">
              <Share2 className="h-5 w-5" />
            </Button>
          </div>
        </div>
        
        <div className={cn('w-full transition-all duration-500 ease-in-out overflow-hidden', showComments ? 'max-h-[500px] opacity-100' : 'max-h-0 opacity-0')}>
          {showComments && <CommentsSection confession={confession} onReport={onReport} refresh={refresh} />}
        </div>
      </CardFooter>
    </Card>
  );
}
