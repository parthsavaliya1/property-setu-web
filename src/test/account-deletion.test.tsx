import { act, type ComponentType } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, expect, it, vi } from 'vitest';

const { request } = vi.hoisted(() => ({ request: vi.fn() }));
vi.mock('@/lib/propertysetu', () => ({ api: request, metadata: () => ({}) }));
vi.mock('@/components/propertysetu/site', () => ({ SiteHeader: () => null, Footer: () => null, PageIntro: () => <h1>Delete account</h1> }));
vi.mock('@tanstack/react-router', () => ({ createFileRoute: () => (options: unknown) => ({ options }), Link: ({ children }: { children: React.ReactNode }) => <span>{children}</span> }));
import { Route } from '@/routes/delete-account';
let root: Root;
let container: HTMLDivElement;
async function mount() {
  container = document.createElement('div'); document.body.append(container);
  const Page = Route.options.component as ComponentType;
  root = createRoot(container);
  await act(async () => { root.render(<Page />); });
}
async function input(id: string, value: string) {
  const element = container.querySelector<HTMLInputElement>(`#${id}`)!;
  await act(async () => {
    Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')!.set!.call(element, value);
    element.dispatchEvent(new Event('input', { bubbles: true }));
  });
}
async function submit() { await act(async () => { container.querySelector('form')!.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true })); }); }
afterEach(async () => { if (root) await act(async () => root.unmount()); container?.remove(); request.mockReset(); });

it('requires verification and confirmation, and keeps failed deletion retryable', async () => {
  request.mockResolvedValueOnce({ sessionId: 'test-session' }).mockResolvedValueOnce({ token: 'test-token' })
    .mockRejectedValueOnce(new Error('Server temporarily unavailable')).mockResolvedValueOnce(undefined);
  await mount();
  await input('delete-phone', '9876543210'); await submit();
  await input('delete-code', '123456'); await submit();
  expect(container.querySelector<HTMLButtonElement>('button[type="submit"]')!.disabled).toBe(true);
  await submit();
  expect(request.mock.calls.some(([path]) => path === '/api/me')).toBe(false);
  await act(async () => container.querySelector<HTMLInputElement>('input[type="checkbox"]')!.click());
  await submit();
  expect(container.querySelector('[role="alert"]')?.textContent).toContain('Server temporarily unavailable');
  expect(container.textContent).not.toContain('Your account has been deleted');
  await submit();
  expect(container.querySelector('[role="status"]')?.textContent).toContain('Your account has been deleted');
  expect(request.mock.calls.slice(2)).toEqual([
    ['/api/me', { method: 'DELETE' }, 'test-token'], ['/api/me', { method: 'DELETE' }, 'test-token'],
  ]);
});
it('does not reveal deletion confirmation when verification fails', async () => {
  request.mockResolvedValueOnce({ sessionId: 'test-session' }).mockRejectedValueOnce(new Error('Invalid code'));
  await mount();
  await input('delete-phone', '9876543210'); await submit();
  await input('delete-code', '000000'); await submit();
  expect(container.querySelector('[role="alert"]')?.textContent).toContain('Invalid code');
  expect(container.querySelector('input[type="checkbox"]')).toBeNull();
  expect(request.mock.calls.some(([path]) => path === '/api/me')).toBe(false);
});
