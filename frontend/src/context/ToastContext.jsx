import { createContext, useContext, useState, useCallback } from 'react';
import { CheckCircle2, AlertCircle, X } from 'lucide-react';

const ToastContext = createContext(null);

export function ToastProvider({ children }) {
    const [toasts, setToasts] = useState([]);

    const removeToast = useCallback((id) => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
    }, []);

    const showToast = useCallback((message, type = 'success') => {
        const id = Date.now() + Math.random();
        setToasts((prev) => [...prev, { id, message, type }]);
        setTimeout(() => removeToast(id), 4000);
    }, [removeToast]);

    return (
        <ToastContext.Provider value={{ showToast }}>
            {children}
            <div className="fixed bottom-5 right-5 z-[100] flex flex-col gap-2 max-w-sm">
                {toasts.map((t) => (
                    <div
                        key={t.id}
                        role="status"
                        className={`flex items-start gap-2.5 rounded-xl border px-4 py-3 shadow-lg bg-(--color-paper) animate-[fadeIn_0.2s_ease] ${
                            t.type === 'error' ? 'border-(--color-coral)' : 'border-(--color-line)'
                        }`}
                    >
                        {t.type === 'error' ? (
                            <AlertCircle size={18} className="text-(--color-coral) shrink-0 mt-0.5" />
                        ) : (
                            <CheckCircle2 size={18} className="text-(--color-teal) shrink-0 mt-0.5" />
                        )}
                        <p className="text-sm text-(--color-ink) flex-1">{t.message}</p>
                        <button onClick={() => removeToast(t.id)} className="text-(--color-ink-soft) hover:text-(--color-ink)">
                            <X size={14} />
                        </button>
                    </div>
                ))}
            </div>
        </ToastContext.Provider>
    );
}

export function useToast() {
    const ctx = useContext(ToastContext);
    if (!ctx) throw new Error('useToast must be used within a ToastProvider');
    return ctx;
}
