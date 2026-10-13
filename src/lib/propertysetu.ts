export const APP_URL = 'https://app.propertysetu.com';
function sameMachineApi(hostname: string) {
 return hostname === 'localhost' || hostname === '127.0.0.1' || /^(\d{1,3}\.){3}\d{1,3}$/.test(hostname);
}
function resolveApiUrl() {
 // A page opened on this computer should call the API on the same host.
 // VITE_API_URL is a LAN address that goes stale when the network changes.
 if (typeof window !== 'undefined' && sameMachineApi(window.location.hostname)) return `http://${window.location.hostname}:4000`;
 const configured = import.meta.env['VITE_API_URL'];
 if (typeof configured === 'string' && configured.trim()) return configured.replace(/\/$/, '');
 return 'http://127.0.0.1:4000';
}
export const API_URL = resolveApiUrl();
export const TOKEN_KEY = 'propertysetu_admin_token';
export function money(value: number) { return new Intl.NumberFormat('en-IN', { style:'currency', currency:'INR', maximumFractionDigits:0 }).format(value); }
export function displayPrice(value: number | string | null | undefined) {
 if (value == null || value === '') return 'Price on request';
 const amount = Number(value);
 if (!Number.isFinite(amount) || amount <= 0) return 'Price on request';
 return money(amount);
}
export function label(value: string) { return value.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' '); }
export function metadata(title: string, description: string) { return { meta: [{ title: `${title} — PropertySetu` }, { name:'description', content:description }, { property:'og:title', content:`${title} — PropertySetu` }, { property:'og:description', content:description }, { property:'og:type', content:'website' }, { name:'twitter:card', content:'summary_large_image' }] }; }
export class ApiError extends Error { constructor(message: string, public status: number) { super(message); } }
export async function api<T>(path: string, options: RequestInit = {}, token?: string): Promise<T> {
 const controller = new AbortController(); const timeout = setTimeout(() => controller.abort(), 20000);
 try {
  const isForm = typeof FormData !== 'undefined' && options.body instanceof FormData;
 const response = await fetch(`${API_URL}${path}`, { ...options, signal:controller.signal, headers: { ...(options.body && !isForm ? {'Content-Type':'application/json'} : {}), ...(token ? {Authorization:`Bearer ${token}`} : {}), ...options.headers } });
  const data = await response.json();
  if (!response.ok) throw new ApiError(data.code === 'email_not_verified' ? 'Open your verification email before signing in.' : data.error || 'The request could not be completed.', response.status);
  return data as T;
 } catch (error) { if(error instanceof ApiError) throw error; throw new Error('Unable to reach PropertySetu. Please check your connection and try again.'); }
 finally { clearTimeout(timeout); }
}
