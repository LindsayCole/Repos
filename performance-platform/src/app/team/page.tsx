import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { getCurrentUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { UI_TEXT } from '@/lib/constants';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import PerformanceChart from '@/components/dashboard/PerformanceChart';

export default async function TeamPage() {
    const user = await getCurrentUser();

    if (!user || user.role !== 'MANAGER') {
        redirect('/dashboard');
    }

    // Fetch all employees under this manager
    const employees = await prisma.user.findMany({
        where: { managerId: user.id },
        include: {
            reviewsAsEmployee: {
                include: {
                    template: true,
                },
                orderBy: { createdAt: 'desc' },
            },
        },
    });

    // Helper function to get score color
    const getScoreColor = (score: number | null) => {
        if (!score) return { bg: 'bg-slate-700', text: 'text-slate-400', border: 'border-slate-600' };
        if (score >= 3.5) return { bg: 'bg-green-500/20', text: 'text-green-300', border: 'border-green-500/30' };
        if (score >= 2.5) return { bg: 'bg-purple-500/20', text: 'text-purple-300', border: 'border-purple-500/30' };
        if (score >= 1.5) return { bg: 'bg-orange-500/20', text: 'text-orange-300', border: 'border-orange-500/30' };
        return { bg: 'bg-red-500/20', text: 'text-red-300', border: 'border-red-500/30' };
    };

    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-4xl font-bold text-white mb-2">{UI_TEXT.TEAM_TITLE}</h1>
                <p className="text-slate-400">{UI_TEXT.TEAM_SUBTITLE}</p>
            </div>

            {employees.length === 0 ? (
                <Card>
                    <p className="text-slate-400 text-center py-8">{UI_TEXT.NO_DIRECT_REPORTS}</p>
                </Card>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {employees.map(employee => {
                        const completedReviews = employee.reviewsAsEmployee.filter(r => r.status === 'COMPLETED');
                        const pendingReviews = employee.reviewsAsEmployee.filter(r => r.status === 'PENDING_MANAGER');

                        // Calculate average overall score
                        const reviewsWithScores = completedReviews.filter(r => r.overallScore !== null);
                        const avgScore = reviewsWithScores.length > 0
                            ? reviewsWithScores.reduce((sum, r) => sum + (r.overallScore || 0), 0) / reviewsWithScores.length
                            : null;

                        const scoreColors = getScoreColor(avgScore);

                        // Prepare score data for performance chart
                        const employeeScoreData = reviewsWithScores.map(review => ({
                            date: review.updatedAt.toISOString(),
                            score: review.overallScore!,
                            templateTitle: review.template.title
                        }));

                        return (
                            <Card key={employee.id} className="space-y-4">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <h3 className="text-xl font-semibold text-cyan-400">{employee.name}</h3>
                                        <p className="text-sm text-slate-400">{employee.email}</p>
                                        {employee.department && (
                                            <p className="text-xs text-slate-500 mt-1">{employee.department}</p>
                                        )}
                                    </div>
                                    <div className="text-right space-y-2">
                                        <div className={`px-3 py-2 rounded-lg ${scoreColors.bg} border ${scoreColors.border}`}>
                                            <div className="text-xs text-slate-400">Avg Score</div>
                                            <div className={`text-2xl font-bold ${scoreColors.text}`}>
                                                {avgScore !== null ? avgScore.toFixed(2) : '--'}
                                            </div>
                                            <div className="text-xs text-slate-500">/ 4.0</div>
                                        </div>
                                        <div className="text-xs text-slate-500">{UI_TEXT.COMPLETED_REVIEWS(completedReviews.length)}</div>
                                    </div>
                                </div>

                                {pendingReviews.length > 0 && (
                                    <div className="p-3 bg-orange-500/10 border border-orange-500/30 rounded-lg">
                                        <p className="text-sm text-orange-300">
                                            {UI_TEXT.PENDING_REVIEWS(pendingReviews.length)}
                                        </p>
                                    </div>
                                )}

                                <div className="pt-4 border-t border-slate-700">
                                    <h4 className="text-sm font-semibold text-slate-300 mb-3">Recent Reviews</h4>
                                    {employee.reviewsAsEmployee.length === 0 ? (
                                        <p className="text-xs text-slate-500">No reviews yet</p>
                                    ) : (
                                        <div className="space-y-2">
                                            {employee.reviewsAsEmployee.slice(0, 3).map(review => (
                                                <Link key={review.id} href={`/reviews/${review.id}`}>
                                                    <div className="flex justify-between items-center p-2 bg-slate-800/30 rounded hover:bg-slate-800/50 transition-colors">
                                                        <span className="text-sm text-slate-300">{review.template.title}</span>
                                                        <StatusBadge status={review.status} size="sm" />
                                                    </div>
                                                </Link>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                <PerformanceChart scores={employeeScoreData} />
                            </Card>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
