'use client';

import { Card } from '@/components/ui/Card';
import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';

interface MetricData {
    label: string;
    value: number;
    color: string;
}

interface PerformanceChartProps {
    userId?: string;
    metrics?: MetricData[];
}

export default function PerformanceChart({ userId, metrics }: PerformanceChartProps) {
    const [data, setData] = useState<MetricData[]>(metrics || [
        { label: 'Behaviour', value: 0, color: 'bg-primary' },
        { label: 'Results', value: 0, color: 'bg-slate-500' },
        { label: 'Overall', value: 0, color: 'bg-slate-900 dark:bg-slate-100' },
    ]);

    useEffect(() => {
        if (metrics) {
            setData(metrics);
        } else if (userId) {
            // Fetch real data from API
            fetch(`/api/performance-metrics?userId=${userId}`)
                .then(res => res.json())
                .then(fetchedData => setData(fetchedData))
                .catch(() => {
                    // Fallback to demo data
                    setData([
                        { label: 'Behaviour', value: 3.2, color: 'bg-primary' },
                        { label: 'Results', value: 3.5, color: 'bg-slate-500' },
                        { label: 'Overall', value: 3.35, color: 'bg-slate-900 dark:bg-slate-100' },
                    ]);
                });
        }
    }, [userId, metrics]);

    const maxValue = 4; // Our scale is 1-4

    return (
        <Card>
            <h2 className="text-xl font-semibold text-foreground mb-6">Performance Overview</h2>
            <div className="space-y-4">
                {data.map((metric, index) => (
                    <div key={metric.label}>
                        <div className="flex justify-between text-sm mb-2">
                            <span className="text-muted-foreground">{metric.label}</span>
                            <span className="text-foreground font-semibold">{metric.value.toFixed(1)} / {maxValue}</span>
                        </div>
                        <div className="w-full bg-secondary h-2 rounded-full overflow-hidden">
                            <motion.div
                                className={`${metric.color} h-full rounded-full`}
                                initial={{ width: 0 }}
                                animate={{ width: `${(metric.value / maxValue) * 100}%` }}
                                transition={{ duration: 1, delay: index * 0.2, ease: 'easeOut' }}
                            />
                        </div>
                    </div>
                ))}
            </div>
        </Card>
    );
}
