import { useEffect, useState, type FormEvent } from 'react';
import { Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Status, useAdmin } from './admin';
import { ThemeSettings } from './theme-settings';

type ListingSettings = {
  standardPrice: number;
  premiumListPrice: number;
  premiumPrice: number;
  premiumOfferPercent: number;
  premiumSavings: number;
  yearlyDiscountPercent: number;
};

type DemoUser = {
  id: string;
  phone: string;
  otp: string;
  full_name: string;
  active: boolean;
  created_at: string;
};

function money(amount: number) {
  return `₹${amount.toLocaleString('en-IN')}`;
}

export function Settings() {
  const session = useAdmin();
  const [settings, setSettings] = useState<ListingSettings | null>(null);
  const [standard, setStandard] = useState('20');
  const [premium, setPremium] = useState('30');
  const [offer, setOffer] = useState('0');
  const [yearly, setYearly] = useState('15');
  const [users, setUsers] = useState<DemoUser[]>([]);
  const [name, setName] = useState('Demo user');
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('123456');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [busy, setBusy] = useState('');

  const premiumAmount = Number(premium);
  const offerAmount = Number(offer);
  const yearlyAmount = Number(yearly);
  const charged = Number.isFinite(premiumAmount) && Number.isFinite(offerAmount)
    ? Math.round((premiumAmount * (100 - offerAmount)) / 100)
    : 0;
  const savings = Number.isFinite(premiumAmount) ? Math.max(0, premiumAmount - charged) : 0;
  const yearPay = Number.isFinite(yearlyAmount)
    ? Math.round((charged * 12 * (100 - yearlyAmount)) / 100)
    : 0;

  async function load() {
    if (!session) return;
    setLoading(true);
    setError('');
    try {
      const [prices, demos] = await Promise.all([
        session.request<ListingSettings>('/api/admin/settings'),
        session.request<DemoUser[]>('/api/admin/demo-users'),
      ]);
      setSettings(prices);
      setStandard(String(prices.standardPrice));
      setPremium(String(prices.premiumListPrice));
      setOffer(String(prices.premiumOfferPercent));
      setYearly(String(prices.yearlyDiscountPercent));
      setUsers(Array.isArray(demos) ? demos : []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not load settings.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { void load(); }, [session?.token]);

  async function savePrices(event: FormEvent) {
    event.preventDefault();
    if (!session) return;
    const standardPrice = Number(standard);
    const premiumPrice = Number(premium);
    const premiumOffer = Number(offer);
    const yearlyDiscount = Number(yearly);
    if (![standardPrice, premiumPrice, premiumOffer, yearlyDiscount].every((value) => Number.isInteger(value) && value >= 0)) {
      setError('Enter whole rupee amounts and whole percents.');
      return;
    }
    setBusy('prices');
    setError('');
    setNotice('');
    try {
      const saved = await session.request<ListingSettings>('/api/admin/settings', {
        method: 'PATCH',
        body: JSON.stringify({
          standard_price: standardPrice,
          premium_price: premiumPrice,
          premium_offer_percent: premiumOffer,
          yearly_discount_percent: yearlyDiscount,
        }),
      });
      setSettings(saved);
      setNotice('Listing prices saved. The app uses these amounts on the next open.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save prices.');
    } finally {
      setBusy('');
    }
  }

  async function addDemo(event: FormEvent) {
    event.preventDefault();
    if (!session) return;
    setBusy('demo');
    setError('');
    setNotice('');
    try {
      const created = await session.request<DemoUser>('/api/admin/demo-users', {
        method: 'POST',
        body: JSON.stringify({ phone, otp, full_name: name.trim() }),
      });
      setUsers((current) => [created, ...current]);
      setPhone('');
      setNotice(`Demo login saved for ${created.phone}. OTP ${created.otp} is not sent by SMS.`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not create the demo user.');
    } finally {
      setBusy('');
    }
  }

  async function toggle(row: DemoUser) {
    if (!session) return;
    setBusy(row.id);
    setError('');
    try {
      const updated = await session.request<DemoUser>(`/api/admin/demo-users/${encodeURIComponent(row.id)}`, {
        method: 'PATCH',
        body: JSON.stringify({ active: !row.active }),
      });
      setUsers((current) => current.map((item) => item.id === row.id ? updated : item));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not update the demo user.');
    } finally {
      setBusy('');
    }
  }

  async function remove(row: DemoUser) {
    if (!session) return;
    if (!window.confirm(`Remove demo login for ${row.phone}? The account stays, and the next login will send a real OTP.`)) return;
    setBusy(row.id);
    setError('');
    try {
      await session.request(`/api/admin/demo-users/${encodeURIComponent(row.id)}`, { method: 'DELETE' });
      setUsers((current) => current.filter((item) => item.id !== row.id));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not remove the demo user.');
    } finally {
      setBusy('');
    }
  }

  if (loading) return <Status title="Loading settings…" loading />;
  if (!settings && error) return <Status title="Settings unavailable" description={error} retry={() => void load()} />;

  return <>
    <h1>Settings</h1>
    <p className="admin-subtitle">Colour theme, listing amounts, premium offers, and demo logins that skip SMS.</p>
    {error ? <div role="alert" className="error-notice">{error}</div> : null}
    {notice ? <div className="settings-preview">{notice}</div> : null}

    <ThemeSettings />

    <section className="admin-section">
      <div className="admin-section-head"><h2>Listing amounts</h2></div>
      <p className="text-sm text-muted-foreground">Set the monthly fee in rupees. Example: regular 20, premium 30. A premium offer of 20 shows 20% off and the rupees saved.</p>
      <form onSubmit={savePrices}>
        <div className="settings-grid">
          <div className="field"><label htmlFor="standard-price">Regular amount (₹ / month)</label><input id="standard-price" inputMode="numeric" required value={standard} onChange={(event) => setStandard(event.target.value.replace(/\D/g, '').slice(0, 6))} /></div>
          <div className="field"><label htmlFor="premium-price">Premium amount (₹ / month)</label><input id="premium-price" inputMode="numeric" required value={premium} onChange={(event) => setPremium(event.target.value.replace(/\D/g, '').slice(0, 6))} /></div>
          <div className="field"><label htmlFor="premium-offer">Premium offer (%)</label><input id="premium-offer" inputMode="numeric" required value={offer} onChange={(event) => setOffer(event.target.value.replace(/\D/g, '').slice(0, 2))} /><span className="text-xs text-muted-foreground">0 turns the offer off. 20 means 20% off.</span></div>
          <div className="field"><label htmlFor="yearly-offer">Yearly discount (%)</label><input id="yearly-offer" inputMode="numeric" required value={yearly} onChange={(event) => setYearly(event.target.value.replace(/\D/g, '').slice(0, 2))} /></div>
        </div>
        <div className="settings-preview">
          {offerAmount > 0
            ? <>Premium shows <strong>{offerAmount}% off</strong>. Customers pay {money(charged)} instead of {money(premiumAmount || 0)} and save {money(savings)}. A year is {money(yearPay)}.</>
            : <>No premium offer. Customers pay {money(premiumAmount || 0)} for one premium month. A year is {money(yearPay)}.</>}
        </div>
        <Button disabled={busy === 'prices'}>{busy === 'prices' ? 'Saving…' : 'Save amounts'}</Button>
      </form>
    </section>

    <section className="admin-section">
      <div className="admin-section-head"><h2>Demo users</h2></div>
      <p className="text-sm text-muted-foreground">Use a 10-digit number such as 9999999999 and an OTP such as 123456. Login accepts that OTP and does not send an SMS.</p>
      <form onSubmit={addDemo}>
        <div className="settings-grid">
          <div className="field"><label htmlFor="demo-name">Name</label><input id="demo-name" required minLength={2} maxLength={80} value={name} onChange={(event) => setName(event.target.value)} /></div>
          <div className="field"><label htmlFor="demo-phone">Mobile number</label><input id="demo-phone" inputMode="numeric" required pattern="[0-9]{10}" maxLength={10} value={phone} onChange={(event) => setPhone(event.target.value.replace(/\D/g, '').slice(0, 10))} placeholder="9999999999" /></div>
          <div className="field"><label htmlFor="demo-otp">OTP</label><input id="demo-otp" inputMode="numeric" required pattern="[0-9]{6}" maxLength={6} value={otp} onChange={(event) => setOtp(event.target.value.replace(/\D/g, '').slice(0, 6))} placeholder="123456" /></div>
        </div>
        <Button disabled={busy === 'demo'}>{busy === 'demo' ? 'Saving…' : 'Add demo user'}</Button>
      </form>
      {users.length ? <div className="table-wrapper" style={{ marginTop: 22 }}><table><thead><tr>{['Name', 'Mobile', 'OTP', 'SMS', 'Status', ''].map((heading) => <th key={heading}>{heading}</th>)}</tr></thead><tbody>{users.map((row) => <tr key={row.id}><td className="font-semibold">{row.full_name}</td><td>{row.phone}</td><td>{row.otp}</td><td>{row.active ? 'Not sent' : 'Real OTP'}</td><td><Button type="button" variant="outline" size="sm" disabled={busy === row.id} onClick={() => void toggle(row)}>{row.active ? 'Active' : 'Off'}</Button></td><td><Button type="button" variant="ghost" size="icon" aria-label={`Remove ${row.phone}`} disabled={busy === row.id} onClick={() => void remove(row)}><Trash2 /></Button></td></tr>)}</tbody></table></div> : <Status title="No demo users yet" description="Add a mobile number and a fixed OTP. That login will not send an SMS." />}
    </section>
  </>;
}
