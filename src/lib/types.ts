export type Confession = {
  id: string;
  text: string;
  timestamp: Date;
  anonHash: string;
  status: 'approved' | 'pending' | 'rejected';
};
