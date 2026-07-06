import { useEffect, useState, useCallback } from 'react';
import { Plus, Pencil, Trash2, Receipt, Search, SlidersHorizontal } from 'lucide-react';
import AppShell from '../../components/layout/AppShell';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Modal from '../../components/ui/Modal';
import { Input, Select, Textarea } from '../../components/ui/FormControls';
import { PageLoader, EmptyState } from '../../components/ui/Feedback';
import { expenseService } from '../../services/services';
import { useCategories } from '../../hooks/useCategories';
import { formatKSh, formatDate, colorForCategory } from '../../utils/format';
import { useToast } from '../../context/ToastContext';

const emptyForm = { amount: '', categoryId: '', date: new Date().toISOString().split('T')[0], description: '', paymentMethod: 'cash' };
const PAYMENT_METHODS = [
    { value: 'cash', label: 'Cash' },
    { value: 'mpesa', label: 'M-Pesa' },
    { value: 'card', label: 'Card' },
    { value: 'bank', label: 'Bank transfer' },
    { value: 'other', label: 'Other' }
];

export default function Expenses() {
    const { showToast } = useToast();
    const { categories } = useCategories('expense');
    const [records, setRecords] = useState([]);
    const [loading, setLoading] = useState(true);
    const [modalOpen, setModalOpen] = useState(false);
    const [editing, setEditing] = useState(null);
    const [form, setForm] = useState(emptyForm);
    const [saving, setSaving] = useState(false);
    const [confirmDelete, setConfirmDelete] = useState(null);

    const [filtersOpen, setFiltersOpen] = useState(false);
    const [search, setSearch] = useState('');
    const [categoryFilter, setCategoryFilter] = useState('');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');

    const load = useCallback(() => {
        setLoading(true);
        const params = {};
        if (search) params.search = search;
        if (categoryFilter) params.categoryId = categoryFilter;
        if (startDate) params.startDate = startDate;
        if (endDate) params.endDate = endDate;
        expenseService.getAll(params)
            .then((res) => setRecords(res.data.expenses))
            .finally(() => setLoading(false));
    }, [search, categoryFilter, startDate, endDate]);

    useEffect(() => {
        const timeout = setTimeout(load, 300); // debounce search
        return () => clearTimeout(timeout);
    }, [load]);

    const openAdd = () => { setEditing(null); setForm(emptyForm); setModalOpen(true); };
    const openEdit = (record) => {
        setEditing(record);
        setForm({
            amount: record.amount, categoryId: record.category_id,
            date: record.date.split('T')[0], description: record.description || '',
            paymentMethod: record.payment_method || 'cash'
        });
        setModalOpen(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSaving(true);
        try {
            const payload = { ...form, amount: Number(form.amount), categoryId: Number(form.categoryId) };
            if (editing) {
                await expenseService.update(editing.id, payload);
                showToast('Expense updated.');
            } else {
                await expenseService.add(payload);
                showToast('Expense added.');
            }
            setModalOpen(false);
            load();
        } catch (err) {
            showToast(err.response?.data?.message || 'Could not save expense.', 'error');
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (id) => {
        try {
            await expenseService.remove(id);
            showToast('Expense deleted.');
            setConfirmDelete(null);
            load();
        } catch {
            showToast('Could not delete this record.', 'error');
        }
    };

    const total = records.reduce((sum, r) => sum + Number(r.amount), 0);
    const hasActiveFilters = categoryFilter || startDate || endDate;

    return (
        <AppShell>
            <div className="flex items-center justify-between mb-1">
                <h1 className="font-display text-2xl font-bold text-(--color-ink)">Expenses</h1>
                <Button icon={Plus} onClick={openAdd}>Add expense</Button>
            </div>
            <p className="text-(--color-ink-soft) mb-6">
                Total {hasActiveFilters || search ? 'filtered' : 'recorded'}:{' '}
                <span className="font-mono-num font-semibold text-(--color-coral)">{formatKSh(total)}</span>
            </p>

            {/* Search + filter bar */}
            <div className="flex flex-col sm:flex-row gap-3 mb-4">
                <div className="relative flex-1">
                    <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-(--color-ink-soft)" />
                    <input
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Search descriptions…"
                        className="w-full rounded-full border border-(--color-line) bg-(--color-paper) pl-10 pr-4 py-2.5 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-(--color-teal)"
                    />
                </div>
                <Button
                    variant={hasActiveFilters ? 'primary' : 'outline'}
                    icon={SlidersHorizontal}
                    onClick={() => setFiltersOpen((o) => !o)}
                >
                    Filters {hasActiveFilters && `(${[categoryFilter, startDate, endDate].filter(Boolean).length})`}
                </Button>
            </div>

            {filtersOpen && (
                <Card className="mb-4">
                    <div className="grid sm:grid-cols-3 gap-3">
                        <Select label="Category" value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)}>
                            <option value="">All categories</option>
                            {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                        </Select>
                        <Input label="From" type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
                        <Input label="To" type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
                    </div>
                    {hasActiveFilters && (
                        <button
                            onClick={() => { setCategoryFilter(''); setStartDate(''); setEndDate(''); }}
                            className="text-xs font-medium text-(--color-teal) hover:underline mt-3"
                        >
                            Clear filters
                        </button>
                    )}
                </Card>
            )}

            <Card padded={false}>
                {loading ? (
                    <PageLoader />
                ) : records.length === 0 ? (
                    <EmptyState
                        icon={Receipt}
                        title="No expenses found"
                        description={search || hasActiveFilters ? 'Try adjusting your search or filters.' : 'Add your first expense to start tracking spending.'}
                        action={!search && !hasActiveFilters && <Button size="sm" icon={Plus} onClick={openAdd}>Add expense</Button>}
                    />
                ) : (
                    <ul className="divide-y divide-(--color-line)">
                        {records.map((r) => (
                            <li key={r.id} className="flex items-center gap-3 px-5 py-4">
                                <div
                                    className="h-9 w-9 rounded-full flex items-center justify-center shrink-0"
                                    style={{ backgroundColor: `${colorForCategory(r.category_name)}22` }}
                                >
                                    <Receipt size={15} style={{ color: colorForCategory(r.category_name) }} />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium text-(--color-ink) truncate">{r.description || r.category_name}</p>
                                    <p className="text-xs text-(--color-ink-soft) capitalize">
                                        {r.category_name} · {formatDate(r.date)} · {r.payment_method}
                                    </p>
                                </div>
                                <span className="font-mono-num font-semibold text-(--color-coral) shrink-0">
                                    −{formatKSh(r.amount)}
                                </span>
                                <div className="flex items-center gap-1 shrink-0">
                                    <button onClick={() => openEdit(r)} aria-label="Edit" className="p-2 text-(--color-ink-soft) hover:text-(--color-ink) hover:bg-(--color-sand-deep) rounded-full">
                                        <Pencil size={14} />
                                    </button>
                                    <button onClick={() => setConfirmDelete(r)} aria-label="Delete" className="p-2 text-(--color-ink-soft) hover:text-(--color-coral) hover:bg-(--color-coral-soft) rounded-full">
                                        <Trash2 size={14} />
                                    </button>
                                </div>
                            </li>
                        ))}
                    </ul>
                )}
            </Card>

            <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Edit expense' : 'Add expense'}>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <Input
                        label="Amount (KSh)" type="number" min="0.01" step="0.01" required
                        value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })}
                    />
                    <Select
                        label="Category" required value={form.categoryId}
                        onChange={(e) => setForm({ ...form, categoryId: e.target.value })}
                    >
                        <option value="">Select a category</option>
                        {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </Select>
                    <Input
                        label="Date" type="date" required
                        value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })}
                    />
                    <Select
                        label="Payment method" value={form.paymentMethod}
                        onChange={(e) => setForm({ ...form, paymentMethod: e.target.value })}
                    >
                        {PAYMENT_METHODS.map((m) => <option key={m.value} value={m.value}>{m.label}</option>)}
                    </Select>
                    <Textarea
                        label="Description (optional)" rows={2}
                        value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })}
                        placeholder="e.g. Weekly groceries"
                    />
                    <div className="flex gap-3 pt-2">
                        <Button type="button" variant="outline" className="flex-1" onClick={() => setModalOpen(false)}>Cancel</Button>
                        <Button type="submit" className="flex-1" loading={saving}>{editing ? 'Save changes' : 'Add expense'}</Button>
                    </div>
                </form>
            </Modal>

            <Modal open={!!confirmDelete} onClose={() => setConfirmDelete(null)} title="Delete expense">
                <p className="text-sm text-(--color-ink-soft) mb-5">
                    Are you sure you want to delete this {confirmDelete && formatKSh(confirmDelete.amount)} expense? This can't be undone.
                </p>
                <div className="flex gap-3">
                    <Button variant="outline" className="flex-1" onClick={() => setConfirmDelete(null)}>Cancel</Button>
                    <Button variant="danger" className="flex-1" onClick={() => handleDelete(confirmDelete.id)}>Delete</Button>
                </div>
            </Modal>
        </AppShell>
    );
}
