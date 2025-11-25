'use client';

import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import Link from 'next/link';
import { ReviewTask } from '@/types';

interface ReviewTaskCardProps {
    review: ReviewTask;
    type: 'employee' | 'manager';
}

export default function ReviewTaskCard({ review, type }: ReviewTaskCardProps) {
    const isEmployee = type === 'employee';

    return (
        <div className="flex items-center justify-between p-4 bg-card rounded-lg border border-border shadow-sm">
            <div>
                <h3 className="font-medium text-foreground">
                    {isEmployee ? review.template.title : review.employee?.name}
                </h3>
                <p className="text-sm text-muted-foreground">
                    {isEmployee ? 'Self-Evaluation Required' : `${review.template.title} - Manager Review`}
                </p>
            </div>
            <Link href={`/reviews/${review.id}`}>
                <Button size="sm" variant={isEmployee ? 'primary' : 'secondary'}>
                    {isEmployee ? 'Start Review' : 'Review'}
                </Button>
            </Link>
        </div>
    );
}
