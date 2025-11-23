import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

/**
 * API route to export analytics data as CSV
 * HR only - exports all reviews with comprehensive details
 */
export async function GET() {
    try {
        const user = await getCurrentUser();

        // HR only access
        if (!user || user.role !== 'HR') {
            return NextResponse.json(
                { error: 'Unauthorized. HR access required.' },
                { status: 403 }
            );
        }

        // Fetch all reviews with related data
        const reviews = await prisma.performanceReview.findMany({
            include: {
                employee: {
                    select: {
                        name: true,
                        email: true,
                        department: true,
                    },
                },
                manager: {
                    select: {
                        name: true,
                        email: true,
                    },
                },
                template: {
                    select: {
                        title: true,
                    },
                },
            },
            orderBy: {
                createdAt: 'desc',
            },
        });

        // Generate CSV content
        const csvRows: string[] = [];

        // Header row
        csvRows.push([
            'Review ID',
            'Employee Name',
            'Employee Email',
            'Department',
            'Manager Name',
            'Manager Email',
            'Template',
            'Status',
            'Overall Score',
            'Created Date',
            'Updated Date',
            'Completion Time (days)',
        ].join(','));

        // Data rows
        reviews.forEach((review) => {
            const createdDate = new Date(review.createdAt);
            const updatedDate = new Date(review.updatedAt);
            const completionDays = review.status === 'COMPLETED'
                ? Math.round((updatedDate.getTime() - createdDate.getTime()) / (1000 * 60 * 60 * 24))
                : '';

            const row = [
                review.id,
                escapeCSV(review.employee.name),
                review.employee.email,
                review.employee.department || 'N/A',
                escapeCSV(review.manager.name),
                review.manager.email,
                escapeCSV(review.template.title),
                review.status,
                review.overallScore?.toFixed(2) || '',
                createdDate.toISOString().split('T')[0],
                updatedDate.toISOString().split('T')[0],
                completionDays,
            ].join(',');

            csvRows.push(row);
        });

        const csvContent = csvRows.join('\n');

        // Return CSV file
        return new NextResponse(csvContent, {
            headers: {
                'Content-Type': 'text/csv',
                'Content-Disposition': `attachment; filename="analytics-export-${new Date().toISOString().split('T')[0]}.csv"`,
            },
        });
    } catch (error) {
        console.error('Export error:', error);
        return NextResponse.json(
            { error: 'Failed to export data' },
            { status: 500 }
        );
    }
}

/**
 * Helper function to escape CSV values
 * Handles commas, quotes, and newlines
 */
function escapeCSV(value: string): string {
    if (value.includes(',') || value.includes('"') || value.includes('\n')) {
        return `"${value.replace(/"/g, '""')}"`;
    }
    return value;
}
