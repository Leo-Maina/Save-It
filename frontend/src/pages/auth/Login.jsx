import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { LogIn } from 'lucide-react';
import { GoogleLogin, GoogleOAuthProvider } from '@react-oauth/google';
import { useAuth } from '../../context/AuthContext';
import { Input } from '../../components/ui/FormControls';
import Button from '../../components/ui/Button';
import { useToast } from '../../context/ToastContext';

export default function Login() {
    const { login, loginWithGoogle } = useAuth();
    const { showToast } = useToast();
    const navigate = useNavigate();

    const [form, setForm] = useState({ email: '', password: '' });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            const user = await login(form.email, form.password);
            showToast(`Welcome back, ${user.name.split(' ')[0]}.`);
            navigate(user.role === 'admin' ? '/admin' : '/dashboard');
        } catch (err) {
            setError(err.response?.data?.message || 'Could not log in. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleGoogleSuccess = async (credentialResponse) => {
        setError('');
        try {
            const user = await loginWithGoogle(credentialResponse.credential);
            showToast(`Welcome back, ${user.name.split(' ')[0]}.`);
            navigate(user.role === 'admin' ? '/admin' : '/dashboard');
        } catch (err) {
            setError(err.response?.data?.message || 'Google sign-in failed. Please try again.');
        }
    };

    return (
        <div className="min-h-screen bg-(--color-sand) flex items-center justify-center px-4 py-12">
            <div className="w-full max-w-sm">
                <Link to="/" className="flex items-center gap-2 justify-center mb-8">
                    <div className="h-8 w-8 rounded-lg bg-(--color-teal) flex items-center justify-center">
                        <span className="text-(--color-sand) font-display font-bold text-sm">S</span>
                    </div>
                    <span className="font-display font-bold text-lg">Save-It</span>
                </Link>

                <div className="bg-(--color-paper) border border-(--color-line) rounded-[1.25rem] p-7 sm:p-8">
                    <h1 className="font-display text-xl font-bold text-(--color-ink) mb-1">Welcome back</h1>
                    <p className="text-sm text-(--color-ink-soft) mb-6">Log in to keep your budget on track.</p>

                    {error && (
                        <div className="mb-4 rounded-xl bg-(--color-coral-soft) text-(--color-coral) text-sm px-3.5 py-2.5">
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <Input
                            label="Email"
                            type="email"
                            name="email"
                            autoComplete="email"
                            required
                            value={form.email}
                            onChange={(e) => setForm({ ...form, email: e.target.value })}
                            placeholder="you@strathmore.edu"
                        />
                        <Input
                            label="Password"
                            type="password"
                            name="password"
                            autoComplete="current-password"
                            required
                            value={form.password}
                            onChange={(e) => setForm({ ...form, password: e.target.value })}
                            placeholder="••••••••"
                        />
                        <Button type="submit" className="w-full" loading={loading} icon={LogIn}>
                            Log in
                        </Button>
                    </form>

                    <div className="flex items-center gap-3 my-5">
                        <div className="h-px flex-1 bg-(--color-line)" />
                        <span className="text-xs text-(--color-ink-soft)">or</span>
                        <div className="h-px flex-1 bg-(--color-line)" />
                    </div>

                    <div className="flex justify-center">
                        {googleClientId ? (
                            <GoogleOAuthProvider clientId={googleClientId}>
                                <GoogleLogin
                                    onSuccess={handleGoogleSuccess}
                                    onError={() => setError('Google sign-in failed. Please try again.')}
                                    theme="outline"
                                    shape="pill"
                                    width="304"
                                />
                            </GoogleOAuthProvider>
                        ) : (
                            <div className="text-xs text-(--color-ink-soft)">
                                Google sign-in is unavailable. Missing VITE_GOOGLE_CLIENT_ID.
                            </div>
                        )}
                    </div>

                    <p className="text-sm text-(--color-ink-soft) text-center mt-6">
                        New to Save-It?{' '}
                        <Link to="/register" className="text-(--color-teal) font-medium hover:underline">
                            Create an account
                        </Link>
                    </p>
                </div>

                <div className="mt-5 rounded-xl bg-(--color-sand-deep) px-4 py-3 text-xs text-(--color-ink-soft) text-center">
                    Demo login — <span className="font-mono-num">leonel.maina@strathmore.edu</span> / <span className="font-mono-num">Password123!</span>
                </div>
            </div>
        </div>
    );
}