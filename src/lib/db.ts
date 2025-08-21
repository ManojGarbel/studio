import type { Confession } from './types';

// In a real app, this would be a database like Firestore or a SQL database.
// For demonstration, we're using in-memory arrays.

export const confessions: Confession[] = [
  {
    id: '1',
    text: 'I deployed an untested feature to production and it brought down the entire system for an hour. Nobody knows it was me.',
    timestamp: new Date(Date.now() - 3600000), // 1 hour ago
    anonHash: 'mockHash1',
    status: 'approved',
    likes: 10,
    dislikes: 1,
    comments: [
      {
        id: 'c1',
        text: 'Happens to the best of us.',
        timestamp: new Date(Date.now() - 3000000),
        anonHash: 'mockHash3',
        isAuthor: false,
      },
      {
        id: 'c2',
        text: 'I feel a bit better knowing I am not alone.',
        timestamp: new Date(Date.now() - 2800000),
        anonHash: 'mockHash1',
        isAuthor: true,
      },
    ],
  },
  {
    id: '2',
    text: 'My side project is just a collection of Stack Overflow answers stitched together with duct tape and hope.',
    timestamp: new Date(Date.now() - 86400000), // 1 day ago
    anonHash: 'mockHash2',
    status: 'approved',
    likes: 42,
    dislikes: 0,
    comments: [],
  },
  {
    id: '3',
    text: 'I introduced a bug during a demo to the client and blamed it on their network connection.',
    timestamp: new Date(Date.now() - 172800000), // 2 days ago
    anonHash: 'mockHash3',
    status: 'pending',
    likes: 5,
    dislikes: 0,
    comments: [],
    },
];

const bannedUsers: Set<string> = new Set();

export async function addBannedUser(anonHash: string): Promise<void> {
    if (bannedUsers.has(anonHash)) {
        throw new Error('User is already banned.');
    }
  bannedUsers.add(anonHash);
  return Promise.resolve();
}

export async function isUserBanned(anonHash: string): Promise<boolean> {
  return Promise.resolve(bannedUsers.has(anonHash));
}
