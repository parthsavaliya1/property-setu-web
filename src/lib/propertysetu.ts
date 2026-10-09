export const APP_URL = 'https://app.propertysetu.com';
function resolveApiUrl() {
 const configured = import.meta.env['VITE_API_URL'];
 if (typeof configured === 'string' && configured.trim()) return configured.replace(/\/$/, '');
 if (typeof window !== 'undefined' && window.location.hostname) return `http://${window.location.hostname}:4000`;
 return 'http://127.0.0.1:4000';
}
export const API_URL = resolveApiUrl();
export const TOKEN_KEY = 'propertysetu_admin_token';
export function money(value: number) { return new Intl.NumberFormat('en-IN', { style:'currency', currency:'INR', maximumFractionDigits:0 }).format(value); }
export function label(value: string) { return value.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' '); }
export function metadata(title: string, description: string) { return { meta: [{ title: `${title} — PropertySetu` }, { name:'description', content:description }, { property:'og:title', content:`${title} — PropertySetu` }, { property:'og:description', content:description }, { property:'og:type', content:'website' }, { name:'twitter:card', content:'summary_large_image' }] }; }
export class ApiError extends Error { constructor(message: string, public status: number) { super(message); } }
export async function api<T>(path: string, options: RequestInit = {}, token?: string): Promise<T> {
 const controller = new AbortController(); const timeout = setTimeout(() => controller.abort(), 10000);
 try {
  const response = await fetch(`${API_URL}${path}`, { ...options, signal:controller.signal, headers: { ...(options.body ? {'Content-Type':'application/json'} : {}), ...(token ? {Authorization:`Bearer ${token}`} : {}), ...options.headers } });
  const data = await response.json();
  if (!response.ok) throw new ApiError(data.code === 'email_not_verified' ? 'Open your verification email before signing in.' : data.error || 'The request could not be completed.', response.status);
  return data as T;
 } catch (error) { if(error instanceof ApiError) throw error; throw new Error('Unable to reach PropertySetu. Please check your connection and try again.'); }
 finally { clearTimeout(timeout); }
}
