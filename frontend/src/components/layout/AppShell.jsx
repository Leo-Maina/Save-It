import { useState, useEffect, useCallback } from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import {
    LayoutDashboard, Wallet, Receipt, PieChart, Target, FileBarChart,
    Settings, LogOut, Bell, Moon, Sun, Menu, X, Users, ShieldCheck, Repeat
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { alertService } from '../../services/services';
import AlertsPanel from './AlertsPanel';

const STUDENT_NAV = [
    { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/income', label: 'Income', icon: Wallet },
    { to: '/expenses', label: 'Expenses', icon: Receipt },
    { to: '/budgets', label: 'Budgets', icon: PieChart },
    { to: '/savings', label: 'Savings', icon: Target },
    { to: '/recurring', label: 'Recurring', icon: Repeat },
    { to: '/reports', label: 'Reports', icon: FileBarChart },
    { to: '/settings', label: 'Settings', icon: Settings },
];

const ADMIN_NAV = [
    { to: '/admin', label: 'Overview', icon: ShieldCheck },
    { to: '/admin/users', label: 'Users', icon: Users },
    { to: '/admin/categories', label: 'Categories', icon: PieChart },
];

export default function AppShell({ children }) {
    const { user, logout } = useAuth();
    const { theme, toggleTheme } = useTheme();
    const navigate = useNavigate();
    const location = useLocation();
    const [mobileNavOpen, setMobileNavOpen] = useState(false);
    const [alertsOpen, setAlertsOpen] = useState(false);
    const [unreadCount, setUnreadCount] = useState(0);

    const isAdmin = user?.role === 'admin';
    const navItems = isAdmin ? ADMIN_NAV : STUDENT_NAV;

    const fetchUnread = useCallback(async () => {
        try {
            const res = await alertService.getAll('unread');
            setUnreadCount(res.data.alerts.length);
        } catch {
            // silent — alerts are non-critical to page function
        }
    }, []);

    useEffect(() => {
        if (!isAdmin) {
            fetchUnread();
            const interval = setInterval(fetchUnread, 60000);
            return () => clearInterval(interval);
        }
    }, [fetchUnread, isAdmin]);

    useEffect(() => setMobileNavOpen(false), [location.pathname]);

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    return (
        <div className="min-h-screen bg-(--color-sand)">
            {/* ---- Mobile top bar ---- */}
            <div className="lg:hidden flex items-center justify-between px-4 h-16 border-b border-(--color-line) bg-(--color-paper) sticky top-0 z-30">
                <button onClick={() => setMobileNavOpen(true)} aria-label="Open menu" className="p-2 -ml-2">
                    <Menu size={22} />
                </button>
                <span className="font-display font-bold text-(--color-teal)">Save-It</span>
                <button onClick={() => setAlertsOpen(true)} aria-label="Notifications" className="relative p-2 -mr-2">
                    <Bell size={20} />
                    {unreadCount > 0 && (
                        <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-(--color-coral)" />
                    )}
                </button>
            </div>

            <div className="flex">
                {/* ---- Sidebar (desktop) ---- */}
                <aside className="hidden lg:flex lg:flex-col w-64 shrink-0 h-screen sticky top-0 border-r border-(--color-line) bg-(--color-paper) px-4 py-6">
                    <SidebarContent
                        navItems={navItems}
                        user={user}
                        isAdmin={isAdmin}
                        onLogout={handleLogout}
                    />
                </aside>

                {/* ---- Sidebar (mobile drawer) ---- */}
                {mobileNavOpen && (
                    <div className="lg:hidden fixed inset-0 z-40">
                        <div className="absolute inset-0 bg-(--color-ink)/40" onClick={() => setMobileNavOpen(false)} />
                        <aside className="absolute left-0 top-0 h-full w-72 bg-(--color-paper) px-4 py-6 flex flex-col">
                            <div className="flex justify-end mb-2">
                                <button onClick={() => setMobileNavOpen(false)} aria-label="Close menu" className="p-1.5">
                                    <X size={20} />
                                </button>
                            </div>
                            <SidebarContent
                                navItems={navItems}
                                user={user}
                                isAdmin={isAdmin}
                                onLogout={handleLogout}
                            />
                        </aside>
                    </div>
                )}

                {/* ---- Main content ---- */}
                <div className="flex-1 min-w-0">
                    {/* Desktop top bar */}
                    <div className="hidden lg:flex items-center justify-end gap-3 px-8 h-16 border-b border-(--color-line) bg-(--color-paper)/70 backdrop-blur sticky top-0 z-20">
                        <button
                            onClick={toggleTheme}
                            aria-label="Toggle dark mode"
                            className="p-2 rounded-full text-(--color-ink-soft) hover:bg-(--color-sand-deep) hover:text-(--color-ink) transition-colors"
                        >
                            {theme === 'light' ? <Moon size={18} /> : <Sun size={18} />}
                        </button>
                        {!isAdmin && (
                            <button
                                onClick={() => setAlertsOpen(true)}
                                aria-label="Notifications"
                                className="relative p-2 rounded-full text-(--color-ink-soft) hover:bg-(--color-sand-deep) hover:text-(--color-ink) transition-colors"
                            >
                                <Bell size={18} />
                                {unreadCount > 0 && (
                                    <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-(--color-coral)" />
                                )}
                            </button>
                        )}
                    </div>

                    <main className="px-4 sm:px-6 lg:px-8 py-6 lg:py-8 max-w-7xl mx-auto">
                        {children}
                    </main>
                </div>
            </div>

            <AlertsPanel
                open={alertsOpen}
                onClose={() => setAlertsOpen(false)}
                onAlertsChanged={fetchUnread}
            />
        </div>
    );
}

function SidebarContent({ navItems, user, isAdmin, onLogout }) {
    return (
        <>
            <div className="flex items-center gap-2 px-2 mb-8">
                <div className="h-8 w-8 rounded-lg bg-(--color-teal) flex items-center justify-center">
                    <span className="text-(--color-sand) font-display font-bold text-sm">S</span>
                </div>
                <span className="font-display font-bold text-lg text-(--color-ink)">Save-It</span>
            </div>

            <nav className="flex-1 flex flex-col gap-1">
                {navItems.map(({ to, label, icon: Icon }) => (
                    <NavLink
                        key={to}
                        to={to}
                        end={to === '/admin'}
                        className={({ isActive }) =>
                            `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 hover:translate-x-1 ${
                                isActive
                                    ? 'bg-(--color-teal-soft) text-(--color-teal-deep)'
                                    : 'text-(--color-ink-soft) hover:bg-(--color-sand-deep) hover:text-(--color-ink)'
                            }`
                        }
                    >
                        <Icon size={18} strokeWidth={2} />
                        {label}
                    </NavLink>
                ))}
            </nav>

            <div className="mt-6 pt-4 border-t border-(--color-line)">
                <div className="flex items-center gap-3 px-2 mb-3">
                    <div className="h-9 w-9 rounded-full bg-(--color-sage-soft) flex items-center justify-center font-display font-semibold text-(--color-teal-deep) text-sm shrink-0">
                        {user?.name?.charAt(0)?.toUpperCase() || '?'}
                    </div>
                    <div className="min-w-0">
                        <p className="text-sm font-medium text-(--color-ink) truncate">{user?.name}</p>
                        <p className="text-xs text-(--color-ink-soft) truncate">{isAdmin ? 'Administrator' : user?.university || 'Student'}</p>
                    </div>
                </div>
                <button
                    onClick={onLogout}
                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-(--color-ink-soft) hover:bg-(--color-coral-soft) hover:text-(--color-coral) transition-colors"
                >
                    <LogOut size={18} strokeWidth={2} />
                    Log out
                </button>
            </div>
        </>
    );
}
