'use client';

import { Clock } from 'lucide-react';
import { getDeadlineStatus, getDeadlineColor, formatDeadline } from '@/lib/deadlines';

interface DeadlineIndicatorProps {
    dueDate: Date | null;
    size?: 'sm' | 'md';
}

export default function DeadlineIndicator({ dueDate, size = 'md' }: DeadlineIndicatorProps) {
    if (!dueDate) return null;

    const status = getDeadlineStatus(dueDate);
    const colors = getDeadlineColor(status);
    const formattedDeadline = formatDeadline(dueDate);

    const sizeClasses = {
        sm: 'px-2 py-1 text-xs',
        md: 'px-3 py-1.5 text-sm'
    };

    const iconSize = size === 'sm' ? 12 : 14;

    return (
        <div
            className={`inline-flex items-center gap-1.5 rounded-lg border ${colors.bg} ${colors.border} ${sizeClasses[size]} transition-all duration-200`}
        >
            <Clock size={iconSize} className={colors.text} />
            <span className={`font-medium ${colors.text}`}>
                {formattedDeadline}
            </span>
        </div>
    );
}
