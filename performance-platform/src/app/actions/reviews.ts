'use server';

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { sendEmail, reviewAssignedEmail, selfEvalSubmittedEmail, reviewCompletedEmail } from '@/lib/email';

export async function createReviewCycle(templateId: string, employeeId: string, managerId: string) {
    const review = await prisma.performanceReview.create({
        data: {
            templateId,
            employeeId,
            managerId,
            status: 'PENDING_EMPLOYEE',
        },
        include: {
            employee: true,
            manager: true,
            template: true,
        }
    });

    // Send email
    const { subject, html } = reviewAssignedEmail(review.employee.name, review.template.title);
    await sendEmail({ to: review.employee.email, subject, html });

    revalidatePath('/dashboard');
}

export async function submitEmployeeReview(reviewId: string, responses: Record<string, { rating: number, comment: string }>) {
    // Save all responses
    const promises = Object.entries(responses).map(([questionId, data]) => {
        return prisma.reviewResponse.create({
            data: {
                reviewId,
                questionId,
                selfRating: data.rating,
                selfComment: data.comment,
            }
        });
    });

    await Promise.all(promises);

    // Update review status
    const review = await prisma.performanceReview.update({
        where: { id: reviewId },
        data: { status: 'PENDING_MANAGER' },
        include: {
            employee: true,
            manager: true,
            template: true,
        }
    });

    // Send email
    const { subject, html } = selfEvalSubmittedEmail(review.employee.name, review.manager.name, review.template.title);
    await sendEmail({ to: review.manager.email, subject, html });

    revalidatePath('/dashboard');
    redirect('/dashboard');
}

export async function submitManagerReview(reviewId: string, responses: Record<string, { rating: number, comment: string }>) {
    // Update responses with manager data
    const promises = Object.entries(responses).map(([questionId, data]) => {
        return prisma.reviewResponse.findFirst({
            where: { reviewId, questionId }
        }).then(response => {
            if (response) {
                return prisma.reviewResponse.update({
                    where: { id: response.id },
                    data: {
                        managerRating: data.rating,
                        managerComment: data.comment
                    }
                });
            } else {
                return prisma.reviewResponse.create({
                    data: {
                        reviewId,
                        questionId,
                        managerRating: data.rating,
                        managerComment: data.comment
                    }
                });
            }
        });
    });

    await Promise.all(promises);

    const review = await prisma.performanceReview.update({
        where: { id: reviewId },
        data: { status: 'COMPLETED' },
        include: {
            employee: true,
            manager: true,
            template: true,
        }
    });

    // Send email
    const { subject, html } = reviewCompletedEmail(review.employee.name, review.manager.name, review.template.title);
    await sendEmail({ to: [review.employee.email, review.manager.email].join(','), subject, html });

    revalidatePath('/dashboard');
    redirect('/dashboard');
}
