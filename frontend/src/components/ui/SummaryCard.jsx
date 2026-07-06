import Card from '../ui/Card';

export default function SummaryCard({ icon: Icon, label, value, tone = 'neutral', sub }) {
    const tones = {
        teal: 'bg-(--color-teal-soft) text-(--color-teal-deep)',
        coral: 'bg-(--color-coral-soft) text-(--color-coral)',
        sage: 'bg-(--color-sage-soft) text-(--color-teal-deep)',
        gold: 'bg-(--color-gold-soft) text-[#8A6418]',
        neutral: 'bg-(--color-sand-deep) text-(--color-ink-soft)',
    };

    return (
        <Card className="flex flex-col gap-3">
            <div className={`h-9 w-9 rounded-full flex items-center justify-center ${tones[tone]}`}>
                <Icon size={17} strokeWidth={2} />
            </div>
            <div>
                <p className="text-xs text-(--color-ink-soft) mb-1">{label}</p>
                <p className="font-mono-num font-display text-2xl font-bold text-(--color-ink) leading-tight">{value}</p>
                {sub && <p className="text-xs text-(--color-ink-soft) mt-1">{sub}</p>}
            </div>
        </Card>
    );
}
