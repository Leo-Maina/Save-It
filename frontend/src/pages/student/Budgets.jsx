import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus, PieChart, Calendar, Trash2, ChevronRight, Sparkles } from 'lucide-react';
import AppShell from '../../components/layout/AppShell';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Modal from '../../components/ui/Modal';
import { Input, Select } from '../../components/ui/FormControls';
import { PageLoader, EmptyState } from '../../components/ui/Feedback';
import ProgressRing from '../../components/ui/ProgressRing';
import Badge from '../../components/ui/Badge';
import { budgetService } from '../../services/services';
import { useCategories } from '../../hooks/useCategories';
import { formatKSh, formatDate } from '../../utils/format';
import { useToast } from '../../context/ToastContext';

const BUDGET_TYPES = [
    { value: 'monthly', label: 'Monthly budget' },
    { value: 'semester', label: 'Semester budget' },
    { value: 'custom', label: 'Custom date range' }
];

const emptyForm = { name: '', type: 'monthly', startDate: '', endDate: '', amount: '' };

export default function Budgets() {
    const { showToast } = useToast();
    const { categories } = useCategories('expense');
    const [budgets, setBudgets] = useState([]);
    const [loading, setLoading] = useState(true);
    const [modalOpen, setModalOpen] = useState(false);
    const [step, setStep] = useState(1); // 1: basics, 2: allocations
    const [form, setForm] = useState(emptyForm);
    const [allocations, setAllocations] = useState([]); // [{categoryId, categoryName, allocatedAmount, allocatedPercent}]
    const [saving, setSaving] = useState(false);
    const [confirmDelete, setConfirmDelete] = useState(null);
    const [budgetDetails, setBudgetDetails] = useState({}); // id -> { percentUsed, ... }

    const load = () => {
        setLoading(true);
        budgetService.getAll()
            .then(async (res) => {
                setBudgets(res.data.budgets);
                // fetch lightweight detail for progress rings
                const details = {};
                await Promise.all(res.data.budgets.map(async (b) => {
                    try {
                        const d = await budgetService.getDetail(b.id);
                        details[b.id] = d.data.budget;
                    } catch { /* ignore individual failures */ }
                }));
                setBudgetDetails(details);
            })
            .finally(() => setLoading(false));
    };

    useEffect(() => { load(); }, []);

    const openCreate = () => {
        setForm(emptyForm);
        setAllocations([]);
        setStep(1);
        setModalOpen(true);
    };

    const proceedToAllocations = async (e) => {
        e.preventDefault();
        if (!form.amount || Number(form.amount) <= 0) {
            showToast('Enter a budget amount first.', 'error');
            return;
        }
        try {
            const res = await budgetService.suggest(Number(form.amount));
            const withCategoryIds = res.data.suggestions.map((s) => {
                const cat = categories.find((c) => c.name === s.categoryName);
                return {
                    categoryId: cat?.id || '',
                    categoryName: s.categoryName,
                    allocatedPercent: s.percent,
                    allocatedAmount: s.amount
                };
            }).filter((a) => a.categoryId); // only keep categories that exist in DB
            setAllocations(withCategoryIds);
            setStep(2);
        } catch {
            showToast('Could not generate suggestions. You can still set allocations manually.', 'error');
            setAllocations(categories.slice(0, 5).map((c) => ({ categoryId: c.id, categoryName: c.name, allocatedPercent: 0, allocatedAmount: 0 })));
            setStep(2);
        }
    };

    const updateAllocation = (categoryId, field, value) => {
        setAllocations((prev) => prev.map((a) => {
            if (a.categoryId !== categoryId) return a;
            if (field === 'allocatedPercent') {
                const percent = Number(value);
                return { ...a, allocatedPercent: percent, allocatedAmount: Math.round((Number(form.amount) * percent) / 100 * 100) / 100 };
            }
            return { ...a, allocatedAmount: Number(value) };
        }));
    };

    const totalAllocated = allocations.reduce((sum, a) => sum + Number(a.allocatedAmount || 0), 0);

    const handleCreate = async () => {
        setSaving(true);
        try {
            await budgetService.create({
                ...form,
                amount: Number(form.amount),
                allocations: allocations.map((a) => ({
                    categoryId: a.categoryId,
                    allocatedAmount: Number(a.allocatedAmount),
                    allocatedPercent: a.allocatedPercent
                }))
            });
            showToast('Budget created.');
            setModalOpen(false);
            load();
        } catch (err) {
            showToast(err.response?.data?.message || 'Could not create budget.', 'error');
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (id) => {
        try {
            await budgetService.remove(id);
            showToast('Budget deleted.');
            setConfirmDelete(null);
            load();
        } catch {
            showToast('Could not delete this budget.', 'error');
        }
    };

    return (
        <AppShell>
            <div className="flex items-center justify-between mb-1">
                <h1 className="font-display text-2xl font-bold text-(--color-ink)">Budgets</h1>
                <Button icon={Plus} onClick={openCreate}>Create budget</Button>
            </div>
            <p className="text-(--color-ink-soft) mb-6">Monthly, semester, or custom-range budgets with category allocations.</p>

            {loading ? (
                <PageLoader />
            ) : budgets.length === 0 ? (
                <Card>
                    <EmptyState
                        icon={PieChart}
                        title="No budgets yet"
                        description="Create a budget and let Save-It suggest a sensible split across categories."
                        action={<Button size="sm" icon={Plus} onClick={openCreate}>Create your first budget</Button>}
                    />
                </Card>
            ) : (
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {budgets.map((b) => {
                        const detail = budgetDetails[b.id];
                        return (
                            <Card key={b.id} className="flex flex-col">
                                <div className="flex items-start justify-between mb-4">
                                    <div>
                                        <Badge variant="teal" className="capitalize mb-2">{b.type}</Badge>
                                        <h3 className="font-display font-semibold text-(--color-ink)">{b.name}</h3>
                                        <p className="text-xs text-(--color-ink-soft) mt-0.5 flex items-center gap-1">
                                            <Calendar size={11} /> {formatDate(b.start_date)} – {formatDate(b.end_date)}
                                        </p>
                                    </div>
                                    <button
                                        onClick={() => setConfirmDelete(b)}
                                        aria-label="Delete budget"
                                        className="p-1.5 text-(--color-ink-soft) hover:text-(--color-coral) hover:bg-(--color-coral-soft) rounded-full shrink-0"
                                    >
                                        <Trash2 size={14} />
                                    </button>
                                </div>

                                <div className="flex items-center gap-4 mb-4">
                                    <ProgressRing
                                        percent={detail?.percentUsed || 0}
                                        overBudget={(detail?.percentUsed || 0) >= 100}
                                        size={64}
                                        strokeWidth={7}
                                    />
                                    <div className="flex-1 space-y-1 text-sm">
                                        <div className="flex justify-between"><span className="text-(--color-ink-soft)">Budget</span><span className="font-mono-num">{formatKSh(b.amount)}</span></div>
                                        <div className="flex justify-between"><span className="text-(--color-ink-soft)">Spent</span><span className="font-mono-num">{formatKSh(detail?.totalSpent || 0)}</span></div>
                                    </div>
                                </div>

                                <Link
                                    to={`/budgets/${b.id}`}
                                    className="mt-auto inline-flex items-center justify-center gap-1 text-sm font-medium text-(--color-teal) hover:underline"
                                >
                                    View details <ChevronRight size={14} />
                                </Link>
                            </Card>
                        );
                    })}
                </div>
            )}

            <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={step === 1 ? 'Create budget' : 'Allocate categories'} maxWidth="max-w-lg">
                {step === 1 ? (
                    <form onSubmit={proceedToAllocations} className="space-y-4">
                        <Input
                            label="Budget name" required placeholder="e.g. June Budget, Semester 1 2026"
                            value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
                        />
                        <Select label="Type" value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
                            {BUDGET_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
                        </Select>
                        <div className="grid grid-cols-2 gap-3">
                            <Input label="Start date" type="date" required value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value })} />
                            <Input label="End date" type="date" required value={form.endDate} onChange={(e) => setForm({ ...form, endDate: e.target.value })} />
                        </div>
                        <Input
                            label="Total budget amount (KSh)" type="number" min="1" step="0.01" required
                            value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })}
                            placeholder="e.g. 30000"
                        />
                        <div className="flex gap-3 pt-2">
                            <Button type="button" variant="outline" className="flex-1" onClick={() => setModalOpen(false)}>Cancel</Button>
                            <Button type="submit" className="flex-1" icon={Sparkles}>Suggest allocations</Button>
                        </div>
                    </form>
                ) : (
                    <div className="space-y-4">
                        <p className="text-sm text-(--color-ink-soft)">
                            Based on a {formatKSh(Number(form.amount))} budget. Adjust the percentages to fit your needs.
                        </p>
                        <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
                            {allocations.map((a) => (
                                <div key={a.categoryId} className="flex items-center gap-3">
                                    <span className="text-sm text-(--color-ink) w-28 shrink-0 truncate">{a.categoryName}</span>
                                    <input
                                        type="number" min="0" max="100" step="1"
                                        value={a.allocatedPercent}
                                        onChange={(e) => updateAllocation(a.categoryId, 'allocatedPercent', e.target.value)}
                                        className="w-16 rounded-lg border border-(--color-line) px-2 py-1.5 text-sm text-right font-mono-num focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-(--color-teal)"
                                    />
                                    <span className="text-xs text-(--color-ink-soft)">%</span>
                                    <span className="flex-1 text-right text-sm font-mono-num text-(--color-ink-soft)">{formatKSh(a.allocatedAmount)}</span>
                                </div>
                            ))}
                        </div>
                        <div className="flex items-center justify-between text-sm pt-2 border-t border-(--color-line)">
                            <span className="text-(--color-ink-soft)">Total allocated</span>
                            <span className={`font-mono-num font-semibold ${totalAllocated > Number(form.amount) ? 'text-(--color-coral)' : 'text-(--color-ink)'}`}>
                                {formatKSh(totalAllocated)} / {formatKSh(Number(form.amount))}
                            </span>
                        </div>
                        <div className="flex gap-3 pt-2">
                            <Button type="button" variant="outline" className="flex-1" onClick={() => setStep(1)}>Back</Button>
                            <Button type="button" className="flex-1" loading={saving} onClick={handleCreate}>Create budget</Button>
                        </div>
                    </div>
                )}
            </Modal>

            <Modal open={!!confirmDelete} onClose={() => setConfirmDelete(null)} title="Delete budget">
                <p className="text-sm text-(--color-ink-soft) mb-5">
                    Delete "{confirmDelete?.name}"? Your transaction history won't be affected.
                </p>
                <div className="flex gap-3">
                    <Button variant="outline" className="flex-1" onClick={() => setConfirmDelete(null)}>Cancel</Button>
                    <Button variant="danger" className="flex-1" onClick={() => handleDelete(confirmDelete.id)}>Delete</Button>
                </div>
            </Modal>
        </AppShell>
    );
}
