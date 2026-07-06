import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { formatKSh, colorForCategory } from '../../utils/format';
import { EmptyState } from '../ui/Feedback';
import { PieChart as PieChartIcon } from 'lucide-react';

export default function SpendingPieChart({ data }) {
    if (!data || data.length === 0) {
        return (
            <EmptyState
                icon={PieChartIcon}
                title="No spending yet"
                description="Add an expense and your spending breakdown will appear here."
            />
        );
    }

    return (
        <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                    <Pie
                        data={data}
                        dataKey="total"
                        nameKey="category"
                        cx="50%"
                        cy="50%"
                        innerRadius={56}
                        outerRadius={88}
                        paddingAngle={2}
                        cornerRadius={4}
                    >
                        {data.map((entry) => (
                            <Cell key={entry.category} fill={colorForCategory(entry.category)} stroke="none" />
                        ))}
                    </Pie>
                    <Tooltip
                        formatter={(value) => formatKSh(value)}
                        contentStyle={{
                            background: 'var(--color-paper)',
                            border: '1px solid var(--color-line)',
                            borderRadius: 12,
                            fontSize: 13
                        }}
                    />
                    <Legend
                        iconType="circle"
                        iconSize={8}
                        formatter={(value) => <span style={{ color: 'var(--color-ink-soft)', fontSize: 12 }}>{value}</span>}
                    />
                </PieChart>
            </ResponsiveContainer>
        </div>
    );
}
