/**
 * ProgressRing — the app's signature visual motif.
 * Used for budget usage and savings goal progress: a "filling jar"
 * feel rather than a clinical linear progress bar.
 */
export default function ProgressRing({
    percent = 0,
    size = 88,
    strokeWidth = 9,
    color,
    label,
    sublabel,
    overBudget = false
}) {
    const clamped = Math.max(0, Math.min(100, percent));
    const radius = (size - strokeWidth) / 2;
    const circumference = 2 * Math.PI * radius;
    const offset = circumference - (clamped / 100) * circumference;

    const ringColor = color || (overBudget ? 'var(--color-coral)' : clamped > 85 ? 'var(--color-gold)' : 'var(--color-teal)');

    return (
        <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
            <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="-rotate-90">
                <circle
                    className="progress-ring-track"
                    cx={size / 2}
                    cy={size / 2}
                    r={radius}
                    strokeWidth={strokeWidth}
                />
                <circle
                    className="progress-ring-fill"
                    cx={size / 2}
                    cy={size / 2}
                    r={radius}
                    strokeWidth={strokeWidth}
                    stroke={ringColor}
                    strokeDasharray={circumference}
                    strokeDashoffset={offset}
                />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="font-mono-num text-sm font-semibold text-(--color-ink) leading-none">
                    {label ?? `${Math.round(clamped)}%`}
                </span>
                {sublabel && <span className="text-[10px] text-(--color-ink-soft) mt-1">{sublabel}</span>}
            </div>
        </div>
    );
}
