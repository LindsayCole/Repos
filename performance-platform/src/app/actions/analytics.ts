'use server';

import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import { redirect } from 'next/navigation';

// Type definitions for analytics data
export interface OverviewMetrics {
    totalReviews: number;
    activeReviews: number;
    completionRate: number;
    averageScore: number;
    previousPeriodCompletion: number;
    previousPeriodScore: number;
}

export interface ReviewStatusBreakdown {
    pendingEmployee: { count: number; percentage: number };
    pendingManager: { count: number; percentage: number };
    completed: { count: number; percentage: number };
    overdue: { count: number; percentage: number };
}

export interface ReviewsByMonth {
    month: string;
    created: number;
    completed: number;
}

export interface DepartmentScore {
    department: string;
    employeeCount: number;
    avgScore: number;
    reviewsCompleted: number;
    completionRate: number;
}

export interface TopPerformer {
    id: string;
    name: string;
    department: string;
    avgScore: number;
    reviewCount: number;
}

export interface TemplateUsage {
    templateId: string;
    templateName: string;
    reviewsCreated: number;
    completionRate: number;
    avgScore: number;
}

/**
 * Get overview metrics for the analytics dashboard
 * Optimized using Prisma aggregations
 */
export async function getOverviewMetrics(timeRange: string = 'all'): Promise<OverviewMetrics> {
    const user = await getCurrentUser();
    if (!user || user.role !== 'HR') {
        redirect('/dashboard');
    }

    const dateFilter = getDateFilter(timeRange);
    const previousDateFilter = getPreviousDateFilter(timeRange);

    // Total reviews (all time)
    const totalReviews = await prisma.performanceReview.count();

    // Active reviews (pending)
    const activeReviews = await prisma.performanceReview.count({
        where: {
            status: { in: ['PENDING_EMPLOYEE', 'PENDING_MANAGER'] },
        },
    });

    // Completed reviews in time range
    const completedReviews = await prisma.performanceReview.count({
        where: {
            status: 'COMPLETED',
            ...(dateFilter.createdAt && { createdAt: dateFilter.createdAt }),
        },
    });

    // Total reviews in time range
    const totalInRange = await prisma.performanceReview.count({
        where: dateFilter,
    });

    // Completion rate
    const completionRate = totalInRange > 0
        ? Math.round((completedReviews / totalInRange) * 100)
        : 0;

    // Previous period completion rate (for comparison)
    const previousCompleted = await prisma.performanceReview.count({
        where: {
            status: 'COMPLETED',
            ...(previousDateFilter.createdAt && { createdAt: previousDateFilter.createdAt }),
        },
    });

    const previousTotal = await prisma.performanceReview.count({
        where: previousDateFilter,
    });

    const previousPeriodCompletion = previousTotal > 0
        ? Math.round((previousCompleted / previousTotal) * 100)
        : 0;

    // Average score (org-wide)
    const avgScoreResult = await prisma.performanceReview.aggregate({
        where: {
            status: 'COMPLETED',
            overallScore: { not: null },
            ...(dateFilter.createdAt && { createdAt: dateFilter.createdAt }),
        },
        _avg: {
            overallScore: true,
        },
    });

    const averageScore = avgScoreResult._avg.overallScore
        ? Math.round(avgScoreResult._avg.overallScore * 100) / 100
        : 0;

    // Previous period average score
    const previousAvgResult = await prisma.performanceReview.aggregate({
        where: {
            status: 'COMPLETED',
            overallScore: { not: null },
            ...(previousDateFilter.createdAt && { createdAt: previousDateFilter.createdAt }),
        },
        _avg: {
            overallScore: true,
        },
    });

    const previousPeriodScore = previousAvgResult._avg.overallScore
        ? Math.round(previousAvgResult._avg.overallScore * 100) / 100
        : 0;

    return {
        totalReviews,
        activeReviews,
        completionRate,
        averageScore,
        previousPeriodCompletion,
        previousPeriodScore,
    };
}

/**
 * Get review status breakdown with counts and percentages
 */
export async function getReviewStatusBreakdown(): Promise<ReviewStatusBreakdown> {
    const user = await getCurrentUser();
    if (!user || user.role !== 'HR') {
        redirect('/dashboard');
    }

    const totalReviews = await prisma.performanceReview.count();

    const pendingEmployeeCount = await prisma.performanceReview.count({
        where: { status: 'PENDING_EMPLOYEE' },
    });

    const pendingManagerCount = await prisma.performanceReview.count({
        where: { status: 'PENDING_MANAGER' },
    });

    const completedCount = await prisma.performanceReview.count({
        where: { status: 'COMPLETED' },
    });

    // Calculate overdue (created more than 30 days ago and not completed)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const overdueCount = await prisma.performanceReview.count({
        where: {
            status: { in: ['PENDING_EMPLOYEE', 'PENDING_MANAGER'] },
            createdAt: { lt: thirtyDaysAgo },
        },
    });

    return {
        pendingEmployee: {
            count: pendingEmployeeCount,
            percentage: totalReviews > 0 ? Math.round((pendingEmployeeCount / totalReviews) * 100) : 0,
        },
        pendingManager: {
            count: pendingManagerCount,
            percentage: totalReviews > 0 ? Math.round((pendingManagerCount / totalReviews) * 100) : 0,
        },
        completed: {
            count: completedCount,
            percentage: totalReviews > 0 ? Math.round((completedCount / totalReviews) * 100) : 0,
        },
        overdue: {
            count: overdueCount,
            percentage: totalReviews > 0 ? Math.round((overdueCount / totalReviews) * 100) : 0,
        },
    };
}

/**
 * Get reviews created and completed by month
 */
export async function getReviewsByMonth(months: number = 12): Promise<ReviewsByMonth[]> {
    const user = await getCurrentUser();
    if (!user || user.role !== 'HR') {
        redirect('/dashboard');
    }

    const startDate = new Date();
    startDate.setMonth(startDate.getMonth() - months);

    // Fetch all reviews in the time range
    const reviews = await prisma.performanceReview.findMany({
        where: {
            createdAt: { gte: startDate },
        },
        select: {
            createdAt: true,
            updatedAt: true,
            status: true,
        },
    });

    // Group by month
    const monthMap: Record<string, { created: number; completed: number }> = {};

    reviews.forEach((review) => {
        const createdMonth = review.createdAt.toISOString().slice(0, 7); // YYYY-MM

        if (!monthMap[createdMonth]) {
            monthMap[createdMonth] = { created: 0, completed: 0 };
        }
        monthMap[createdMonth].created++;

        if (review.status === 'COMPLETED') {
            const completedMonth = review.updatedAt.toISOString().slice(0, 7);
            if (!monthMap[completedMonth]) {
                monthMap[completedMonth] = { created: 0, completed: 0 };
            }
            monthMap[completedMonth].completed++;
        }
    });

    // Convert to array and format month names
    const result: ReviewsByMonth[] = Object.entries(monthMap)
        .map(([month, data]) => ({
            month: formatMonth(month),
            created: data.created,
            completed: data.completed,
        }))
        .sort((a, b) => a.month.localeCompare(b.month));

    return result;
}

/**
 * Get average scores by department
 */
export async function getScoresByDepartment(): Promise<DepartmentScore[]> {
    const user = await getCurrentUser();
    if (!user || user.role !== 'HR') {
        redirect('/dashboard');
    }

    // Get all users with department info
    const users = await prisma.user.findMany({
        where: {
            department: { not: null },
        },
        select: {
            id: true,
            department: true,
        },
    });

    // Group users by department
    const departmentMap: Record<string, string[]> = {};
    users.forEach((user) => {
        if (user.department) {
            if (!departmentMap[user.department]) {
                departmentMap[user.department] = [];
            }
            departmentMap[user.department].push(user.id);
        }
    });

    // Get scores for each department
    const departmentScores: DepartmentScore[] = [];

    for (const [department, employeeIds] of Object.entries(departmentMap)) {
        const employeeCount = employeeIds.length;

        // Get completed reviews for this department
        const completedReviews = await prisma.performanceReview.findMany({
            where: {
                employeeId: { in: employeeIds },
                status: 'COMPLETED',
                overallScore: { not: null },
            },
            select: {
                overallScore: true,
            },
        });

        const totalReviews = await prisma.performanceReview.count({
            where: {
                employeeId: { in: employeeIds },
            },
        });

        const reviewsCompleted = completedReviews.length;
        const completionRate = totalReviews > 0
            ? Math.round((reviewsCompleted / totalReviews) * 100)
            : 0;

        const avgScore = completedReviews.length > 0
            ? Math.round(
                (completedReviews.reduce((sum, r) => sum + (r.overallScore || 0), 0) / completedReviews.length) * 100
            ) / 100
            : 0;

        departmentScores.push({
            department,
            employeeCount,
            avgScore,
            reviewsCompleted,
            completionRate,
        });
    }

    return departmentScores.sort((a, b) => b.avgScore - a.avgScore);
}

/**
 * Get top and bottom performers
 */
export async function getTopPerformers(limit: number = 5): Promise<{ top: TopPerformer[]; bottom: TopPerformer[] }> {
    const user = await getCurrentUser();
    if (!user || user.role !== 'HR') {
        redirect('/dashboard');
    }

    // Get all employees with completed reviews
    const employees = await prisma.user.findMany({
        where: {
            reviewsAsEmployee: {
                some: {
                    status: 'COMPLETED',
                    overallScore: { not: null },
                },
            },
        },
        select: {
            id: true,
            name: true,
            department: true,
            reviewsAsEmployee: {
                where: {
                    status: 'COMPLETED',
                    overallScore: { not: null },
                },
                select: {
                    overallScore: true,
                },
            },
        },
    });

    // Calculate average scores for each employee
    const performerData: TopPerformer[] = employees.map((employee) => {
        const reviews = employee.reviewsAsEmployee;
        const avgScore = reviews.length > 0
            ? Math.round(
                (reviews.reduce((sum, r) => sum + (r.overallScore || 0), 0) / reviews.length) * 100
            ) / 100
            : 0;

        return {
            id: employee.id,
            name: employee.name,
            department: employee.department || 'N/A',
            avgScore,
            reviewCount: reviews.length,
        };
    });

    // Sort by average score
    const sorted = performerData.sort((a, b) => b.avgScore - a.avgScore);

    return {
        top: sorted.slice(0, limit),
        bottom: sorted.slice(-limit).reverse(),
    };
}

/**
 * Get template usage statistics
 */
export async function getTemplateUsage(): Promise<TemplateUsage[]> {
    const user = await getCurrentUser();
    if (!user || user.role !== 'HR') {
        redirect('/dashboard');
    }

    const templates = await prisma.formTemplate.findMany({
        select: {
            id: true,
            title: true,
            reviews: {
                select: {
                    status: true,
                    overallScore: true,
                },
            },
        },
    });

    const templateUsage: TemplateUsage[] = templates.map((template) => {
        const reviewsCreated = template.reviews.length;
        const completedReviews = template.reviews.filter((r) => r.status === 'COMPLETED');
        const completionRate = reviewsCreated > 0
            ? Math.round((completedReviews.length / reviewsCreated) * 100)
            : 0;

        const reviewsWithScores = completedReviews.filter((r) => r.overallScore !== null);
        const avgScore = reviewsWithScores.length > 0
            ? Math.round(
                (reviewsWithScores.reduce((sum, r) => sum + (r.overallScore || 0), 0) / reviewsWithScores.length) * 100
            ) / 100
            : 0;

        return {
            templateId: template.id,
            templateName: template.title,
            reviewsCreated,
            completionRate,
            avgScore,
        };
    });

    return templateUsage.sort((a, b) => b.reviewsCreated - a.reviewsCreated);
}

/**
 * Helper function to get date filter based on time range
 */
function getDateFilter(timeRange: string) {
    const now = new Date();
    const filter: any = {};

    switch (timeRange) {
        case '30':
            const thirtyDaysAgo = new Date(now);
            thirtyDaysAgo.setDate(now.getDate() - 30);
            filter.createdAt = { gte: thirtyDaysAgo };
            break;
        case '90':
            const ninetyDaysAgo = new Date(now);
            ninetyDaysAgo.setDate(now.getDate() - 90);
            filter.createdAt = { gte: ninetyDaysAgo };
            break;
        case '365':
            const oneYearAgo = new Date(now);
            oneYearAgo.setFullYear(now.getFullYear() - 1);
            filter.createdAt = { gte: oneYearAgo };
            break;
        case 'all':
        default:
            // No filter
            break;
    }

    return filter;
}

/**
 * Helper function to get previous period date filter
 */
function getPreviousDateFilter(timeRange: string) {
    const now = new Date();
    const filter: any = {};

    switch (timeRange) {
        case '30':
            const start = new Date(now);
            start.setDate(now.getDate() - 60);
            const end = new Date(now);
            end.setDate(now.getDate() - 30);
            filter.createdAt = { gte: start, lt: end };
            break;
        case '90':
            const start90 = new Date(now);
            start90.setDate(now.getDate() - 180);
            const end90 = new Date(now);
            end90.setDate(now.getDate() - 90);
            filter.createdAt = { gte: start90, lt: end90 };
            break;
        case '365':
            const start365 = new Date(now);
            start365.setFullYear(now.getFullYear() - 2);
            const end365 = new Date(now);
            end365.setFullYear(now.getFullYear() - 1);
            filter.createdAt = { gte: start365, lt: end365 };
            break;
        case 'all':
        default:
            // For 'all', use same as current (no comparison makes sense)
            break;
    }

    return filter;
}

/**
 * Helper function to format month string
 */
function formatMonth(monthStr: string): string {
    const [year, month] = monthStr.split('-');
    const date = new Date(parseInt(year), parseInt(month) - 1);
    return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
}
