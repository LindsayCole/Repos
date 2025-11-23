'use server';

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';

/**
 * Get the count of unread notifications for a user
 * Used for the badge on the notification bell
 */
export async function getUnreadNotificationCount(userId: string): Promise<number> {
    try {
        if (!userId) {
            return 0;
        }

        const count = await prisma.notification.count({
            where: {
                userId,
                isRead: false,
            },
        });

        return count;
    } catch (error) {
        console.error('Error fetching unread notification count:', error);
        return 0;
    }
}

/**
 * Get all notifications for a user (paginated, most recent first)
 */
export async function getNotifications(userId: string, limit = 10) {
    try {
        if (!userId) {
            return [];
        }

        const notifications = await prisma.notification.findMany({
            where: {
                userId,
            },
            orderBy: {
                createdAt: 'desc',
            },
            take: limit,
        });

        return notifications;
    } catch (error) {
        console.error('Error fetching notifications:', error);
        return [];
    }
}

/**
 * Mark a single notification as read
 */
export async function markNotificationAsRead(notificationId: string) {
    try {
        if (!notificationId) {
            throw new Error('Notification ID is required');
        }

        await prisma.notification.update({
            where: { id: notificationId },
            data: { isRead: true },
        });

        revalidatePath('/dashboard');
        return { success: true };
    } catch (error) {
        console.error('Error marking notification as read:', error);
        throw new Error('Failed to mark notification as read');
    }
}

/**
 * Mark all notifications as read for a user
 */
export async function markAllNotificationsAsRead(userId: string) {
    try {
        if (!userId) {
            throw new Error('User ID is required');
        }

        await prisma.notification.updateMany({
            where: {
                userId,
                isRead: false,
            },
            data: {
                isRead: true,
            },
        });

        revalidatePath('/dashboard');
        return { success: true };
    } catch (error) {
        console.error('Error marking all notifications as read:', error);
        throw new Error('Failed to mark all notifications as read');
    }
}

/**
 * Create a new notification
 * Helper function used by other server actions
 */
export async function createNotification(
    userId: string,
    type: string,
    title: string,
    message: string,
    link?: string
) {
    try {
        if (!userId || !type || !title || !message) {
            throw new Error('Missing required fields for notification');
        }

        const notification = await prisma.notification.create({
            data: {
                userId,
                type,
                title,
                message,
                link: link || null,
                isRead: false,
            },
        });

        revalidatePath('/dashboard');
        return notification;
    } catch (error) {
        console.error('Error creating notification:', error);
        // Don't throw - notifications should not block main operations
        return null;
    }
}

/**
 * Delete old notifications (older than 30 days)
 * This should be run as a scheduled job (cron)
 */
export async function cleanupOldNotifications() {
    try {
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        const result = await prisma.notification.deleteMany({
            where: {
                createdAt: {
                    lt: thirtyDaysAgo,
                },
            },
        });

        console.log(`Cleaned up ${result.count} old notifications`);
        return { success: true, deletedCount: result.count };
    } catch (error) {
        console.error('Error cleaning up old notifications:', error);
        throw new Error('Failed to cleanup old notifications');
    }
}

/**
 * Get all notifications for a user (no limit)
 * Used for "View All" page in the future
 */
export async function getAllNotifications(userId: string) {
    try {
        if (!userId) {
            return [];
        }

        const notifications = await prisma.notification.findMany({
            where: {
                userId,
            },
            orderBy: {
                createdAt: 'desc',
            },
        });

        return notifications;
    } catch (error) {
        console.error('Error fetching all notifications:', error);
        return [];
    }
}

/**
 * Delete a single notification
 */
export async function deleteNotification(notificationId: string) {
    try {
        if (!notificationId) {
            throw new Error('Notification ID is required');
        }

        await prisma.notification.delete({
            where: { id: notificationId },
        });

        revalidatePath('/dashboard');
        return { success: true };
    } catch (error) {
        console.error('Error deleting notification:', error);
        throw new Error('Failed to delete notification');
    }
}
