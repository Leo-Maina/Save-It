import { useState, useEffect } from 'react';
import { BarChart3, TrendingUp } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import AppShell from '../../components/layout/AppShell';
import Card from '../../components/ui/Card';
import { Input } from '../../components/ui/FormControls';
import Button from '../../components/ui/Button';
import { PageLoader, EmptyState } from '../../components/ui/Feedback';
import SpendingPieChart from '../../components/charts/SpendingPieChart';
import ProgressRing from '../../components/ui/ProgressRing';
import { dashboardService } from '../../services/services';
import { formatKSh, colorForCategory } from '../../utils/format';

const TABS = [
    { id: 'monthly', label: 'Monthly' },
    { id: 'semester', label: 'Semester' },
    { id: 'savings', label: 'Savings performance' }
];

export default function Reports() {
    const [tab, setTab] = useState('monthly');

    return (
        <AppShell>
            <h1 className="font-display text-2xl font-bold text-(--color-ink) mb-1">Reports</h1>
            <p className="text-(--color-ink-soft) mb-6">All reports stay inside Save-It — nothing to export.</p>

            <div className="flex gap-1 bg-(--color-sand-deep) rounded-full p-1 w-fit mb-6">
                {TABS.map((t) => (
                    <button
                        key={t.id}
                        onClick={() => setTab(t.id)}
                        className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                            tab === t.id ? 'bg-(--color-paper) text-(--color-ink) shadow-sm' : 'text-(--color-ink-soft) hover:text-(--color-ink)'
                        }`}
                    >
                        {t.label}
                    </button>
                ))}
            </div>

            {tab === 'monthly' && <MonthlyReport />}
            {tab === 'semester' && <SemesterReport />}
            {tab === 'savings' && <SavingsPerformanceReport />}
        </AppShell>
    );
}

function MonthlyReport() {
    const [month, setMonth] = useState(new Date().toISOString().slice(0, 7));
    const [report, setReport] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        setLoading(true);
        dashboardService.getMonthlyReport(month)
            .then((res) => setReport(res.data))
            .finally(() => setLoading(false));
    }, [month]);

    return (
        <div>
            <div className="mb-5 max-w-[200px]">
                <Input label="Month" type="month" value={month} onChange={(e) => setMonth(e.target.value)} />
            </div>

            {loading ? <PageLoader /> : !report ? null : (
                <>
                    <div className="grid sm:grid-cols-3 gap-4 mb-6">
                        <Card>
                            <p className="text-xs text-(--color-ink-soft) mb-1">Income</p>
                            <p className="font-mono-num font-display text-xl font-bold text-(--color-teal-deep)">{formatKSh(report.totalIncome)}</p>
                        </Card>
                        <Card>
                            <p className="text-xs text-(--color-ink-soft) mb-1">Expenses</p>
                            <p className="font-mono-num font-display text-xl font-bold text-(--color-coral)">{formatKSh(report.totalExpenses)}</p>
                        </Card>
                        <Card>
                            <p className="text-xs text-(--color-ink-soft) mb-1">Net savings</p>
                            <p className={`font-mono-num font-display text-xl font-bold ${report.netSavings >= 0 ? 'text-(--color-ink)' : 'text-(--color-coral)'}`}>
                                {formatKSh(report.netSavings)}
                            </p>
                        </Card>
                    </div>
                    <Card>
                        <h2 className="font-display font-semibold text-(--color-ink) mb-3">Spending by category</h2>
                        <SpendingPieChart data={report.spendingByCategory} />
                    </Card>
                </>
            )}
        </div>
    );
}

function SemesterReport() {
    const today = new Date();
    const defaultStart = new Date(today.getFullYear(), 0, 1).toISOString().split('T')[0];
    const defaultEnd = new Date(today.getFullYear(), 3, 30).toISOString().split('T')[0];

    const [startDate, setStartDate] = useState(defaultStart);
    const [endDate, setEndDate] = useState(defaultEnd);
    const [report, setReport] = useState(null);
    const [loading, setLoading] = useState(false);

    const runReport = () => {
        setLoading(true);
        dashboardService.getSemesterReport(startDate, endDate)
            .then((res) => setReport(res.data))
            .finally(() => setLoading(false));
    };

    useEffect(() => { runReport(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, []);

    return (
        <div>
            <div className="flex flex-wrap items-end gap-3 mb-6">
                <Input label="Start date" type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
                <Input label="End date" type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
                <Button onClick={runReport} loading={loading}>Run report</Button>
            </div>

            {loading ? <PageLoader /> : !report ? null : (
                <>
                    <div className="grid sm:grid-cols-3 gap-4 mb-6">
                        <Card>
                            <p className="text-xs text-(--color-ink-soft) mb-1">Income</p>
                            <p className="font-mono-num font-display text-xl font-bold text-(--color-teal-deep)">{formatKSh(report.totalIncome)}</p>
                        </Card>
                        <Card>
                            <p className="text-xs text-(--color-ink-soft) mb-1">Expenses</p>
                            <p className="font-mono-num font-display text-xl font-bold text-(--color-coral)">{formatKSh(report.totalExpenses)}</p>
                        </Card>
                        <Card>
                            <p className="text-xs text-(--color-ink-soft) mb-1">Net savings</p>
                            <p className={`font-mono-num font-display text-xl font-bold ${report.netSavings >= 0 ? 'text-(--color-ink)' : 'text-(--color-coral)'}`}>
                                {formatKSh(report.netSavings)}
                            </p>
                        </Card>
                    </div>

                    <div className="grid lg:grid-cols-2 gap-5">
                        <Card>
                            <h2 className="font-display font-semibold text-(--color-ink) mb-3">Spending by category</h2>
                            <SpendingPieChart data={report.spendingByCategory} />
                        </Card>
                        <Card>
                            <h2 className="font-display font-semibold text-(--color-ink) mb-3">Monthly trend</h2>
                            {report.monthlyBreakdown.length === 0 ? (
                                <EmptyState icon={BarChart3} title="No data for this range" />
                            ) : (
                                <div className="h-64">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <BarChart data={report.monthlyBreakdown}>
                                            <CartesianGrid strokeDasharray="3 3" stroke="var(--color-line)" vertical={false} />
                                            <XAxis dataKey="month" tick={{ fontSize: 11, fill: 'var(--color-ink-soft)' }} axisLine={false} tickLine={false} />
                                            <YAxis tick={{ fontSize: 11, fill: 'var(--color-ink-soft)' }} axisLine={false} tickLine={false} width={50} />
                                            <Tooltip
                                                formatter={(v) => formatKSh(v)}
                                                contentStyle={{ background: 'var(--color-paper)', border: '1px solid var(--color-line)', borderRadius: 12, fontSize: 13 }}
                                            />
                                            <Bar dataKey="total" fill="var(--color-teal)" radius={[6, 6, 0, 0]} />
                                        </BarChart>
                                    </ResponsiveContainer>
                                </div>
                            )}
                        </Card>
                    </div>
                </>
            )}
        </div>
    );
}

function SavingsPerformanceReport() {
    const [goals, setGoals] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        dashboardService.getSavingsPerformance()
            .then((res) => setGoals(res.data.goals))
            .finally(() => setLoading(false));
    }, []);

    if (loading) return <PageLoader />;
    if (!goals || goals.length === 0) {
        return <Card><EmptyState icon={TrendingUp} title="No savings goals yet" description="Create a goal to see performance here." /></Card>;
    }

    return (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {goals.map((g) => (
                <Card key={g.id} className="flex items-center gap-4">
                    <ProgressRing
                        percent={g.percentComplete}
                        color={g.status === 'completed' ? 'var(--color-teal)' : 'var(--color-gold)'}
                        size={64}
                        strokeWidth={7}
                    />
                    <div>
                        <p className="font-display font-semibold text-(--color-ink)">{g.name}</p>
                        <p className="text-sm text-(--color-ink-soft)">{formatKSh(g.current)} of {formatKSh(g.target)}</p>
                        <p className="text-xs text-(--color-ink-soft) capitalize mt-0.5">{g.status}</p>
                    </div>
                </Card>
            ))}
        </div>
    );
}
