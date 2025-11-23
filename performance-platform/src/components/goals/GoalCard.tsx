import Link from 'next/link';
import { Card } from '@/components/ui/Card';
import { Calendar, TrendingUp, User } from 'lucide-react';
import { format } from 'date-fns';
import GoalStatusBadge from './GoalStatusBadge';

interface GoalCardProps {
    goal: {
        id: string;
        title: string;
        description: string | null;
        status: string;
        progress: number;
        targetDate: Date | null;
        completionDate: Date | null;
        manager?: {
            name: string;
        } | null;
    };
}

export default function GoalCard({ goal }: GoalCardProps) {
    const isOverdue = goal.targetDate && new Date(goal.targetDate) < new Date() && goal.status !== 'COMPLETED';

    return (
        <Link href={`/goals/${goal.id}`}>
            <Card className="hover:border-cyan-500/50 transition-colors cursor-pointer">
                <div className="space-y-4">
                    {/* Header */}
                    <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                                <h3 className="text-lg font-semibold text-white">{goal.title}</h3>
                                <GoalStatusBadge status={goal.status} />
                            </div>
                            {goal.description && (
                                <p className="text-slate-400 text-sm line-clamp-2">{goal.description}</p>
                            )}
                        </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                            <span className="text-slate-400">Progress</span>
                            <span className="text-white font-medium">{goal.progress}%</span>
                        </div>
                        <div className="w-full bg-slate-700 h-2 rounded-full overflow-hidden">
                            <div
                                className={`h-full rounded-full transition-all ${
                                    goal.status === 'COMPLETED'
                                        ? 'bg-green-500'
                                        : isOverdue
                                        ? 'bg-red-500'
                                        : 'bg-cyan-500'
                                }`}
                                style={{ width: `${goal.progress}%` }}
                            />
                        </div>
                    </div>

                    {/* Meta Info */}
                    <div className="flex items-center gap-4 text-sm text-slate-400">
                        {goal.targetDate && (
                            <div className="flex items-center gap-1.5">
                                <Calendar className="w-4 h-4" />
                                <span className={isOverdue ? 'text-red-400' : ''}>
                                    {format(new Date(goal.targetDate), 'MMM d, yyyy')}
                                </span>
                            </div>
                        )}
                        {goal.manager && (
                            <div className="flex items-center gap-1.5">
                                <User className="w-4 h-4" />
                                <span>{goal.manager.name}</span>
                            </div>
                        )}
                    </div>
                </div>
            </Card>
        </Link>
    );
}
