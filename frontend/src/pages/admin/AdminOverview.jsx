import { useEffect, useState } from 'react';
import { Users, Activity, Receipt, PiggyBank, Target, UserCheck } from 'lucide-react';
import AppShell from '../../components/layout/AppShell';
import Card from '../../components/ui/Card';
import SummaryCard from '../../components/ui/SummaryCard';
import { PageLoader, EmptyState } from '../../components/ui/Feedback';
import { adminService } from '../../services/services';
import { formatKSh, formatDate } from '../../utils/format';

export default function AdminOverview() {
    const [stats, setStats] = useState(null);
    const [activity, setActivity] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        Promise.all([adminService.getStats(), adminService.getActivity()])
            .then(([statsRes, activityRes]) => {
                setStats(statsRes.data);
                setActivity(activityRes.data);
            })
            .finally(() => setLoading(false));
    }, []);

    if (loading) return <AppShell><PageLoader /></AppShell>;

    return (
        <AppShell>
            <h1 className="font-display text-2xl font-bold text-(--color-ink) mb-1">System overview</h1>
            <p className="text-(--color-ink-soft) mb-6">A snapshot of Save-It's usage across all students.</p>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                <SummaryCard icon={Users} label="Total users" value={stats.totalUsers} tone="teal" />
                <SummaryCard icon={UserCheck} label="Active accounts" value={stats.activeAccounts} tone="sage" sub={`${stats.recentlyActiveUsers} active in last 30d`} />
                <SummaryCard icon={Receipt} label="Total transactions" value={stats.totalTransactions} tone="gold" sub={`${stats.totalIncomeRecords} income · ${stats.totalExpenseRecords} expense`} />
                <SummaryCard icon={Target} label="Savings goals" value={stats.totalSavingsGoals} tone="coral" sub={`${stats.totalBudgets} budgets active`} />
            </div>

            <div className="grid lg:grid-cols-2 gap-5">
                <Card>
                    <h2 className="font-display font-semibold text-(--color-ink) mb-4">Recent signups</h2>
                    {activity.recentSignups.length === 0 ? (
                        <EmptyState icon={Users} title="No signups yet" />
                    ) : (
                        <ul className="divide-y divide-(--color-line)">
                            {activity.recentSignups.map((u) => (
                                <li key={u.id} className="py-3 flex items-center justify-between">
                                    <div>
                                        <p className="text-sm font-medium text-(--color-ink)">{u.name}</p>
                                        <p className="text-xs text-(--color-ink-soft)">{u.email}</p>
                                    </div>
                                    <span className="text-xs text-(--color-ink-soft)">{formatDate(u.created_at)}</span>
                                </li>
                            ))}
                        </ul>
                    )}
                </Card>

                <Card>
                    <h2 className="font-display font-semibold text-(--color-ink) mb-4">Recent activity</h2>
                    {activity.recentTransactions.length === 0 ? (
                        <EmptyState icon={Activity} title="No activity yet" />
                    ) : (
                        <ul className="divide-y divide-(--color-line)">
                            {activity.recentTransactions.map((tx) => (
                                <li key={`${tx.type}-${tx.id}`} className="py-3 flex items-center justify-between">
                                    <div>
                                        <p className="text-sm font-medium text-(--color-ink) capitalize">{tx.type} · {tx.user_name}</p>
                                        <p className="text-xs text-(--color-ink-soft)">{formatDate(tx.date)}</p>
                                    </div>
                                    <span className={`text-sm font-mono-num font-semibold ${tx.type === 'income' ? 'text-(--color-teal-deep)' : 'text-(--color-coral)'}`}>
                                        {formatKSh(tx.amount)}
                                    </span>
                                </li>
                            ))}
                        </ul>
                    )}
                </Card>
            </div>
        </AppShell>
    );
}
