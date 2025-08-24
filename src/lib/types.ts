export type Comment = {
  id: string;
  text: string;
  timestamp: Date;
  anonHash: string;
  isAuthor: boolean;
};

export type Confession = {
  id: string;
  text: string;
  timestamp: Date;
  anonHash: string;
  status: 'approved' | 'pending' | 'rejected';
  likes: number;
  dislikes: number;
  comments: Comment[];
  // Add a field to track the current user's interaction
  userInteraction?: 'like' | 'dislike' | null;
};
