'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { Calendar } from 'lucide-react';

interface TimeRangeSelectorProps {
    currentRange: string;
}

export default function TimeRangeSelector({ currentRange }: TimeRangeSelectorProps) {
    const router = useRouter();
    const searchParams = useSearchParams();

    const timeRanges = [
        { value: '30', label: 'Last 30 days' },
        { value: '90', label: 'Last 90 days' },
        { value: '365', label: 'Last year' },
        { value: 'all', label: 'All time' },
    ];

    const handleChange = (value: string) => {
        const params = new URLSearchParams(searchParams.toString());
        if (value === 'all') {
            params.delete('timeRange');
        } else {
            params.set('timeRange', value);
        }
        router.push(`/analytics?${params.toString()}`);
    };

    return (
        <div className="flex items-center gap-2 bg-slate-900/50 backdrop-blur-xl border border-slate-800 rounded-lg px-4 py-2">
            <Calendar size={18} className="text-slate-400" />
            <select
                value={currentRange}
                onChange={(e) => handleChange(e.target.value)}
                className="bg-transparent text-white text-sm font-medium outline-none cursor-pointer"
            >
                {timeRanges.map((range) => (
                    <option key={range.value} value={range.value} className="bg-slate-900 text-white">
                        {range.label}
                    </option>
                ))}
            </select>
        </div>
    );
}
