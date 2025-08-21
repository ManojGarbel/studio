'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import type { Confession, Comment } from './types';
import { moderateConfession } from '@/ai/flows/moderate-confession';
import { cookies } from 'next/headers';

// --- In-memory "database" for demonstration ---
const confessions: Confession[] = [
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
            }
        ]
    },
    {
        id: '2',
        text: 'My side project is just a collection of Stack Overflow answers stitched together with duct tape and hope.',
        timestamp: new Date(Date.now() - 86400000), // 1 day ago
        anonHash: 'mockHash2',
        status: 'approved',
        likes: 42,
        dislikes: 0,
        comments: []
    },
];
// --- End of in-memory "database" ---


export async function getConfessions(): Promise<Confession[]> {
  // In a real app, you'd fetch this from a database like Firestore
  return Promise.resolve(
    [...confessions]
        .filter(c => c.status === 'approved')
        .sort((a,b) => b.timestamp.getTime() - a.timestamp.getTime())
    );
}

export async function getAllConfessionsForAdmin(): Promise<Confession[]> {
    // In a real app, you'd fetch this from a database like Firestore
    return Promise.resolve(
      [...confessions]
          .sort((a,b) => b.timestamp.getTime() - a.timestamp.getTime())
      );
}

export async function updateConfessionStatus(id: string, status: 'approved' | 'rejected') {
    const confession = confessions.find(c => c.id === id);
    if (confession) {
        confession.status = status;
        revalidatePath('/');
        revalidatePath('/admin');
        return { success: true, message: `Confession ${status}.`};
    }
    return { success: false, message: 'Confession not found.' };
}


const confessionSchema = z.string()
  .min(10, { message: 'Confession must be at least 10 characters long.' })
  .max(1000, { message: 'Confession must be no more than 1000 characters long.' });

const PII_REGEX = {
    EMAIL: /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/gi,
    PHONE: /(\+\d{1,2}\s?)?\(?\d{3}\)?[\s.-]?\d{3}[\s.-]?\d{4}/g,
};


export async function submitConfession(prevState: any, formData: FormData) {
  const rawConfession = formData.get('confession');
  
  const validatedFields = confessionSchema.safeParse(rawConfession);

  if (!validatedFields.success) {
    return {
      success: false,
      message: validatedFields.error.issues[0].message,
    };
  }

  const confessionText = validatedFields.data;

  // Basic PII filtering
  if (confessionText.match(PII_REGEX.EMAIL) || confessionText.match(PII_REGEX.PHONE)) {
    return {
      success: false,
      message: 'Confession appears to contain personal information. Please remove it.'
    }
  }

  const anonHash = cookies().get('anon_hash')?.value;

  if (!anonHash) {
    // This should not happen if the form is only shown to activated users
    return {
      success: false,
      message: 'User not authenticated. Please activate your account.',
    };
  }

  try {
    const moderationResult = await moderateConfession({ text: confessionText });
    
    const newConfession: Confession = {
        id: crypto.randomUUID(),
        text: confessionText,
        timestamp: new Date(),
        anonHash: anonHash,
        status: moderationResult.isToxic ? 'pending' : 'approved',
        likes: 0,
        dislikes: 0,
        comments: [],
    };

    // In a real app, you'd save this to a database
    confessions.unshift(newConfession);

    revalidatePath('/');
    
    if (newConfession.status === 'pending') {
        return {
            success: true,
            message: 'Your confession has been submitted and is pending review. Thank you.',
        }
    }

    return {
      success: true,
      message: 'Your confession has been posted anonymously!',
    };
  } catch(error) {
    console.error("Error during confession submission:", error);
    return {
        success: false,
        message: 'An unexpected error occurred. Please try again later.'
    }
  }
}

const activationSchema = z.string().min(1, { message: 'Activation key is required.' });
const ACTIVATION_KEY = 'WELCOME';

export async function activateAccount(prevState: any, formData: FormData) {
    const rawActivationKey = formData.get('activationKey');
    const validatedFields = activationSchema.safeParse(rawActivationKey);

    if (!validatedFields.success) {
        return {
            success: false,
            message: validatedFields.error.issues[0].message,
        };
    }
    
    if (validatedFields.data !== process.env.ACTIVATION_KEY) {
        return {
            success: false,
            message: 'Invalid activation key.',
        };
    }
    
    const anonHash = crypto.randomUUID();
    cookies().set('is_activated', 'true', { httpOnly: true, path: '/' });
    cookies().set('anon_hash', anonHash, { httpOnly: true, path: '/' });
    
    revalidatePath('/');

    return {
        success: true,
        message: 'Account activated! You can now share your confessions.',
    };
}

export async function handleLike(confessionId: string) {
    const confession = confessions.find(c => c.id === confessionId);
    if (confession) {
        confession.likes += 1;
        revalidatePath('/');
    }
}

export async function handleDislike(confessionId: string) {
    const confession = confessions.find(c => c.id === confessionId);
    if (confession) {
        confession.dislikes += 1;
        revalidatePath('/');
    }
}

const commentSchema = z.string().min(1, "Comment cannot be empty.").max(500, "Comment is too long.");

export async function addComment(confessionId: string, formData: FormData) {
    const confession = confessions.find(c => c.id === confessionId);
    const anonHash = cookies().get('anon_hash')?.value;

    if (!confession || !anonHash) {
        return { success: false, message: 'Could not add comment.' };
    }

    const validatedFields = commentSchema.safeParse(formData.get('comment'));
    
    if (!validatedFields.success) {
        return { success: false, message: validatedFields.error.issues[0].message };
    }

    const newComment: Comment = {
        id: crypto.randomUUID(),
        text: validatedFields.data,
        timestamp: new Date(),
        anonHash: anonHash,
        isAuthor: confession.anonHash === anonHash,
    }

    confession.comments.unshift(newComment);
    revalidatePath('/');
    return { success: true };
}
