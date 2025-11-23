'use server';

import { prisma } from '@/lib/prisma';
import { NOTIFICATION_TYPES, NOTIFICATION_MESSAGES } from '@/lib/constants';
import { createNotification } from './notifications';

/**
 * Create deadline notifications for reviews that are due soon or overdue
 * This function should be run as a scheduled job (cron) daily
 *
 * Logic:
 * - Find reviews due in 3 days -> Create "REVIEW_DUE_SOON" notification (3 days)
 * - Find reviews due in 1 day -> Create "REVIEW_DUE_SOON" notification (1 day)
 * - Find reviews overdue -> Create "REVIEW_OVERDUE" notification
 *
 * Only notifies for pending employee reviews (PENDING_EMPLOYEE status)
 * Avoids duplicate notifications by checking if notification already exists for the same review/type
 */
export async function createDeadlineNotifications() {
    try {
        const now = new Date();
        const threeDaysFromNow = new Date(now);
        threeDaysFromNow.setDate(now.getDate() + 3);
        threeDaysFromNow.setHours(23, 59, 59, 999);

        const oneDayFromNow = new Date(now);
        oneDayFromNow.setDate(now.getDate() + 1);
        oneDayFromNow.setHours(23, 59, 59, 999);

        const results = {
            threeDayReminders: 0,
            oneDayReminders: 0,
            overdueReminders: 0,
            errors: 0,
        };

        // Find all pending employee reviews with due dates
        const pendingReviews = await prisma.performanceReview.findMany({
            where: {
                status: 'PENDING_EMPLOYEE',
                dueDate: {
                    not: null,
                },
            },
            include: {
                employee: true,
                template: true,
            },
        });

        // Process each review and create appropriate notifications
        for (const review of pendingReviews) {
            if (!review.dueDate) continue;

            const dueDate = new Date(review.dueDate);
            const daysDiff = Math.ceil((dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

            try {
                // Check if review is overdue
                if (dueDate < now) {
                    // Check if we already sent an overdue notification
                    const existingNotification = await prisma.notification.findFirst({
                        where: {
                            userId: review.employeeId,
                            type: NOTIFICATION_TYPES.REVIEW_DUE_SOON,
                            link: `/reviews/${review.id}`,
                            createdAt: {
                                gte: new Date(now.getTime() - 24 * 60 * 60 * 1000), // Last 24 hours
                            },
                        },
                    });

                    if (!existingNotification) {
                        const notificationMessage = NOTIFICATION_MESSAGES.REVIEW_OVERDUE(review.template.title);
                        await createNotification(
                            review.employeeId,
                            NOTIFICATION_TYPES.REVIEW_DUE_SOON,
                            notificationMessage.title,
                            notificationMessage.message,
                            `/reviews/${review.id}`
                        );
                        results.overdueReminders++;
                    }
                }
                // Check if due in 1 day
                else if (daysDiff === 1) {
                    const existingNotification = await prisma.notification.findFirst({
                        where: {
                            userId: review.employeeId,
                            type: NOTIFICATION_TYPES.REVIEW_DUE_SOON,
                            link: `/reviews/${review.id}`,
                            createdAt: {
                                gte: new Date(now.getTime() - 24 * 60 * 60 * 1000), // Last 24 hours
                            },
                        },
                    });

                    if (!existingNotification) {
                        const notificationMessage = NOTIFICATION_MESSAGES.REVIEW_DUE_SOON(review.template.title, 1);
                        await createNotification(
                            review.employeeId,
                            NOTIFICATION_TYPES.REVIEW_DUE_SOON,
                            notificationMessage.title,
                            notificationMessage.message,
                            `/reviews/${review.id}`
                        );
                        results.oneDayReminders++;
                    }
                }
                // Check if due in 3 days
                else if (daysDiff === 3) {
                    const existingNotification = await prisma.notification.findFirst({
                        where: {
                            userId: review.employeeId,
                            type: NOTIFICATION_TYPES.REVIEW_DUE_SOON,
                            link: `/reviews/${review.id}`,
                            createdAt: {
                                gte: new Date(now.getTime() - 24 * 60 * 60 * 1000), // Last 24 hours
                            },
                        },
                    });

                    if (!existingNotification) {
                        const notificationMessage = NOTIFICATION_MESSAGES.REVIEW_DUE_SOON(review.template.title, 3);
                        await createNotification(
                            review.employeeId,
                            NOTIFICATION_TYPES.REVIEW_DUE_SOON,
                            notificationMessage.title,
                            notificationMessage.message,
                            `/reviews/${review.id}`
                        );
                        results.threeDayReminders++;
                    }
                }
            } catch (error) {
                console.error(`Error creating deadline notification for review ${review.id}:`, error);
                results.errors++;
            }
        }

        console.log('Deadline notifications created:', results);
        return {
            success: true,
            message: 'Deadline notifications processed successfully',
            results,
        };
    } catch (error) {
        console.error('Error creating deadline notifications:', error);
        throw new Error('Failed to create deadline notifications');
    }
}

/**
 * Manual trigger to send reminders for a specific review
 * Useful for testing or one-off manual reminders
 */
export async function sendReviewReminder(reviewId: string) {
    try {
        const review = await prisma.performanceReview.findUnique({
            where: { id: reviewId },
            include: {
                employee: true,
                template: true,
            },
        });

        if (!review) {
            throw new Error('Review not found');
        }

        if (!review.dueDate) {
            throw new Error('Review has no due date');
        }

        const now = new Date();
        const dueDate = new Date(review.dueDate);
        const daysDiff = Math.ceil((dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

        let notificationMessage;
        if (dueDate < now) {
            notificationMessage = NOTIFICATION_MESSAGES.REVIEW_OVERDUE(review.template.title);
        } else {
            notificationMessage = NOTIFICATION_MESSAGES.REVIEW_DUE_SOON(review.template.title, Math.max(daysDiff, 0));
        }

        await createNotification(
            review.employeeId,
            NOTIFICATION_TYPES.REVIEW_DUE_SOON,
            notificationMessage.title,
            notificationMessage.message,
            `/reviews/${review.id}`
        );

        return {
            success: true,
            message: 'Reminder notification sent successfully',
        };
    } catch (error) {
        console.error('Error sending review reminder:', error);
        throw error instanceof Error ? error : new Error('Failed to send review reminder');
    }
}
