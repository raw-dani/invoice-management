import { NavLink, Outlet, useNavigate, Link } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '../../contexts/AuthContext';
import { classNames } from '../../lib/utils';
import toast from '../../lib/toast';
import { searchApi } from '../../api/search';
import type { SearchResults } from '../../api/search';
import { notificationsApi } from '../../api/notifications';

const NAV_ITEMS = [
    { to: '/', label: 'Dashboard', icon: '📊' },
    { to: '/customers', label: 'Customers', icon: '👥' },
    { to: '/products', label: 'Products', icon: '📦' },
    { to: '/invoices', label: 'Invoices', icon: '📄' },
    { to: '/quotes', label: 'Quotes', icon: '💬' },
    { to: '/payments', label: 'Payments', icon: '💰' },
    { to: '/subscriptions', label: 'Subscriptions', icon: '🔁' },
    { to: '/email-templates', label: 'Email', icon: '✉️' },
    { to: '/templates', label: 'PDF Templates', icon: '🖨️' },
    { to: '/activity-log', label: 'Activity Log', icon: '🕘' },
    { to: '/reports', label: 'Reports', icon: '📈' },
    { to: '/settings', label: 'Settings', icon: '⚙️' },
    { to: '/notifications', label: 'Notifications', icon: '🔔' },
    { to: '/users', label: 'Users', icon: '👤' },
];

export default function AppLayout() {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const [search, setSearch] = useState('');
    const [term, setTerm] = useState('');
    useEffect(() => { const timer = window.setTimeout(() => setTerm(search.trim()), 300); return () => window.clearTimeout(timer); }, [search]);
    const { data: results } = useQuery({ queryKey: ['global-search', term], queryFn: () => searchApi(term), enabled: term.length >= 2 });
    const { data: notifications } = useQuery({ queryKey: ['notifications'], queryFn: notificationsApi.list, refetchInterval: 60_000 });

    const handleLogout = async () => {
        await logout();
        toast.success('Logged out');
        navigate('/login');
    };

    return (
        <div className="min-h-screen bg-gray-50 flex">
            <aside className="w-60 bg-white border-r border-gray-200 flex flex-col">
                <div className="h-16 flex items-center px-5 border-b border-gray-200">
                    <span className="font-semibold text-gray-900">Invoice Management</span>
                </div>
                <nav className="flex-1 px-3 py-4 space-y-1">
                    {NAV_ITEMS.map((item) => (
                        <NavLink
                            key={item.to}
                            to={item.to}
                            end={item.to === '/'}
                            className={({ isActive }) => classNames(
                                'flex items-center gap-3 px-3 py-2 rounded-md text-sm',
                                isActive
                                    ? 'bg-indigo-50 text-indigo-700 font-medium'
                                    : 'text-gray-700 hover:bg-gray-100'
                            )}
                        >
                            <span>{item.icon}</span>
                            <span>{item.label}</span>
                            {item.to === '/notifications' && !!notifications?.unread_count && <span className="ml-auto rounded-full bg-red-500 px-1.5 py-0.5 text-[10px] text-white">{notifications.unread_count}</span>}
                        </NavLink>
                    ))}
                </nav>
                <div className="px-3 py-3 border-t border-gray-200">
                    <div className="px-3 py-2 text-sm">
                        <div className="font-medium text-gray-900 truncate">{user?.name}</div>
                        <div className="text-xs text-gray-500 truncate">{user?.company?.name}</div>
                    </div>
                    <button
                        onClick={handleLogout}
                        className="w-full text-left px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-md"
                    >
                        Logout
                    </button>
                </div>
            </aside>

            <main className="flex-1 overflow-auto">
                <div className="max-w-7xl mx-auto px-6 py-8">
                    <SearchBox value={search} term={term} results={results} onChange={setSearch} onClear={() => { setSearch(''); setTerm(''); }} />
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
