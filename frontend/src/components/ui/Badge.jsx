const VARIANTS = {
    success: 'bg-(--color-sage-soft) text-(--color-teal-deep)',
    warning: 'bg-(--color-gold-soft) text-[#8A6418]',
    danger: 'bg-(--color-coral-soft) text-(--color-coral)',
    neutral: 'bg-(--color-sand-deep) text-(--color-ink-soft)',
    teal: 'bg-(--color-teal-soft) text-(--color-teal-deep)',
};

export default function Badge({ children, variant = 'neutral', className = '' }) {
    return (
        <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium ${VARIANTS[variant]} ${className}`}>
            {children}
        </span>
    );
}
