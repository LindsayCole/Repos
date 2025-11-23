'use client';

import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import Link from 'next/link';
import { ReviewTask } from '@/types';
import { UI_TEXT } from '@/lib/constants';

interface ReviewTaskCardProps {
    review: ReviewTask;
    type: 'employee' | 'manager';
}

export default function ReviewTaskCard({ review, type }: ReviewTaskCardProps) {
    const isEmployee = type === 'employee';

    return (
        <div className="flex items-center justify-between p-4 bg-slate-800/50 rounded-xl border border-slate-700">
            <div>
                <h3 className="font-medium text-white">
                    {isEmployee ? review.template.title : review.employee?.name}
                </h3>
                <p className="text-sm text-slate-400">
                    {isEmployee ? UI_TEXT.STATUS_SELF_EVAL : `${review.template.title} - Manager Review`}
                </p>
            </div>
            <Link href={`/reviews/${review.id}`}>
                <Button size="sm" variant={isEmployee ? 'primary' : 'secondary'}>
                    {isEmployee ? UI_TEXT.START_REVIEW : UI_TEXT.REVIEW_ACTION}
                </Button>
            </Link>
        </div>
    );
}
