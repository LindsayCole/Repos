'use server';

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { sendEmail, goalCreatedEmail, goalCompletedEmail, goalMilestoneEmail } from '@/lib/email';

export async function createGoal(data: {
    title: string;
    description?: string;
    targetDate?: Date | string;
    userId: string;
    managerId?: string;
}) {
    const goal = await prisma.goal.create({
        data: {
            title: data.title,
            description: data.description,
            targetDate: data.targetDate ? new Date(data.targetDate) : null,
            userId: data.userId,
            managerId: data.managerId,
            status: 'NOT_STARTED',
            progress: 0,
        },
        include: {
            user: true,
            manager: true,
        }
    });

    // Send email to manager if assigned
    if (goal.manager) {
        const { subject, html } = goalCreatedEmail(goal.user.name, goal.manager.name, goal.title);
        await sendEmail({ to: goal.manager.email, subject, html });
    }

    revalidatePath('/goals');
    revalidatePath('/dashboard');
    return goal;
}

export async function updateGoal(goalId: string, data: {
    title?: string;
    description?: string;
    targetDate?: Date | string;
    status?: string;
}) {
    const goal = await prisma.goal.update({
        where: { id: goalId },
        data: {
            ...(data.title && { title: data.title }),
            ...(data.description !== undefined && { description: data.description }),
            ...(data.targetDate && { targetDate: new Date(data.targetDate) }),
            ...(data.status && { status: data.status }),
        },
        include: {
            user: true,
            manager: true,
        }
    });

    revalidatePath('/goals');
    revalidatePath(`/goals/${goalId}`);
    revalidatePath('/dashboard');
    return goal;
}

export async function deleteGoal(goalId: string) {
    await prisma.goal.delete({
        where: { id: goalId },
    });

    revalidatePath('/goals');
    revalidatePath('/dashboard');
}

export async function updateGoalProgress(
    goalId: string,
    newProgress: number,
    note?: string,
    userId?: string
) {
    // Get current goal to track progress change
    const currentGoal = await prisma.goal.findUnique({
        where: { id: goalId },
        include: {
            user: true,
            manager: true,
        }
    });

    if (!currentGoal) {
        throw new Error('Goal not found');
    }

    const oldProgress = currentGoal.progress;

    // Update goal progress
    const goal = await prisma.goal.update({
        where: { id: goalId },
        data: {
            progress: newProgress,
            ...(newProgress > 0 && currentGoal.status === 'NOT_STARTED' && { status: 'IN_PROGRESS' }),
        },
        include: {
            user: true,
            manager: true,
        }
    });

    // Create progress update record
    if (userId) {
        await prisma.goalUpdate.create({
            data: {
                goalId,
                oldProgress,
                newProgress,
                note,
                createdById: userId,
            }
        });
    }

    // Send milestone emails at 25%, 50%, 75%
    const milestones = [25, 50, 75];
    const crossedMilestone = milestones.find(
        milestone => oldProgress < milestone && newProgress >= milestone
    );

    if (crossedMilestone && goal.manager) {
        const { subject, html } = goalMilestoneEmail(
            goal.user.name,
            goal.manager.name,
            goal.title,
            crossedMilestone
        );
        await sendEmail({ to: goal.manager.email, subject, html });
    }

    revalidatePath('/goals');
    revalidatePath(`/goals/${goalId}`);
    revalidatePath('/dashboard');
    revalidatePath('/team');
    return goal;
}

export async function completeGoal(goalId: string) {
    const goal = await prisma.goal.update({
        where: { id: goalId },
        data: {
            status: 'COMPLETED',
            progress: 100,
            completionDate: new Date(),
        },
        include: {
            user: true,
            manager: true,
        }
    });

    // Send completion notification
    if (goal.manager) {
        const { subject, html } = goalCompletedEmail(goal.user.name, goal.manager.name, goal.title);
        await sendEmail({ to: [goal.user.email, goal.manager.email].join(','), subject, html });
    }

    revalidatePath('/goals');
    revalidatePath(`/goals/${goalId}`);
    revalidatePath('/dashboard');
    revalidatePath('/team');
    return goal;
}

export async function getEmployeeGoals(userId: string, filter?: 'all' | 'active' | 'completed') {
    const statusFilter = filter === 'active'
        ? { in: ['NOT_STARTED', 'IN_PROGRESS'] }
        : filter === 'completed'
        ? 'COMPLETED'
        : undefined;

    const goals = await prisma.goal.findMany({
        where: {
            userId,
            ...(statusFilter && { status: statusFilter }),
        },
        include: {
            manager: true,
            updates: {
                orderBy: { createdAt: 'desc' },
                take: 3,
            },
        },
        orderBy: [
            { status: 'asc' },
            { targetDate: 'asc' },
        ],
    });

    return goals;
}

export async function getTeamGoals(managerId: string, filter?: 'all' | 'active' | 'completed') {
    const statusFilter = filter === 'active'
        ? { in: ['NOT_STARTED', 'IN_PROGRESS'] }
        : filter === 'completed'
        ? 'COMPLETED'
        : undefined;

    const goals = await prisma.goal.findMany({
        where: {
            managerId,
            ...(statusFilter && { status: statusFilter }),
        },
        include: {
            user: true,
            updates: {
                orderBy: { createdAt: 'desc' },
                take: 1,
            },
        },
        orderBy: [
            { status: 'asc' },
            { user: { name: 'asc' } },
        ],
    });

    return goals;
}

export async function getGoalById(goalId: string) {
    const goal = await prisma.goal.findUnique({
        where: { id: goalId },
        include: {
            user: true,
            manager: true,
            updates: {
                include: {
                    createdBy: true,
                },
                orderBy: { createdAt: 'desc' },
            },
        },
    });

    return goal;
}
