import { useState } from 'react';
import { Save, KeyRound } from 'lucide-react';
import AppShell from '../../components/layout/AppShell';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import { Input, Select } from '../../components/ui/FormControls';
import { useAuth } from '../../context/AuthContext';
import { authService } from '../../services/services';
import { useToast } from '../../context/ToastContext';

const YEARS = [1, 2, 3, 4, 5, 6];

export default function Settings() {
    const { user, updateUser } = useAuth();
    const { showToast } = useToast();

    const [profileForm, setProfileForm] = useState({
        name: user?.name || '', phone: user?.phone || '', university: user?.university || '',
        studentId: user?.student_id || '', course: user?.course || '', yearOfStudy: user?.year_of_study || ''
    });
    const [savingProfile, setSavingProfile] = useState(false);

    const [pwForm, setPwForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
    const [pwError, setPwError] = useState('');
    const [savingPw, setSavingPw] = useState(false);

    const handleProfileSubmit = async (e) => {
        e.preventDefault();
        setSavingProfile(true);
        try {
            const res = await authService.updateProfile({
                ...profileForm,
                yearOfStudy: profileForm.yearOfStudy ? Number(profileForm.yearOfStudy) : undefined
            });
            updateUser({ ...user, ...res.data.user });
            showToast('Profile updated.');
        } catch (err) {
            showToast(err.response?.data?.message || 'Could not update profile.', 'error');
        } finally {
            setSavingProfile(false);
        }
    };

    const handlePasswordSubmit = async (e) => {
        e.preventDefault();
        setPwError('');
        if (pwForm.newPassword !== pwForm.confirmPassword) {
            setPwError('New passwords do not match.');
            return;
        }
        setSavingPw(true);
        try {
            await authService.changePassword({ currentPassword: pwForm.currentPassword, newPassword: pwForm.newPassword });
            showToast('Password changed.');
            setPwForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
        } catch (err) {
            setPwError(err.response?.data?.message || 'Could not change password.');
        } finally {
            setSavingPw(false);
        }
    };

    return (
        <AppShell>
            <h1 className="font-display text-2xl font-bold text-(--color-ink) mb-1">Settings</h1>
            <p className="text-(--color-ink-soft) mb-6">Manage your profile and account security.</p>

            <div className="grid lg:grid-cols-2 gap-5">
                <Card>
                    <h2 className="font-display font-semibold text-(--color-ink) mb-4">Profile</h2>
                    <form onSubmit={handleProfileSubmit} className="space-y-4">
                        <Input label="Full name" value={profileForm.name} onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })} />
                        <Input label="Email" value={user?.email} disabled className="opacity-60" />
                        <Input label="Phone number" value={profileForm.phone} onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })} />
                        <Input label="University" value={profileForm.university} onChange={(e) => setProfileForm({ ...profileForm, university: e.target.value })} />
                        <div className="grid grid-cols-2 gap-3">
                            <Input label="Student ID" value={profileForm.studentId} onChange={(e) => setProfileForm({ ...profileForm, studentId: e.target.value })} />
                            <Select label="Year of study" value={profileForm.yearOfStudy} onChange={(e) => setProfileForm({ ...profileForm, yearOfStudy: e.target.value })}>
                                <option value="">Select</option>
                                {YEARS.map((y) => <option key={y} value={y}>Year {y}</option>)}
                            </Select>
                        </div>
                        <Input label="Course" value={profileForm.course} onChange={(e) => setProfileForm({ ...profileForm, course: e.target.value })} />
                        <Button type="submit" icon={Save} loading={savingProfile}>Save changes</Button>
                    </form>
                </Card>

                <Card>
                    <h2 className="font-display font-semibold text-(--color-ink) mb-4">Change password</h2>
                    {pwError && (
                        <div className="mb-4 rounded-xl bg-(--color-coral-soft) text-(--color-coral) text-sm px-3.5 py-2.5">{pwError}</div>
                    )}
                    <form onSubmit={handlePasswordSubmit} className="space-y-4">
                        <Input label="Current password" type="password" required value={pwForm.currentPassword} onChange={(e) => setPwForm({ ...pwForm, currentPassword: e.target.value })} />
                        <Input label="New password" type="password" required minLength={8} value={pwForm.newPassword} onChange={(e) => setPwForm({ ...pwForm, newPassword: e.target.value })} />
                        <Input label="Confirm new password" type="password" required value={pwForm.confirmPassword} onChange={(e) => setPwForm({ ...pwForm, confirmPassword: e.target.value })} />
                        <Button type="submit" icon={KeyRound} loading={savingPw}>Change password</Button>
                    </form>
                </Card>
            </div>
        </AppShell>
    );
}
