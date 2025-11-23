'use server';

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { sendEmail, reviewAssignedEmail } from '@/lib/email';

export async function createReviewCycle(data: {
    name: string;
    description?: string;
    frequency: string;
    startDate: Date | string;
    templateId: string;
    departments?: string[];
    includeAllUsers: boolean;
}) {
    // Calculate next run date based on frequency
    const startDate = new Date(data.startDate);
    let nextRunDate = new Date(startDate);

    switch (data.frequency) {
        case 'MONTHLY':
            nextRunDate.setMonth(nextRunDate.getMonth() + 1);
            break;
        case 'QUARTERLY':
            nextRunDate.setMonth(nextRunDate.getMonth() + 3);
            break;
        case 'SEMI_ANNUAL':
            nextRunDate.setMonth(nextRunDate.getMonth() + 6);
            break;
        case 'ANNUAL':
            nextRunDate.setFullYear(nextRunDate.getFullYear() + 1);
            break;
    }

    const cycle = await prisma.reviewCycle.create({
        data: {
            name: data.name,
            description: data.description,
            frequency: data.frequency,
            startDate: startDate,
            nextRunDate: nextRunDate,
            templateId: data.templateId,
            isActive: true,
            departments: data.departments ? JSON.stringify(data.departments) : null,
            includeAllUsers: data.includeAllUsers,
        },
        include: {
            template: true,
        },
    });

    revalidatePath('/cycles');
    revalidatePath('/dashboard');
    return cycle;
}

export async function updateReviewCycle(cycleId: string, data: {
    name?: string;
    description?: string;
    isActive?: boolean;
}) {
    const cycle = await prisma.reviewCycle.update({
        where: { id: cycleId },
        data: {
            ...(data.name && { name: data.name }),
            ...(data.description !== undefined && { description: data.description }),
            ...(data.isActive !== undefined && { isActive: data.isActive }),
        },
    });

    revalidatePath('/cycles');
    revalidatePath(`/cycles/${cycleId}`);
    return cycle;
}

export async function deleteReviewCycle(cycleId: string) {
    await prisma.reviewCycle.delete({
        where: { id: cycleId },
    });

    revalidatePath('/cycles');
}

export async function launchReviewCycle(cycleId: string) {
    const cycle = await prisma.reviewCycle.findUnique({
        where: { id: cycleId },
        include: {
            template: true,
        },
    });

    if (!cycle) {
        throw new Error('Review cycle not found');
    }

    // Get target users
    let targetUsers;

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
    } else {
        targetUsers = [];
    }

    // Create reviews for all target users
    const reviews = await Promise.all(
        targetUsers.map(async (user) => {
            if (!user.manager) return null;

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

            return review;
        })
    );

    // Update cycle with last run date and calculate next run date
    const now = new Date();
    let nextRunDate = new Date(cycle.nextRunDate || now);

    switch (cycle.frequency) {
        case 'MONTHLY':
            nextRunDate.setMonth(nextRunDate.getMonth() + 1);
            break;
        case 'QUARTERLY':
            nextRunDate.setMonth(nextRunDate.getMonth() + 3);
            break;
        case 'SEMI_ANNUAL':
            nextRunDate.setMonth(nextRunDate.getMonth() + 6);
            break;
        case 'ANNUAL':
            nextRunDate.setFullYear(nextRunDate.getFullYear() + 1);
            break;
    }

    await prisma.reviewCycle.update({
        where: { id: cycleId },
        data: {
            lastRunDate: now,
            nextRunDate: nextRunDate,
        },
    });

    revalidatePath('/cycles');
    revalidatePath(`/cycles/${cycleId}`);
    revalidatePath('/dashboard');

    return {
        cycle,
        reviewsCreated: reviews.filter(r => r !== null).length,
    };
}

export async function getUpcomingCycles() {
    const cycles = await prisma.reviewCycle.findMany({
        where: {
            isActive: true,
            nextRunDate: {
                lte: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // Next 30 days
            },
        },
        include: {
            template: true,
        },
        orderBy: {
            nextRunDate: 'asc',
        },
    });

    return cycles;
}

export async function getCycleProgress(cycleId: string) {
    const reviews = await prisma.performanceReview.findMany({
        where: { cycleId },
    });

    const total = reviews.length;
    const completed = reviews.filter(r => r.status === 'COMPLETED').length;
    const pendingEmployee = reviews.filter(r => r.status === 'PENDING_EMPLOYEE').length;
    const pendingManager = reviews.filter(r => r.status === 'PENDING_MANAGER').length;

    return {
        total,
        completed,
        pendingEmployee,
        pendingManager,
        completionRate: total > 0 ? Math.round((completed / total) * 100) : 0,
    };
}
