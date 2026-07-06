import { useEffect, useState, useCallback } from 'react';
import { Plus, Pencil, Trash2, Wallet } from 'lucide-react';
import AppShell from '../../components/layout/AppShell';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Modal from '../../components/ui/Modal';
import { Input, Select, Textarea } from '../../components/ui/FormControls';
import { PageLoader, EmptyState } from '../../components/ui/Feedback';
import { incomeService } from '../../services/services';
import { useCategories } from '../../hooks/useCategories';
import { formatKSh, formatDate } from '../../utils/format';
import { useToast } from '../../context/ToastContext';

const emptyForm = { amount: '', categoryId: '', date: new Date().toISOString().split('T')[0], description: '' };

export default function Income() {
    const { showToast } = useToast();
    const { categories } = useCategories('income');
    const [records, setRecords] = useState([]);
    const [loading, setLoading] = useState(true);
    const [modalOpen, setModalOpen] = useState(false);
    const [editing, setEditing] = useState(null);
    const [form, setForm] = useState(emptyForm);
    const [saving, setSaving] = useState(false);
    const [confirmDelete, setConfirmDelete] = useState(null);

    const load = useCallback(() => {
        setLoading(true);
        incomeService.getAll()
            .then((res) => setRecords(res.data.income))
            .finally(() => setLoading(false));
    }, []);

    useEffect(() => { load(); }, [load]);

    const openAdd = () => { setEditing(null); setForm(emptyForm); setModalOpen(true); };
    const openEdit = (record) => {
        setEditing(record);
        setForm({
            amount: record.amount, categoryId: record.category_id,
            date: record.date.split('T')[0], description: record.description || ''
        });
        setModalOpen(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSaving(true);
        try {
            const payload = { ...form, amount: Number(form.amount), categoryId: Number(form.categoryId) };
            if (editing) {
                await incomeService.update(editing.id, payload);
                showToast('Income updated.');
            } else {
                await incomeService.add(payload);
                showToast('Income added.');
            }
            setModalOpen(false);
            load();
        } catch (err) {
            showToast(err.response?.data?.message || 'Could not save income.', 'error');
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (id) => {
        try {
            await incomeService.remove(id);
            showToast('Income deleted.');
            setConfirmDelete(null);
            load();
        } catch {
            showToast('Could not delete this record.', 'error');
        }
    };

    const total = records.reduce((sum, r) => sum + Number(r.amount), 0);

    return (
        <AppShell>
            <div className="flex items-center justify-between mb-1">
                <h1 className="font-display text-2xl font-bold text-(--color-ink)">Income</h1>
                <Button icon={Plus} onClick={openAdd}>Add income</Button>
            </div>
            <p className="text-(--color-ink-soft) mb-6">
                Total recorded: <span className="font-mono-num font-semibold text-(--color-teal-deep)">{formatKSh(total)}</span>
            </p>

            <Card padded={false}>
                {loading ? (
                    <PageLoader />
                ) : records.length === 0 ? (
                    <EmptyState
                        icon={Wallet}
                        title="No income recorded yet"
                        description="Add your allowance, bursary, or part-time earnings to start tracking."
                        action={<Button size="sm" icon={Plus} onClick={openAdd}>Add income</Button>}
                    />
                ) : (
                    <ul className="divide-y divide-(--color-line)">
                        {records.map((r) => (
                            <li key={r.id} className="flex items-center gap-3 px-5 py-4">
                                <div className="h-9 w-9 rounded-full bg-(--color-sage-soft) flex items-center justify-center shrink-0">
                                    <Wallet size={15} className="text-(--color-teal-deep)" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium text-(--color-ink) truncate">{r.description || r.category_name}</p>
                                    <p className="text-xs text-(--color-ink-soft)">{r.category_name} · {formatDate(r.date)}</p>
                                </div>
                                <span className="font-mono-num font-semibold text-(--color-teal-deep) shrink-0">
                                    +{formatKSh(r.amount)}
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

            <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Edit income' : 'Add income'}>
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
                    <Textarea
                        label="Description (optional)" rows={2}
                        value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })}
                        placeholder="e.g. June allowance from parents"
                    />
                    <div className="flex gap-3 pt-2">
                        <Button type="button" variant="outline" className="flex-1" onClick={() => setModalOpen(false)}>Cancel</Button>
                        <Button type="submit" className="flex-1" loading={saving}>{editing ? 'Save changes' : 'Add income'}</Button>
                    </div>
                </form>
            </Modal>

            <Modal open={!!confirmDelete} onClose={() => setConfirmDelete(null)} title="Delete income record">
                <p className="text-sm text-(--color-ink-soft) mb-5">
                    Are you sure you want to delete this {confirmDelete && formatKSh(confirmDelete.amount)} record? This can't be undone.
                </p>
                <div className="flex gap-3">
                    <Button variant="outline" className="flex-1" onClick={() => setConfirmDelete(null)}>Cancel</Button>
                    <Button variant="danger" className="flex-1" onClick={() => handleDelete(confirmDelete.id)}>Delete</Button>
                </div>
            </Modal>
        </AppShell>
    );
}
