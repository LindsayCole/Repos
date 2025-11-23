'use client';

import { CheckCircle2, Clock, AlertCircle } from 'lucide-react';

interface CycleProgressChartProps {
    total: number;
    completed: number;
    pendingEmployee: number;
    pendingManager: number;
    completionRate: number;
}

export default function CycleProgressChart({
    total,
    completed,
    pendingEmployee,
    pendingManager,
    completionRate,
}: CycleProgressChartProps) {
    const stats = [
        {
            label: 'Completed',
            value: completed,
            color: 'bg-green-500',
            icon: CheckCircle2,
            textColor: 'text-green-400',
        },
        {
            label: 'Pending Employee',
            value: pendingEmployee,
            color: 'bg-blue-500',
            icon: Clock,
            textColor: 'text-blue-400',
        },
        {
            label: 'Pending Manager',
            value: pendingManager,
            color: 'bg-orange-500',
            icon: AlertCircle,
            textColor: 'text-orange-400',
        },
    ];

    return (
        <div className="space-y-6">
            {/* Overall Progress */}
            <div className="space-y-3">
                <div className="flex items-center justify-between">
                    <span className="text-slate-400">Overall Completion</span>
                    <span className="text-2xl font-bold text-white">{completionRate}%</span>
                </div>
                <div className="w-full bg-slate-700 h-4 rounded-full overflow-hidden">
                    <div
                        className="h-full bg-gradient-to-r from-green-500 to-cyan-500 rounded-full transition-all"
                        style={{ width: `${completionRate}%` }}
                    />
                </div>
                <div className="text-sm text-slate-500">
                    {completed} of {total} reviews completed
                </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {stats.map((stat) => {
                    const Icon = stat.icon;
                    return (
                        <div
                            key={stat.label}
                            className="p-4 bg-slate-800/30 rounded-lg border border-slate-800"
                        >
                            <div className="flex items-center gap-3 mb-2">
                                <div className={`p-2 ${stat.color}/10 rounded-lg`}>
                                    <Icon className={`w-4 h-4 ${stat.textColor}`} />
                                </div>
                                <span className="text-sm text-slate-400">{stat.label}</span>
                            </div>
                            <div className="text-2xl font-bold text-white">{stat.value}</div>
                            <div className="text-xs text-slate-500 mt-1">
                                {total > 0 ? Math.round((stat.value / total) * 100) : 0}% of total
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
