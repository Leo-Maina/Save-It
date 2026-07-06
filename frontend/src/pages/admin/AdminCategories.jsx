import { useEffect, useState } from 'react';
import { Plus, Trash2, Tag } from 'lucide-react';
import AppShell from '../../components/layout/AppShell';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Modal from '../../components/ui/Modal';
import { Input, Select } from '../../components/ui/FormControls';
import { PageLoader, EmptyState } from '../../components/ui/Feedback';
import Badge from '../../components/ui/Badge';
import { categoryService } from '../../services/services';
import { useToast } from '../../context/ToastContext';

const emptyForm = { name: '', type: 'expense' };

export default function AdminCategories() {
    const { showToast } = useToast();
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [modalOpen, setModalOpen] = useState(false);
    const [form, setForm] = useState(emptyForm);
    const [saving, setSaving] = useState(false);
    const [confirmDelete, setConfirmDelete] = useState(null);

    const load = () => {
        setLoading(true);
        categoryService.getAll()
            .then((res) => setCategories(res.data.categories))
            .finally(() => setLoading(false));
    };

    useEffect(() => { load(); }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSaving(true);
        try {
            await categoryService.add(form);
            showToast('Category added.');
            setModalOpen(false);
            setForm(emptyForm);
            load();
        } catch (err) {
            showToast(err.response?.data?.message || 'Could not add category.', 'error');
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (id) => {
        try {
            await categoryService.remove(id);
            showToast('Category deleted.');
            setConfirmDelete(null);
            load();
        } catch (err) {
            showToast(err.response?.data?.message || 'Could not delete this category.', 'error');
        }
    };

    const expenseCategories = categories.filter((c) => c.type === 'expense');
    const incomeCategories = categories.filter((c) => c.type === 'income');

    return (
        <AppShell>
            <div className="flex items-center justify-between mb-1">
                <h1 className="font-display text-2xl font-bold text-(--color-ink)">Categories</h1>
                <Button icon={Plus} onClick={() => setModalOpen(true)}>Add category</Button>
            </div>
            <p className="text-(--color-ink-soft) mb-6">Default categories can't be removed, since transactions depend on them.</p>

            {loading ? (
                <PageLoader />
            ) : (
                <div className="grid sm:grid-cols-2 gap-5">
                    <CategoryGroup title="Expense categories" items={expenseCategories} onDelete={setConfirmDelete} />
                    <CategoryGroup title="Income categories" items={incomeCategories} onDelete={setConfirmDelete} />
                </div>
            )}

            <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Add category">
                <form onSubmit={handleSubmit} className="space-y-4">
                    <Input label="Category name" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. Health & wellness" />
                    <Select label="Type" value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
                        <option value="expense">Expense</option>
                        <option value="income">Income</option>
                    </Select>
                    <div className="flex gap-3 pt-2">
                        <Button type="button" variant="outline" className="flex-1" onClick={() => setModalOpen(false)}>Cancel</Button>
                        <Button type="submit" className="flex-1" loading={saving}>Add</Button>
                    </div>
                </form>
            </Modal>

            <Modal open={!!confirmDelete} onClose={() => setConfirmDelete(null)} title="Delete category">
                <p className="text-sm text-(--color-ink-soft) mb-5">
                    Delete "{confirmDelete?.name}"? This will fail if any transactions still use it.
                </p>
                <div className="flex gap-3">
                    <Button variant="outline" className="flex-1" onClick={() => setConfirmDelete(null)}>Cancel</Button>
                    <Button variant="danger" className="flex-1" onClick={() => handleDelete(confirmDelete.id)}>Delete</Button>
                </div>
            </Modal>
        </AppShell>
    );
}

function CategoryGroup({ title, items, onDelete }) {
    return (
        <Card padded={false}>
            <h2 className="font-display font-semibold text-(--color-ink) px-5 pt-5 pb-3">{title}</h2>
            {items.length === 0 ? (
                <EmptyState icon={Tag} title="No categories" />
            ) : (
                <ul className="divide-y divide-(--color-line)">
                    {items.map((c) => (
                        <li key={c.id} className="flex items-center justify-between px-5 py-3">
                            <span className="text-sm text-(--color-ink)">{c.name}</span>
                            <div className="flex items-center gap-2">
                                {c.is_default && <Badge variant="neutral">Default</Badge>}
                                {!c.is_default && (
                                    <button onClick={() => onDelete(c)} aria-label="Delete" className="p-1.5 text-(--color-ink-soft) hover:text-(--color-coral) hover:bg-(--color-coral-soft) rounded-full">
                                        <Trash2 size={14} />
                                    </button>
                                )}
                            </div>
                        </li>
                    ))}
                </ul>
            )}
        </Card>
    );
}
