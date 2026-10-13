import { type ReactNode, useState } from 'react';
import { Link, useLocation } from 'wouter';
import {
  Activity,
  ArrowDownLeft,
  ArrowUpRight,
  BadgeCheck,
  Banknote,
  Boxes,
  ChevronDown,
  CircleHelp,
  ClipboardList,
  CreditCard,
  FileClock,
  Gauge,
  HandCoins,
  History,
  LayoutDashboard,
  LifeBuoy,
  LogOut,
  Menu,
  Package,
  Settings,
  ShieldCheck,
  Users,
  Wallet,
  X,
} from 'lucide-react';
import { useClerk } from '@clerk/react';

export const cn = (...values: Array<string | false | null | undefined>) => values.filter(Boolean).join(' ');

export const taka = (amount: number | null | undefined) =>
  new Intl.NumberFormat('en-BD', { style: 'currency', currency: 'BDT', maximumFractionDigits: 2 }).format(amount ?? 0);

export const dateLabel = (value?: string | null) =>
  value ? new Intl.DateTimeFormat('en-BD', { day: 'numeric', month: 'short', year: 'numeric' }).format(new Date(value)) : '—';

export function Button({
  children,
  variant = 'primary',
  className,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'primary' | 'quiet' | 'outline' | 'danger'; 'data-testid'?: string }) {
  return (
    <button
      className={cn('button', `button-${variant}`, className)}
      data-testid={props['data-testid']}
      {...props}
    >
      {children}
    </button>
  );
}

export function PageHeading({ eyebrow, title, description, action }: { eyebrow?: string; title: string; description?: string; action?: ReactNode }) {
  return (
    <div className="page-heading">
      <div>
        {eyebrow && <p className="eyebrow">{eyebrow}</p>}
        <h1 className="font-display">{title}</h1>
        {description && <p className="heading-description">{description}</p>}
      </div>
      {action && <div className="heading-action">{action}</div>}
    </div>
  );
}

export function Panel({ children, className = '', title, subtitle, action }: { children: ReactNode; className?: string; title?: string; subtitle?: string; action?: ReactNode }) {
  return (
    <section className={cn('panel surface', className)}>
      {(title || action) && (
        <div className="panel-heading">
          <div>
            {title && <h2>{title}</h2>}
            {subtitle && <p>{subtitle}</p>}
          </div>
          {action}
        </div>
      )}
      {children}
    </section>
  );
}

export function Metric({ label, value, note, icon: Icon, tone = 'gold' }: { label: string; value: ReactNode; note?: string; icon: typeof Wallet; tone?: 'gold' | 'mint' | 'blue' | 'rose' }) {
  return (
    <div className={`metric metric-${tone}`}>
      <div className="metric-top">
        <span>{label}</span>
        <span className="metric-icon"><Icon size={18} strokeWidth={1.8} /></span>
      </div>
      <strong>{value}</strong>
      {note && <small>{note}</small>}
    </div>
  );
}

export function StatusPill({ status }: { status: string }) {
  return <span className={`status status-${status.toLowerCase()}`} data-testid={`status-${status}`}>{status.replaceAll('_', ' ')}</span>;
}

export function Notice({ kind = 'info', children }: { kind?: 'info' | 'success' | 'error'; children: ReactNode }) {
  return <div className={`notice notice-${kind}`} role={kind === 'error' ? 'alert' : 'status'}>{children}</div>;
}

export function LoadingBlock({ rows = 4 }: { rows?: number }) {
  return (
    <div className="loading-stack" aria-label="Loading content">
      {Array.from({ length: rows }).map((_, index) => <div className="skeleton skeleton-row" key={index} />)}
    </div>
  );
}

export function EmptyState({ title, detail, action }: { title: string; detail: string; action?: ReactNode }) {
  return (
    <div className="empty-state">
      <span className="empty-mark"><Activity size={20} /></span>
      <h3>{title}</h3>
      <p>{detail}</p>
      {action}
    </div>
  );
}

const memberLinks = [
  { href: '/dashboard', label: 'Overview', icon: LayoutDashboard },
  { href: '/balance', label: 'Balance', icon: Wallet },
  { href: '/profile', label: 'My profile', icon: Users },
  { href: '/deposits', label: 'Deposits', icon: ArrowDownLeft },
  { href: '/withdrawals', label: 'Withdrawals', icon: ArrowUpRight },
  { href: '/packages', label: 'Packages', icon: Package },
  { href: '/purchases', label: 'Purchases', icon: CreditCard },
  { href: '/referrals', label: 'Referrals', icon: HandCoins },
  { href: '/transactions', label: 'Transaction history', icon: History },
];

const adminLinks = [
  { href: '/admin', label: 'Operations', icon: Gauge },
  { href: '/admin/members', label: 'Members', icon: Users },
  { href: '/admin/deposits', label: 'Deposits', icon: ArrowDownLeft },
  { href: '/admin/withdrawals', label: 'Withdrawals', icon: ArrowUpRight },
  { href: '/admin/purchases', label: 'Purchases', icon: CreditCard },
  { href: '/admin/packages', label: 'Packages', icon: Boxes },
  { href: '/admin/settings', label: 'Settings', icon: Settings },
  { href: '/admin/audit-log', label: 'Audit log', icon: FileClock },
];

export function AppShell({ children, admin = false }: { children: ReactNode; admin?: boolean }) {
  const [location] = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const { signOut } = useClerk();
  const links = admin ? adminLinks : memberLinks;
  const displayName = admin ? 'Operations' : 'Member space';
  const homeLink = admin ? '/admin' : '/dashboard';
  const closeMenu = () => setMobileOpen(false);

  return (
    <div className="app-shell">
      {mobileOpen && <button className="mobile-scrim" aria-label="Close navigation" onClick={closeMenu} />}
      <aside className={cn('sidebar', mobileOpen && 'sidebar-open')}>
        <Link href={homeLink} className="brand-lockup" onClick={closeMenu}>
          <span className="brand-monogram">K</span>
          <span><b>AFFILIATE</b><small>MARKETING · BD</small></span>
        </Link>
        <div className="workspace-label">{admin ? 'AUTHORIZED ADMIN' : 'YOUR ACCOUNT'}</div>
        <div className="account-chip">
          <div className="account-avatar">{admin ? 'OP' : 'AM'}</div>
          <span><b>{displayName}</b><small>{admin ? 'Careful by design' : 'Verified activity'}</small></span>
          <ChevronDown size={14} />
        </div>
        <nav className="side-navigation" aria-label={admin ? 'Admin navigation' : 'Member navigation'}>
          <div className="nav-group-title">{admin ? 'WORKSPACE' : 'ACCOUNT'}</div>
          {links.map(({ href, label, icon: Icon }) => {
            const active = location === href || (href !== '/admin' && href !== '/dashboard' && location.startsWith(`${href}/`));
            return (
              <Link
                href={href}
                className={cn('nav-link', active && 'nav-link-active')}
                key={href}
                onClick={closeMenu}
                data-testid={`link-${href.slice(1).replaceAll('/', '-')}`}
              >
                <Icon size={17} strokeWidth={1.8} />
                <span>{label}</span>
                {active && <i />}
              </Link>
            );
          })}
        </nav>
        <div className="sidebar-bottom">
          {admin && <div className="secure-note"><ShieldCheck size={17} /><span>Protected operations<br />Actions are audit logged</span></div>}
          {!admin && <div className="secure-note"><BadgeCheck size={17} /><span>Clear records.<br />No promised returns.</span></div>}
          <button className="nav-link logout-link" onClick={() => signOut({ redirectUrl: '/' })} data-testid="button-sign-out">
            <LogOut size={17} /><span>Sign out</span>
          </button>
        </div>
      </aside>
      <main className="app-main">
        <header className="mobile-header">
          <button className="mobile-menu-button" onClick={() => setMobileOpen(true)} aria-label="Open navigation"><Menu size={21} /></button>
          <Link href={homeLink} className="mobile-brand"><span className="brand-monogram">K</span> AFFILIATE</Link>
          <span className="mobile-status"><span /> Secure</span>
        </header>
        <div className="topbar">
          <div className="topbar-breadcrumb">{admin ? 'Operations workspace' : 'Member account'} <span>/</span> Bangladesh</div>
          <div className="topbar-right"><span className="live-indicator"><i /> Account services active</span><button className="help-button" title="Support" aria-label="Support"><LifeBuoy size={17} /></button></div>
        </div>
        <div className="page-content page-enter">{children}</div>
        <footer className="app-footer"><span>© AFFILIATE MARKETING</span><span>Bangladesh · BDT</span><span>Activity is subject to review</span></footer>
      </main>
    </div>
  );
}

export function Field({ label, children, hint }: { label: string; children: ReactNode; hint?: string }) {
  return <label className="field"><span>{label}</span>{children}{hint && <small>{hint}</small>}</label>;
}

export function DataTable({ children, headings }: { children: ReactNode; headings: string[] }) {
  return <div className="table-scroll"><table><thead><tr>{headings.map((heading) => <th key={heading}>{heading}</th>)}</tr></thead><tbody>{children}</tbody></table></div>;
}

export function PublicHeader() {
  const [open, setOpen] = useState(false);
  return (
    <header className="public-header">
      <Link href="/" className="brand-lockup">
        <span className="brand-monogram">K</span>
        <span><b>AFFILIATE</b><small>MARKETING · BD</small></span>
      </Link>
      <nav className={cn('public-nav', open && 'public-nav-open')}>
        <a href="#how-it-works" onClick={() => setOpen(false)}>How it works</a>
        <a href="#packages" onClick={() => setOpen(false)}>Packages</a>
        <a href="#faq" onClick={() => setOpen(false)}>Questions</a>
      </nav>
      <div className="public-actions">
        <Link href="/sign-in" className="public-signin">Sign in</Link>
        <Link href="/sign-up" className="public-join">Create account <ArrowUpRight size={15} /></Link>
      </div>
      <button className="public-menu" onClick={() => setOpen(!open)} aria-label="Toggle navigation">{open ? <X /> : <Menu />}</button>
    </header>
  );
}

export const iconLibrary = { Banknote, ClipboardList, CircleHelp, Wallet };
