import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
    const searchParams = request.nextUrl.searchParams;
    const userId = searchParams.get('userId');
    const managerId = searchParams.get('managerId');

    if (!userId && !managerId) {
        return NextResponse.json({ error: 'User ID or Manager ID required' }, { status: 400 });
    }

    try {
        // Fetch goals for the user or team
        const goals = await prisma.goal.findMany({
            where: userId ? { userId } : { managerId },
            include: {
                user: true,
            },
        });

        if (goals.length === 0) {
            return NextResponse.json({
                totalGoals: 0,
                completionRate: 0,
                averageProgress: 0,
                onTrack: 0,
                atRisk: 0,
                completed: 0,
                inProgress: 0,
                notStarted: 0,
            });
        }

        // Calculate metrics
        const now = new Date();
        const completed = goals.filter(g => g.status === 'COMPLETED').length;
        const inProgress = goals.filter(g => g.status === 'IN_PROGRESS').length;
        const notStarted = goals.filter(g => g.status === 'NOT_STARTED').length;
        const cancelled = goals.filter(g => g.status === 'CANCELLED').length;

        const totalProgress = goals.reduce((sum, g) => sum + g.progress, 0);
        const averageProgress = goals.length > 0 ? totalProgress / goals.length : 0;

        const completionRate = goals.length > 0 ? (completed / goals.length) * 100 : 0;

        // Calculate on-track vs at-risk goals
        let onTrack = 0;
        let atRisk = 0;

        goals.forEach(goal => {
            if (goal.status === 'COMPLETED') {
                onTrack++;
            } else if (goal.status === 'CANCELLED') {
                // Don't count cancelled goals
            } else if (goal.targetDate) {
                const targetDate = new Date(goal.targetDate);
                const daysUntilDue = Math.ceil((targetDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
                const expectedProgress = goal.progress;

                // Simple heuristic: if target date is passed and not completed, it's at risk
                // Or if progress is significantly behind expected (less than 50% with less than 30 days)
                if (daysUntilDue < 0 && goal.status !== 'COMPLETED') {
                    atRisk++;
                } else if (daysUntilDue < 30 && expectedProgress < 50) {
                    atRisk++;
                } else {
                    onTrack++;
                }
            } else {
                // No target date, consider on track if in progress
                if (goal.status === 'IN_PROGRESS') {
                    onTrack++;
                } else {
                    atRisk++;
                }
            }
        });

        return NextResponse.json({
            totalGoals: goals.length,
            completionRate: Math.round(completionRate),
            averageProgress: Math.round(averageProgress),
            onTrack,
            atRisk,
            completed,
            inProgress,
            notStarted,
            cancelled,
        });
    } catch (error) {
        console.error('Error fetching goal metrics:', error);
        return NextResponse.json({ error: 'Failed to fetch metrics' }, { status: 500 });
    }
}
