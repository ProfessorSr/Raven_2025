import React from 'react';
import { api } from '@/lib/api';

const registry: Record<string, React.FC<any>> = {
  hero: (p) => (
    <section style={{ padding: '40px 0' }}>
      <h1 style={{ margin: 0 }}>{p.headline || 'Hero headline'}</h1>
      {p.subheadline && <p style={{ marginTop: 8 }}>{p.subheadline}</p>}
      {p.ctaHref && p.ctaText && <a href={p.ctaHref} style={{ display: 'inline-block', marginTop: 12 }}>{p.ctaText}</a>}
    </section>
  ),
  text: (p) => <div dangerouslySetInnerHTML={{ __html: p.html || '' }} />,
  markdown: (p) => <pre style={{ whiteSpace: 'pre-wrap' }}>{p.md || ''}</pre>,
  image: (p) => <img src={p.src} alt={p.alt || ''} style={{ maxWidth: '100%' }} />,
  cta: (p) => <a href={p.href} style={{ display: 'inline-block' }}>{p.text || 'Learn more'}</a>,
  form: (p) => <div>Form block placeholder (scope: {p.scope})</div>,
};

export default function PageRenderer({ slug }: { slug: string }) {
  const [page, setPage] = React.useState<any>(null);
  const [blocks, setBlocks] = React.useState<any[]>([]);
  const [error, setError] = React.useState('');

  React.useEffect(() => {
    (async () => {
      try {
        const d = await api.pages.get(slug);
        setPage(d.page);
        setBlocks(d.blocks || []);
      } catch (e: any) {
        setError(e.message || 'Failed to load page');
      }
    })();
  }, [slug]);

  if (error) return <p style={{ color: 'crimson' }}>{error}</p>;
  if (!page) return <p>Loading page…</p>;

  const zones = blocks.reduce((acc: any, b: any) => { (acc[b.zone] ||= []).push(b); return acc; }, {});

  return (
    <div>
      {(zones['main'] || []).map((b: any) => {
        const Cmp = registry[b.type] || ((p: any) => <div>Unknown block: {b.type}</div>);
        return <div key={b.id} style={{ marginBottom: 16 }}><Cmp {...b.config} /></div>;
      })}
    </div>
  );
}
