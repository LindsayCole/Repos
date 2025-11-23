import { cn } from '@/lib/utils';
import { UI_TEXT } from '@/lib/constants';
import React from 'react';

interface StatusBadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
    status: 'PENDING_EMPLOYEE' | 'PENDING_MANAGER' | 'COMPLETED';
    size?: 'sm' | 'md';
}

export function StatusBadge({
    status,
    size = 'md',
    className,
    ...props
}: StatusBadgeProps) {
    const statusConfig = {
        PENDING_EMPLOYEE: {
            text: UI_TEXT.STATUS_SELF_EVAL,
            colors: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
        },
        PENDING_MANAGER: {
            text: UI_TEXT.STATUS_MANAGER_REVIEW,
            colors: 'bg-orange-500/20 text-orange-300 border-orange-500/30',
        },
        COMPLETED: {
            text: UI_TEXT.STATUS_COMPLETED,
            colors: 'bg-green-500/20 text-green-300 border-green-500/30',
        },
    };

    const sizes = {
        sm: 'px-2 py-0.5 text-xs',
        md: 'px-2 py-1 text-xs',
    };

    const config = statusConfig[status];

    return (
        <span
            className={cn(
                'inline-flex items-center justify-center rounded border font-medium whitespace-nowrap',
                config.colors,
                sizes[size],
                className
            )}
            {...props}
        >
            {config.text}
        </span>
    );
}
