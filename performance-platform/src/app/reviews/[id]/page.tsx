import { getCurrentUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { redirect } from 'next/navigation';
import { ReviewMode } from '@/types';
import ReviewForm from './ReviewForm';
import ExportPdfButton from './ExportPdfButton';
import { ERRORS } from '@/lib/constants';
import { formatDistanceToNow } from 'date-fns';

export default async function ReviewPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const user = await getCurrentUser();

    if (!user) redirect('/login');

    const review = await prisma.performanceReview.findUnique({
        where: { id },
        include: {
            template: {
                include: {
                    sections: {
                        orderBy: { order: 'asc' },
                        include: {
                            questions: {
                                orderBy: { order: 'asc' }
                            }
                        }
                    }
                }
            },
            responses: true,
            employee: true,
            manager: true
        }
    });

    if (!review) return <div>{ERRORS.REVIEW_NOT_FOUND}</div>;

    const isEmployee = user.id === review.employeeId;
    const isManager = user.id === review.managerId;

    // Determine mode
    const mode: ReviewMode = isEmployee && review.status === 'PENDING_EMPLOYEE' ? 'EMPLOYEE'
        : isManager && review.status === 'PENDING_MANAGER' ? 'MANAGER'
            : 'VIEW';

    // Helper function to get score color
    const getScoreColor = (score: number | null) => {
        if (!score) return { bg: 'bg-slate-700', text: 'text-slate-400', border: 'border-slate-600', label: 'No Score' };
        if (score >= 3.5) return { bg: 'bg-green-500/20', text: 'text-green-300', border: 'border-green-500/30', label: 'Excellent' };
        if (score >= 2.5) return { bg: 'bg-purple-500/20', text: 'text-purple-300', border: 'border-purple-500/30', label: 'Good' };
        if (score >= 1.5) return { bg: 'bg-orange-500/20', text: 'text-orange-300', border: 'border-orange-500/30', label: 'Needs Improvement' };
        return { bg: 'bg-red-500/20', text: 'text-red-300', border: 'border-red-500/30', label: 'Poor' };
    };

    const scoreColors = getScoreColor(review.overallScore);

    return (
        <div className="max-w-4xl mx-auto space-y-8">
            <div className="flex justify-between items-start gap-4">
                <div className="space-y-2 flex-1">
                    <div className="flex items-center gap-3">
                        <h1 className="text-3xl font-bold text-white">{review.template.title}</h1>
                        {review.isDraft && review.responses.length > 0 && mode !== 'VIEW' && (
                            <span className="px-3 py-1 rounded-full text-xs font-medium bg-blue-500/20 text-blue-300 border border-blue-500/30">
                                Draft
                            </span>
                        )}
                    </div>
                    <p className="text-slate-400">
                        {mode === 'EMPLOYEE' ? 'Self-Evaluation' : mode === 'MANAGER' ? `Review for ${review.employee.name}` : 'Review Details'}
                    </p>
                    {review.isDraft && review.responses.length > 0 && mode !== 'VIEW' && (
                        <p className="text-xs text-slate-500">
                            Last updated: {formatDistanceToNow(review.updatedAt)} ago
                        </p>
                    )}
                </div>
                {review.status === 'COMPLETED' && mode === 'VIEW' && review.overallScore !== null && (
                    <div className={`px-4 py-3 rounded-lg ${scoreColors.bg} border ${scoreColors.border} text-center min-w-[120px]`}>
                        <div className="text-xs text-slate-400 mb-1">Overall Score</div>
                        <div className={`text-3xl font-bold ${scoreColors.text}`}>
                            {review.overallScore.toFixed(2)}
                        </div>
                        <div className="text-xs text-slate-500 mb-2">/ 4.0</div>
                        <div className={`text-xs font-medium ${scoreColors.text}`}>
                            {scoreColors.label}
                        </div>
                    </div>
                )}
                {review.status === 'COMPLETED' && (
                    <ExportPdfButton
                        reviewId={review.id}
                        employeeName={review.employee.name}
                        templateTitle={review.template.title}
                    />
                )}
            </div>

            <ReviewForm
                review={review}
                mode={mode}
                user={user}
            />
        </div>
    );
}
