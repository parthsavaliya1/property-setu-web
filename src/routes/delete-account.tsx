import { createFileRoute, Link } from '@tanstack/react-router';
import { useState, type FormEvent } from 'react';
import { Footer, PageIntro, SiteHeader } from '@/components/propertysetu/site';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { api, metadata, SUPPORT_EMAIL } from '@/lib/propertysetu';

export const Route = createFileRoute('/delete-account')({
  head: () => metadata('Delete account', 'Verify your mobile number and permanently delete your PropertySetu account without installing the app.'),
  component: DeleteAccountPage,
});

function DeleteAccountPage() {
  const [step, setStep] = useState<'phone' | 'code' | 'confirm' | 'done'>('phone');
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [sessionId, setSessionId] = useState('');
  const [token, setToken] = useState('');
  const [confirmed, setConfirmed] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (busy || step === 'done') return;
    setBusy(true);
    setError('');
    try {
      if (step === 'phone') {
        if (!/^[0-9]{10}$/.test(phone)) throw new Error('Enter your registered 10-digit mobile number.');
        const result = await api<{ sessionId: string }>('/api/auth/send-otp', { method: 'POST', body: JSON.stringify({ phone, create: false }) });
        if (!result.sessionId) throw new Error('Could not start verification. Please try again.');
        setSessionId(result.sessionId);
        setOtp('');
        setStep('code');
      } else if (step === 'code') {
        const result = await api<{ token: string }>('/api/auth/verify-otp', { method: 'POST', body: JSON.stringify({ phone, otp, sessionId, create: false }) });
        if (!result.token) throw new Error('Verification did not complete. Please try again.');
        // The deletion session stays in memory and never changes the admin session.
        setToken(result.token);
        setOtp('');
        setStep('confirm');
      } else if (confirmed && token) {
        await api('/api/me', { method: 'DELETE' }, token);
        setToken('');
        setSessionId('');
        setPhone('');
        setStep('done');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Please try again.');
    } finally {
      setBusy(false);
    }
  }

  return <>
    <SiteHeader />
    <main>
      <PageIntro eyebrow="Your account, your choice" title="Delete your PropertySetu account" description="Request permanent deletion without installing the app." />
      <article className="privacy site-width">
        <section>
          <h2>What will be deleted?</h2>
          <p>Deletion removes your account, profile, owned listings, chats involving your account, inquiries, visits and linked account data from the active database. Stored uploads are queued for deletion. Backup copies and third-party caches may remain until they expire or are cleared. Anonymised payment references may remain for accounting and duplicate-purchase prevention.</p>
          <p>Verifying your registered mobile number does not delete your account. You must confirm permanent deletion afterwards.</p>
        </section>
        <section className="max-w-lg pb-8">
          {step === 'done' ? <p role="status">Your account has been deleted. Stored files have been queued for deletion.</p> : <form onSubmit={submit} className="space-y-5" aria-busy={busy}>
            {step === 'phone' ? <div className="space-y-2">
              <label htmlFor="delete-phone">Registered mobile number (India)</label>
              <Input id="delete-phone" type="tel" inputMode="numeric" autoComplete="tel-national" maxLength={10} value={phone} onChange={event => setPhone(event.target.value.replace(/\D/g, '').slice(0, 10))} disabled={busy} required />
            </div> : null}
            {step === 'code' ? <div className="space-y-2">
              <label htmlFor="delete-code">Verification code for your number ending {phone.slice(-4)}</label>
              <Input id="delete-code" inputMode="numeric" autoComplete="one-time-code" maxLength={8} value={otp} onChange={event => setOtp(event.target.value.replace(/\D/g, ''))} disabled={busy} required />
              <Button type="button" variant="link" disabled={busy} onClick={() => { setStep('phone'); setSessionId(''); setOtp(''); setError(''); }}>Change number or request a new code</Button>
            </div> : null}
            {step === 'confirm' ? <label className="flex items-start gap-3">
              <input type="checkbox" checked={confirmed} onChange={event => setConfirmed(event.target.checked)} disabled={busy} className="mt-1" />
              <span>I understand deletion is permanent and want to delete my account and associated data.</span>
            </label> : null}
            {error ? <p role="alert">{error}</p> : null}
            <Button type="submit" variant={step === 'confirm' ? 'destructive' : 'default'} disabled={busy || (step === 'confirm' && (!confirmed || !token))}>
              {busy ? 'Please wait…' : step === 'phone' ? 'Send verification code' : step === 'code' ? 'Verify account' : 'Permanently delete my account'}
            </Button>
          </form>}
        </section>
        <p><Link to="/privacy">Read our Privacy Policy</Link></p>
        <p>Need help or cannot access your registered number? Email <a href={`mailto:${SUPPORT_EMAIL}`}>{SUPPORT_EMAIL}</a> for account-deletion assistance.</p>
      </article>
    </main>
    <Footer />
  </>;
}
