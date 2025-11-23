'use client';

import { Card } from '@/components/ui/Card';
import { ActionItemWithReview } from '@/types';
import { UI_TEXT } from '@/lib/constants';
import Link from 'next/link';
import { Calendar, ChevronRight } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

interface ActionItemsWidgetProps {
    actionItems: ActionItemWithReview[];
}

export default function ActionItemsWidget({ actionItems }: ActionItemsWidgetProps) {
    const pendingOrInProgressItems = actionItems.filter(
        item => item.status === 'PENDING' || item.status === 'IN_PROGRESS'
    );

    // Sort by target date (soonest first, null dates last)
    const sortedItems = [...pendingOrInProgressItems].sort((a, b) => {
        if (!a.targetDate && !b.targetDate) return 0;
        if (!a.targetDate) return 1;
        if (!b.targetDate) return -1;
        return new Date(a.targetDate).getTime() - new Date(b.targetDate).getTime();
    });

    const topItems = sortedItems.slice(0, 5);

    const getPriorityColor = (priority: string) => {
        switch (priority) {
            case 'HIGH':
                return 'text-red-400';
            case 'MEDIUM':
                return 'text-orange-400';
            case 'LOW':
                return 'text-blue-400';
            default:
                return 'text-slate-400';
        }
    };

    const isOverdue = (targetDate: Date | null) => {
        return targetDate && new Date(targetDate) < new Date();
    };

    return (
        <Card className="space-y-4">
            {/* Header */}
            <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-cyan-400">
                    {UI_TEXT.MY_ACTION_ITEMS}
                </h2>
                <div className="text-sm text-slate-400">
                    {pendingOrInProgressItems.length} active
                </div>
            </div>

            {/* Action Items List */}
            {topItems.length === 0 ? (
                <div className="text-center py-8 bg-slate-800/20 border border-slate-700 rounded-lg">
                    <p className="text-slate-400 text-sm">
                        No active action items. Great job!
                    </p>
                </div>
            ) : (
                <div className="space-y-2">
                    {topItems.map(item => (
                        <Link
                            key={item.id}
                            href={`/reviews/${item.reviewId}`}
                            className="block"
                        >
                            <div className={cn(
                                "p-3 bg-slate-800/30 border rounded-lg hover:bg-slate-800/50 transition-all group",
                                isOverdue(item.targetDate) ? "border-red-500/30" : "border-slate-700"
                            )}>
                                <div className="flex items-start gap-2">
                                    <div className="flex-1 min-w-0">
                                        {/* Title and Priority */}
                                        <div className="flex items-start gap-2 mb-1">
                                            <span className={cn(
                                                "text-xs font-medium flex-shrink-0",
                                                getPriorityColor(item.priority)
                                            )}>
                                                {item.priority}
                                            </span>
                                            <h4 className="text-sm font-medium text-slate-200 line-clamp-1 flex-1">
                                                {item.title}
                                            </h4>
                                        </div>

                                        {/* Review Name */}
                                        <p className="text-xs text-slate-400 mb-1">
                                            {item.review.template.title}
                                        </p>

                                        {/* Target Date */}
                                        {item.targetDate && (
                                            <div className={cn(
                                                "flex items-center gap-1 text-xs",
                                                isOverdue(item.targetDate) ? "text-red-400" : "text-slate-500"
                                            )}>
                                                <Calendar size={12} />
                                                <span>
                                                    {isOverdue(item.targetDate) && 'Overdue: '}
                                                    {format(new Date(item.targetDate), 'MMM d, yyyy')}
                                                </span>
                                            </div>
                                        )}
                                    </div>

                                    {/* Arrow Icon */}
                                    <ChevronRight
                                        size={16}
                                        className="text-slate-500 group-hover:text-cyan-400 transition-colors flex-shrink-0 mt-1"
                                    />
                                </div>
                            </div>
                        </Link>
                    ))}
                </div>
            )}

            {/* View All Link */}
            {pendingOrInProgressItems.length > 5 && (
                <div className="pt-2 border-t border-slate-700">
                    <Link
                        href="/dashboard"
                        className="text-sm text-cyan-400 hover:text-cyan-300 transition-colors flex items-center justify-center gap-1"
                    >
                        {UI_TEXT.VIEW_ALL_ACTION_ITEMS}
                        <ChevronRight size={14} />
                    </Link>
                </div>
            )}
        </Card>
    );
}
