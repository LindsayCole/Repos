'use client';

import { createReviewCycle } from '@/app/actions/reviews';
import { Button } from '@/components/ui/Button';

export default function CreateReviewButton({ templateId, employeeId, managerId }: { templateId: string, employeeId: string, managerId: string }) {
    return (
        <Button
            variant="primary"
            onClick={async () => {
                await createReviewCycle(templateId, employeeId, managerId);
            }}
        >
            Start Test Review Cycle
        </Button>
    );
}
