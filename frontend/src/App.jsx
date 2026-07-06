import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { ToastProvider } from './context/ToastContext';
import ProtectedRoute from './components/ProtectedRoute';

import Landing from './pages/Landing';
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import VerifyEmail from './pages/auth/VerifyEmail';

import Dashboard from './pages/student/Dashboard';
import Income from './pages/student/Income';
import Expenses from './pages/student/Expenses';
import Budgets from './pages/student/Budgets';
import BudgetDetail from './pages/student/BudgetDetail';
import Savings from './pages/student/Savings';
import Recurring from './pages/student/Recurring';
import Reports from './pages/student/Reports';
import Settings from './pages/student/Settings';

import AdminOverview from './pages/admin/AdminOverview';
import AdminUsers from './pages/admin/AdminUsers';
import AdminCategories from './pages/admin/AdminCategories';

function RoleAwareRedirect() {
    const { user, loading } = useAuth();
    if (loading) return null;
    if (!user) return <Navigate to="/login" replace />;
    return <Navigate to={user.role === 'admin' ? '/admin' : '/dashboard'} replace />;
}

export default function App() {
    return (
        <BrowserRouter>
            <ThemeProvider>
                <ToastProvider>
                    <AuthProvider>
                        <Routes>
                            {/* Public */}
                            <Route path="/" element={<Landing />} />
                            <Route path="/login" element={<Login />} />
                            <Route path="/register" element={<Register />} />
                            <Route path="/verify-email" element={<VerifyEmail />} />

                            {/* Generic post-login redirect */}
                            <Route path="/app" element={<RoleAwareRedirect />} />

                            {/* Student */}
                            <Route path="/dashboard" element={<ProtectedRoute requireRole="student"><Dashboard /></ProtectedRoute>} />
                            <Route path="/income" element={<ProtectedRoute requireRole="student"><Income /></ProtectedRoute>} />
                            <Route path="/expenses" element={<ProtectedRoute requireRole="student"><Expenses /></ProtectedRoute>} />
                            <Route path="/budgets" element={<ProtectedRoute requireRole="student"><Budgets /></ProtectedRoute>} />
                            <Route path="/budgets/:id" element={<ProtectedRoute requireRole="student"><BudgetDetail /></ProtectedRoute>} />
                            <Route path="/savings" element={<ProtectedRoute requireRole="student"><Savings /></ProtectedRoute>} />
                            <Route path="/recurring" element={<ProtectedRoute requireRole="student"><Recurring /></ProtectedRoute>} />
                            <Route path="/reports" element={<ProtectedRoute requireRole="student"><Reports /></ProtectedRoute>} />
                            <Route path="/settings" element={<ProtectedRoute requireRole="student"><Settings /></ProtectedRoute>} />

                            {/* Admin */}
                            <Route path="/admin" element={<ProtectedRoute requireRole="admin"><AdminOverview /></ProtectedRoute>} />
                            <Route path="/admin/users" element={<ProtectedRoute requireRole="admin"><AdminUsers /></ProtectedRoute>} />
                            <Route path="/admin/categories" element={<ProtectedRoute requireRole="admin"><AdminCategories /></ProtectedRoute>} />

                            {/* Fallback */}
                            <Route path="*" element={<Navigate to="/" replace />} />
                        </Routes>
                    </AuthProvider>
                </ToastProvider>
            </ThemeProvider>
        </BrowserRouter>
    );
}
