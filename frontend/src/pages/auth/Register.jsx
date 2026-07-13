import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { UserPlus, Mail, ExternalLink } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { Input, Select } from '../../components/ui/FormControls';
import Button from '../../components/ui/Button';

const YEARS = [1, 2, 3, 4, 5, 6];

export default function Register() {
    const { register } = useAuth();
    const navigate = useNavigate();

    const [form, setForm] = useState({
        name: '', email: '', password: '', confirmPassword: '',
        phone: '', university: '', studentId: '', course: '', yearOfStudy: ''
    });
    const [errors, setErrors] = useState({});
    const [loading, setLoading] = useState(false);
    const [successState, setSuccessState] = useState(null); // { devVerificationLink }

    const handleChange = (field) => (e) => setForm({ ...form, [field]: e.target.value });

    const validate = () => {
        const errs = {};
        if (!form.name.trim()) errs.name = 'Full name is required.';
        if (!/^\S+@\S+\.\S+$/.test(form.email)) errs.email = 'Enter a valid email address.';
        if (form.password.length < 8) errs.password = 'Password must be at least 8 characters.';
        if (form.password !== form.confirmPassword) errs.confirmPassword = 'Passwords do not match.';
        setErrors(errs);
        return Object.keys(errs).length === 0;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!validate()) return;
        setLoading(true);
        try {
            const result = await register({
                name: form.name,
                email: form.email,
                password: form.password,
                phone: form.phone || undefined,
                university: form.university || undefined,
                studentId: form.studentId || undefined,
                course: form.course || undefined,
                yearOfStudy: form.yearOfStudy ? Number(form.yearOfStudy) : undefined
            });
            setSuccessState(result);
        } catch (err) {
            const apiErrors = err.response?.data?.errors;
            if (apiErrors) {
                const mapped = {};
                apiErrors.forEach((e) => { mapped[e.field] = e.message; });
                setErrors(mapped);
            } else {
                setErrors({ form: err.response?.data?.message || 'Registration failed. Please try again.' });
            }
        } finally {
            setLoading(false);
        }
    };

    if (successState) {
        return (
            <div className="min-h-screen bg-(--color-sand) flex items-center justify-center px-4 py-12">
                <div className="w-full max-w-sm bg-(--color-paper) border border-(--color-line) rounded-[1.25rem] p-7 sm:p-8 text-center">
                    <div className="h-12 w-12 rounded-full bg-(--color-sage-soft) flex items-center justify-center mx-auto mb-4">
                        <Mail size={22} className="text-(--color-teal-deep)" />
                    </div>
                    <h1 className="font-display text-xl font-bold text-(--color-ink) mb-2">Check your inbox</h1>
                    <p className="text-sm text-(--color-ink-soft) mb-5">
                        We've sent a verification link to <strong className="text-(--color-ink)">{form.email}</strong>.
                        Verify your account, then log in.
                    </p>

                    <div className="rounded-xl bg-(--color-gold-soft) text-left px-4 py-3.5 mb-5">
                        <p className="text-xs font-semibold text-[#8A6418] mb-1.5">Development note</p>
                        <p className="text-xs text-(--color-ink-soft) mb-2.5 leading-relaxed">
                            Email sending isn't connected in this build. Use the link below to verify your account directly.
                        </p>
                        <a
                            href={successState.devVerificationLink}
                            className="inline-flex items-center gap-1.5 text-xs font-medium text-(--color-teal) hover:underline break-all"
                        >
                            <ExternalLink size={12} className="shrink-0" /> Verify my account now
                        </a>
                    </div>

                    <Button
                        onClick={() => navigate('/login')}
                        className="w-full"
                        icon={UserPlus}
                    >
                        Go to login
                    </Button>

                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-(--color-sand) flex items-center justify-center px-4 py-12">
            <div className="w-full max-w-md">
                <Link to="/" className="flex items-center gap-2 justify-center mb-8">
                    <div className="h-8 w-8 rounded-lg bg-(--color-teal) flex items-center justify-center">
                        <span className="text-(--color-sand) font-display font-bold text-sm">S</span>
                    </div>
                    <span className="font-display font-bold text-lg">Save-It</span>
                </Link>

                <div className="bg-(--color-paper) border border-(--color-line) rounded-[1.25rem] p-7 sm:p-8">
                    <h1 className="font-display text-xl font-bold text-(--color-ink) mb-1">Create your account</h1>
                    <p className="text-sm text-(--color-ink-soft) mb-6">Set up your student budget in a couple of minutes.</p>

                    {errors.form && (
                        <div className="mb-4 rounded-xl bg-(--color-coral-soft) text-(--color-coral) text-sm px-3.5 py-2.5">
                            {errors.form}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <Input label="Full name" required value={form.name} onChange={handleChange('name')} error={errors.name} placeholder="Jane Wanjiru" />
                        <Input label="Email" type="email" required value={form.email} onChange={handleChange('email')} error={errors.email} placeholder="you@strathmore.edu" />

                        <div className="grid grid-cols-2 gap-3">
                            <Input label="Password" type="password" required value={form.password} onChange={handleChange('password')} error={errors.password} placeholder="At least 8 characters" />
                            <Input label="Confirm password" type="password" required value={form.confirmPassword} onChange={handleChange('confirmPassword')} error={errors.confirmPassword} />
                        </div>

                        <Input label="Phone number" value={form.phone} onChange={handleChange('phone')} placeholder="07XX XXX XXX" />

                        <div className="h-px bg-(--color-line) my-1" />
                        <p className="text-xs font-medium text-(--color-ink-soft) uppercase tracking-wide">Academic details (optional)</p>

                        <Input label="University" value={form.university} onChange={handleChange('university')} placeholder="Strathmore University" />
                        <div className="grid grid-cols-2 gap-3">
                            <Input label="Student ID" value={form.studentId} onChange={handleChange('studentId')} placeholder="192227" />
                            <Select label="Year of study" value={form.yearOfStudy} onChange={handleChange('yearOfStudy')}>
                                <option value="">Select</option>
                                {YEARS.map((y) => <option key={y} value={y}>Year {y}</option>)}
                            </Select>
                        </div>
                        <Input label="Course" value={form.course} onChange={handleChange('course')} placeholder="Informatics and Computer Science" />

                        <Button type="submit" className="w-full mt-2" loading={loading} icon={UserPlus}>
                            Create account
                        </Button>
                    </form>

                    <p className="text-sm text-(--color-ink-soft) text-center mt-6">
                        Already have an account?{' '}
                        <Link to="/login" className="text-(--color-teal) font-medium hover:underline">
                            Log in
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    );
}
