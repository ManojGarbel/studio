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
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { motion } from 'framer-motion';
import { useState } from 'react';
import { cn } from '@/lib/utils';

// ---- Mock keywords for syntax highlight ----
const KEYWORDS = ['if', 'else', 'for', 'while', 'return', 'true', 'false'];

function SyntaxHighlighter({ text }: { text: string }) {
  return (
    <pre className="whitespace-pre-wrap font-mono text-green-200 text-sm leading-relaxed">
      {text.split(/\b/).map((word, i) => {
        let color = 'text-green-200'; // default terminal green
        const lower = word.toLowerCase();

        if (KEYWORDS.includes(lower)) color = 'text-green-400';
        else if (!isNaN(Number(word))) color = 'text-purple-400';
        else if (
          (word.startsWith('"') && word.endsWith('"')) ||
          (word.startsWith("'") && word.endsWith("'"))
        )
          color = 'text-yellow-400';

        return (
          <span key={i} className={color}>
            {word}
          </span>
        );
      })}
    </pre>
  );
}

export function ConfessionCard({
  confession,
  onLike,
  onDislike,
  onReport,
}: {
  confession: Confession;
  onLike: () => void;
  onDislike: () => void;
  onReport: () => void;
}) {
  const [comments, setComments] = useState(confession.comments || []);

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <Card
        className={cn(
          'w-full overflow-hidden rounded-xl border border-green-500/30',
          'bg-black/95 backdrop-blur-sm font-mono text-green-200',
          'shadow-lg shadow-green-500/10 transition-all duration-300',
          'hover:shadow-green-500/20 hover:border-green-500/40'
        )}
      >
        {/* --- Header --- */}
        <CardHeader className="flex flex-row items-start justify-between space-y-0 p-4">
          <div className="flex items-center gap-2">
            <Avatar className="h-8 w-8">
              <AvatarImage src="/icons/dp.png" alt="anon" />
              <AvatarFallback>🕶️</AvatarFallback>
            </Avatar>
            <div>
              <p className="text-sm font-semibold text-green-300">Anonymous</p>
              <p className="text-xs text-green-500/70">
                {formatDistanceToNow(new Date(confession.createdAt), {
                  addSuffix: true,
                })}
              </p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="text-green-400 hover:text-green-300 hover:bg-green-900/30"
          >
            <MoreVertical className="h-4 w-4" />
          </Button>
        </CardHeader>

        {/* --- Body --- */}
        <CardContent className="px-4 pb-2">
          <SyntaxHighlighter text={confession.content} />
        </CardContent>

        {/* --- Footer (like, dislike, comment, report) --- */}
        <CardFooter className="flex justify-between items-center px-4 py-2 border-t border-green-700/30">
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="ghost"
              className="flex items-center gap-1 text-green-400 hover:text-green-300 hover:bg-green-900/30"
              onClick={onLike}
            >
              <Heart className="h-4 w-4" /> {confession.likes}
            </Button>
            <Button
              size="sm"
              variant="ghost"
              className="flex items-center gap-1 text-purple-400 hover:text-purple-300 hover:bg-purple-900/30"
              onClick={onDislike}
            >
              <ThumbsDown className="h-4 w-4" /> {confession.dislikes}
            </Button>
          </div>

          <div className="flex gap-2">
            <Button
              size="sm"
              variant="ghost"
              className="flex items-center gap-1 text-yellow-400 hover:text-yellow-300 hover:bg-yellow-900/30"
            >
              <MessageSquare className="h-4 w-4" /> {comments.length}
            </Button>
            <Button
              size="sm"
              variant="ghost"
              className="flex items-center gap-1 text-red-400 hover:text-red-300 hover:bg-red-900/30"
              onClick={onReport}
            >
              <Flag className="h-4 w-4" />
            </Button>
          </div>
        </CardFooter>

        {/* --- Comments Section --- */}
        <div
          className={cn(
            'w-full space-y-3 pt-3 border-t border-green-700/30',
            'max-h-80 overflow-y-auto scrollbar-thin',
            'scrollbar-thumb-green-500/40 scrollbar-track-black scroll-smooth',
            'bg-black/90 px-3 pb-3'
          )}
        >
          {/* Add Comment */}
          <div className="flex items-start gap-2 pr-1">
            <Avatar className="h-7 w-7 shrink-0 mt-1">
              <AvatarImage src="/icons/dp.png" alt="anon" />
              <AvatarFallback>🕶️</AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <input
                type="text"
                placeholder="Type your comment..."
                className="w-full bg-transparent border-b border-green-600/40 focus:outline-none text-sm text-green-200 placeholder-green-600/70"
              />
            </div>
            <Button
              size="icon"
              variant="ghost"
              className="text-green-400 hover:text-green-300 hover:bg-green-900/30"
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>

          {/* Comments List */}
          <div className="space-y-3">
            {comments.map((comment, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3 }}
                className="flex items-start gap-2"
              >
                <Avatar className="h-6 w-6 shrink-0 mt-1">
                  <AvatarImage src="/icons/dp.png" alt="anon" />
                  <AvatarFallback>🕶️</AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <p className="text-xs text-green-300">Anonymous</p>
                  <p className="text-xs text-green-500/60 mb-1">
                    {formatDistanceToNow(new Date(comment.createdAt), {
                      addSuffix: true,
                    })}
                  </p>
                  <p className="text-sm text-green-200 leading-relaxed">
                    {comment.content}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </Card>
    </motion.div>
  );
}
