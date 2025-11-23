'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { updateGoalProgress, completeGoal } from '@/app/actions/goals';
import { CheckCircle2 } from 'lucide-react';

interface GoalProgressSliderProps {
    goalId: string;
    currentProgress: number;
    userId: string;
}

export default function GoalProgressSlider({ goalId, currentProgress, userId }: GoalProgressSliderProps) {
    const router = useRouter();
    const [progress, setProgress] = useState(currentProgress);
    const [note, setNote] = useState('');
    const [isUpdating, setIsUpdating] = useState(false);

    const handleUpdate = async () => {
        setIsUpdating(true);
        try {
            await updateGoalProgress(goalId, progress, note || undefined, userId);
            setNote('');
            router.refresh();
        } catch (error) {
            console.error('Error updating progress:', error);
            alert('Failed to update progress. Please try again.');
        } finally {
            setIsUpdating(false);
        }
    };

    const handleComplete = async () => {
        if (!confirm('Are you sure you want to mark this goal as completed?')) {
            return;
        }

        setIsUpdating(true);
        try {
            await completeGoal(goalId);
            router.refresh();
        } catch (error) {
            console.error('Error completing goal:', error);
            alert('Failed to complete goal. Please try again.');
        } finally {
            setIsUpdating(false);
        }
    };

    const hasChanged = progress !== currentProgress;

    return (
        <div className="space-y-6">
            <div className="space-y-4">
                <div className="flex items-center justify-between">
                    <label className="text-sm font-medium text-slate-300">
                        Progress: {progress}%
                    </label>
                    {progress === 100 && (
                        <Button
                            onClick={handleComplete}
                            disabled={isUpdating}
                            className="gap-2 bg-green-600 hover:bg-green-700"
                        >
                            <CheckCircle2 className="w-4 h-4" />
                            Mark as Complete
                        </Button>
                    )}
                </div>

                <input
                    type="range"
                    min="0"
                    max="100"
                    step="5"
                    value={progress}
                    onChange={(e) => setProgress(parseInt(e.target.value))}
                    className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer
                        [&::-webkit-slider-thumb]:appearance-none
                        [&::-webkit-slider-thumb]:w-4
                        [&::-webkit-slider-thumb]:h-4
                        [&::-webkit-slider-thumb]:rounded-full
                        [&::-webkit-slider-thumb]:bg-cyan-500
                        [&::-webkit-slider-thumb]:cursor-pointer
                        [&::-moz-range-thumb]:w-4
                        [&::-moz-range-thumb]:h-4
                        [&::-moz-range-thumb]:rounded-full
                        [&::-moz-range-thumb]:bg-cyan-500
                        [&::-moz-range-thumb]:border-0
                        [&::-moz-range-thumb]:cursor-pointer"
                />

                <div className="flex justify-between text-xs text-slate-500">
                    <span>0%</span>
                    <span>25%</span>
                    <span>50%</span>
                    <span>75%</span>
                    <span>100%</span>
                </div>
            </div>

            <div>
                <label htmlFor="note" className="block text-sm font-medium text-slate-300 mb-2">
                    Progress Note (Optional)
                </label>
                <textarea
                    id="note"
                    rows={3}
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 transition-colors resize-none"
                    placeholder="Add a note about your progress..."
                />
            </div>

            <Button
                onClick={handleUpdate}
                disabled={!hasChanged || isUpdating}
                className="w-full"
            >
                {isUpdating ? 'Updating...' : 'Update Progress'}
            </Button>
        </div>
    );
}
