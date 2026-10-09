import { useState } from 'react';
import { Link } from '@tanstack/react-router';
import { LayoutDashboard, Building2, Flag, ShieldCheck, ArrowLeft, PanelLeftClose, PanelLeftOpen, Eye, Users, IndianRupee, MessageSquare, BadgeCheck, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Brand } from './site';

const stats = [['Total properties', Building2], ['Published', BadgeCheck], ['Pending review', Clock], ['Inquiries', MessageSquare], ['Open reports', Flag], ['Users', Users], ['Revenue', IndianRupee], ['Property views', Eye]] as const;
const tabs = [['overview', 'Dashboard', LayoutDashboard], ['users', 'Users', Users], ['payments', 'Payments', IndianRupee], ['properties', 'Properties', Building2], ['reports', 'Reports', Flag]] as const;
type Tab = typeof tabs[number][0];
const columns: Record<Exclude<Tab, 'overview'>, string[]> = {
  users: ['Name', 'Email', 'Phone', 'City', 'Roles', 'Listings', 'Wallet', 'Joined'],
  payments: ['User', 'Property', 'Type', 'Amount', 'Provider', 'Reference', 'Status', 'Paid', 'Created'],
  properties: ['Property', 'City', 'Owner', 'Type', 'Price', 'Status', 'Verification', 'Featured', 'Created'],
  reports: ['Report ID', 'Property', 'Reason', 'Description', 'Status', 'Created'],
};
const filters: Record<Exclude<Tab, 'overview'>, string[]> = {
  users: ['verified', 'unverified'],
  payments: ['pending', 'paid', 'failed', 'refunded', 'cancelled'],
  properties: ['draft', 'pending_review', 'published', 'rejected', 'sold', 'rented', 'expired', 'archived'],
  reports: ['pending', 'reviewing', 'resolved', 'dismissed'],
};
const copy: Record<Tab, string> = {
  overview: 'Users, payments, and properties in one place.',
  users: 'Every account on PropertySetu.',
  payments: 'Listing fees and wallet top-ups.',
  properties: 'Review listings and manage publication.',
  reports: 'Keep your marketplace safe and trustworthy.',
};

export function AdminPreview() {
  const [tab, setTab] = useState<Tab>('overview');
  const [collapsed, setCollapsed] = useState(false);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');
  const title = tabs.find(([value]) => value === tab)?.[1] ?? 'Dashboard';
  return <div className="admin-shell">
    <aside className={`admin-sidebar ${collapsed ? 'admin-collapsed' : ''}`}>
      <Brand />
      <div className="text-xs uppercase text-muted-foreground admin-sidebar-label">Layout preview</div>
      <nav className="admin-nav" aria-label="Preview navigation">
        {tabs.map(([value, label, Icon]) => <Button variant={tab === value ? 'secondary' : 'ghost'} className="preview-nav-button" aria-pressed={tab === value} key={value} title={label} onClick={() => { setTab(value); setSearch(''); setFilter('all'); }}><Icon /><span>{label}</span></Button>)}
      </nav>
      <Link className="admin-sidebar-bottom mt-auto text-sm text-muted-foreground flex items-center gap-2" to="/"><ArrowLeft className="size-4" /><span>Back to website</span></Link>
    </aside>
    <div className="admin-main">
      <header className="admin-topbar">
        <div className="flex items-center gap-3">
          <Button className="admin-collapse-button" variant="ghost" size="icon" aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'} title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'} onClick={() => setCollapsed(!collapsed)}>{collapsed ? <PanelLeftOpen /> : <PanelLeftClose />}</Button>
          <span className="flex items-center gap-2"><ShieldCheck className="size-4 text-primary" />Read-only preview</span>
        </div>
        <Button variant="outline" asChild><Link to="/admin">Admin sign in</Link></Button>
      </header>
      <main className="admin-content">
        <div className="preview-notice">Layout preview only · No account data or live actions</div>
        <h1>{title}</h1>
        <p className="admin-subtitle">{copy[tab]}</p>
        {tab === 'overview' ? <div className="stats-grid">{stats.map(([label, Icon]) => <div className="stat" key={label}><div className="stat-top"><span>{label}</span><Icon /></div><div className="stat-value">—</div><span className="text-xs text-muted-foreground">Available after sign in</span></div>)}</div> : <>
          <div className="table-toolbar">
            <input className="search-input" aria-label={`Search ${tab} preview`} placeholder="Search" value={search} onChange={e => setSearch(e.target.value)} />
            <select className="table-select" aria-label="Preview status filter" value={filter} onChange={e => setFilter(e.target.value)}>
              <option value="all">All</option>
              {filters[tab].map(value => <option key={value} value={value}>{value.replaceAll('_', ' ')}</option>)}
            </select>
          </div>
          <div className="table-wrapper">
            <table>
              <thead><tr>{columns[tab].map(heading => <th key={heading}>{heading}</th>)}</tr></thead>
              <tbody><tr><td colSpan={columns[tab].length}><div className="preview-empty"><Building2 className="size-8 text-primary" /><h3>No records in layout preview</h3><p>Sign in to view your marketplace’s {tab}.</p></div></td></tr></tbody>
            </table>
          </div>
        </>}
      </main>
    </div>
  </div>;
}
