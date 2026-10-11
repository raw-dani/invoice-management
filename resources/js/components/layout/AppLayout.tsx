import { NavLink, Outlet, useNavigate, Link, useLocation } from 'react-router-dom';
import { useEffect, useState, type ReactNode } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '../../contexts/AuthContext';
import { classNames } from '../../lib/utils';
import toast from '../../lib/toast';
import { searchApi } from '../../api/search';
import type { SearchResults } from '../../api/search';
import { settingsApi } from '../../api/settings';
import { notificationsApi } from '../../api/notifications';
import { UserCircleIcon, ArrowRightOnRectangleIcon, Bars3Icon, XMarkIcon } from '../ui/Icons';

const Icon = ({ className, children }: { className?: string; children: ReactNode }) => (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" aria-hidden="true">
        {children}
    </svg>
);

const DashboardIcon = ({ className }: { className?: string }) => (
    <Icon className={className}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12l8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" />
    </Icon>
);

const CustomersIcon = ({ className }: { className?: string }) => (
    <Icon className={className}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 21h19.5m-18-18v18m10.5-18v18m6-13.5V21M6.75 6.75h.75m-.75 3h.75m-.75 3h.75m3-6h.75m-.75 3h.75m-.75 3h.75M6.75 21v-3.375c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21M3 3h12m-.75 4.5H21m-3.75 3.75h.008v.008h-.008v-.008zm0 3h.008v.008h-.008v-.008zm0 3h.008v.008h-.008v-.008z" />
    </Icon>
);

const ProductsIcon = ({ className }: { className?: string }) => (
    <Icon className={className}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M21 7.5l-9-5.25L3 7.5m18 0l-9 5.25m9-5.25v9l-9 5.25M3 7.5l9 5.25M3 7.5v9l9 5.25m0-9v9" />
    </Icon>
);

const InvoicesIcon = ({ className }: { className?: string }) => (
    <Icon className={className}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
    </Icon>
);

const QuotesIcon = ({ className }: { className?: string }) => (
    <Icon className={className}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
    </Icon>
);

const PaymentsIcon = ({ className }: { className?: string }) => (
    <Icon className={className}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 8.25h19.5M2.25 9h19.5m-16.5 5.25h6m-6 2.25h3m-3.75 3h15a2.25 2.25 0 002.25-2.25V6.75A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25v10.5A2.25 2.25 0 004.5 19.5z" />
    </Icon>
);

const SubscriptionsIcon = ({ className }: { className?: string }) => (
    <Icon className={className}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
    </Icon>
);

const EmailIcon = ({ className }: { className?: string }) => (
    <Icon className={className}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
    </Icon>
);

const TemplatesIcon = ({ className }: { className?: string }) => (
    <Icon className={className}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
    </Icon>
);

const ActivityIcon = ({ className }: { className?: string }) => (
    <Icon className={className}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
    </Icon>
);

const ReportsIcon = ({ className }: { className?: string }) => (
    <Icon className={className}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
    </Icon>
);

const SettingsIcon = ({ className }: { className?: string }) => (
    <Icon className={className}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.324.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.24-.438.613-.431.992a6.759 6.759 0 010 .255c-.007.378.138.75.43.99l1.005.828c.424.35.534.954.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.57 6.57 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.28c-.09.543-.56.941-1.11.941h-2.594c-.55 0-1.02-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.992a6.932 6.932 0 010-.255c.007-.378-.138-.75-.43-.99l-1.004-.828a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.087.22-.128.332-.183.582-.495.644-.869l.214-1.281z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    </Icon>
);

const NotificationsIcon = ({ className }: { className?: string }) => (
    <Icon className={className}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" />
    </Icon>
);

const UsersIcon = ({ className }: { className?: string }) => (
    <Icon className={className}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
    </Icon>
);

const NAV_ITEMS = [
    { to: '/', label: 'Dashboard', icon: DashboardIcon },
    { to: '/customers', label: 'Customers', icon: CustomersIcon },
    { to: '/products', label: 'Products', icon: ProductsIcon },
    { to: '/invoices', label: 'Invoices', icon: InvoicesIcon },
    { to: '/quotes', label: 'Quotes', icon: QuotesIcon },
    { to: '/payments', label: 'Payments', icon: PaymentsIcon },
    { to: '/subscriptions', label: 'Subscriptions', icon: SubscriptionsIcon },
    { to: '/email-templates', label: 'Email', icon: EmailIcon },
    { to: '/templates', label: 'PDF Templates', icon: TemplatesIcon },
    { to: '/activity-log', label: 'Activity Log', icon: ActivityIcon },
    { to: '/reports', label: 'Reports', icon: ReportsIcon },
    { to: '/settings', label: 'Settings', icon: SettingsIcon },
    { to: '/notifications', label: 'Notifications', icon: NotificationsIcon },
    { to: '/users', label: 'Users', icon: UsersIcon },
    { to: '/profile', label: 'My Profile', icon: UserCircleIcon },
];

function AppLogo({ logoUrl, name, className = 'w-8 h-8' }: { logoUrl: string | null; name: string; className?: string }) {
    if (logoUrl) {
        return (
            <div className={`${className} rounded-lg bg-white border border-gray-200/90 flex items-center justify-center p-0.5 shadow-2xs overflow-hidden shrink-0`}>
                <img
                    src={logoUrl}
                    alt={name}
                    className="max-h-full max-w-full object-contain"
                />
            </div>
        );
    }
    return (
        <div className={`${className} rounded-lg bg-indigo-600 flex items-center justify-center text-white font-bold text-sm shadow-xs shrink-0`}>
            {name ? name.slice(0, 2).toUpperCase() : 'IN'}
        </div>
    );
}

export default function AppLayout() {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [search, setSearch] = useState('');
    const [term, setTerm] = useState('');

    // Fetch company settings to get the configured logo and company name in real-time
    const { data: companySettings } = useQuery({
        queryKey: ['settings_group', 'company'],
        queryFn: () => settingsApi.get('company'),
        staleTime: 60_000,
    });

    const rawLogo = companySettings?.logo || user?.company?.logo;
    const logoUrl = (() => {
        if (!rawLogo) return null;
        if (rawLogo.startsWith('http') || rawLogo.startsWith('data:')) return rawLogo;
        if (rawLogo.startsWith('/storage/')) return rawLogo;
        return '/storage/' + rawLogo;
    })();
    const companyName = companySettings?.name || user?.company?.name || 'Invoice Management';

    // Close mobile drawer on route navigation
    useEffect(() => {
        setMobileMenuOpen(false);
    }, [location.pathname]);

    useEffect(() => {
        const timer = window.setTimeout(() => setTerm(search.trim()), 300);
        return () => window.clearTimeout(timer);
    }, [search]);

    const { data: results } = useQuery({
        queryKey: ['global-search', term],
        queryFn: () => searchApi(term),
        enabled: term.length >= 2,
    });

    const { data: notifications } = useQuery({
        queryKey: ['notifications'],
        queryFn: notificationsApi.list,
        refetchInterval: 60_000,
    });

    const handleLogout = async () => {
        setMobileMenuOpen(false);
        await logout();
        toast.success('Logged out');
        navigate('/login');
    };

    const renderNavLinks = (onItemClick?: () => void) => (
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
            {NAV_ITEMS.map((item) => (
                <NavLink
                    key={item.to}
                    to={item.to}
                    end={item.to === '/'}
                    onClick={onItemClick}
                    className={({ isActive }) => classNames(
                        'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition',
                        isActive
                            ? 'bg-indigo-50 text-indigo-700 shadow-xs'
                            : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
                    )}
                >
                    <item.icon className="h-5 w-5 shrink-0" />
                    <span className="truncate">{item.label}</span>
                    {item.to === '/notifications' && !!notifications?.unread_count && (
                        <span className="ml-auto rounded-full bg-red-500 px-1.5 py-0.5 text-[10px] font-bold text-white shadow-xs">
                            {notifications.unread_count}
                        </span>
                    )}
                </NavLink>
            ))}
        </nav>
    );

    const renderUserFooter = (onItemClick?: () => void) => (
        <div className="px-3 py-3 border-t border-gray-200 bg-gray-50/50">
            <NavLink
                to="/profile"
                onClick={onItemClick}
                className={({ isActive }) => classNames(
                    'flex items-center gap-2.5 p-2 rounded-lg text-sm transition group mb-1.5',
                    isActive
                        ? 'bg-indigo-50 border border-indigo-200 text-indigo-900 font-medium shadow-xs'
                        : 'text-gray-700 hover:bg-gray-100'
                )}
                title="Buka profil akun & ganti password"
            >
                <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-indigo-600 to-indigo-500 text-white flex items-center justify-center font-bold text-xs flex-shrink-0 shadow-xs">
                    {user?.name?.charAt(0).toUpperCase() || 'U'}
                </div>
                <div className="min-w-0 flex-1">
                    <div className="font-semibold text-xs truncate leading-tight text-gray-900 group-hover:text-indigo-600">
                        {user?.name}
                    </div>
                    <div className="text-[11px] text-gray-500 truncate flex items-center gap-1">
                        <span className="capitalize font-medium text-indigo-600">{user?.role}</span>
                        <span>•</span>
                        <span>Profil</span>
                    </div>
                </div>
            </NavLink>
            <button
                onClick={handleLogout}
                className="w-full flex items-center gap-2 px-2.5 py-1.5 text-xs text-red-600 hover:bg-red-50 hover:text-red-700 rounded-md transition font-medium"
            >
                <ArrowRightOnRectangleIcon className="w-4 h-4 text-red-500" />
                <span>Logout</span>
            </button>
        </div>
    );

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col lg:flex-row">
            {/* Mobile Sticky Header Bar */}
            <header className="lg:hidden sticky top-0 z-30 bg-white border-b border-gray-200 px-4 h-16 flex items-center justify-between shadow-xs">
                <div className="flex items-center gap-3 min-w-0">
                    <button
                        type="button"
                        onClick={() => setMobileMenuOpen(true)}
                        className="p-2 -ml-2 rounded-lg text-gray-600 hover:text-gray-900 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 shrink-0"
                        aria-label="Buka menu navigasi"
                    >
                        <Bars3Icon className="w-6 h-6" />
                    </button>
                    <Link to="/" className="flex items-center gap-2.5 min-w-0">
                        <AppLogo logoUrl={logoUrl} name={companyName} className="w-8 h-8" />
                        <span className="font-bold text-gray-900 text-base tracking-tight truncate max-w-[170px] sm:max-w-xs">
                            {companyName}
                        </span>
                    </Link>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                    <Link
                        to="/notifications"
                        className="relative p-2 rounded-lg text-gray-500 hover:text-gray-900 hover:bg-gray-100 transition"
                        title="Notifikasi"
                    >
                        <NotificationsIcon className="w-5 h-5" />
                        {!!notifications?.unread_count && (
                            <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-red-500 ring-2 ring-white" />
                        )}
                    </Link>
                    <Link
                        to="/profile"
                        className="w-8 h-8 rounded-full bg-gradient-to-tr from-indigo-600 to-indigo-500 text-white flex items-center justify-center font-bold text-xs shadow-xs ml-1"
                        title="Profil Saya"
                    >
                        {user?.name?.charAt(0).toUpperCase() || 'U'}
                    </Link>
                </div>
            </header>

            {/* Mobile Slide-over Drawer & Overlay */}
            {mobileMenuOpen && (
                <div className="fixed inset-0 z-40 lg:hidden" role="dialog" aria-modal="true">
                    {/* Backdrop */}
                    <div
                        className="fixed inset-0 bg-gray-900/60 backdrop-blur-xs transition-opacity duration-300"
                        onClick={() => setMobileMenuOpen(false)}
                        aria-hidden="true"
                    />

                    {/* Drawer Panel */}
                    <aside className="fixed inset-y-0 left-0 z-50 w-72 max-w-[85vw] bg-white flex flex-col shadow-2xl">
                        <div className="h-16 flex items-center justify-between px-5 border-b border-gray-200">
                            <div className="flex items-center gap-2.5 min-w-0">
                                <AppLogo logoUrl={logoUrl} name={companyName} className="w-8 h-8" />
                                <span className="font-bold text-gray-900 text-base truncate">
                                    {companyName}
                                </span>
                            </div>
                            <button
                                type="button"
                                onClick={() => setMobileMenuOpen(false)}
                                className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition shrink-0"
                                aria-label="Tutup menu"
                            >
                                <XMarkIcon className="w-5 h-5" />
                            </button>
                        </div>

                        {renderNavLinks(() => setMobileMenuOpen(false))}
                        {renderUserFooter(() => setMobileMenuOpen(false))}
                    </aside>
                </div>
            )}

            {/* Desktop Persistent Sidebar */}
            <aside className="hidden lg:flex lg:w-60 lg:flex-col lg:h-screen lg:sticky lg:top-0 bg-white border-r border-gray-200 shrink-0">
                <div className="h-16 flex items-center px-5 border-b border-gray-200">
                    <Link to="/" className="flex items-center gap-2.5 min-w-0">
                        <AppLogo logoUrl={logoUrl} name={companyName} className="w-8 h-8" />
                        <span className="font-semibold text-gray-900 text-sm truncate" title={companyName}>
                            {companyName}
                        </span>
                    </Link>
                </div>
                {renderNavLinks()}
                {renderUserFooter()}
            </aside>

            {/* Main Content Viewport */}
            <main className="flex-1 min-w-0 overflow-auto">
                <div className="max-w-7xl mx-auto px-4 py-5 sm:px-6 sm:py-8">
                    <SearchBox
                        value={search}
                        term={term}
                        results={results}
                        onChange={setSearch}
                        onClear={() => {
                            setSearch('');
                            setTerm('');
                        }}
                    />
                    <Outlet />
                </div>
            </main>
        </div>
    );
}

function SearchBox({ value, term, results, onChange, onClear }: { value: string; term: string; results?: SearchResults; onChange: (value: string) => void; onClear: () => void }) {
    const items = results ? [
        ...results.invoices.map((item) => ({ label: item.invoice_number, path: `/invoices/${item.id}` })),
        ...results.quotes.map((item) => ({ label: item.quote_number, path: `/quotes/${item.id}` })),
        ...results.customers.map((item) => ({ label: item.company_name, path: `/customers/${item.id}` })),
        ...results.subscriptions.map((item) => ({ label: item.subscription_number, path: `/subscriptions/${item.id}` })),
    ].slice(0, 8) : [];

    return <div className="relative mb-6 max-w-xl">
        <input value={value} onChange={(event) => onChange(event.target.value)} placeholder="Search invoices, customers, products..." className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500" />
        {term.length >= 2 && results && <div className="absolute z-20 mt-1 w-full rounded-md border bg-white shadow-lg">
            {items.map((item) => <Link key={item.path} to={item.path} onClick={onClear} className="block px-3 py-2 text-sm hover:bg-gray-50">{item.label}</Link>)}
            {!items.length && <div className="px-3 py-2 text-sm text-gray-500">No results</div>}
        </div>}
    </div>;
}
