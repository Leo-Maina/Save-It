import { useEffect, useState } from 'react';
import { Plus, Repeat, Trash2, CheckCircle2 } from 'lucide-react';
import AppShell from '../../components/layout/AppShell';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Modal from '../../components/ui/Modal';
import { Input, Select } from '../../components/ui/FormControls';
import { PageLoader, EmptyState } from '../../components/ui/Feedback';
import Badge from '../../components/ui/Badge';
import { recurringService } from '../../services/services';
import { useCategories } from '../../hooks/useCategories';
import { formatKSh, formatDate, daysUntil } from '../../utils/format';
import { useToast } from '../../context/ToastContext';

const FREQUENCIES = [
    { value: 'weekly', label: 'Weekly' },
    { value: 'monthly', label: 'Monthly' },
    { value: 'termly', label: 'Termly' },
    { value: 'yearly', label: 'Yearly' }
];

const emptyForm = { name: '', amount: '', categoryId: '', frequency: 'monthly', startDate: new Date().toISOString().split('T')[0], endDate: '' };

export default function Recurring() {
    const { showToast } = useToast();
    const { categories } = useCategories('expense');
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [modalOpen, setModalOpen] = useState(false);
    const [form, setForm] = useState(emptyForm);
    const [saving, setSaving] = useState(false);
    const [confirmDelete, setConfirmDelete] = useState(null);
    const [loggingId, setLoggingId] = useState(null);

    const load = () => {
        setLoading(true);
        recurringService.getAll()
            .then((res) => setItems(res.data.recurring))
            .finally(() => setLoading(false));
    };

    useEffect(() => { load(); }, []);

    const openCreate = () => { setForm(emptyForm); setModalOpen(true); };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSaving(true);
        try {
            await recurringService.add({
                ...form, amount: Number(form.amount), categoryId: Number(form.categoryId),
                endDate: form.endDate || undefined
            });
            showToast('Recurring expense added.');
            setModalOpen(false);
            load();
        } catch (err) {
            showToast(err.response?.data?.message || 'Could not add recurring expense.', 'error');
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (id) => {
        try {
            await recurringService.remove(id);
            showToast('Recurring expense removed.');
            setConfirmDelete(null);
            load();
        } catch {
            showToast('Could not delete this item.', 'error');
        }
    };

    const handleLogPayment = async (id) => {
        setLoggingId(id);
        try {
            await recurringService.logPayment(id);
            showToast('Payment logged and next due date updated.');
            load();
        } catch {
            showToast('Could not log this payment.', 'error');
        } finally {
            setLoggingId(null);
        }
    };

    return (
        <AppShell>
            <div className="flex items-center justify-between mb-1">
                <h1 className="font-display text-2xl font-bold text-(--color-ink)">Recurring expenses</h1>
                <Button icon={Plus} onClick={openCreate}>Add recurring</Button>
            </div>
            <p className="text-(--color-ink-soft) mb-6">Rent, internet, subscriptions — logged automatically with due-date reminders.</p>

            <Card padded={false}>
                {loading ? (
                    <PageLoader />
                ) : items.length === 0 ? (
                    <EmptyState
                        icon={Repeat}
                        title="No recurring expenses set up"
                        description="Add rent or a subscription and Save-It will remind you before each payment is due."
                        action={<Button size="sm" icon={Plus} onClick={openCreate}>Add recurring expense</Button>}
                    />
                ) : (
                    <ul className="divide-y divide-(--color-line)">
                        {items.map((item) => {
                            const due = daysUntil(item.next_due_date);
                            return (
                                <li key={item.id} className="flex items-center gap-3 px-5 py-4">
                                    <div className="h-9 w-9 rounded-full bg-(--color-teal-soft) flex items-center justify-center shrink-0">
                                        <Repeat size={15} className="text-(--color-teal-deep)" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-medium text-(--color-ink)">{item.name}</p>
                                        <p className="text-xs text-(--color-ink-soft) capitalize">{item.category_name} · {item.frequency}</p>
                                    </div>
                                    <div className="text-right shrink-0">
                                        <p className="font-mono-num font-semibold text-(--color-ink)">{formatKSh(item.amount)}</p>
                                        <Badge variant={due != null && due <= 2 ? 'warning' : 'neutral'} className="mt-1">
                                            Due {formatDate(item.next_due_date)}
                                        </Badge>
                                    </div>
                                    <div className="flex items-center gap-1 shrink-0">
                                        <button
                                            onClick={() => handleLogPayment(item.id)}
                                            disabled={loggingId === item.id}
                                            aria-label="Log payment"
                                            title="Log this payment as paid"
                                            className="p-2 text-(--color-ink-soft) hover:text-(--color-teal) hover:bg-(--color-teal-soft) rounded-full disabled:opacity-50"
                                        >
                                            <CheckCircle2 size={16} />
                                        </button>
                                        <button onClick={() => setConfirmDelete(item)} aria-label="Delete" className="p-2 text-(--color-ink-soft) hover:text-(--color-coral) hover:bg-(--color-coral-soft) rounded-full">
                                            <Trash2 size={14} />
                                        </button>
                                    </div>
                                </li>
                            );
                        })}
                    </ul>
                )}
            </Card>

            <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Add recurring expense">
                <form onSubmit={handleSubmit} className="space-y-4">
                    <Input label="Name" required placeholder="e.g. Rent" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
                    <Input label="Amount (KSh)" type="number" min="0.01" step="0.01" required value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} />
                    <Select label="Category" required value={form.categoryId} onChange={(e) => setForm({ ...form, categoryId: e.target.value })}>
                        <option value="">Select a category</option>
                        {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </Select>
                    <Select label="Frequency" value={form.frequency} onChange={(e) => setForm({ ...form, frequency: e.target.value })}>
                        {FREQUENCIES.map((f) => <option key={f.value} value={f.value}>{f.label}</option>)}
                    </Select>
                    <Input label="Start date" type="date" required value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value })} />
                    <Input label="End date (optional)" type="date" value={form.endDate} onChange={(e) => setForm({ ...form, endDate: e.target.value })} />
                    <div className="flex gap-3 pt-2">
                        <Button type="button" variant="outline" className="flex-1" onClick={() => setModalOpen(false)}>Cancel</Button>
                        <Button type="submit" className="flex-1" loading={saving}>Add</Button>
                    </div>
                </form>
            </Modal>

            <Modal open={!!confirmDelete} onClose={() => setConfirmDelete(null)} title="Delete recurring expense">
                <p className="text-sm text-(--color-ink-soft) mb-5">
                    Stop tracking "{confirmDelete?.name}"? This won't delete past logged payments.
                </p>
                <div className="flex gap-3">
                    <Button variant="outline" className="flex-1" onClick={() => setConfirmDelete(null)}>Cancel</Button>
                    <Button variant="danger" className="flex-1" onClick={() => handleDelete(confirmDelete.id)}>Delete</Button>
                </div>
            </Modal>
        </AppShell>
    );
}
