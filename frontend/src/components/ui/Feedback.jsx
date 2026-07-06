export function Spinner({ size = 24, className = '' }) {
    return (
        <div
            className={`rounded-full border-2 border-(--color-line) border-t-(--color-teal) animate-spin ${className}`}
            style={{ width: size, height: size }}
            role="status"
            aria-label="Loading"
        />
    );
}

export function PageLoader({ message = 'Loading…' }) {
    return (
        <div className="flex flex-col items-center justify-center gap-3 py-24 text-(--color-ink-soft)">
            <Spinner size={28} />
            <p className="text-sm">{message}</p>
        </div>
    );
}

export function EmptyState({ icon: Icon, title, description, action }) {
    return (
        <div className="flex flex-col items-center justify-center text-center gap-3 py-12 px-4">
            {Icon && (
                <div className="h-12 w-12 rounded-full bg-(--color-sand-deep) flex items-center justify-center text-(--color-ink-soft)">
                    <Icon size={22} strokeWidth={1.75} />
                </div>
            )}
            <div>
                <p className="font-display font-semibold text-(--color-ink)">{title}</p>
                {description && <p className="text-sm text-(--color-ink-soft) mt-1 max-w-xs mx-auto">{description}</p>}
            </div>
            {action}
        </div>
    );
}
