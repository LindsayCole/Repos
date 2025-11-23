'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { launchReviewCycle } from '@/app/actions/review-cycles';
import { Play } from 'lucide-react';

interface LaunchCycleButtonProps {
    cycleId: string;
    cycleName: string;
}

export default function LaunchCycleButton({ cycleId, cycleName }: LaunchCycleButtonProps) {
    const router = useRouter();
    const [isLaunching, setIsLaunching] = useState(false);

    const handleLaunch = async () => {
        if (!confirm(`Are you sure you want to launch the cycle "${cycleName}"? This will create reviews for all target employees and send email notifications.`)) {
            return;
        }

        setIsLaunching(true);
        try {
            const result = await launchReviewCycle(cycleId);
            alert(`Successfully created ${result.reviewsCreated} reviews!`);
            router.refresh();
        } catch (error) {
            console.error('Error launching cycle:', error);
            alert('Failed to launch cycle. Please try again.');
        } finally {
            setIsLaunching(false);
        }
    };

    return (
        <Button
            onClick={handleLaunch}
            disabled={isLaunching}
            className="gap-2"
        >
            <Play className="w-4 h-4" />
            {isLaunching ? 'Launching...' : 'Launch Cycle'}
        </Button>
    );
}
