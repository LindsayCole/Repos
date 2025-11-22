import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
    const searchParams = request.nextUrl.searchParams;
    const userId = searchParams.get('userId');

    if (!userId) {
        return NextResponse.json({ error: 'User ID required' }, { status: 400 });
    }

    try {
        // Fetch all completed reviews for the user
        const reviews = await prisma.performanceReview.findMany({
            where: {
                employeeId: userId,
                status: 'COMPLETED',
            },
            include: {
                responses: {
                    include: {
                        question: {
                            include: {
                                section: true,
                            },
                        },
                    },
                },
            },
            orderBy: {
                createdAt: 'desc',
            },
            take: 5, // Last 5 reviews
        });

        if (reviews.length === 0) {
            return NextResponse.json([
                { label: 'Behaviour', value: 0, color: 'bg-cyan-500' },
                { label: 'Results', value: 0, color: 'bg-purple-500' },
                { label: 'Overall', value: 0, color: 'bg-green-500' },
            ]);
        }

        // Calculate averages by section
        const sectionAverages: Record<string, { sum: number; count: number }> = {};
        let totalSum = 0;
        let totalCount = 0;

        reviews.forEach(review => {
            review.responses.forEach(response => {
                const sectionTitle = response.question.section.title;
                const rating = response.managerRating || response.selfRating;

                if (rating) {
                    if (!sectionAverages[sectionTitle]) {
                        sectionAverages[sectionTitle] = { sum: 0, count: 0 };
                    }
                    sectionAverages[sectionTitle].sum += rating;
                    sectionAverages[sectionTitle].count += 1;
                    totalSum += rating;
                    totalCount += 1;
                }
            });
        });

        const metrics = Object.entries(sectionAverages).map(([label, data]) => ({
            label,
            value: data.count > 0 ? data.sum / data.count : 0,
            color: label === 'Behaviour' ? 'bg-cyan-500' : 'bg-purple-500',
        }));

        // Add overall average
        metrics.push({
            label: 'Overall',
            value: totalCount > 0 ? totalSum / totalCount : 0,
            color: 'bg-green-500',
        });

        return NextResponse.json(metrics);
    } catch (error) {
        console.error('Error fetching performance metrics:', error);
        return NextResponse.json({ error: 'Failed to fetch metrics' }, { status: 500 });
    }
}
