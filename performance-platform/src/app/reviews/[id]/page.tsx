import { getCurrentUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { redirect } from 'next/navigation';
import ReviewForm from './ReviewForm';
import ExportPdfButton from './ExportPdfButton';

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

    if (!review) return <div>Review not found</div>;

    const isEmployee = user.id === review.employeeId;
    const isManager = user.id === review.managerId;

    // Determine mode
    const mode = isEmployee && review.status === 'PENDING_EMPLOYEE' ? 'EMPLOYEE'
        : isManager && review.status === 'PENDING_MANAGER' ? 'MANAGER'
            : 'VIEW';

    return (
        <div className="max-w-4xl mx-auto space-y-8">
            <div className="flex justify-between items-start">
                <div className="space-y-2">
                    <h1 className="text-3xl font-bold text-white">{review.template.title}</h1>
                    <p className="text-slate-400">
                        {mode === 'EMPLOYEE' ? 'Self-Evaluation' : mode === 'MANAGER' ? `Review for ${review.employee.name}` : 'Review Details'}
                    </p>
                </div>
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
