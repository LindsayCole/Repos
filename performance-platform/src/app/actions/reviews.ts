'use server';

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { ReviewFormData } from '@/types';
import { sendEmail, reviewAssignedEmail, selfEvalSubmittedEmail, reviewCompletedEmail } from '@/lib/email';
import { ERRORS, SUCCESS_MESSAGES } from '@/lib/constants';

export async function createReviewCycle(templateId: string, employeeId: string, managerId: string) {
    try {
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
        return { success: true, message: SUCCESS_MESSAGES.REVIEW_CREATED };
    } catch (error) {
        console.error('Error creating review cycle:', error);
        throw new Error(ERRORS.REVIEW_CREATE_FAILED);
    }
}

export async function submitEmployeeReview(reviewId: string, responses: ReviewFormData) {
    try {
        if (!reviewId) {
            throw new Error(ERRORS.REVIEW_ID_REQUIRED);
        }

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
    } catch (error) {
        console.error('Error submitting employee review:', error);
        throw new Error(ERRORS.REVIEW_SUBMIT_FAILED);
    }
}

export async function submitManagerReview(reviewId: string, responses: ReviewFormData) {
    try {
        if (!reviewId) {
            throw new Error(ERRORS.REVIEW_ID_REQUIRED);
        }

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

        // Calculate overall score from all manager ratings
        const allResponses = await prisma.reviewResponse.findMany({
            where: { reviewId },
            select: { managerRating: true }
        });

        const validRatings = allResponses
            .map((r: { managerRating: number | null }) => r.managerRating)
            .filter((rating): rating is number => rating !== null);

        const overallScore = validRatings.length > 0
            ? Math.round((validRatings.reduce((sum: number, rating: number) => sum + rating, 0) / validRatings.length) * 100) / 100
            : null;

        const review = await prisma.performanceReview.update({
            where: { id: reviewId },
            data: {
                status: 'COMPLETED',
                overallScore
            },
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
    } catch (error) {
        console.error('Error submitting manager review:', error);
        throw new Error(ERRORS.REVIEW_SUBMIT_FAILED);
    }
}
