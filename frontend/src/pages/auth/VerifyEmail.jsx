import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { CheckCircle2, XCircle, Loader2 } from 'lucide-react';
import { authService } from '../../services/services';
import Button from '../../components/ui/Button';

export default function VerifyEmail() {
    const [searchParams] = useSearchParams();
    const token = searchParams.get('token');
    const [status, setStatus] = useState('verifying'); // verifying | success | error
    const [message, setMessage] = useState('');

    useEffect(() => {
        if (!token) {
            setStatus('error');
            setMessage('No verification token was provided.');
            return;
        }
        authService.verifyEmail(token)
            .then((res) => {
                setStatus('success');
                setMessage(res.data.message);
            })
            .catch((err) => {
                setStatus('error');
                setMessage(err.response?.data?.message || 'Verification failed.');
            });
    }, [token]);

    return (
        <div className="min-h-screen bg-(--color-sand) flex items-center justify-center px-4 py-12">
            <div className="w-full max-w-sm bg-(--color-paper) border border-(--color-line) rounded-[1.25rem] p-7 sm:p-8 text-center">
                {status === 'verifying' && (
                    <>
                        <Loader2 size={32} className="text-(--color-teal) animate-spin mx-auto mb-4" />
                        <h1 className="font-display text-lg font-bold text-(--color-ink)">Verifying your account…</h1>
                    </>
                )}
                {status === 'success' && (
                    <>
                        <CheckCircle2 size={36} className="text-(--color-teal) mx-auto mb-4" />
                        <h1 className="font-display text-xl font-bold text-(--color-ink) mb-2">Email verified</h1>
                        <p className="text-sm text-(--color-ink-soft) mb-6">{message}</p>
                        <Link to="/login">
                            <Button className="w-full">Go to login</Button>
                        </Link>
                    </>
                )}
                {status === 'error' && (
                    <>
                        <XCircle size={36} className="text-(--color-coral) mx-auto mb-4" />
                        <h1 className="font-display text-xl font-bold text-(--color-ink) mb-2">Verification failed</h1>
                        <p className="text-sm text-(--color-ink-soft) mb-6">{message}</p>
                        <Link to="/login">
                            <Button variant="outline" className="w-full">Back to login</Button>
                        </Link>
                    </>
                )}
            </div>
        </div>
    );
}
