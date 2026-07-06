import { useEffect, useState } from 'react';
import { Plus, Target, PlusCircle, Trash2 } from 'lucide-react';
import AppShell from '../../components/layout/AppShell';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Modal from '../../components/ui/Modal';
import { Input } from '../../components/ui/FormControls';
import { PageLoader, EmptyState } from '../../components/ui/Feedback';
import ProgressRing from '../../components/ui/ProgressRing';
import Badge from '../../components/ui/Badge';
import { savingsService } from '../../services/services';
import { formatKSh, formatDate, daysUntil } from '../../utils/format';
import { useToast } from '../../context/ToastContext';

const emptyForm = { name: '', targetAmount: '', deadline: '', initialAmount: '' };
const emptyContribution = { amount: '', date: new Date().toISOString().split('T')[0], note: '' };

export default function Savings() {
    const { showToast } = useToast();
    const [goals, setGoals] = useState([]);
    const [loading, setLoading] = useState(true);
    const [modalOpen, setModalOpen] = useState(false);
    const [form, setForm] = useState(emptyForm);
    const [saving, setSaving] = useState(false);
    const [confirmDelete, setConfirmDelete] = useState(null);

    const [contributeTarget, setContributeTarget] = useState(null);
    const [contribution, setContribution] = useState(emptyContribution);
    const [contributing, setContributing] = useState(false);

    const load = () => {
        setLoading(true);
        savingsService.getAll()
            .then((res) => setGoals(res.data.goals))
            .finally(() => setLoading(false));
    };

    useEffect(() => { load(); }, []);

    const openCreate = () => { setForm(emptyForm); setModalOpen(true); };

    const handleCreate = async (e) => {
        e.preventDefault();
        setSaving(true);
        try {
            await savingsService.create({
                name: form.name,
                targetAmount: Number(form.targetAmount),
                deadline: form.deadline || undefined,
                initialAmount: form.initialAmount ? Number(form.initialAmount) : 0
            });
            showToast('Savings goal created.');
            setModalOpen(false);
            load();
        } catch (err) {
            showToast(err.response?.data?.message || 'Could not create goal.', 'error');
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (id) => {
        try {
            await savingsService.remove(id);
            showToast('Savings goal deleted.');
            setConfirmDelete(null);
            load();
        } catch {
            showToast('Could not delete this goal.', 'error');
        }
    };

    const openContribute = (goal) => {
        setContributeTarget(goal);
        setContribution(emptyContribution);
    };

    const handleContribute = async (e) => {
        e.preventDefault();
        setContributing(true);
        try {
            await savingsService.contribute(contributeTarget.id, {
                amount: Number(contribution.amount), date: contribution.date, note: contribution.note || undefined
            });
            showToast('Contribution added.');
            setContributeTarget(null);
            load();
        } catch (err) {
            showToast(err.response?.data?.message || 'Could not add contribution.', 'error');
        } finally {
            setContributing(false);
        }
    };

    return (
        <AppShell>
            <div className="flex items-center justify-between mb-1">
                <h1 className="font-display text-2xl font-bold text-(--color-ink)">Savings goals</h1>
                <Button icon={Plus} onClick={openCreate}>New goal</Button>
            </div>
            <p className="text-(--color-ink-soft) mb-6">Track multiple goals with deadlines and contribution history.</p>

            {loading ? (
                <PageLoader />
            ) : goals.length === 0 ? (
                <Card>
                    <EmptyState
                        icon={Target}
                        title="No savings goals yet"
                        description="Set a target — a laptop, rent deposit, or trip — and watch your progress fill in."
                        action={<Button size="sm" icon={Plus} onClick={openCreate}>Create a goal</Button>}
                    />
                </Card>
            ) : (
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {goals.map((goal) => {
                        const left = daysUntil(goal.deadline);
                        return (
                            <Card key={goal.id} className="flex flex-col">
                                <div className="flex items-start justify-between mb-4">
                                    <div className="min-w-0">
                                        {goal.status === 'completed' && <Badge variant="success" className="mb-2">Completed</Badge>}
                                        <h3 className="font-display font-semibold text-(--color-ink) truncate">{goal.name}</h3>
                                        {goal.deadline && (
                                            <p className="text-xs text-(--color-ink-soft) mt-0.5">
                                                {formatDate(goal.deadline)}
                                                {left != null && goal.status === 'active' && (
                                                    <span> · {left >= 0 ? `${left}d left` : 'past deadline'}</span>
                                                )}
                                            </p>
                                        )}
                                    </div>
                                    <button
                                        onClick={() => setConfirmDelete(goal)}
                                        aria-label="Delete goal"
                                        className="p-1.5 text-(--color-ink-soft) hover:text-(--color-coral) hover:bg-(--color-coral-soft) rounded-full shrink-0"
                                    >
                                        <Trash2 size={14} />
                                    </button>
                                </div>

                                <div className="flex items-center gap-4 mb-4">
                                    <ProgressRing
                                        percent={goal.percentComplete}
                                        color={goal.status === 'completed' ? 'var(--color-teal)' : 'var(--color-gold)'}
                                        size={68}
                                        strokeWidth={7}
                                    />
                                    <div className="text-sm">
                                        <p className="font-mono-num font-semibold text-(--color-ink)">{formatKSh(goal.current_amount)}</p>
                                        <p className="text-(--color-ink-soft)">of {formatKSh(goal.target_amount)}</p>
                                        <p className="text-(--color-ink-soft) text-xs mt-0.5">{formatKSh(goal.remaining)} to go</p>
                                    </div>
                                </div>

                                {goal.status === 'active' && (
                                    <Button variant="outline" size="sm" icon={PlusCircle} className="mt-auto" onClick={() => openContribute(goal)}>
                                        Add contribution
                                    </Button>
                                )}
                            </Card>
                        );
                    })}
                </div>
            )}

            <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="New savings goal">
                <form onSubmit={handleCreate} className="space-y-4">
                    <Input label="Goal name" required placeholder="e.g. Laptop" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
                    <Input label="Target amount (KSh)" type="number" min="1" step="0.01" required value={form.targetAmount} onChange={(e) => setForm({ ...form, targetAmount: e.target.value })} placeholder="e.g. 80000" />
                    <Input label="Deadline (optional)" type="date" value={form.deadline} onChange={(e) => setForm({ ...form, deadline: e.target.value })} />
                    <Input label="Starting amount (optional)" type="number" min="0" step="0.01" value={form.initialAmount} onChange={(e) => setForm({ ...form, initialAmount: e.target.value })} placeholder="0" />
                    <div className="flex gap-3 pt-2">
                        <Button type="button" variant="outline" className="flex-1" onClick={() => setModalOpen(false)}>Cancel</Button>
                        <Button type="submit" className="flex-1" loading={saving}>Create goal</Button>
                    </div>
                </form>
            </Modal>

            <Modal open={!!contributeTarget} onClose={() => setContributeTarget(null)} title={`Add to "${contributeTarget?.name}"`}>
                <form onSubmit={handleContribute} className="space-y-4">
                    <Input label="Amount (KSh)" type="number" min="0.01" step="0.01" required value={contribution.amount} onChange={(e) => setContribution({ ...contribution, amount: e.target.value })} />
                    <Input label="Date" type="date" required value={contribution.date} onChange={(e) => setContribution({ ...contribution, date: e.target.value })} />
                    <Input label="Note (optional)" value={contribution.note} onChange={(e) => setContribution({ ...contribution, note: e.target.value })} placeholder="e.g. June savings" />
                    <div className="flex gap-3 pt-2">
                        <Button type="button" variant="outline" className="flex-1" onClick={() => setContributeTarget(null)}>Cancel</Button>
                        <Button type="submit" className="flex-1" loading={contributing}>Add contribution</Button>
                    </div>
                </form>
            </Modal>

            <Modal open={!!confirmDelete} onClose={() => setConfirmDelete(null)} title="Delete savings goal">
                <p className="text-sm text-(--color-ink-soft) mb-5">
                    Delete "{confirmDelete?.name}"? Your contribution history for this goal will be lost.
                </p>
                <div className="flex gap-3">
                    <Button variant="outline" className="flex-1" onClick={() => setConfirmDelete(null)}>Cancel</Button>
                    <Button variant="danger" className="flex-1" onClick={() => handleDelete(confirmDelete.id)}>Delete</Button>
                </div>
            </Modal>
        </AppShell>
    );
}
