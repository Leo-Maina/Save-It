import { useEffect } from 'react';
import { X } from 'lucide-react';

export default function Modal({ open, onClose, title, children, maxWidth = 'max-w-md' }) {
    useEffect(() => {
        if (!open) return;
        const onKey = (e) => { if (e.key === 'Escape') onClose(); };
        document.addEventListener('keydown', onKey);
        document.body.style.overflow = 'hidden';
        return () => {
            document.removeEventListener('keydown', onKey);
            document.body.style.overflow = '';
        };
    }, [open, onClose]);

    if (!open) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div
                className="absolute inset-0 bg-(--color-ink)/40 backdrop-blur-[2px]"
                onClick={onClose}
                aria-hidden="true"
            />
            <div
                role="dialog"
                aria-modal="true"
                aria-labelledby="modal-title"
                className={`relative w-full ${maxWidth} max-h-[90vh] overflow-y-auto rounded-2xl bg-(--color-paper) border border-(--color-line) shadow-xl p-6`}
            >
                <div className="flex items-center justify-between mb-5">
                    <h2 id="modal-title" className="font-display text-lg font-semibold text-(--color-ink)">{title}</h2>
                    <button
                        onClick={onClose}
                        aria-label="Close"
                        className="rounded-full p-1.5 text-(--color-ink-soft) hover:bg-(--color-sand-deep) hover:text-(--color-ink) transition-colors"
                    >
                        <X size={18} />
                    </button>
                </div>
                {children}
            </div>
        </div>
    );
}
