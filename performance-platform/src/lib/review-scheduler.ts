import { prisma } from './prisma';
import { sendEmail, reviewAssignedEmail } from './email';

/**
 * Check for review cycles that are due to run and launch them automatically
 * This function is called by the cron job
 */
export async function processScheduledReviewCycles() {
    const now = new Date();

    console.log(`[Review Scheduler] Checking for due cycles at ${now.toISOString()}`);

    // Find all active cycles where nextRunDate is in the past or today
    const dueCycles = await prisma.reviewCycle.findMany({
        where: {
            isActive: true,
            nextRunDate: {
                lte: now,
            },
        },
        include: {
            template: true,
        },
    });

    console.log(`[Review Scheduler] Found ${dueCycles.length} due cycles`);

    const results = [];

    for (const cycle of dueCycles) {
        try {
            console.log(`[Review Scheduler] Processing cycle: ${cycle.name} (${cycle.id})`);

            // Get target users
            let targetUsers: Array<{
                id: string;
                managerId: string | null;
                manager: { id: string; name: string; email: string } | null;
                name: string;
                email: string;
            }> = [];

            if (cycle.includeAllUsers) {
                targetUsers = await prisma.user.findMany({
                    where: {
                        role: { in: ['EMPLOYEE', 'MANAGER'] },
                        managerId: { not: null },
                    },
                    include: {
                        manager: true,
                    },
                });
            } else if (cycle.departments) {
                const depts = JSON.parse(cycle.departments);
                targetUsers = await prisma.user.findMany({
                    where: {
                        department: { in: depts },
                        managerId: { not: null },
                    },
                    include: {
                        manager: true,
                    },
                });
            }

            console.log(`[Review Scheduler] Creating reviews for ${targetUsers.length} users`);

            // Create reviews for all target users
            const reviews = [];
            for (const user of targetUsers) {
                if (!user.manager) continue;

                try {
                    const review = await prisma.performanceReview.create({
                        data: {
                            templateId: cycle.templateId,
                            employeeId: user.id,
                            managerId: user.managerId!,
                            cycleId: cycle.id,
                            status: 'PENDING_EMPLOYEE',
                        },
                        include: {
                            employee: true,
                            manager: true,
                            template: true,
                        },
                    });

                    // Send email notification
                    const { subject, html } = reviewAssignedEmail(review.employee.name, review.template.title);
                    await sendEmail({ to: review.employee.email, subject, html });

                    reviews.push(review);
                } catch (error) {
                    console.error(`[Review Scheduler] Error creating review for user ${user.id}:`, error);
                }
            }

            // Calculate next run date
            const nextRunDate = calculateNextRunDate(cycle.nextRunDate || now, cycle.frequency);

            // Update cycle with last run date and next run date
            await prisma.reviewCycle.update({
                where: { id: cycle.id },
                data: {
                    lastRunDate: now,
                    nextRunDate: nextRunDate,
                },
            });

            results.push({
                cycleId: cycle.id,
                cycleName: cycle.name,
                reviewsCreated: reviews.length,
                nextRunDate: nextRunDate,
                success: true,
            });

            console.log(`[Review Scheduler] Successfully processed cycle ${cycle.name}: ${reviews.length} reviews created`);
        } catch (error) {
            console.error(`[Review Scheduler] Error processing cycle ${cycle.id}:`, error);
            results.push({
                cycleId: cycle.id,
                cycleName: cycle.name,
                reviewsCreated: 0,
                error: error instanceof Error ? error.message : 'Unknown error',
                success: false,
            });
        }
    }

    console.log(`[Review Scheduler] Completed processing ${results.length} cycles`);

    return {
        processedAt: now,
        cyclesProcessed: results.length,
        results,
    };
}

/**
 * Calculate the next run date based on the current date and frequency
 */
function calculateNextRunDate(currentDate: Date, frequency: string): Date {
    const nextDate = new Date(currentDate);

    switch (frequency) {
        case 'MONTHLY':
            nextDate.setMonth(nextDate.getMonth() + 1);
            break;
        case 'QUARTERLY':
            nextDate.setMonth(nextDate.getMonth() + 3);
            break;
        case 'SEMI_ANNUAL':
            nextDate.setMonth(nextDate.getMonth() + 6);
            break;
        case 'ANNUAL':
            nextDate.setFullYear(nextDate.getFullYear() + 1);
            break;
        default:
            // Default to annual if frequency is unknown
            nextDate.setFullYear(nextDate.getFullYear() + 1);
    }

    return nextDate;
}

/**
 * Get upcoming review cycles (next 30 days)
 */
export async function getUpcomingReviewCycles() {
    const now = new Date();
    const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

    const upcomingCycles = await prisma.reviewCycle.findMany({
        where: {
            isActive: true,
            nextRunDate: {
                gte: now,
                lte: thirtyDaysFromNow,
            },
        },
        include: {
            template: true,
        },
        orderBy: {
            nextRunDate: 'asc',
        },
    });

    return upcomingCycles;
}
