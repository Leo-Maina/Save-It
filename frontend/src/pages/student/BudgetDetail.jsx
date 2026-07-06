import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, AlertTriangle } from 'lucide-react';
import AppShell from '../../components/layout/AppShell';
import Card from '../../components/ui/Card';
import { PageLoader } from '../../components/ui/Feedback';
import ProgressRing from '../../components/ui/ProgressRing';
import { budgetService } from '../../services/services';
import { formatKSh, formatDate, colorForCategory } from '../../utils/format';

export default function BudgetDetail() {
    const { id } = useParams();
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        budgetService.getDetail(id)
            .then((res) => setData(res.data))
            .finally(() => setLoading(false));
    }, [id]);

    if (loading) return <AppShell><PageLoader /></AppShell>;
    if (!data) return <AppShell><Card>Budget not found.</Card></AppShell>;

    const { budget, allocations } = data;

    return (
        <AppShell>
            <Link to="/budgets" className="inline-flex items-center gap-1.5 text-sm text-(--color-ink-soft) hover:text-(--color-ink) mb-4">
                <ArrowLeft size={15} /> Back to budgets
            </Link>

            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
                <div>
                    <h1 className="font-display text-2xl font-bold text-(--color-ink)">{budget.name}</h1>
                    <p className="text-(--color-ink-soft) mt-1">{formatDate(budget.start_date)} – {formatDate(budget.end_date)}</p>
                </div>
                <div className="flex items-center gap-4">
                    <ProgressRing percent={budget.percentUsed} overBudget={budget.percentUsed >= 100} size={72} strokeWidth={8} />
                    <div className="text-sm">
                        <p className="text-(--color-ink-soft)">Spent <span className="font-mono-num font-semibold text-(--color-ink)">{formatKSh(budget.totalSpent)}</span></p>
                        <p className="text-(--color-ink-soft)">of <span className="font-mono-num font-semibold text-(--color-ink)">{formatKSh(budget.amount)}</span></p>
                    </div>
                </div>
            </div>

            {budget.percentUsed >= 100 && (
                <div className="flex items-center gap-2.5 rounded-xl bg-(--color-coral-soft) text-(--color-coral) px-4 py-3 mb-6 text-sm">
                    <AlertTriangle size={16} className="shrink-0" />
                    You've exceeded this budget by {formatKSh(budget.totalSpent - budget.amount)}.
                </div>
            )}

            <h2 className="font-display font-semibold text-(--color-ink) mb-3">Category breakdown</h2>
            <div className="space-y-3">
                {allocations.length === 0 ? (
                    <Card><p className="text-sm text-(--color-ink-soft)">No category allocations were set for this budget.</p></Card>
                ) : (
                    allocations.map((a) => (
                        <Card key={a.id} className="flex items-center gap-4">
                            <div
                                className="h-10 w-10 rounded-full flex items-center justify-center shrink-0 font-display font-semibold text-sm"
                                style={{ backgroundColor: `${colorForCategory(a.category_name)}22`, color: colorForCategory(a.category_name) }}
                            >
                                {a.category_name.charAt(0)}
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between mb-1.5">
                                    <span className="text-sm font-medium text-(--color-ink)">{a.category_name}</span>
                                    <span className={`text-xs font-mono-num ${a.percentUsed >= 100 ? 'text-(--color-coral)' : 'text-(--color-ink-soft)'}`}>
                                        {a.percentUsed}%
                                    </span>
                                </div>
                                <div className="h-2 rounded-full bg-(--color-sand-deep) overflow-hidden">
                                    <div
                                        className="h-full rounded-full transition-all duration-700"
                                        style={{
                                            width: `${Math.min(100, a.percentUsed)}%`,
                                            backgroundColor: a.percentUsed >= 100 ? 'var(--color-coral)' : colorForCategory(a.category_name)
                                        }}
                                    />
                                </div>
                                <div className="flex items-center justify-between mt-1.5 text-xs text-(--color-ink-soft)">
                                    <span>{formatKSh(a.spent)} spent</span>
                                    <span>{formatKSh(a.allocated_amount)} allocated</span>
                                </div>
                            </div>
                        </Card>
                    ))
                )}
            </div>
        </AppShell>
    );
}
