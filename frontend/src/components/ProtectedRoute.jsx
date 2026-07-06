import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { PageLoader } from '../components/ui/Feedback';

export default function ProtectedRoute({ children, requireRole }) {
    const { user, loading } = useAuth();

    if (loading) return <PageLoader message="Checking your session…" />;
    if (!user) return <Navigate to="/login" replace />;
    if (requireRole && user.role !== requireRole) return <Navigate to="/dashboard" replace />;

    return children;
}
