import { Card } from '@/components/ui/Card';
import { getCurrentUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { redirect, notFound } from 'next/navigation';
import { ChevronLeft, Calendar, User, TrendingUp } from 'lucide-react';
import Link from 'next/link';
import GoalProgressSlider from '@/components/goals/GoalProgressSlider';
import GoalStatusBadge from '@/components/goals/GoalStatusBadge';
import { format } from 'date-fns';

export default async function GoalDetailPage({ params }: { params: { id: string } }) {
    const user = await getCurrentUser();

    if (!user) {
        redirect('/login');
    }

    const goal = await prisma.goal.findUnique({
        where: { id: params.id },
        include: {
            user: true,
            manager: true,
            updates: {
                include: {
                    createdBy: true,
                },
                orderBy: { createdAt: 'desc' },
            },
        },
    });

    if (!goal) {
        notFound();
    }

    // Check if user has access to this goal
    if (goal.userId !== user.id && goal.managerId !== user.id) {
        redirect('/goals');
    }

    const isOwner = goal.userId === user.id;

    return (
        <div className="max-w-4xl mx-auto space-y-8">
            <Link
                href="/goals"
                className="inline-flex items-center gap-2 text-slate-400 hover:text-white transition-colors"
            >
                <ChevronLeft className="w-4 h-4" />
                Back to Goals
            </Link>

            <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                        <h1 className="text-4xl font-bold text-white">{goal.title}</h1>
                        <GoalStatusBadge status={goal.status} />
                    </div>
                    {goal.description && (
                        <p className="text-slate-400">{goal.description}</p>
                    )}
                </div>
            </div>

            {/* Goal Details */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="space-y-2">
                    <div className="flex items-center gap-3">
                        <div className="p-3 bg-purple-500/10 rounded-lg">
                            <TrendingUp className="w-5 h-5 text-purple-400" />
                        </div>
                        <div>
                            <div className="text-sm text-slate-400">Progress</div>
                            <div className="text-2xl font-bold text-white">{goal.progress}%</div>
                        </div>
                    </div>
                </Card>

                {goal.targetDate && (
                    <Card className="space-y-2">
                        <div className="flex items-center gap-3">
                            <div className="p-3 bg-blue-500/10 rounded-lg">
                                <Calendar className="w-5 h-5 text-blue-400" />
                            </div>
                            <div>
                                <div className="text-sm text-slate-400">Target Date</div>
                                <div className="text-lg font-medium text-white">
                                    {format(new Date(goal.targetDate), 'MMM d, yyyy')}
                                </div>
                            </div>
                        </div>
                    </Card>
                )}

                {goal.manager && (
                    <Card className="space-y-2">
                        <div className="flex items-center gap-3">
                            <div className="p-3 bg-green-500/10 rounded-lg">
                                <User className="w-5 h-5 text-green-400" />
                            </div>
                            <div>
                                <div className="text-sm text-slate-400">Manager</div>
                                <div className="text-lg font-medium text-white">{goal.manager.name}</div>
                            </div>
                        </div>
                    </Card>
                )}
            </div>

            {/* Progress Slider */}
            {isOwner && goal.status !== 'COMPLETED' && goal.status !== 'CANCELLED' && (
                <Card>
                    <h2 className="text-xl font-semibold text-white mb-6">Update Progress</h2>
                    <GoalProgressSlider goalId={goal.id} currentProgress={goal.progress} userId={user.id} />
                </Card>
            )}

            {/* Progress History */}
            {goal.updates.length > 0 && (
                <Card>
                    <h2 className="text-xl font-semibold text-white mb-6">Progress History</h2>
                    <div className="space-y-4">
                        {goal.updates.map((update) => (
                            <div
                                key={update.id}
                                className="flex gap-4 p-4 bg-slate-800/30 rounded-lg border border-slate-800"
                            >
                                <div className="flex-1">
                                    <div className="flex items-center gap-3 mb-2">
                                        <span className="text-sm font-medium text-white">
                                            {update.createdBy.name}
                                        </span>
                                        <span className="text-sm text-slate-500">
                                            {format(new Date(update.createdAt), 'MMM d, yyyy h:mm a')}
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-2 mb-2">
                                        <span className="text-slate-400">{update.oldProgress}%</span>
                                        <span className="text-slate-600">→</span>
                                        <span className="text-green-400 font-medium">{update.newProgress}%</span>
                                    </div>
                                    {update.note && (
                                        <p className="text-slate-300">{update.note}</p>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </Card>
            )}
        </div>
    );
}
