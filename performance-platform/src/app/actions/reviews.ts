'use server';

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { ReviewFormData } from '@/types';
import { sendEmail, reviewAssignedEmail, selfEvalSubmittedEmail, reviewCompletedEmail } from '@/lib/email';
import { ERRORS, SUCCESS_MESSAGES, NOTIFICATION_TYPES, NOTIFICATION_MESSAGES } from '@/lib/constants';
import { createNotification } from './notifications';

export async function saveDraftReview(reviewId: string, responses: ReviewFormData) {
    try {
        if (!reviewId) {
            throw new Error(ERRORS.REVIEW_ID_REQUIRED);
        }

        // Upsert all responses
        const promises = Object.entries(responses).map(async ([questionId, data]) => {
            const existingResponse = await prisma.reviewResponse.findFirst({
                where: { reviewId, questionId }
            });

            if (existingResponse) {
                return prisma.reviewResponse.update({
                    where: { id: existingResponse.id },
                    data: {
                        selfRating: data.rating,
                        selfComment: data.comment,
                    }
                });
            } else {
                return prisma.reviewResponse.create({
                    data: {
                        reviewId,
                        questionId,
                        selfRating: data.rating,
                        selfComment: data.comment,
                    }
                });
            }
        });

        await Promise.all(promises);

        // Update review updatedAt timestamp (keep status and isDraft unchanged)
        await prisma.performanceReview.update({
            where: { id: reviewId },
            data: { updatedAt: new Date() }
        });

        revalidatePath('/reviews/' + reviewId);
        return { success: true, message: 'Draft saved successfully' };
    } catch (error) {
        console.error('Error saving draft review:', error);
        throw new Error('Failed to save draft');
    }
}

export async function createReviewCycle(
    templateId: string,
    employeeId: string,
    managerId: string,
    dueDate?: Date
) {
    try {
        const review = await prisma.performanceReview.create({
            data: {
                templateId,
                employeeId,
                managerId,
                status: 'PENDING_EMPLOYEE',
                dueDate: dueDate || null,
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

        // Create notification for employee
        const notificationMessage = NOTIFICATION_MESSAGES.REVIEW_ASSIGNED(review.template.title);
        await createNotification(
            review.employeeId,
            NOTIFICATION_TYPES.REVIEW_ASSIGNED,
            notificationMessage.title,
            notificationMessage.message,
            `/reviews/${review.id}`
        );

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

        // Upsert all responses
        const promises = Object.entries(responses).map(async ([questionId, data]) => {
            const existingResponse = await prisma.reviewResponse.findFirst({
                where: { reviewId, questionId }
            });

            if (existingResponse) {
                return prisma.reviewResponse.update({
                    where: { id: existingResponse.id },
                    data: {
                        selfRating: data.rating,
                        selfComment: data.comment,
                    }
                });
            } else {
                return prisma.reviewResponse.create({
                    data: {
                        reviewId,
                        questionId,
                        selfRating: data.rating,
                        selfComment: data.comment,
                    }
                });
            }
        });

        await Promise.all(promises);

        // Update review status and mark as submitted
        const review = await prisma.performanceReview.update({
            where: { id: reviewId },
            data: {
                status: 'PENDING_MANAGER',
                isDraft: false,
                employeeSubmittedAt: new Date()
            },
            include: {
                employee: true,
                manager: true,
                template: true,
            }
        });

        // Send email
        const { subject, html } = selfEvalSubmittedEmail(review.employee.name, review.manager.name, review.template.title);
        await sendEmail({ to: review.manager.email, subject, html });

        // Create notification for manager
        const notificationMessage = NOTIFICATION_MESSAGES.REVIEW_SUBMITTED(review.employee.name, review.template.title);
        await createNotification(
            review.managerId,
            NOTIFICATION_TYPES.REVIEW_SUBMITTED,
            notificationMessage.title,
            notificationMessage.message,
            `/reviews/${review.id}`
        );

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
            }).then((response: { id: string } | null) => {
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
            .filter((rating: number | null): rating is number => rating !== null);

        const overallScore = validRatings.length > 0
            ? Math.round((validRatings.reduce((sum: number, rating: number) => sum + rating, 0) / validRatings.length) * 100) / 100
            : null;

        const review = await prisma.performanceReview.update({
            where: { id: reviewId },
            data: {
                status: 'COMPLETED',
                overallScore,
                isDraft: false,
                managerSubmittedAt: new Date()
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

        // Create notification for employee
        const notificationMessage = NOTIFICATION_MESSAGES.REVIEW_COMPLETED(review.template.title);
        await createNotification(
            review.employeeId,
            NOTIFICATION_TYPES.REVIEW_COMPLETED,
            notificationMessage.title,
            notificationMessage.message,
            `/reviews/${review.id}`
        );

        revalidatePath('/dashboard');
        redirect('/dashboard');
    } catch (error) {
        console.error('Error submitting manager review:', error);
        throw new Error(ERRORS.REVIEW_SUBMIT_FAILED);
    }
}
