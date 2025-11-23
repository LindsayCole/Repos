import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { getCurrentUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { Plus, Target, TrendingUp, CheckCircle2 } from 'lucide-react';
import GoalCard from '@/components/goals/GoalCard';

export default async function GoalsPage() {
    const user = await getCurrentUser();

    if (!user) {
        redirect('/login');
    }

    // Fetch all goals for the user
    const goals = await prisma.goal.findMany({
        where: {
            userId: user.id,
        },
        include: {
            manager: true,
            updates: {
                orderBy: { createdAt: 'desc' },
                take: 1,
            },
        },
        orderBy: [
            { status: 'asc' },
            { targetDate: 'asc' },
        ],
    });

    // Calculate stats
    const activeGoals = goals.filter(g => ['NOT_STARTED', 'IN_PROGRESS'].includes(g.status));
    const completedGoals = goals.filter(g => g.status === 'COMPLETED');
    const totalProgress = goals.length > 0
        ? Math.round(goals.reduce((sum, g) => sum + g.progress, 0) / goals.length)
        : 0;

    return (
        <div className="space-y-8">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-4xl font-bold text-white mb-2">My Goals</h1>
                    <p className="text-slate-400">Track and manage your professional development goals</p>
                </div>
                <Link href="/goals/new">
                    <Button className="gap-2">
                        <Plus className="w-4 h-4" />
                        New Goal
                    </Button>
                </Link>
            </div>

            {/* Stats Overview */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="space-y-2">
                    <div className="flex items-center gap-3">
                        <div className="p-3 bg-blue-500/10 rounded-lg">
                            <Target className="w-6 h-6 text-blue-400" />
                        </div>
                        <div>
                            <div className="text-sm text-slate-400">Active Goals</div>
                            <div className="text-2xl font-bold text-white">{activeGoals.length}</div>
                        </div>
                    </div>
                </Card>

                <Card className="space-y-2">
                    <div className="flex items-center gap-3">
                        <div className="p-3 bg-green-500/10 rounded-lg">
                            <CheckCircle2 className="w-6 h-6 text-green-400" />
                        </div>
                        <div>
                            <div className="text-sm text-slate-400">Completed</div>
                            <div className="text-2xl font-bold text-white">{completedGoals.length}</div>
                        </div>
                    </div>
                </Card>

                <Card className="space-y-2">
                    <div className="flex items-center gap-3">
                        <div className="p-3 bg-purple-500/10 rounded-lg">
                            <TrendingUp className="w-6 h-6 text-purple-400" />
                        </div>
                        <div>
                            <div className="text-sm text-slate-400">Average Progress</div>
                            <div className="text-2xl font-bold text-white">{totalProgress}%</div>
                        </div>
                    </div>
                </Card>
            </div>

            {/* Goals List */}
            <div className="space-y-4">
                <h2 className="text-xl font-semibold text-white">All Goals</h2>

                {goals.length === 0 ? (
                    <Card className="p-12 text-center border border-dashed border-slate-800">
                        <div className="inline-flex p-4 bg-slate-800/30 rounded-full mb-4">
                            <Target className="w-8 h-8 text-slate-500" />
                        </div>
                        <h3 className="text-lg font-medium text-white mb-2">No goals yet</h3>
                        <p className="text-slate-400 mb-6">
                            Start your professional development journey by creating your first goal
                        </p>
                        <Link href="/goals/new">
                            <Button className="gap-2">
                                <Plus className="w-4 h-4" />
                                Create Your First Goal
                            </Button>
                        </Link>
                    </Card>
                ) : (
                    <div className="grid grid-cols-1 gap-4">
                        {goals.map((goal) => (
                            <GoalCard key={goal.id} goal={goal} />
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
