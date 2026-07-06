export function Input({ label, error, className = '', id, ...rest }) {
    const inputId = id || rest.name;
    return (
        <div className={className}>
            {label && (
                <label htmlFor={inputId} className="block text-sm font-medium text-(--color-ink-soft) mb-1.5">
                    {label}
                </label>
            )}
            <input
                id={inputId}
                className={`w-full rounded-xl border bg-(--color-paper) px-3.5 py-2.5 text-sm text-(--color-ink) placeholder:text-(--color-ink-soft)/60 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-(--color-teal) ${error ? 'border-(--color-coral)' : 'border-(--color-line)'}`}
                {...rest}
            />
            {error && <p className="mt-1 text-xs text-(--color-coral)">{error}</p>}
        </div>
    );
}

export function Select({ label, error, className = '', id, children, ...rest }) {
    const selectId = id || rest.name;
    return (
        <div className={className}>
            {label && (
                <label htmlFor={selectId} className="block text-sm font-medium text-(--color-ink-soft) mb-1.5">
                    {label}
                </label>
            )}
            <select
                id={selectId}
                className={`w-full rounded-xl border bg-(--color-paper) px-3.5 py-2.5 text-sm text-(--color-ink) transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-(--color-teal) ${error ? 'border-(--color-coral)' : 'border-(--color-line)'}`}
                {...rest}
            >
                {children}
            </select>
            {error && <p className="mt-1 text-xs text-(--color-coral)">{error}</p>}
        </div>
    );
}

export function Textarea({ label, error, className = '', id, ...rest }) {
    const taId = id || rest.name;
    return (
        <div className={className}>
            {label && (
                <label htmlFor={taId} className="block text-sm font-medium text-(--color-ink-soft) mb-1.5">
                    {label}
                </label>
            )}
            <textarea
                id={taId}
                className={`w-full rounded-xl border bg-(--color-paper) px-3.5 py-2.5 text-sm text-(--color-ink) placeholder:text-(--color-ink-soft)/60 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-(--color-teal) ${error ? 'border-(--color-coral)' : 'border-(--color-line)'}`}
                {...rest}
            />
            {error && <p className="mt-1 text-xs text-(--color-coral)">{error}</p>}
        </div>
    );
}
