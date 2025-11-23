'use server';

import { prisma } from '@/lib/prisma';
import { sendEmail } from '@/lib/email';
import { shouldSendReminder } from '@/lib/deadlines';
import { formatDeadline } from '@/lib/deadlines';

/**
 * Send email reminders for reviews approaching their due date or overdue
 * This function should be called by a cron job (e.g., daily)
 *
 * @returns Object with counts of reminders sent and reviews checked
 */
export async function sendReviewReminders() {
    try {
        console.log('Starting review reminder process...');

        // Find all pending reviews with due dates
        const pendingReviews = await prisma.performanceReview.findMany({
            where: {
                OR: [
                    { status: 'PENDING_EMPLOYEE' },
                    { status: 'PENDING_MANAGER' }
                ],
                dueDate: {
                    not: null
                }
            },
            include: {
                employee: true,
                manager: true,
                template: true
            }
        });

        console.log(`Found ${pendingReviews.length} pending reviews with due dates`);

        let remindersSent = 0;
        const remindersToSend: Array<{
            reviewId: string;
            recipientEmail: string;
            recipientName: string;
            reviewTitle: string;
            dueDate: Date;
            status: string;
        }> = [];

        // Filter reviews that need reminders
        for (const review of pendingReviews) {
            if (!review.dueDate) continue;

            // Check if reminder should be sent
            // Note: In a real implementation, you would track lastReminderSent in the database
            // For now, we'll just check if the review needs a reminder based on due date
            const needsReminder = shouldSendReminder(review.dueDate, null);

            if (needsReminder) {
                const isEmployeePhase = review.status === 'PENDING_EMPLOYEE';
                const recipient = isEmployeePhase ? review.employee : review.manager;

                remindersToSend.push({
                    reviewId: review.id,
                    recipientEmail: recipient.email,
                    recipientName: recipient.name,
                    reviewTitle: review.template.title,
                    dueDate: review.dueDate,
                    status: review.status
                });
            }
        }

        console.log(`Sending ${remindersToSend.length} reminders...`);

        // Send email reminders
        for (const reminder of remindersToSend) {
            try {
                const deadlineText = formatDeadline(reminder.dueDate);
                const isEmployeePhase = reminder.status === 'PENDING_EMPLOYEE';

                const subject = `Reminder: Performance Review ${deadlineText}`;
                const html = `
                    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                        <h2 style="color: #0891b2;">Performance Review Reminder</h2>
                        <p>Hi ${reminder.recipientName},</p>
                        <p>This is a reminder about your pending performance review: <strong>${reminder.reviewTitle}</strong></p>
                        <div style="background-color: #fef3c7; border-left: 4px solid #f59e0b; padding: 16px; margin: 20px 0;">
                            <p style="margin: 0; color: #92400e;">
                                <strong>Status:</strong> ${deadlineText}
                            </p>
                        </div>
                        <p>
                            ${isEmployeePhase
                                ? 'Please complete your self-evaluation as soon as possible.'
                                : 'Please complete the manager review as soon as possible.'}
                        </p>
                        <p>
                            <a href="${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/reviews/${reminder.reviewId}"
                               style="display: inline-block; background-color: #0891b2; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin-top: 16px;">
                                Complete Review
                            </a>
                        </p>
                        <p style="color: #64748b; font-size: 14px; margin-top: 32px;">
                            This is an automated reminder from the Performance Management Platform.
                        </p>
                    </div>
                `;

                await sendEmail({
                    to: reminder.recipientEmail,
                    subject,
                    html
                });

                remindersSent++;

                // Log successful reminder
                console.log(`✓ Reminder sent to ${reminder.recipientName} (${reminder.recipientEmail}) for review: ${reminder.reviewTitle}`);

                // TODO: In a real implementation, you would update the review to track when the reminder was sent
                // await prisma.performanceReview.update({
                //     where: { id: reminder.reviewId },
                //     data: { lastReminderSent: new Date() }
                // });

            } catch (emailError) {
                console.error(`✗ Failed to send reminder for review ${reminder.reviewId}:`, emailError);
            }
        }

        const result = {
            success: true,
            reviewsChecked: pendingReviews.length,
            remindersSent,
            message: `Sent ${remindersSent} reminders out of ${pendingReviews.length} pending reviews`
        };

        console.log('Review reminder process completed:', result);
        return result;

    } catch (error) {
        console.error('Error in sendReviewReminders:', error);
        return {
            success: false,
            reviewsChecked: 0,
            remindersSent: 0,
            error: error instanceof Error ? error.message : 'Unknown error',
            message: 'Failed to send review reminders'
        };
    }
}

/**
 * Get upcoming deadlines for a specific user
 * Useful for dashboard widgets showing deadline alerts
 *
 * @param userId The user ID to check deadlines for
 * @returns Array of reviews with approaching deadlines
 */
export async function getUpcomingDeadlines(userId: string) {
    try {
        const upcomingReviews = await prisma.performanceReview.findMany({
            where: {
                OR: [
                    { employeeId: userId, status: 'PENDING_EMPLOYEE' },
                    { managerId: userId, status: 'PENDING_MANAGER' }
                ],
                dueDate: {
                    not: null,
                    lte: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // Within 7 days
                }
            },
            include: {
                template: true,
                employee: true,
                manager: true
            },
            orderBy: {
                dueDate: 'asc'
            }
        });

        return {
            success: true,
            deadlines: upcomingReviews
        };
    } catch (error) {
        console.error('Error fetching upcoming deadlines:', error);
        return {
            success: false,
            deadlines: [],
            error: error instanceof Error ? error.message : 'Unknown error'
        };
    }
}
