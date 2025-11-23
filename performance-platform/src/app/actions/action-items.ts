'use server';

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { ERRORS } from '@/lib/constants';

export async function createActionItem(
    reviewId: string,
    title: string,
    description?: string,
    category?: string,
    priority: string = 'MEDIUM',
    targetDate?: Date
) {
    try {
        if (!reviewId || !title) {
            throw new Error('Review ID and title are required');
        }

        const actionItem = await prisma.actionItem.create({
            data: {
                reviewId,
                title,
                description: description || null,
                category: category || null,
                priority,
                targetDate: targetDate || null,
            }
        });

        revalidatePath(`/reviews/${reviewId}`);
        return { success: true, actionItem };
    } catch (error) {
        console.error('Error creating action item:', error);
        throw new Error('Failed to create action item');
    }
}

export async function updateActionItem(
    actionItemId: string,
    updates: {
        title?: string;
        description?: string;
        category?: string;
        priority?: string;
        targetDate?: Date | null;
        status?: string;
    }
) {
    try {
        if (!actionItemId) {
            throw new Error('Action item ID is required');
        }

        // If status is being changed to COMPLETED, set completedAt
        const data: any = { ...updates };
        if (updates.status === 'COMPLETED' && !data.completedAt) {
            data.completedAt = new Date();
        } else if (updates.status && updates.status !== 'COMPLETED') {
            data.completedAt = null;
        }

        const actionItem = await prisma.actionItem.update({
            where: { id: actionItemId },
            data,
            include: {
                review: true
            }
        });

        revalidatePath(`/reviews/${actionItem.reviewId}`);
        revalidatePath('/dashboard');
        return { success: true, actionItem };
    } catch (error) {
        console.error('Error updating action item:', error);
        throw new Error('Failed to update action item');
    }
}

export async function completeActionItem(actionItemId: string) {
    try {
        return await updateActionItem(actionItemId, {
            status: 'COMPLETED',
        });
    } catch (error) {
        console.error('Error completing action item:', error);
        throw new Error('Failed to complete action item');
    }
}

export async function deleteActionItem(actionItemId: string) {
    try {
        if (!actionItemId) {
            throw new Error('Action item ID is required');
        }

        const actionItem = await prisma.actionItem.findUnique({
            where: { id: actionItemId }
        });

        if (!actionItem) {
            throw new Error('Action item not found');
        }

        await prisma.actionItem.delete({
            where: { id: actionItemId }
        });

        revalidatePath(`/reviews/${actionItem.reviewId}`);
        revalidatePath('/dashboard');
        return { success: true };
    } catch (error) {
        console.error('Error deleting action item:', error);
        throw new Error('Failed to delete action item');
    }
}

export async function getActionItemsForReview(reviewId: string) {
    try {
        if (!reviewId) {
            throw new Error('Review ID is required');
        }

        const actionItems = await prisma.actionItem.findMany({
            where: { reviewId },
            orderBy: { createdAt: 'desc' }
        });

        return { success: true, actionItems };
    } catch (error) {
        console.error('Error fetching action items:', error);
        throw new Error('Failed to fetch action items');
    }
}

export async function getActionItemsForUser(userId: string) {
    try {
        if (!userId) {
            throw new Error('User ID is required');
        }

        const actionItems = await prisma.actionItem.findMany({
            where: {
                review: {
                    employeeId: userId
                }
            },
            include: {
                review: {
                    include: {
                        template: true,
                        employee: true
                    }
                }
            },
            orderBy: { targetDate: 'asc' }
        });

        return { success: true, actionItems };
    } catch (error) {
        console.error('Error fetching user action items:', error);
        throw new Error('Failed to fetch user action items');
    }
}
