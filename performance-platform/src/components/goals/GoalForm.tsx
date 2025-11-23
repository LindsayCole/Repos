'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { createGoal } from '@/app/actions/goals';

interface GoalFormProps {
    userId: string;
    managerId?: string;
}

export default function GoalForm({ userId, managerId }: GoalFormProps) {
    const router = useRouter();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        targetDate: '',
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);

        try {
            const goal = await createGoal({
                title: formData.title,
                description: formData.description || undefined,
                targetDate: formData.targetDate || undefined,
                userId,
                managerId,
            });

            router.push(`/goals/${goal.id}`);
        } catch (error) {
            console.error('Error creating goal:', error);
            alert('Failed to create goal. Please try again.');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            <div>
                <label htmlFor="title" className="block text-sm font-medium text-slate-300 mb-2">
                    Goal Title *
                </label>
                <input
                    type="text"
                    id="title"
                    required
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 transition-colors"
                    placeholder="e.g., Complete Advanced TypeScript Course"
                />
            </div>

            <div>
                <label htmlFor="description" className="block text-sm font-medium text-slate-300 mb-2">
                    Description
                </label>
                <textarea
                    id="description"
                    rows={4}
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 transition-colors resize-none"
                    placeholder="Provide more details about this goal and why it's important..."
                />
            </div>

            <div>
                <label htmlFor="targetDate" className="block text-sm font-medium text-slate-300 mb-2">
                    Target Date
                </label>
                <input
                    type="date"
                    id="targetDate"
                    value={formData.targetDate}
                    onChange={(e) => setFormData({ ...formData, targetDate: e.target.value })}
                    className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-cyan-500 transition-colors"
                />
            </div>

            <div className="flex gap-3 pt-4">
                <Button
                    type="submit"
                    disabled={isSubmitting || !formData.title}
                    className="flex-1"
                >
                    {isSubmitting ? 'Creating...' : 'Create Goal'}
                </Button>
                <Button
                    type="button"
                    onClick={() => router.back()}
                    className="bg-slate-700 hover:bg-slate-600 text-white"
                >
                    Cancel
                </Button>
            </div>
        </form>
    );
}
