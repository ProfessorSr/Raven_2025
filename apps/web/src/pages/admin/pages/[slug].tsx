    import React from 'react';
import AdminLayout from '@/components/admin/AdminLayout';
import SectionLayout from '@/components/admin/SectionLayout';
import * as pagesApi from '@/lib/apiPages';
import SaveIndicator from '@/components/SaveIndicator';
import { useAutosave } from '@/hooks/useAutosave';

export default function AdminPageEditor() {
  const [adminToken, setAdminToken] = React.useState('');
  const [slug, setSlug] = React.useState('');
  const [page, setPage] = React.useState<any>(null);
  const [err, setErr] = React.useState('');

  React.useEffect(() => { const t = localStorage.getItem('raven_admin_token')||''; setAdminToken(t); }, []);
  React.useEffect(() => { const parts = window.location.pathname.split('/'); setSlug(parts[parts.length-1] || ''); }, []);
  React.useEffect(() => { (async () => { if (!slug) return; try { const p = await pagesApi.getPublic(slug); setPage(p); } catch(e:any){ setErr(e?.message||'Load failed'); } })(); }, [slug]);

  const status = useAutosave(page, async (val) => { if (!val?.id || !adminToken) return; const { id, ...rest } = val; await pagesApi.update(id, rest, adminToken); }, 1000);
  function set<K extends string>(key: K, value: any){ setPage((prev:any)=> ({ ...(prev||{}), [key]: value })); }

  if (!page) return (<AdminLayout title="Page Editor"><SectionLayout title="Loading…" sidebar={null} /></AdminLayout>);

  return (
    <AdminLayout title="Page Editor">
      <SectionLayout title={`Editing: ${page.title||slug}`} sidebar={null}>
        {err && <p style={{color:'crimson'}}>{err}</p>}
        <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:12 }}>
          <SaveIndicator status={status} />
          <label style={{marginLeft:'auto'}}>
            <input type="checkbox" checked={!!page.is_published} onChange={(e)=>set('is_published', e.target.checked)} /> Published
          </label>
        </div>
        <div style={{ display:'grid', gap:8, maxWidth:720 }}>
          <label>Title<br/>
            <input value={page.title||''} onChange={(e)=>set('title', e.target.value)} />
          </label>
          <label>Slug<br/>
            <input value={page.slug||''} onChange={(e)=>set('slug', e.target.value)} />
          </label>
          <label>Content (JSON)<br/>
            <textarea rows={12} value={JSON.stringify(page.content||{}, null, 2)} onChange={(e)=>{ try { set('content', JSON.parse(e.target.value||'{}')); } catch { } }} />
          </label>
        </div>
      </SectionLayout>
    </AdminLayout>
  );
}
