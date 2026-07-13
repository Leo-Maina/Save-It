import { Link } from 'react-router-dom';
import { Wallet, PieChart, Target, Bell, ArrowRight } from 'lucide-react';

const FEATURES = [
    {
        icon: Wallet,
        title: 'Track every shilling',
        description: 'Log allowances, bursaries and part-time earnings alongside food, transport and rent — built for how student money actually moves.'
    },
    {
        icon: PieChart,
        title: 'Budgets that suggest themselves',
        description: 'Tell Save-It your income and it proposes a sensible split across food, transport, academics and savings — yours to adjust.'
    },
    {
        icon: Target,
        title: 'Goals you can see filling up',
        description: 'Save toward a laptop, rent deposit, or trip with clear progress and a deadline that keeps you honest.'
    },
    {
        icon: Bell,
        title: 'Alerts before you overspend',
        description: 'A nudge at 80% of any budget category, and a heads-up before rent or subscriptions are due.'
    }
];

export default function Landing() {
    return (
        <div className="min-h-screen bg-(--color-sand)">
            <header className="px-6 sm:px-10 h-20 flex items-center justify-between max-w-7xl mx-auto">
                <div className="flex items-center gap-2">
                    <div className="h-8 w-8 rounded-lg bg-(--color-teal) flex items-center justify-center">
                        <span className="text-(--color-sand) font-display font-bold text-sm">S</span>
                    </div>
                    <span className="font-display font-bold text-lg">Save-It</span>
                </div>
                <div className="flex items-center gap-3">
                    <Link to="/login" className="text-sm font-medium text-(--color-ink-soft) hover:text-(--color-ink) px-3 py-2">
                        Log in
                    </Link>
                    <Link
                        to="/register"
                        className="text-sm font-medium bg-(--color-teal) text-(--color-sand) px-4 py-2.5 rounded-full hover:bg-(--color-teal-deep) transition-colors"
                    >
                        Get started
                    </Link>
                </div>
            </header>

            <section className="px-6 sm:px-10 max-w-7xl mx-auto pt-16 pb-20 sm:pt-24 sm:pb-28 grid lg:grid-cols-2 gap-12 items-center">
                <div>
                    <span className="inline-flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide text-(--color-teal-deep) bg-(--color-teal-soft) px-3 py-1.5 rounded-full mb-6">
                        Built for Kenyan university students
                    </span>
                    <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl font-bold leading-[1.05] text-(--color-ink) mb-6">
                        Make your allowance
                        <br />
                        <span className="text-(--color-teal)">last the whole term.</span>
                    </h1>
                    <p className="text-lg text-(--color-ink-soft) max-w-md mb-8 leading-relaxed">
                        Save-It tracks income, expenses, budgets and savings goals in Kenyan Shillings —
                        designed around allowances, bursaries and semester cycles, not salaried adults.
                    </p>
                    <div className="flex flex-wrap items-center gap-4">
                        <Link
                            to="/register"
                            className="inline-flex items-center gap-2 bg-(--color-teal) text-(--color-sand) px-6 py-3.5 rounded-full font-medium hover:bg-(--color-teal-deep) transition-colors"
                        >
                            Create your free account <ArrowRight size={16} />
                        </Link>
                        <Link to="/login" className="text-(--color-ink-soft) hover:text-(--color-ink) font-medium px-2">
                            I already have an account
                        </Link>
                    </div>
                </div>

                <div className="relative">
                    <div className="bg-(--color-paper) border border-(--color-line) rounded-[1.5rem] p-6 sm:p-8 shadow-sm">
                        <p className="text-xs font-medium text-(--color-ink-soft) uppercase tracking-wide mb-1">Current balance</p>
                        <p className="font-mono-num font-display text-4xl font-bold text-(--color-ink) mb-6">KSh 17,600</p>
                        <div className="grid grid-cols-2 gap-4 mb-6">
                            <div className="rounded-xl bg-(--color-sage-soft) p-4">
                                <p className="text-xs text-(--color-ink-soft) mb-1">Income (June)</p>
                                <p className="font-mono-num font-semibold text-(--color-teal-deep)">KSh 28,000</p>
                            </div>
                            <div className="rounded-xl bg-(--color-coral-soft) p-4">
                                <p className="text-xs text-(--color-ink-soft) mb-1">Spent (June)</p>
                                <p className="font-mono-num font-semibold text-(--color-coral)">KSh 10,400</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3 rounded-xl border border-(--color-line) p-4">
                            <div className="h-10 w-10 rounded-full bg-(--color-gold-soft) flex items-center justify-center shrink-0">
                                <Target size={18} className="text-(--color-gold)" />
                            </div>
                            <div className="flex-1">
                                <p className="text-sm font-medium text-(--color-ink)">Laptop fund</p>
                                <div className="h-1.5 rounded-full bg-(--color-sand-deep) mt-1.5 overflow-hidden">
                                    <div className="h-full rounded-full bg-(--color-gold)" style={{ width: '22.5%' }} />
                                </div>
                            </div>
                            <span className="text-xs font-mono-num text-(--color-ink-soft)">22.5%</span>
                        </div>
                    </div>
                </div>
            </section>

            <section className="px-6 sm:px-10 max-w-7xl mx-auto pb-24">
                <h2 className="font-display text-2xl sm:text-3xl font-bold text-center mb-12">
                    Everything a student budget actually needs
                </h2>
                <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
                    {FEATURES.map(({ icon: Icon, title, description }) => (
                        <div
                            key={title}
                            className="bg-(--color-paper) border border-(--color-line) rounded-2xl p-6 transition-all duration-200 hover:-translate-y-1 hover:shadow-md"
                 >
                            <div className="h-10 w-10 rounded-full bg-(--color-teal-soft) flex items-center justify-center mb-4">
                                <Icon size={18} className="text-(--color-teal-deep)" />
                            </div>
                            <h3 className="font-display font-semibold text-(--color-ink) mb-2">{title}</h3>
                            <p className="text-sm text-(--color-ink-soft) leading-relaxed">{description}</p>
                        </div>
                    ))}
                </div>
            </section>

            <footer className="border-t border-(--color-line) py-8 px-6 sm:px-10">
                <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 text-sm text-(--color-ink-soft)">
                    <span>Save-It — a student budgeting project, Strathmore University.</span>
                    <span>All amounts in Kenyan Shillings (KSh)</span>
                </div>
            </footer>
        </div>
    );
}
