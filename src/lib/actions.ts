'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import type { Confession } from './types';
import { moderateConfession } from '@/ai/flows/moderate-confession';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

// --- In-memory "database" for demonstration ---
const confessions: Confession[] = [
    {
        id: '1',
        text: 'I deployed an untested feature to production and it brought down the entire system for an hour. Nobody knows it was me.',
        timestamp: new Date(Date.now() - 3600000), // 1 hour ago
        anonHash: 'mockHash1',
        status: 'approved'
    },
    {
        id: '2',
        text: 'My side project is just a collection of Stack Overflow answers stitched together with duct tape and hope.',
        timestamp: new Date(Date.now() - 86400000), // 1 day ago
        anonHash: 'mockHash2',
        status: 'approved'
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

  // TODO: Implement rate limiting (e.g., check last post time for anonHash)

  try {
    const moderationResult = await moderateConfession({ text: confessionText });
    
    const newConfession: Confession = {
        id: crypto.randomUUID(),
        text: confessionText,
        timestamp: new Date(),
        anonHash: crypto.randomUUID(), // Mock anonHash
        status: moderationResult.isToxic ? 'pending' : 'approved',
    };

    // In a real app, you'd save this to a database
    confessions.push(newConfession);

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
    
    if (validatedFields.data !== ACTIVATION_KEY) {
        return {
            success: false,
            message: 'Invalid activation key.',
        };
    }
    
    cookies().set('is_activated', 'true', { httpOnly: true, path: '/' });
    revalidatePath('/');
    redirect('/');
}
