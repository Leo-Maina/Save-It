import { useEffect, useState } from 'react';
import { Users as UsersIcon, ShieldOff, ShieldCheck } from 'lucide-react';
import AppShell from '../../components/layout/AppShell';
import Card from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import { PageLoader, EmptyState } from '../../components/ui/Feedback';
import { adminService } from '../../services/services';
import { formatDate } from '../../utils/format';
import { useToast } from '../../context/ToastContext';

export default function AdminUsers() {
    const { showToast } = useToast();
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [actingId, setActingId] = useState(null);

    const load = () => {
        setLoading(true);
        adminService.getUsers()
            .then((res) => setUsers(res.data.users))
            .finally(() => setLoading(false));
    };

    useEffect(() => { load(); }, []);

    const toggleAccount = async (user) => {
        setActingId(user.id);
        try {
            if (user.is_active) {
                await adminService.disableUser(user.id);
                showToast(`${user.name}'s account disabled.`);
            } else {
                await adminService.enableUser(user.id);
                showToast(`${user.name}'s account enabled.`);
            }
            load();
        } catch {
            showToast('Could not update this account.', 'error');
        } finally {
            setActingId(null);
        }
    };

    return (
        <AppShell>
            <h1 className="font-display text-2xl font-bold text-(--color-ink) mb-1">Users</h1>
            <p className="text-(--color-ink-soft) mb-6">{users.length} registered student{users.length !== 1 ? 's' : ''}.</p>

            <Card padded={false}>
                {loading ? (
                    <PageLoader />
                ) : users.length === 0 ? (
                    <EmptyState icon={UsersIcon} title="No users yet" />
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b border-(--color-line) text-left text-xs text-(--color-ink-soft) uppercase tracking-wide">
                                    <th className="px-5 py-3 font-medium">Name</th>
                                    <th className="px-5 py-3 font-medium">University</th>
                                    <th className="px-5 py-3 font-medium">Status</th>
                                    <th className="px-5 py-3 font-medium">Joined</th>
                                    <th className="px-5 py-3 font-medium text-right">Action</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-(--color-line)">
                                {users.map((u) => (
                                    <tr key={u.id}>
                                        <td className="px-5 py-3.5">
                                            <p className="font-medium text-(--color-ink)">{u.name}</p>
                                            <p className="text-xs text-(--color-ink-soft)">{u.email}</p>
                                        </td>
                                        <td className="px-5 py-3.5 text-(--color-ink-soft)">
                                            {u.university || '—'}
                                            {u.course && <p className="text-xs">{u.course}</p>}
                                        </td>
                                        <td className="px-5 py-3.5">
                                            <Badge variant={u.is_active ? 'success' : 'danger'}>
                                                {u.is_active ? 'Active' : 'Disabled'}
                                            </Badge>
                                            {!u.is_verified && <Badge variant="neutral" className="ml-1.5">Unverified</Badge>}
                                        </td>
                                        <td className="px-5 py-3.5 text-(--color-ink-soft)">{formatDate(u.created_at)}</td>
                                        <td className="px-5 py-3.5 text-right">
                                            <Button
                                                size="sm"
                                                variant={u.is_active ? 'outline' : 'primary'}
                                                icon={u.is_active ? ShieldOff : ShieldCheck}
                                                loading={actingId === u.id}
                                                onClick={() => toggleAccount(u)}
                                            >
                                                {u.is_active ? 'Disable' : 'Enable'}
                                            </Button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </Card>
        </AppShell>
    );
}
