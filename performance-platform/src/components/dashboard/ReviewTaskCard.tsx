'use client';

import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import Link from 'next/link';
import { ReviewTask } from '@/types';
import { UI_TEXT } from '@/lib/constants';
import DeadlineIndicator from '@/components/ui/DeadlineIndicator';
import { Calendar } from 'lucide-react';

interface ReviewTaskCardProps {
    review: ReviewTask;
    type: 'employee' | 'manager';
}

export default function ReviewTaskCard({ review, type }: ReviewTaskCardProps) {
    const isEmployee = type === 'employee';
    const hasDraft = review.isDraft && review.responses && review.responses.length > 0;

    return (
        <div className="flex items-center justify-between p-4 bg-slate-800/50 rounded-xl border border-slate-700">
            <div className="flex items-center gap-3 flex-1">
                {hasDraft && (
                    <div className="w-2 h-2 rounded-full bg-blue-400 animate-pulse flex-shrink-0" />
                )}
                <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <h3 className="font-medium text-white">
                            {isEmployee ? review.template.title : review.employee?.name}
                        </h3>
                        {hasDraft && (
                            <span className="inline-flex items-center px-2 py-0.5 bg-blue-500/20 text-blue-300 border border-blue-500/30 rounded text-xs font-medium">
                                Draft in progress
                            </span>
                        )}
                        {review.cycle && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-purple-500/20 text-purple-300 border border-purple-500/30 rounded text-xs font-medium">
                                <Calendar size={12} />
                                {review.cycle.name}
                            </span>
                        )}
                    </div>
                    <p className="text-sm text-slate-400 mb-2">
                        {isEmployee ? UI_TEXT.STATUS_SELF_EVAL : `${review.template.title} - Manager Review`}
                    </p>
                    {review.dueDate && (
                        <DeadlineIndicator dueDate={new Date(review.dueDate)} size="sm" />
                    )}
                </div>
            </div>
            <Link href={`/reviews/${review.id}`}>
                <Button size="sm" variant={isEmployee ? 'primary' : 'secondary'}>
                    {isEmployee ? UI_TEXT.START_REVIEW : UI_TEXT.REVIEW_ACTION}
                </Button>
            </Link>
        </div>
    );
}
