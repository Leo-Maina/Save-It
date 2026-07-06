import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { authService } from '../services/services';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
    const [user, setUser] = useState(() => {
        const stored = localStorage.getItem('saveit_user');
        return stored ? JSON.parse(stored) : null;
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const token = localStorage.getItem('saveit_token');
        if (!token) {
            setLoading(false);
            return;
        }
        // Validate token against the server and refresh profile data
        authService.getProfile()
            .then((res) => {
                setUser(res.data.user);
                localStorage.setItem('saveit_user', JSON.stringify(res.data.user));
            })
            .catch(() => {
                localStorage.removeItem('saveit_token');
                localStorage.removeItem('saveit_user');
                setUser(null);
            })
            .finally(() => setLoading(false));
    }, []);

    const login = useCallback(async (email, password) => {
        const res = await authService.login({ email, password });
        localStorage.setItem('saveit_token', res.data.token);
        localStorage.setItem('saveit_user', JSON.stringify(res.data.user));
        setUser(res.data.user);
        return res.data.user;
    }, []);

    const register = useCallback(async (payload) => {
        const res = await authService.register(payload);
        return res.data;
    }, []);

    const logout = useCallback(() => {
        localStorage.removeItem('saveit_token');
        localStorage.removeItem('saveit_user');
        setUser(null);
    }, []);

    const updateUser = useCallback((updatedUser) => {
        setUser(updatedUser);
        localStorage.setItem('saveit_user', JSON.stringify(updatedUser));
    }, []);

    return (
        <AuthContext.Provider value={{ user, loading, login, register, logout, updateUser }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const ctx = useContext(AuthContext);
    if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
    return ctx;
}
