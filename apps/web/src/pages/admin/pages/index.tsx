    import React from 'react';
import AdminLayout from '@/components/admin/AdminLayout';
import SectionLayout from '@/components/admin/SectionLayout';
import * as pagesApi from '@/lib/apiPages';

export default function AdminPagesIndex() {
  const [adminToken, setAdminToken] = React.useState('');
  const [pages, setPages] = React.useState<any[]>([]);
  const [draft, setDraft] = React.useState({ slug: '', title: '' });
  const [info, setInfo] = React.useState('');
  const [err, setErr] = React.useState('');

  React.useEffect(() => { const t = localStorage.getItem('raven_admin_token') || ''; setAdminToken(t); }, []);
  async function load() { setErr(''); setInfo(''); try { const res: any = await pagesApi.list(adminToken); setPages(res.pages || res || []); } catch(e:any){ setErr(e?.message || 'Failed to load'); } }
  React.useEffect(() => { if (adminToken) load(); }, [adminToken]);

  async function createPage(e: React.FormEvent) { e.preventDefault(); setErr(''); setInfo(''); try { await pagesApi.create(draft, adminToken); setDraft({ slug:'', title:'' }); setInfo('Page created'); await load(); } catch(e:any){ setErr(e?.message || 'Create failed'); } }
  async function remove(id: string) { if (!confirm('Delete this page?')) return; try { await pagesApi.remove(id, adminToken); await load(); } catch(e:any){ alert(e?.message || 'Delete failed'); } }

  return (
    <AdminLayout title="Pages">
      <SectionLayout title="Pages" sidebar={null}>
        {err && <p style={{color:'crimson'}}>{err}</p>}
        {info && <p style={{color:'seagreen'}}>{info}</p>}
        <h3>Create Page</h3>
        <form onSubmit={createPage} style={{ display:'grid', gap:8, maxWidth:420 }}>
          <label>Slug<br/><input value={draft.slug} onChange={(e)=>setDraft({...draft, slug:e.target.value})} required/></label>
          <label>Title<br/><input value={draft.title} onChange={(e)=>setDraft({...draft, title:e.target.value})} required/></label>
          <button type="submit">Create</button>
        </form>
        <h3 style={{marginTop:16}}>All Pages</h3>
        <ul style={{listStyle:'none', padding:0, display:'grid', gap:8}}>
          {pages.map((p:any)=>(
            <li key={p.id} style={{display:'flex', alignItems:'center', gap:10, border:'1px solid #e5e7eb', borderRadius:8, padding:8}}>
              <div style={{minWidth:220}}><strong>{p.title}</strong><div style={{fontSize:12,opacity:.7}}>{p.slug}</div></div>
              <a href={`/admin/pages/${encodeURIComponent(p.slug)}`} style={{marginLeft:'auto'}}>Edit</a>
              <button onClick={()=>remove(p.id)} style={{color:'crimson'}}>Delete</button>
            </li>
          ))}
        </ul>
      </SectionLayout>
    </AdminLayout>
  );
}
