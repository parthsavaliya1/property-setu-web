import { useEffect, useState, type FormEvent } from 'react';
import { Image as ImageIcon, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAdmin } from './admin';
import { Status } from './admin';

type Banner = { id: string; image_url: string; is_active: boolean; sort_order: number; created_at: string };

export function Banners() {
  const session = useAdmin();
  const [rows, setRows] = useState<Banner[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState('');
  const [file, setFile] = useState<File | null>(null);

  async function load() {
    if (!session) return;
    setLoading(true);
    setError('');
    try {
      const data = await session.request<Banner[]>('/api/admin/banners');
      setRows(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not load banners.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { void load(); }, [session?.token]);

  async function upload(event: FormEvent) {
    event.preventDefault();
    if (!session || !file) return;
    setBusy('upload');
    setError('');
    try {
      const body = new FormData();
      body.append('file', file);
      const created = await session.request<Banner>('/api/admin/banners', { method: 'POST', body });
      setRows((current) => [...current, created]);
      setFile(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not upload the banner.');
    } finally {
      setBusy('');
    }
  }

  async function toggle(row: Banner) {
    if (!session) return;
    setBusy(row.id);
    setError('');
    try {
      const saved = await session.request<Banner>(`/api/admin/banners/${encodeURIComponent(row.id)}`, {
        method: 'PATCH',
        body: JSON.stringify({ is_active: !row.is_active }),
      });
      setRows((current) => current.map((item) => item.id === row.id ? saved : item));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not update the banner.');
    } finally {
      setBusy('');
    }
  }

  async function remove(row: Banner) {
    if (!session || !window.confirm('Remove this banner from the app home screen?')) return;
    setBusy(row.id);
    setError('');
    try {
      await session.request(`/api/admin/banners/${encodeURIComponent(row.id)}`, { method: 'DELETE' });
      setRows((current) => current.filter((item) => item.id !== row.id));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not remove the banner.');
    } finally {
      setBusy('');
    }
  }

  return <>
    <h1>Banners</h1>
    <p className="admin-subtitle">Uploaded banners are added after the built-in home banner. The app shows them as a carousel and moves to the next one every 10 seconds, all in the same size.</p>
    {error ? <div role="alert" className="error-notice">{error}</div> : null}
    <form className="banner-form" onSubmit={upload}>
      <label className="banner-file">
        <ImageIcon />
        <span>{file ? file.name : 'Choose a banner image'}</span>
        <input type="file" accept="image/jpeg,image/png,image/webp" onChange={(event) => setFile(event.target.files?.[0] ?? null)} />
      </label>
      <Button type="submit" disabled={!file || busy === 'upload'}>{busy === 'upload' ? 'Uploading…' : 'Add banner'}</Button>
    </form>
    {loading ? <Status title="Loading banners…" loading /> : rows.length ? <div className="banner-list">{rows.map((row) => <article className="banner-row" key={row.id}>
      <img className="banner-frame" src={row.image_url} alt="" />
      <div className="banner-actions">
        <span className={row.is_active ? 'banner-state is-live' : 'banner-state'}>{row.is_active ? 'Showing in the app' : 'Hidden'}</span>
        <Button type="button" variant="outline" disabled={busy === row.id} onClick={() => toggle(row)}>{row.is_active ? 'Hide' : 'Show'}</Button>
        <Button type="button" variant="outline" disabled={busy === row.id} onClick={() => remove(row)}><Trash2 />Remove</Button>
      </div>
    </article>)}</div> : <Status title="No banners yet" description="The app keeps its current home banner until you upload one here." />}
  </>;
}
