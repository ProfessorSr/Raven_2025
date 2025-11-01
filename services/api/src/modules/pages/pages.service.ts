import { supa } from '../../lib/supabase';
export type Page = { id?: string; slug: string; title: string; content?: any; is_published?: boolean; created_at?: string; updated_at?: string; };
export async function listPages() { const { data, error } = await supa.from('pages').select('*').order('updated_at', { ascending: false }); if (error) throw new Error(error.message); return data||[]; }
export async function getBySlug(slug: string) { const { data, error } = await supa.from('pages').select('*').eq('slug', slug).single(); if (error) throw new Error(error.message); return data; }
export async function create(page: Page) { const { data, error } = await supa.from('pages').insert({ slug: page.slug, title: page.title, content: page.content ?? {}, is_published: page.is_published ?? false }).select('*').single(); if (error) throw new Error(error.message); return data; }
export async function update(id: string, patch: Partial<Page>) { const { data, error } = await supa.from('pages').update(patch).eq('id', id).select('*').single(); if (error) throw new Error(error.message); return data; }
export async function remove(id: string) { const { error } = await supa.from('pages').delete().eq('id', id); if (error) throw new Error(error.message); return { ok: true }; }
