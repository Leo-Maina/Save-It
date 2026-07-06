import { useEffect, useState, useCallback } from 'react';
import { X, Bell, BellOff, Check, AlertTriangle, PiggyBank, TrendingUp, Repeat as RepeatIcon } from 'lucide-react';
import { alertService } from '../../services/services';
import { Spinner } from '../ui/Feedback';

const ICONS = {
    budget: AlertTriangle,
    savings: PiggyBank,
    expense: TrendingUp,
    recurring: RepeatIcon,
    system: Bell
};

function timeAgo(dateString) {
    const seconds = Math.floor((new Date() - new Date(dateString)) / 1000);
    if (seconds < 60) return 'just now';
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
}

export default function AlertsPanel({ open, onClose, onAlertsChanged }) {
    const [alerts, setAlerts] = useState([]);
    const [loading, setLoading] = useState(true);

    const load = useCallback(async () => {
        setLoading(true);
        try {
            const res = await alertService.getAll();
            setAlerts(res.data.alerts.filter((a) => a.status !== 'dismissed'));
        } catch {
            setAlerts([]);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        if (open) load();
    }, [open, load]);

    const handleMarkRead = async (id) => {
        await alertService.markRead(id);
        setAlerts((prev) => prev.map((a) => (a.id === id ? { ...a, status: 'read' } : a)));
        onAlertsChanged?.();
    };

    const handleDismiss = async (id) => {
        await alertService.dismiss(id);
        setAlerts((prev) => prev.filter((a) => a.id !== id));
        onAlertsChanged?.();
    };

    if (!open) return null;

    return (
        <div className="fixed inset-0 z-50 flex justify-end">
            <div className="absolute inset-0 bg-(--color-ink)/30" onClick={onClose} />
            <div className="relative w-full max-w-sm h-full bg-(--color-paper) border-l border-(--color-line) flex flex-col">
                <div className="flex items-center justify-between px-5 h-16 border-b border-(--color-line) shrink-0">
                    <h2 className="font-display font-semibold text-(--color-ink)">Notifications</h2>
                    <button onClick={onClose} aria-label="Close" className="p-1.5 text-(--color-ink-soft) hover:text-(--color-ink)">
                        <X size={18} />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto">
                    {loading ? (
                        <div className="flex justify-center py-12"><Spinner /></div>
                    ) : alerts.length === 0 ? (
                        <div className="flex flex-col items-center justify-center text-center gap-2 py-16 px-6">
                            <BellOff size={28} className="text-(--color-ink-soft)" strokeWidth={1.5} />
                            <p className="text-sm text-(--color-ink-soft)">You're all caught up. No alerts right now.</p>
                        </div>
                    ) : (
                        <ul className="divide-y divide-(--color-line)">
                            {alerts.map((alert) => {
                                const Icon = ICONS[alert.type] || Bell;
                                return (
                                    <li key={alert.id} className={`px-5 py-4 ${alert.status === 'unread' ? 'bg-(--color-teal-soft)/40' : ''}`}>
                                        <div className="flex gap-3">
                                            <div className="h-8 w-8 rounded-full bg-(--color-sand-deep) flex items-center justify-center shrink-0 text-(--color-ink-soft)">
                                                <Icon size={15} />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm text-(--color-ink) leading-snug">{alert.message}</p>
                                                <div className="flex items-center justify-between mt-2">
                                                    <span className="text-xs text-(--color-ink-soft)">{timeAgo(alert.created_at)}</span>
                                                    <div className="flex items-center gap-3">
                                                        {alert.status === 'unread' && (
                                                            <button
                                                                onClick={() => handleMarkRead(alert.id)}
                                                                className="text-xs font-medium text-(--color-teal) hover:underline inline-flex items-center gap-1"
                                                            >
                                                                <Check size={12} /> Mark read
                                                            </button>
                                                        )}
                                                        <button
                                                            onClick={() => handleDismiss(alert.id)}
                                                            className="text-xs font-medium text-(--color-ink-soft) hover:text-(--color-coral)"
                                                        >
                                                            Dismiss
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </li>
                                );
                            })}
                        </ul>
                    )}
                </div>
            </div>
        </div>
    );
}
