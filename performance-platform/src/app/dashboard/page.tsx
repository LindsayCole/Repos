import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { getCurrentUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import CreateReviewButton from '@/components/dashboard/CreateReviewButton';
import PerformanceChart from '@/components/dashboard/PerformanceChart';
import ReviewTaskCard from '@/components/dashboard/ReviewTaskCard';
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

    // Fetch completed reviews for the user to get latest score
    const completedReviews = await prisma.performanceReview.findMany({
        where: {
            employeeId: user.id,
            status: 'COMPLETED',
            overallScore: { not: null }
        },
        include: {
            template: true
        },
        orderBy: { updatedAt: 'desc' }
    });

    const latestScore = completedReviews.length > 0 ? completedReviews[0].overallScore : null;

    // Prepare score data for performance chart
    const scoreData = completedReviews.map(review => ({
        date: review.updatedAt.toISOString(),
        score: review.overallScore!,
        templateTitle: review.template.title
    }));

    // Helper function to get score color
    const getScoreColor = (score: number | null) => {
        if (!score) return { bg: 'bg-slate-700', text: 'text-slate-400', label: 'No Score' };
        if (score >= 3.5) return { bg: 'bg-green-500/20', text: 'text-green-300', label: 'Excellent' };
        if (score >= 2.5) return { bg: 'bg-purple-500/20', text: 'text-purple-300', label: 'Good' };
        if (score >= 1.5) return { bg: 'bg-orange-500/20', text: 'text-orange-300', label: 'Needs Improvement' };
        return { bg: 'bg-red-500/20', text: 'text-red-300', label: 'Poor' };
    };

    const scoreColors = getScoreColor(latestScore);

    // Fetch data for HR test button
    const template = await prisma.formTemplate.findFirst();
    const employee = await prisma.user.findFirst({ where: { role: 'EMPLOYEE' } });
    const manager = await prisma.user.findFirst({ where: { role: 'MANAGER' } });

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
                        <h2 className="text-xl font-semibold text-cyan-400">Latest Performance Score</h2>
                        <div className={`p-6 ${scoreColors.bg} rounded-lg border border-${scoreColors.text.replace('text-', '')}/30`}>
                            <div className="text-center">
                                <div className="text-sm text-slate-400 mb-2">Your Most Recent Score</div>
                                <div className={`text-5xl font-bold ${scoreColors.text} mb-2`}>
                                    {latestScore !== null ? latestScore.toFixed(2) : '--'}
                                </div>
                                <div className="text-lg text-slate-400 mb-3">/ 4.0</div>
                                <div className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${scoreColors.bg} ${scoreColors.text}`}>
                                    {scoreColors.label}
                                </div>
                            </div>
                        </div>
                    </Card>
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
                    <PerformanceChart scores={scoreData} />
                </div>
            </div>
        </div>
    );
}
