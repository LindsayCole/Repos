'use client';

import { Card } from '@/components/ui/Card';
import { TrendingUp, TrendingDown, Minus, LucideIcon } from 'lucide-react';
import { motion } from 'framer-motion';

interface MetricCardProps {
    title: string;
    value: string | number;
    change?: number;
    trend?: 'up' | 'down' | 'neutral';
    icon: LucideIcon;
    colorScheme?: 'cyan' | 'purple' | 'green' | 'orange' | 'red';
    loading?: boolean;
}

export default function MetricCard({
    title,
    value,
    change,
    trend = 'neutral',
    icon: Icon,
    colorScheme = 'cyan',
    loading = false,
}: MetricCardProps) {
    // Color mappings
    const colorClasses = {
        cyan: {
            icon: 'text-cyan-400',
            bg: 'bg-cyan-500/20',
            border: 'border-cyan-500/30',
        },
        purple: {
            icon: 'text-purple-400',
            bg: 'bg-purple-500/20',
            border: 'border-purple-500/30',
        },
        green: {
            icon: 'text-green-400',
            bg: 'bg-green-500/20',
            border: 'border-green-500/30',
        },
        orange: {
            icon: 'text-orange-400',
            bg: 'bg-orange-500/20',
            border: 'border-orange-500/30',
        },
        red: {
            icon: 'text-red-400',
            bg: 'bg-red-500/20',
            border: 'border-red-500/30',
        },
    };

    const colors = colorClasses[colorScheme];

    // Determine trend color
    const getTrendColor = () => {
        if (trend === 'up') return 'text-green-400';
        if (trend === 'down') return 'text-red-400';
        return 'text-slate-400';
    };

    const getTrendIcon = () => {
        if (trend === 'up') return TrendingUp;
        if (trend === 'down') return TrendingDown;
        return Minus;
    };

    const TrendIcon = getTrendIcon();

    if (loading) {
        return (
            <Card className="animate-pulse">
                <div className="space-y-3">
                    <div className="h-4 bg-slate-700 rounded w-1/2"></div>
                    <div className="h-8 bg-slate-700 rounded w-3/4"></div>
                    <div className="h-3 bg-slate-700 rounded w-1/3"></div>
                </div>
            </Card>
        );
    }

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
        >
            <Card className="relative overflow-hidden">
                <div className="flex items-start justify-between">
                    <div className="space-y-2 flex-1">
                        <p className="text-sm text-slate-400 font-medium">{title}</p>
                        <div className="flex items-baseline gap-2">
                            <motion.h3
                                initial={{ scale: 0.8 }}
                                animate={{ scale: 1 }}
                                transition={{ duration: 0.3, delay: 0.1 }}
                                className="text-3xl font-bold text-white"
                            >
                                {value}
                            </motion.h3>
                        </div>
                        {change !== undefined && (
                            <div className={`flex items-center gap-1 text-sm ${getTrendColor()}`}>
                                <TrendIcon size={16} />
                                <span className="font-medium">
                                    {change > 0 ? '+' : ''}
                                    {change}%
                                </span>
                                <span className="text-slate-500 text-xs">vs previous period</span>
                            </div>
                        )}
                    </div>
                    <div className={`p-3 rounded-xl ${colors.bg} ${colors.border} border`}>
                        <Icon size={24} className={colors.icon} />
                    </div>
                </div>
            </Card>
        </motion.div>
    );
}
