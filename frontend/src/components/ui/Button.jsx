const VARIANTS = {
    primary: 'bg-(--color-teal) text-(--color-sand) hover:bg-(--color-teal-deep) focus-visible:ring-(--color-teal)',
    secondary: 'bg-(--color-sand-deep) text-(--color-ink) hover:bg-(--color-line) focus-visible:ring-(--color-ink-soft)',
    outline: 'border border-(--color-line) text-(--color-ink) hover:bg-(--color-sand-deep) focus-visible:ring-(--color-ink-soft)',
    ghost: 'text-(--color-ink-soft) hover:bg-(--color-sand-deep) hover:text-(--color-ink)',
    danger: 'bg-(--color-coral) text-white hover:opacity-90 focus-visible:ring-(--color-coral)',
};

const SIZES = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2.5 text-sm',
    lg: 'px-6 py-3 text-base',
};

export default function Button({
    children,
    variant = 'primary',
    size = 'md',
    className = '',
    type = 'button',
    disabled = false,
    loading = false,
    icon: Icon,
    ...rest
}) {
    return (
        <button
            type={type}
            disabled={disabled || loading}
            className={`inline-flex items-center justify-center gap-2 rounded-full font-medium transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-(--color-sand) disabled:opacity-50 disabled:cursor-not-allowed ${VARIANTS[variant]} ${SIZES[size]} ${className}`}
            {...rest}
        >
            {loading ? (
                <span className="h-4 w-4 rounded-full border-2 border-current border-t-transparent animate-spin" />
            ) : Icon ? (
                <Icon size={16} strokeWidth={2.25} />
            ) : null}
            {children}
        </button>
    );
}
