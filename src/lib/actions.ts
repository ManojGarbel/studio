'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { redirect } from 'next/navigation';
import { cookies, headers } from 'next/headers';

import type { Confession } from './types';
import { createServiceRoleServerClient } from './supabase/server';
import { isUserBanned, getLastPostTime } from './db';
import { PII_REGEX } from './utils';

//
// ──────────────────────────────── CONSTANTS ────────────────────────────────
//
const TEN_MINUTES = 10 * 60 * 1000;

//
// ──────────────────────────────── CONFESSIONS ────────────────────────────────
//

// Fetch confessions (approved + current user’s)
export async function getConfessions(): Promise<Confession[]> {
  const cookieStore = cookies();
  const supabase = createServiceRoleServerClient(cookieStore);
  const anonHash = cookieStore.get('anon_hash')?.value;

  let query = supabase
    .from('confessions')
    .select(`
      id,
      text,
      created_at,
      anon_hash,
      status,
      likes,
      dislikes,
      comments ( id, text, created_at, anon_hash, is_author ),
      post_interactions ( user_anon_hash, interaction_type )
    `)
    .order('created_at', { ascending: false })
    .order('created_at', { foreignTable: 'comments', ascending: true });

  query = anonHash
    ? query.or(`status.eq.approved,anon_hash.eq.${anonHash}`)
    : query.eq('status', 'approved');

  const { data, error } = await query;
  if (error) {
    console.error('Error fetching confessions:', error.message);
    return [];
  }

  return data.map((item: any) => {
    const userInteractions = anonHash
      ? item.post_interactions.filter((pi: any) => pi.user_anon_hash === anonHash)
      : [];

    return {
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
      userInteraction: userInteractions.length > 0 ? userInteractions[0].interaction_type : null,
    };
  });
}

// Admin-only fetch
export async function getAllConfessionsForAdmin(): Promise<Confession[]> {
  const cookieStore = cookies();
  const supabase = createServiceRoleServerClient(cookieStore);

  const { data, error } = await supabase
    .from('confessions')
    .select(`
      id,
      text,
      created_at,
      anon_hash,
      status,
      likes,
      dislikes,
      comments ( id, text, created_at, anon_hash, is_author )
    `)
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
    userInteraction: null,
  }));
}

// Update status
export async function updateConfessionStatus(
  id: string,
  status: 'approved' | 'rejected'
) {
  const supabase = createServiceRoleServerClient(cookies());
  const { error } = await supabase.from('confessions').update({ status }).eq('id', id);

  if (error) {
    console.error('Error updating confession status:', error);
    return { success: false, message: 'Failed to update confession.' };
  }

  revalidatePath('/');
  revalidatePath('/admin');
  return { success: true, message: `Confession ${status}.` };
}

// Submit confession
const confessionSchema = z.string().min(10).max(1000);
export async function submitConfession(prevState: any, formData: FormData) {
  const cookieStore = cookies();
  const anonHash = cookieStore.get('anon_hash')?.value;
  if (!anonHash) return { success: false, message: 'Not authenticated.' };

  if (await isUserBanned(anonHash))
    return { success: false, message: 'You are banned from posting.' };

  const lastPostTime = await getLastPostTime(anonHash);
  if (lastPostTime && Date.now() - lastPostTime.getTime() < TEN_MINUTES) {
    const remaining = Math.ceil((TEN_MINUTES - (Date.now() - lastPostTime.getTime())) / 60000);
    return { success: false, message: `Wait ${remaining} more minute(s).` };
  }

  const rawConfession = formData.get('confession');
  const validated = confessionSchema.safeParse(rawConfession);
  if (!validated.success)
    return { success: false, message: validated.error.issues[0].message };

  const text = validated.data;
  if (text.match(PII_REGEX.EMAIL) || text.match(PII_REGEX.PHONE))
    return { success: false, message: 'No personal information allowed.' };

  const supabase = createServiceRoleServerClient(cookieStore);
  const { error } = await supabase.from('confessions').insert({
    text,
    anon_hash: anonHash,
    status: 'pending',
  });

  if (error) {
    console.error('Error during confession submission:', error);
    return { success: false, message: 'Database error.' };
  }

  revalidatePath('/');
  return { success: true, message: 'Confession submitted for review.' };
}

//
// ──────────────────────────────── ACCOUNT ACTIVATION ────────────────────────────────
//
const activationSchema = z.string().min(1);

export async function activateAccount(prevState: any, formData: FormData) {
  const supabase = createServiceRoleServerClient(cookies());
  const headerStore = headers();

  const validated = activationSchema.safeParse(formData.get('activationKey'));
  if (!validated.success)
    return { success: false, message: validated.error.issues[0].message, anonHash: null };

  if (validated.data !== 'WELCOME')
    return { success: false, message: 'Invalid activation key.', anonHash: null };

  const ip = headerStore.get('x-forwarded-for')?.split(',')[0].trim();
  const userAgent = headerStore.get('user-agent');

  if (ip) {
    const { data: existing } = await supabase
      .from('activations')
      .select('id')
      .eq('ip_address', ip)
      .single();
    if (existing)
      return { success: false, message: 'IP already used.', anonHash: null };
  }

  const anonHash = crypto.randomUUID();
  const { error } = await supabase.from('activations').insert({
    anon_hash: anonHash,
    ip_address: ip,
    user_agent: userAgent,
  });
  if (error) {
    console.error('Activation error:', error);
    return { success: false, message: 'Could not save activation.', anonHash: null };
  }

  return { success: true, message: 'Account activated!', anonHash };
}

//
// ──────────────────────────────── INTERACTIONS ────────────────────────────────
//
async function handleInteraction(confessionId: string, type: 'like' | 'dislike') {
  const cookieStore = cookies();
  const supabase = createServiceRoleServerClient(cookieStore);
  const anonHash = cookieStore.get('anon_hash')?.value;
  if (!anonHash) return { success: false, message: 'Not authenticated.' };

  // Check existing
  const { data: existing } = await supabase
    .from('post_interactions')
    .select('*')
    .eq('confession_id', confessionId)
    .eq('user_anon_hash', anonHash)
    .single();

  if (existing) {
    const isSame = existing.interaction_type === type;
    await supabase.from('post_interactions').delete().eq('id', existing.id);
    await supabase.rpc('decrement_count', {
      row_id: confessionId,
      column_name: existing.interaction_type === 'like' ? 'likes' : 'dislikes',
    });

    if (!isSame) {
      await supabase.from('post_interactions').insert({
        confession_id: confessionId,
        user_anon_hash: anonHash,
        interaction_type: type,
      });
      await supabase.rpc('increment_count', {
        row_id: confessionId,
        column_name: type === 'like' ? 'likes' : 'dislikes',
      });
    }
  } else {
    await supabase.from('post_interactions').insert({
      confession_id: confessionId,
      user_anon_hash: anonHash,
      interaction_type: type,
    });
    await supabase.rpc('increment_count', {
      row_id: confessionId,
      column_name: type === 'like' ? 'likes' : 'dislikes',
    });
  }

  revalidatePath('/');
  return { success: true };
}

export const handleLike = (id: string) => handleInteraction(id, 'like');
export const handleDislike = (id: string) => handleInteraction(id, 'dislike');

//
// ──────────────────────────────── COMMENTS ────────────────────────────────
//
const commentSchema = z.string().min(1).max(500);

export async function addComment(confessionId: string, formData: FormData) {
  const cookieStore = cookies();
  const supabase = createServiceRoleServerClient(cookieStore);
  const anonHash = cookieStore.get('anon_hash')?.value;
  if (!anonHash) return { success: false, message: 'Not authenticated.' };

  if (await isUserBanned(anonHash))
    return { success: false, message: 'You are banned from commenting.' };

  const validated = commentSchema.safeParse(formData.get('comment'));
  if (!validated.success) return { success: false, message: validated.error.issues[0].message };

  const { data: confessionAuthor } = await supabase
    .from('confessions')
    .select('anon_hash')
    .eq('id', confessionId)
    .single();

  if (!confessionAuthor) return { success: false, message: 'Confession not found.' };

  const isAuthor = confessionAuthor.anon_hash === anonHash;
  const { error } = await supabase.from('comments').insert({
    text: validated.data,
    confession_id: confessionId,
    anon_hash: anonHash,
    is_author: isAuthor,
  });

  if (error) return { success: false, message: 'Failed to add comment.' };

  revalidatePath('/');
  return { success: true };
}

//
// ──────────────────────────────── REPORTS ────────────────────────────────
//
async function handleReport(contentId: string, type: 'confession' | 'comment') {
  const supabase = createServiceRoleServerClient(cookies());
  const anonHash = cookies().get('anon_hash')?.value;
  if (!anonHash) return { success: false, message: 'Not authenticated.' };

  const { error } = await supabase.from('reports').insert({
    content_id: contentId,
    content_type: type,
    reporter_anon_hash: anonHash,
    status: 'pending',
  });

  if (error) {
    if (error.code === '23505')
      return { success: false, message: 'Already reported.' };
    return { success: false, message: 'Failed to report.' };
  }

  revalidatePath('/');
  revalidatePath('/admin');
  return { success: true, message: 'Reported for review.' };
}

export const reportConfession = (id: string) => handleReport(id, 'confession');
export const reportComment = (id: string) => handleReport(id, 'comment');

//
// ──────────────────────────────── ADMIN ────────────────────────────────
//
export async function deleteConfession(id: string) {
  const supabase = createServiceRoleServerClient(cookies());
  const { error } = await supabase.from('confessions').delete().eq('id', id);
  if (error) return { success: false, message: 'Failed to delete confession.' };

  revalidatePath('/');
  revalidatePath('/admin');
  return { success: true, message: 'Confession deleted.' };
}

export async function deleteComment(id: string) {
  const supabase = createServiceRoleServerClient(cookies());
  const { error } = await supabase.from('comments').delete().eq('id', id);
  if (error) return { success: false, message: 'Failed to delete comment.' };

  revalidatePath('/');
  revalidatePath('/admin');
  return { success: true, message: 'Comment deleted.' };
}

export async function banUser(anonHash: string) {
  const supabase = createServiceRoleServerClient(cookies());
  const { error } = await supabase.from('banned_users').insert({ anon_hash: anonHash });

  if (error) {
    if (error.code === '23505') return { success: false, message: 'User already banned.' };
    return { success: false, message: 'Failed to ban user.' };
  }

  revalidatePath('/admin');
  return { success: true, message: `User ${anonHash.substring(0, 6)}... banned.` };
}

//
// ──────────────────────────────── ADMIN AUTH ────────────────────────────────
//
const adminAuthSchema = z.string().min(1);

export async function authenticateAdmin(prevState: any, formData: FormData) {
  const validated = adminAuthSchema.safeParse(formData.get('secretKey'));
  if (!validated.success)
    return { success: false, message: validated.error.issues[0].message };

  if (validated.data === process.env.ADMIN_SECRET_KEY) {
    const cookieStore = cookies();
    cookieStore.set('admin-auth', 'true', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 60 * 60 * 24,
      path: '/',
    });
    return { success: true, message: 'Authenticated!' };
  }
  return { success: false, message: 'Invalid secret key.' };
}

export async function signOutAdmin() {
  cookies().delete('admin-auth');
  redirect('/admin/login');
}
