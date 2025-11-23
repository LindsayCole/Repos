'use client';

import { createReviewCycle } from '@/app/actions/reviews';
import { Button } from '@/components/ui/Button';
import { useToast } from '@/lib/toast';
import { useState } from 'react';

export default function CreateReviewButton({ templateId, employeeId, managerId }: { templateId: string, employeeId: string, managerId: string }) {
    const toast = useToast();
    const [isLoading, setIsLoading] = useState(false);

    const handleClick = async () => {
        setIsLoading(true);
        try {
            const result = await createReviewCycle(templateId, employeeId, managerId);
            if (result?.message) {
                toast.success(result.message);
            }
        } catch (error) {
            toast.error(error instanceof Error ? error.message : 'Failed to create review cycle');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Button
            variant="primary"
            onClick={handleClick}
            disabled={isLoading}
        >
            {isLoading ? 'Creating...' : 'Start Test Review Cycle'}
        </Button>
    );
}
