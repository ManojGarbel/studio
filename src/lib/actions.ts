'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import type { Confession } from './types';
import { moderateConfession } from '@/ai/flows/moderate-confession';
import { createServerClient, createServiceRoleServerClient } from './supabase/server';
import { cookies } from 'next/headers';
import { PII_REGEX } from './utils';
import { isUserBanned } from './db';

export async function getConfessions(): Promise<Confession[]> {
  const cookieStore = cookies();
  const supabase = createServerClient(cookieStore);
  const { data, error } = await supabase
    .from('confessions')
    .select(
      `
      id,
      text,
      created_at,
      anon_hash,
      status,
      likes,
      dislikes,
      comments ( id, text, created_at, anon_hash, is_author )
    `
    )
    .eq('status', 'approved')
    .order('created_at', { ascending: false })
    .order('created_at', { foreignTable: 'comments', ascending: true });


  if (error) {
    console.error('Error fetching confessions:', error);
    return [];
  }

  // Map Supabase response to Confession type
  return data.map((item: any) => ({
    id: item.id,
    text: item.text,
    timestamp: new Date(item.created_at),
    anonHash: item.anon_hash,
    status: item.status,
    likes: item.likes,
    dislikes: item.dislikes,
    comments: item.comments.map((c: any) => ({
      id: c.id,
      text: c.text,
      timestamp: new Date(c.created_at),
      anonHash: c.anon_hash,
      isAuthor: c.is_author,
    })),
  }));
}

export async function getAllConfessionsForAdmin(): Promise<Confession[]> {
    const cookieStore = cookies();
    const supabase = createServiceRoleServerClient(cookieStore);
    const { data, error } = await supabase
      .from('confessions')
      .select(
        `
        id,
        text,
        created_at,
        anon_hash,
        status,
        likes,
        dislikes,
        comments ( id, text, created_at, anon_hash, is_author )
      `
      )
      .order('created_at', { ascending: false });
  
    if (error) {
      console.error('Error fetching confessions for admin:', error);
      return [];
    }
  
    return data.map((item: any) => ({
      id: item.id,
      text: item.text,
      timestamp: new Date(item.created_at),
      anonHash: item.anon_hash,
      status: item.status,
      likes: item.likes,
      dislikes: item.dislikes,
      comments: item.comments.map((c: any) => ({
        id: c.id,
        text: c.text,
        timestamp: new Date(c.created_at),
        anonHash: c.anon_hash,
        isAuthor: c.is_author,
      })),
    }));
}


export async function updateConfessionStatus(
  id: string,
  status: 'approved' | 'rejected'
) {
  const cookieStore = cookies();
  const supabase = createServiceRoleServerClient(cookieStore);
  const { data, error } = await supabase
    .from('confessions')
    .update({ status })
    .eq('id', id);

  if (error) {
    console.error('Error updating confession status:', error);
    return { success: false, message: 'Failed to update confession.' };
  }
  revalidatePath('/');
  revalidatePath('/admin');
  return { success: true, message: `Confession ${status}.` };
}

const confessionSchema = z
  .string()
  .min(10, { message: 'Confession must be at least 10 characters long.' })
  .max(1000, {
    message: 'Confession must be no more than 1000 characters long.',
  });

export async function submitConfession(prevState: any, formData: FormData) {
  const cookieStore = cookies();
  const anonHash = cookieStore.get('anon_hash')?.value;

  if (!anonHash) {
    return {
      success: false,
      message: 'User not authenticated. Please activate your account.',
    };
  }
  
  const banned = await isUserBanned(anonHash);
  if (banned) {
      return {
          success: false,
          message: 'You are banned from posting confessions.'
      }
  }

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
  if (
    confessionText.match(PII_REGEX.EMAIL) ||
    confessionText.match(PII_REGEX.PHONE)
  ) {
    return {
      success: false,
      message:
        'Confession appears to contain personal information. Please remove it.',
    };
  }

  try {
    const moderationResult = await moderateConfession({ text: confessionText });
    const supabase = createServiceRoleServerClient(cookieStore);

    const initialStatus = moderationResult.isToxic ? 'rejected' : 'pending';

    const { error } = await supabase.from('confessions').insert({
      text: confessionText,
      anon_hash: anonHash,
      status: initialStatus,
    });

    if (error) {
      console.error('Error submitting confession:', error);
      return {
        success: false,
        message: 'Failed to submit confession to the database.',
      };
    }

    revalidatePath('/');
    revalidatePath('/admin');
    
    return {
        success: true,
        message:
        'Your confession has been submitted and is pending review. Thank you.',
    };

  } catch (error) {
    console.error('Error during confession submission:', error);
    return {
      success: false,
      message: 'An unexpected error occurred. Please try again later.',
    };
  }
}

const activationSchema = z
  .string()
  .min(1, { message: 'Activation key is required.' });

export async function activateAccount(prevState: any, formData: FormData) {
  const rawActivationKey = formData.get('activationKey');
  const validatedFields = activationSchema.safeParse(rawActivationKey);

  if (!validatedFields.success) {
    return {
      success: false,
      message: validatedFields.error.issues[0].message,
      anonHash: null,
    };
  }

  if (validatedFields.data !== process.env.ACTIVATION_KEY) {
    return {
      success: false,
      message: 'Invalid activation key.',
      anonHash: null,
    };
  }

  const anonHash = crypto.randomUUID();
  
  return {
    success: true,
    message: 'Account activated! You can now share your confessions.',
    anonHash: anonHash
  };
}

export async function handleLike(confessionId: string) {
    const cookieStore = cookies();
    const supabase = createServiceRoleServerClient(cookieStore);
    const { error } = await supabase.rpc('increment_like', { row_id: confessionId });
    if (error) {
        console.error('Error liking post', error);
    }
    revalidatePath('/');
}

export async function handleDislike(confessionId: string) {
    const cookieStore = cookies();
    const supabase = createServiceRoleServerClient(cookieStore);
    const { error } = await supabase.rpc('increment_dislike', { row_id: confessionId });
    if (error) {
        console.error('Error disliking post', error);
    }
    revalidatePath('/');
}

const commentSchema = z
  .string()
  .min(1, 'Comment cannot be empty.')
  .max(500, 'Comment is too long.');

export async function addComment(confessionId: string, formData: FormData) {
    const cookieStore = cookies();
    const supabase = createServiceRoleServerClient(cookieStore);
    const anonHash = cookieStore.get('anon_hash')?.value;

  if (!anonHash) {
    return { success: false, message: 'Could not add comment. User not authenticated.' };
  }

  const banned = await isUserBanned(anonHash);
  if (banned) {
      return {
          success: false,
          message: 'You are banned from posting comments.'
      }
  }
  
  const validatedFields = commentSchema.safeParse(formData.get('comment'));

  if (!validatedFields.success) {
    return { success: false, message: validatedFields.error.issues[0].message };
  }

  const { data: confessionAuthor } = await supabase.from('confessions').select('anon_hash').eq('id', confessionId).single();
  
  if(!confessionAuthor){
      return { success: false, message: 'Confession not found.' };
  }

  const isAuthor = confessionAuthor.anon_hash === anonHash;

  const { error } = await supabase.from('comments').insert({
      text: validatedFields.data,
      confession_id: confessionId,
      anon_hash: anonHash,
      is_author: isAuthor
  })

  if(error){
      console.error('Error adding comment', error);
      return { success: false, message: "Failed to add comment." };
  }

  revalidatePath('/');
  return { success: true };
}


export async function reportConfession(confessionId: string) {
    const cookieStore = cookies();
    const supabase = createServiceRoleServerClient(cookieStore);

    const { data: confession, error: fetchError } = await supabase.from('confessions').select('status').eq('id', confessionId).single();

    if(fetchError || !confession) {
        return { success: false, message: 'Confession not found.' };
    }

    if(confession.status === 'pending') {
        return { success: false, message: 'This confession is already pending review.' };
    }

    const { error } = await supabase.from('confessions').update({ status: 'pending' }).eq('id', confessionId);
    
    if (error) {
        return { success: false, message: 'Failed to report confession.' };
    }

    revalidatePath('/');
    revalidatePath('/admin');
    return { success: true, message: 'Confession reported for review.' };
}

export async function deleteConfession(confessionId: string) {
    const cookieStore = cookies();
    const supabase = createServiceRoleServerClient(cookieStore);
    const { error } = await supabase.from('confessions').delete().eq('id', confessionId);
    if(error){
        return { success: false, message: 'Failed to delete confession.' };
    }
    revalidatePath('/');
    revalidatePath('/admin');
    return { success: true, message: 'Confession deleted.' };
}

export async function banUser(anonHash: string) {
    const cookieStore = cookies();
    const supabase = createServiceRoleServerClient(cookieStore);
    const { error } = await supabase.from('banned_users').insert({ anon_hash: anonHash });

    if(error){
        if(error.code === '23505'){ // unique constraint violation
            return { success: false, message: 'User is already banned.' };
        }
        return { success: false, message: 'Failed to ban user.' };
    }
    
    revalidatePath('/admin');
    return { success: true, message: `User ${anonHash.substring(0,6)}... has been banned.` };
}
