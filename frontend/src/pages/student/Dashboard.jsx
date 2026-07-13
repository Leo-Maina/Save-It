import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Wallet, TrendingDown, Scale, Target, ArrowUpRight, ArrowDownRight, ReceiptText } from 'lucide-react';
import AppShell from '../../components/layout/AppShell';
import SummaryCard from '../../components/ui/SummaryCard';
import Card from '../../components/ui/Card';
import ProgressRing from '../../components/ui/ProgressRing';
import SpendingPieChart from '../../components/charts/SpendingPieChart';
import { PageLoader, EmptyState } from '../../components/ui/Feedback';
import Badge from '../../components/ui/Badge';
import { dashboardService } from '../../services/services';
import { formatKSh, formatDateShort, daysUntil } from '../../utils/format';
import { useAuth } from '../../context/AuthContext';

export default function Dashboard() {
    const { user } = useAuth();
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        dashboardService.getDashboard()
            .then((res) => setData(res.data))
            .catch(() => setError('Could not load your dashboard. Please try refreshing.'))
            .finally(() => setLoading(false));
    }, []);

    if (loading) return <AppShell><PageLoader message="Loading your dashboard…" /></AppShell>;

    if (error) {
        return (
            <AppShell>
                <Card><EmptyState title="Something went wrong" description={error} /></Card>
            </AppShell>
        );
    }

    const { summary, spendingByCategory, budgetOverview, savingsOverview, recentTransactions } = data;
    const firstName = user?.name?.split(' ')[0];

    return (
        <AppShell>
            <div className="mb-7">
                <h1 className="font-display text-2xl font-bold text-(--color-ink)">Hi {firstName},</h1>
                <p className="text-(--color-ink-soft) mt-1">Here's where your money stands right now.</p>
            </div>

            {/* Summary cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                <SummaryCard icon={ArrowUpRight} label="Total income" value={formatKSh(summary.totalIncome)} tone="sage" />
                <SummaryCard icon={ArrowDownRight} label="Total expenses" value={formatKSh(summary.totalExpenses)} tone="coral" />
                <SummaryCard
                    icon={Scale}
                    label="Current balance"
                    value={formatKSh(summary.balance)}
                    tone={summary.balance >= 0 ? 'teal' : 'coral'}
                />
                <SummaryCard icon={Target} label="Savings progress" value={`${summary.savingsProgress}%`} tone="gold" />
            </div>

            <div className="grid lg:grid-cols-3 gap-5">
                {/* Pie chart */}
                <Card className="lg:col-span-2">
                    <div className="flex items-center justify-between mb-1">
                        <h2 className="font-display font-semibold text-(--color-ink)">Spending by category</h2>
                        <Link to="/reports" className="text-xs font-medium text-(--color-teal) hover:underline">Full report</Link>
                    </div>
                    <p className="text-sm text-(--color-ink-soft) mb-2">All-time distribution across categories</p>
                    <SpendingPieChart data={spendingByCategory} />
                </Card>

                {/* Budget overview */}
                <Card>
                    <h2 className="font-display font-semibold text-(--color-ink) mb-4">Budget overview</h2>
                    {budgetOverview ? (
                        <div className="flex flex-col items-center text-center">
                            <ProgressRing
                                percent={budgetOverview.percentUsed}
                                overBudget={budgetOverview.percentUsed >= 100}
                                size={110}
                                strokeWidth={10}
                            />
                            <p className="font-medium text-(--color-ink) mt-4">{budgetOverview.name}</p>
                            <div className="w-full mt-4 space-y-2 text-left">
                                <Row label="Budget" value={formatKSh(budgetOverview.amount)} />
                                <Row label="Spent" value={formatKSh(budgetOverview.spent)} />
                                <Row
                                    label="Remaining"
                                    value={formatKSh(budgetOverview.remaining)}
                                    valueClass={budgetOverview.remaining < 0 ? 'text-(--color-coral)' : 'text-(--color-teal-deep)'}
                                />
                            </div>
                            <Link to="/budgets" className="text-xs font-medium text-(--color-teal) hover:underline mt-4">
                                Manage budgets →
                            </Link>
                        </div>
                    ) : (
                        <EmptyState
                            icon={ReceiptText}
                            title="No active budget"
                            description="Create a budget for this period to track your spending against it."
                            action={
                                <Link to="/budgets">
                                    <span className="text-xs font-medium text-(--color-teal) hover:underline">Create a budget →</span>
                                </Link>
                            }
                        />
                    )}
                </Card>
            </div>

            <div className="grid lg:grid-cols-3 gap-5 mt-5">
                {/* Savings overview */}
                <Card>
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="font-display font-semibold text-(--color-ink)">Savings goals</h2>
                        <Link to="/savings" className="text-xs font-medium text-(--color-teal) hover:underline">View all</Link>
                    </div>
                    {savingsOverview.length === 0 ? (
                        <EmptyState
                            icon={Target}
                            title="No active goals"
                            description="Start a savings goal — even small, regular contributions add up."
                        />
                    ) : (
                        <div className="space-y-4">
                            {savingsOverview.map((goal) => {
                                const left = daysUntil(goal.deadline);
                                return (
                                    <div key={goal.id} className="flex items-center gap-3">
                                        <ProgressRing percent={goal.percentComplete} size={48} strokeWidth={5} color="var(--color-gold)" label="" />
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-medium text-(--color-ink) truncate">{goal.name}</p>
                                            <p className="text-xs text-(--color-ink-soft)">
                                                {formatKSh(goal.current)} of {formatKSh(goal.target)}
                                                {left != null && left >= 0 && <span> · {left}d left</span>}
                                            </p>
                                        </div>
                                        <span className="text-sm font-mono-num font-semibold text-(--color-ink-soft) shrink-0">
                                            {goal.percentComplete}%
                                        </span>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </Card>

                {/* Recent transactions */}
                <Card className="lg:col-span-2">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="font-display font-semibold text-(--color-ink)">Recent transactions</h2>
                    </div>
                    {recentTransactions.length === 0 ? (
                        <EmptyState icon={Wallet} title="No transactions yet" description="Income and expenses you record will show up here." />
                    ) : (
                        <ul className="divide-y divide-(--color-line)">
                            {recentTransactions.map((tx) => (
                                <li
                                    key={`${tx.type}-${tx.id}`}
                                    className="py-3 flex items-center gap-3 rounded-lg transition-colors duration-200 hover:bg-(--color-sand)"
                        >
                                    <div
                                        className={`h-8 w-8 rounded-full flex items-center justify-center shrink-0 ${
                                            tx.type === 'income' ? 'bg-(--color-sage-soft) text-(--color-teal-deep)' : 'bg-(--color-coral-soft) text-(--color-coral)'
                                        }`}
                                    >
                                        {tx.type === 'income' ? <ArrowUpRight size={15} /> : <ArrowDownRight size={15} />}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm text-(--color-ink) truncate">{tx.description || tx.category}</p>
                                        <p className="text-xs text-(--color-ink-soft)">{tx.category} · {formatDateShort(tx.date)}</p>
                                    </div>
                                    <span className={`text-sm font-mono-num font-semibold shrink-0 ${tx.type === 'income' ? 'text-(--color-teal-deep)' : 'text-(--color-coral)'}`}>
                                        {tx.type === 'income' ? '+' : '−'}{formatKSh(tx.amount)}
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

function Row({ label, value, valueClass = 'text-(--color-ink)' }) {
    return (
        <div className="flex items-center justify-between text-sm">
            <span className="text-(--color-ink-soft)">{label}</span>
            <span className={`font-mono-num font-medium ${valueClass}`}>{value}</span>
        </div>
    );
}
