import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { getCurrentUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import StartReviewButton from '@/components/dashboard/StartReviewButton';
import ReviewTaskCard from '@/components/dashboard/ReviewTaskCard';
import PerformanceChart from '@/components/dashboard/PerformanceChart';
import { UI_TEXT } from '@/lib/constants';
import { ReviewTask } from '@/types';

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

    // Fetch data for HR modal
    const templates = await prisma.formTemplate.findMany({ select: { id: true, title: true } });
    const employees = await prisma.user.findMany({ where: { role: 'EMPLOYEE' }, select: { id: true, name: true, role: true } });
    const managers = await prisma.user.findMany({ where: { role: 'MANAGER' }, select: { id: true, name: true, role: true } });

    // Calculate real stats
    const totalTeamReviews = await prisma.performanceReview.count({
        where: { managerId: user.id }
    });
    const completedTeamReviews = await prisma.performanceReview.count({
        where: { managerId: user.id, status: 'COMPLETED' }
    });
    const teamCompletionRate = totalTeamReviews > 0 ? Math.round((completedTeamReviews / totalTeamReviews) * 100) : 0;

    // Get next scheduled review (mock logic for now, could be real field later)
    const nextReviewDate = new Date();
    nextReviewDate.setMonth(nextReviewDate.getMonth() + 3);
    const nextReviewString = nextReviewDate.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });

    return (
        <div className="space-y-8">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold text-foreground mb-1">
                        {UI_TEXT.DASHBOARD_WELCOME(user.name.split(' ')[0])}
                    </h1>
                    <p className="text-muted-foreground">{UI_TEXT.DASHBOARD_SUBTITLE}</p>
                </div>
                {user.role === 'HR' && (
                    <StartReviewButton
                        templates={templates}
                        employees={employees}
                        managers={managers}
                    />
                )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="md:col-span-2 space-y-6">
                    <Card className="p-0 border-0 shadow-none bg-transparent">
                        <h2 className="text-lg font-semibold text-foreground mb-4">Your Tasks</h2>

                        <div className="space-y-3">
                            {myReviews.length === 0 && teamReviews.length === 0 && (
                                <div className="p-8 text-center border border-dashed border-border rounded-lg bg-card">
                                    <p className="text-muted-foreground">{UI_TEXT.NO_PENDING_TASKS}</p>
                                </div>
                            )}

                            {myReviews.map((review: ReviewTask) => (
                                <ReviewTaskCard key={review.id} review={review} type="employee" />
                            ))}

                            {teamReviews.map((review: ReviewTask) => (
                                <ReviewTaskCard key={review.id} review={review} type="manager" />
                            ))}
                        </div>
                    </Card>
                </div>

                <div className="space-y-6">
                    <Card>
                        <h2 className="text-lg font-semibold text-foreground mb-4">Quick Stats</h2>
                        <div className="space-y-4">
                            <div className="p-4 bg-secondary/50 rounded-lg">
                                <div className="text-sm text-muted-foreground">Next Review Cycle</div>
                                <div className="text-lg font-medium text-foreground">{nextReviewString}</div>
                            </div>
                            <div className="p-4 bg-secondary/50 rounded-lg">
                                <div className="text-sm text-muted-foreground">Team Completion</div>
                                <div className="text-lg font-medium text-foreground">{teamCompletionRate}%</div>
                                <div className="w-full bg-secondary h-1.5 mt-2 rounded-full overflow-hidden">
                                    <div
                                        className="bg-primary h-full transition-all duration-1000"
                                        style={{ width: `${teamCompletionRate}%` }}
                                    />
                                </div>
                            </div>
                        </div>
                    </Card>
                    <PerformanceChart userId={user.id} />
                </div>
            </div>
        </div>
    );
}
