'use server';

import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import { revalidatePath } from 'next/cache';
import { sendEmail, reviewAssignedEmail } from '@/lib/email';
import { ERRORS, SUCCESS_MESSAGES, NOTIFICATION_TYPES, NOTIFICATION_MESSAGES } from '@/lib/constants';
import { createNotification } from './notifications';

interface CreateCycleData {
    name: string;
    description?: string;
    startDate: Date;
    endDate: Date;
    dueDate: Date;
    templateId: string;
}

/**
 * Create a review cycle and bulk create reviews for selected employees
 * Handles batching to prevent overwhelming the database with large employee sets
 */
export async function createReviewCycle(
    cycleData: CreateCycleData,
    employeeIds: string[]
) {
    try {
        const user = await getCurrentUser();

        if (!user || user.role !== 'HR') {
            throw new Error(ERRORS.AUTH_UNAUTHORIZED);
        }

        // Validate template exists
        const template = await prisma.formTemplate.findUnique({
            where: { id: cycleData.templateId }
        });

        if (!template) {
            throw new Error(ERRORS.TEMPLATE_NOT_FOUND);
        }

        // Validate employees exist
        const employees = await prisma.user.findMany({
            where: {
                id: { in: employeeIds },
                role: { in: ['EMPLOYEE', 'MANAGER'] }
            },
            include: {
                manager: true
            }
        });

        if (employees.length !== employeeIds.length) {
            throw new Error('One or more employee IDs are invalid');
        }

        // Check for employees without managers
        const employeesWithoutManagers = employees.filter(emp => !emp.managerId);
        if (employeesWithoutManagers.length > 0) {
            throw new Error(
                `Cannot create reviews: ${employeesWithoutManagers.length} employee(s) do not have assigned managers`
            );
        }

        // Create the review cycle
        const cycle = await prisma.reviewCycle.create({
            data: {
                name: cycleData.name,
                description: cycleData.description,
                startDate: cycleData.startDate,
                endDate: cycleData.endDate,
                dueDate: cycleData.dueDate,
                status: 'ACTIVE',
                createdById: user.id,
            }
        });

        // Batch create reviews to avoid overwhelming the database
        const BATCH_SIZE = 50;
        const reviewPromises = [];

        for (let i = 0; i < employees.length; i += BATCH_SIZE) {
            const batch = employees.slice(i, i + BATCH_SIZE);

            const batchPromise = prisma.performanceReview.createMany({
                data: batch.map(employee => ({
                    templateId: cycleData.templateId,
                    employeeId: employee.id,
                    managerId: employee.managerId!,
                    cycleId: cycle.id,
                    status: 'PENDING_EMPLOYEE',
                    dueDate: cycleData.dueDate,
                    isDraft: false,
                })),
                skipDuplicates: true, // Prevent duplicate reviews
            });

            reviewPromises.push(batchPromise);
        }

        await Promise.all(reviewPromises);

        // Get all created reviews with their IDs for notification creation
        const createdReviews = await prisma.performanceReview.findMany({
            where: { cycleId: cycle.id },
            select: {
                id: true,
                employeeId: true,
            }
        });

        // Send email notifications in batches (don't send 500 individual emails)
        // Group employees and send BCC emails
        const EMAIL_BATCH_SIZE = 50;
        const emailPromises = [];

        for (let i = 0; i < employees.length; i += EMAIL_BATCH_SIZE) {
            const batch = employees.slice(i, i + EMAIL_BATCH_SIZE);
            const emailList = batch.map(emp => emp.email).join(',');

            const { subject, html } = reviewAssignedEmail(
                'Team Member',
                `${template.title} - ${cycle.name}`
            );

            const emailPromise = sendEmail({
                to: emailList,
                subject,
                html: html.replace(
                    'Hi Team Member,',
                    `<p>Hi,</p><p>You have been assigned a new performance review as part of the ${cycle.name} cycle.</p>`
                ),
            });

            emailPromises.push(emailPromise);
        }

        // Don't await email sending to avoid blocking
        Promise.all(emailPromises).catch(err =>
            console.error('Error sending bulk emails:', err)
        );

        // Create notifications for all employees (in batches to avoid overwhelming the database)
        const NOTIFICATION_BATCH_SIZE = 50;
        const notificationPromises = [];

        for (let i = 0; i < employees.length; i += NOTIFICATION_BATCH_SIZE) {
            const batch = employees.slice(i, i + NOTIFICATION_BATCH_SIZE);

            const batchPromise = Promise.all(
                batch.map(async (employee) => {
                    const review = createdReviews.find(r => r.employeeId === employee.id);
                    if (review) {
                        const notificationMessage = NOTIFICATION_MESSAGES.CYCLE_CREATED(cycle.name, template.title);
                        await createNotification(
                            employee.id,
                            NOTIFICATION_TYPES.CYCLE_CREATED,
                            notificationMessage.title,
                            notificationMessage.message,
                            `/reviews/${review.id}`
                        );
                    }
                })
            );

            notificationPromises.push(batchPromise);
        }

        // Don't await notification creation to avoid blocking
        Promise.all(notificationPromises).catch(err =>
            console.error('Error creating notifications:', err)
        );

        // Get final count of created reviews
        const reviewCount = await prisma.performanceReview.count({
            where: { cycleId: cycle.id }
        });

        revalidatePath('/cycles');
        revalidatePath('/dashboard');

        return {
            success: true,
            message: SUCCESS_MESSAGES.REVIEW_CREATED,
            cycle: {
                ...cycle,
                reviewCount,
            }
        };
    } catch (error) {
        console.error('Error creating review cycle:', error);
        throw error instanceof Error ? error : new Error(ERRORS.REVIEW_CREATE_FAILED);
    }
}

/**
 * Get detailed information about a review cycle including all reviews
 */
export async function getCycleDetails(cycleId: string) {
    try {
        const user = await getCurrentUser();

        if (!user || user.role !== 'HR') {
            throw new Error(ERRORS.AUTH_UNAUTHORIZED);
        }

        const cycle = await prisma.reviewCycle.findUnique({
            where: { id: cycleId },
            include: {
                reviews: {
                    include: {
                        employee: {
                            select: {
                                id: true,
                                name: true,
                                email: true,
                                department: true,
                            }
                        },
                        manager: {
                            select: {
                                id: true,
                                name: true,
                                email: true,
                            }
                        },
                        template: {
                            select: {
                                id: true,
                                title: true,
                            }
                        }
                    },
                    orderBy: {
                        createdAt: 'desc'
                    }
                },
                createdBy: {
                    select: {
                        name: true,
                        email: true,
                    }
                }
            }
        });

        if (!cycle) {
            throw new Error('Review cycle not found');
        }

        // Calculate statistics
        const totalReviews = cycle.reviews.length;
        const completedReviews = cycle.reviews.filter(r => r.status === 'COMPLETED').length;
        const pendingEmployee = cycle.reviews.filter(r => r.status === 'PENDING_EMPLOYEE').length;
        const pendingManager = cycle.reviews.filter(r => r.status === 'PENDING_MANAGER').length;
        const completionPercentage = totalReviews > 0
            ? Math.round((completedReviews / totalReviews) * 100)
            : 0;

        return {
            ...cycle,
            stats: {
                totalReviews,
                completedReviews,
                pendingEmployee,
                pendingManager,
                completionPercentage,
            }
        };
    } catch (error) {
        console.error('Error fetching cycle details:', error);
        throw error instanceof Error ? error : new Error('Failed to fetch cycle details');
    }
}

/**
 * Get all review cycles
 */
export async function getAllCycles() {
    try {
        const user = await getCurrentUser();

        if (!user || user.role !== 'HR') {
            throw new Error(ERRORS.AUTH_UNAUTHORIZED);
        }

        const cycles = await prisma.reviewCycle.findMany({
            include: {
                _count: {
                    select: { reviews: true }
                },
                createdBy: {
                    select: {
                        name: true,
                    }
                }
            },
            orderBy: {
                startDate: 'desc'
            }
        });

        // Calculate completion stats for each cycle
        const cyclesWithStats = await Promise.all(
            cycles.map(async (cycle) => {
                const completedCount = await prisma.performanceReview.count({
                    where: {
                        cycleId: cycle.id,
                        status: 'COMPLETED'
                    }
                });

                return {
                    ...cycle,
                    reviewCount: cycle._count.reviews,
                    completedCount,
                    completionPercentage: cycle._count.reviews > 0
                        ? Math.round((completedCount / cycle._count.reviews) * 100)
                        : 0,
                };
            })
        );

        return cyclesWithStats;
    } catch (error) {
        console.error('Error fetching cycles:', error);
        throw error instanceof Error ? error : new Error('Failed to fetch cycles');
    }
}

/**
 * Update the status of a review cycle
 */
export async function updateCycleStatus(cycleId: string, status: 'DRAFT' | 'ACTIVE' | 'COMPLETED') {
    try {
        const user = await getCurrentUser();

        if (!user || user.role !== 'HR') {
            throw new Error(ERRORS.AUTH_UNAUTHORIZED);
        }

        const cycle = await prisma.reviewCycle.update({
            where: { id: cycleId },
            data: { status }
        });

        revalidatePath('/cycles');
        revalidatePath(`/cycles/${cycleId}`);

        return {
            success: true,
            message: 'Cycle status updated successfully',
            cycle,
        };
    } catch (error) {
        console.error('Error updating cycle status:', error);
        throw error instanceof Error ? error : new Error('Failed to update cycle status');
    }
}

/**
 * Send reminder emails to all employees with pending reviews in a cycle
 */
export async function sendCycleReminders(cycleId: string) {
    try {
        const user = await getCurrentUser();

        if (!user || user.role !== 'HR') {
            throw new Error(ERRORS.AUTH_UNAUTHORIZED);
        }

        const cycle = await prisma.reviewCycle.findUnique({
            where: { id: cycleId },
            include: {
                reviews: {
                    where: {
                        status: { in: ['PENDING_EMPLOYEE', 'PENDING_MANAGER'] }
                    },
                    include: {
                        employee: true,
                        manager: true,
                        template: true,
                    }
                }
            }
        });

        if (!cycle) {
            throw new Error('Review cycle not found');
        }

        // Group by status and send appropriate emails
        const pendingEmployeeReviews = cycle.reviews.filter(r => r.status === 'PENDING_EMPLOYEE');
        const pendingManagerReviews = cycle.reviews.filter(r => r.status === 'PENDING_MANAGER');

        const emailPromises = [];

        // Send reminders to employees
        if (pendingEmployeeReviews.length > 0) {
            const employeeEmails = pendingEmployeeReviews.map(r => r.employee.email).join(',');
            emailPromises.push(
                sendEmail({
                    to: employeeEmails,
                    subject: `Reminder: Complete Your Performance Review - ${cycle.name}`,
                    html: `<p>This is a friendly reminder to complete your self-evaluation for the ${cycle.name} performance review cycle. The deadline is ${new Date(cycle.dueDate).toLocaleDateString()}.</p>`,
                })
            );
        }

        // Send reminders to managers
        if (pendingManagerReviews.length > 0) {
            const managerEmails = [...new Set(pendingManagerReviews.map(r => r.manager.email))].join(',');
            emailPromises.push(
                sendEmail({
                    to: managerEmails,
                    subject: `Reminder: Complete Manager Reviews - ${cycle.name}`,
                    html: `<p>This is a friendly reminder to complete the manager reviews for the ${cycle.name} performance review cycle. The deadline is ${new Date(cycle.dueDate).toLocaleDateString()}.</p>`,
                })
            );
        }

        await Promise.all(emailPromises);

        revalidatePath(`/cycles/${cycleId}`);

        return {
            success: true,
            message: `Reminders sent to ${pendingEmployeeReviews.length + pendingManagerReviews.length} recipients`,
        };
    } catch (error) {
        console.error('Error sending cycle reminders:', error);
        throw error instanceof Error ? error : new Error('Failed to send reminders');
    }
}

/**
 * Get all employees eligible for review assignment
 */
export async function getEligibleEmployees(departmentFilter?: string) {
    try {
        const user = await getCurrentUser();

        if (!user || user.role !== 'HR') {
            throw new Error(ERRORS.AUTH_UNAUTHORIZED);
        }

        const employees = await prisma.user.findMany({
            where: {
                role: { in: ['EMPLOYEE', 'MANAGER'] },
                managerId: { not: null },
                ...(departmentFilter ? { department: departmentFilter } : {}),
            },
            include: {
                manager: {
                    select: {
                        id: true,
                        name: true,
                    }
                }
            },
            orderBy: {
                name: 'asc'
            }
        });

        return employees;
    } catch (error) {
        console.error('Error fetching eligible employees:', error);
        throw error instanceof Error ? error : new Error('Failed to fetch employees');
    }
}
