import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { getCurrentUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import CreateReviewButton from '@/components/dashboard/CreateReviewButton';
import PerformanceChart from '@/components/dashboard/PerformanceChart';
import ReviewTaskCard from '@/components/dashboard/ReviewTaskCard';
import GoalCard from '@/components/goals/GoalCard';
import { UI_TEXT } from '@/lib/constants';
import { ReviewTask } from '@/types';
import { Target, Plus } from 'lucide-react';

export default async function DashboardPage() {
    const user = await getCurrentUser();

    if (!user) {
        redirect('/login');
    }

    // Fetch pending reviews for employee
    const myReviews = await prisma.performanceReview.findMany({
        where: {
            employeeId: user.id,
            status: 'PENDING_EMPLOYEE',
        },
        include: { template: true }
    });

    // Fetch pending reviews for manager
    const teamReviews = await prisma.performanceReview.findMany({
        where: {
            managerId: user.id,
            status: 'PENDING_MANAGER',
        },
        include: { employee: true, template: true }
    });

    // Fetch data for HR test button
    const template = await prisma.formTemplate.findFirst();
    const employee = await prisma.user.findFirst({ where: { role: 'EMPLOYEE' } });
    const manager = await prisma.user.findFirst({ where: { role: 'MANAGER' } });

    // Fetch active goals for the user
    const activeGoals = await prisma.goal.findMany({
        where: {
            userId: user.id,
            status: { in: ['NOT_STARTED', 'IN_PROGRESS'] },
        },
        include: {
            manager: true,
        },
        orderBy: { targetDate: 'asc' },
        take: 3,
    });

    return (
        <div className="space-y-8">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-4xl font-bold text-white mb-2">
                        {UI_TEXT.DASHBOARD_WELCOME(user.name.split(' ')[0])}
                    </h1>
                    <p className="text-slate-400">{UI_TEXT.DASHBOARD_SUBTITLE}</p>
                </div>
                {user.role === 'HR' && template && employee && manager && (
                    <CreateReviewButton
                        templateId={template.id}
                        employeeId={employee.id}
                        managerId={manager.id}
                    />
                )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="md:col-span-2 space-y-6">
                    <h2 className="text-xl font-semibold text-cyan-400">Your Tasks</h2>

                    {myReviews.length === 0 && teamReviews.length === 0 && (
                        <div className="p-8 text-center border border-dashed border-slate-800 rounded-xl">
                            <p className="text-slate-500">{UI_TEXT.NO_PENDING_TASKS}</p>
                        </div>
                    )}

                    {myReviews.map((review: ReviewTask) => (
                        <ReviewTaskCard key={review.id} review={review} type="employee" />
                    ))}

                    {teamReviews.map((review: ReviewTask) => (
                        <ReviewTaskCard key={review.id} review={review} type="manager" />
                    ))}
                </Card>

                <div className="space-y-6">
                    <Card className="space-y-6">
                        <h2 className="text-xl font-semibold text-purple-400">Quick Stats</h2>
                        <div className="space-y-4">
                            <div className="p-4 bg-slate-800/30 rounded-lg">
                                <div className="text-sm text-slate-400">Next Review Cycle</div>
                                <div className="text-lg font-medium text-white">Oct 2025</div>
                            </div>
                            <div className="p-4 bg-slate-800/30 rounded-lg">
                                <div className="text-sm text-slate-400">Team Completion</div>
                                <div className="text-lg font-medium text-white">85%</div>
                                <div className="w-full bg-slate-700 h-1.5 mt-2 rounded-full overflow-hidden">
                                    <div className="bg-purple-500 h-full w-[85%]" />
                                </div>
                            </div>
                        </div>
                    </Card>
                    <PerformanceChart userId={user.id} />
                </div>
            </div>

            {/* Active Goals Section */}
            <Card className="space-y-6">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-cyan-500/10 rounded-lg">
                            <Target className="w-5 h-5 text-cyan-400" />
                        </div>
                        <h2 className="text-xl font-semibold text-white">Active Goals</h2>
                    </div>
                    <Link href="/goals">
                        <Button variant="outline" className="gap-2">
                            View All Goals
                        </Button>
                    </Link>
                </div>

                {activeGoals.length === 0 ? (
                    <div className="p-8 text-center border border-dashed border-slate-800 rounded-xl">
                        <p className="text-slate-500 mb-4">No active goals yet</p>
                        <Link href="/goals/new">
                            <Button className="gap-2">
                                <Plus className="w-4 h-4" />
                                Create Your First Goal
                            </Button>
                        </Link>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 gap-4">
                        {activeGoals.map((goal) => (
                            <GoalCard key={goal.id} goal={goal} />
                        ))}
                    </div>
                )}
            </Card>
        </div>
    );
}
