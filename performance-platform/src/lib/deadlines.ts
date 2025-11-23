import { differenceInDays, formatDistanceToNow, isPast, isToday, addDays } from 'date-fns';

/**
 * Calculate the status of a deadline based on the due date
 * @param dueDate The due date of the review
 * @returns The deadline status: 'overdue' | 'due-soon' | 'upcoming' | 'none'
 */
export function getDeadlineStatus(dueDate: Date | null): 'overdue' | 'due-soon' | 'upcoming' | 'none' {
    if (!dueDate) return 'none';

    const now = new Date();
    const daysUntilDue = differenceInDays(dueDate, now);

    // Overdue if past the due date
    if (isPast(dueDate) && !isToday(dueDate)) {
        return 'overdue';
    }

    // Due soon if within 3 days (inclusive of today)
    if (daysUntilDue <= 3) {
        return 'due-soon';
    }

    // Otherwise upcoming
    return 'upcoming';
}

/**
 * Get color coding for a deadline status
 * @param status The deadline status
 * @returns Object containing background, text, and border color classes
 */
export function getDeadlineColor(status: 'overdue' | 'due-soon' | 'upcoming' | 'none'): {
    bg: string;
    text: string;
    border: string;
} {
    switch (status) {
        case 'overdue':
            return {
                bg: 'bg-red-500/20',
                text: 'text-red-300',
                border: 'border-red-500/30'
            };
        case 'due-soon':
            return {
                bg: 'bg-orange-500/20',
                text: 'text-orange-300',
                border: 'border-orange-500/30'
            };
        case 'upcoming':
            return {
                bg: 'bg-blue-500/20',
                text: 'text-blue-300',
                border: 'border-blue-500/30'
            };
        case 'none':
        default:
            return {
                bg: 'bg-slate-700/20',
                text: 'text-slate-400',
                border: 'border-slate-600/30'
            };
    }
}

/**
 * Format deadline text for display
 * @param dueDate The due date of the review
 * @returns Formatted string like "Due in 2 days", "Overdue by 3 days", "Due today"
 */
export function formatDeadline(dueDate: Date): string {
    if (!dueDate) return 'No deadline';

    const now = new Date();

    // Check if it's today
    if (isToday(dueDate)) {
        return 'Due today';
    }

    // Check if overdue
    if (isPast(dueDate)) {
        const daysOverdue = Math.abs(differenceInDays(now, dueDate));
        if (daysOverdue === 1) {
            return 'Overdue by 1 day';
        }
        return `Overdue by ${daysOverdue} days`;
    }

    // Upcoming
    const daysUntilDue = differenceInDays(dueDate, now);
    if (daysUntilDue === 1) {
        return 'Due tomorrow';
    }
    return `Due in ${daysUntilDue} days`;
}

/**
 * Check if a reminder should be sent for a review
 * @param dueDate The due date of the review
 * @param lastReminderSent The date when the last reminder was sent (null if never sent)
 * @returns True if a reminder should be sent
 */
export function shouldSendReminder(dueDate: Date, lastReminderSent: Date | null): boolean {
    if (!dueDate) return false;

    const now = new Date();
    const daysUntilDue = differenceInDays(dueDate, now);

    // Don't send reminders for reviews that are overdue by more than 7 days
    if (daysUntilDue < -7) {
        return false;
    }

    // If no reminder has been sent yet
    if (!lastReminderSent) {
        // Send reminder if overdue or within 3 days
        return daysUntilDue <= 3;
    }

    // If reminder was sent, only send again if it's been at least 2 days
    const daysSinceLastReminder = differenceInDays(now, lastReminderSent);
    if (daysSinceLastReminder < 2) {
        return false;
    }

    // Send reminder if overdue or within 3 days
    return daysUntilDue <= 3;
}

/**
 * Calculate default due date for a review (14 days from now)
 * @returns Date object 14 days from now
 */
export function getDefaultDueDate(): Date {
    return addDays(new Date(), 14);
}
