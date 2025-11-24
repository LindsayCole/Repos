'use client';

import { useEffect } from 'react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { AlertTriangle } from 'lucide-react';

export default function Error({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    useEffect(() => {
        console.error(error);
    }, [error]);

    return (
        <div className="flex items-center justify-center min-h-[50vh]">
            <Card className="max-w-md w-full text-center space-y-6 p-8 border-red-500/20 bg-red-500/5">
                <div className="flex justify-center">
                    <div className="p-4 bg-red-500/10 rounded-full">
                        <AlertTriangle className="h-12 w-12 text-red-400" />
                    </div>
                </div>

                <div className="space-y-2">
                    <h2 className="text-2xl font-bold text-white">Something went wrong!</h2>
                    <p className="text-slate-400">
                        {error.message || 'An unexpected error occurred. Please try again.'}
                    </p>
                </div>

                <div className="flex gap-4 justify-center">
                    <Button variant="ghost" onClick={() => window.location.href = '/dashboard'}>
                        Go Home
                    </Button>
                    <Button variant="primary" onClick={() => reset()}>
                        Try Again
                    </Button>
                </div>
            </Card>
        </div>
    );
}
