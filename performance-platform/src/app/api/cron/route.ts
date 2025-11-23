import { NextRequest, NextResponse } from 'next/server';
import { processScheduledReviewCycles } from '@/lib/review-scheduler';

/**
 * Cron job endpoint for processing scheduled review cycles
 * This endpoint should be called by a cron service (like Vercel Cron) on a regular schedule
 *
 * For Vercel Cron: Configure in vercel.json
 * For development: Can be called manually or with a local cron job
 */
export async function GET(request: NextRequest) {
    try {
        // Verify the request is authorized (Vercel Cron secret or development mode)
        const authHeader = request.headers.get('authorization');
        const cronSecret = process.env.CRON_SECRET;

        // In production, verify the cron secret
        if (process.env.NODE_ENV === 'production') {
            if (!cronSecret) {
                console.error('[Cron API] CRON_SECRET not configured');
                return NextResponse.json(
                    { error: 'Cron secret not configured' },
                    { status: 500 }
                );
            }

            if (authHeader !== `Bearer ${cronSecret}`) {
                console.error('[Cron API] Unauthorized request');
                return NextResponse.json(
                    { error: 'Unauthorized' },
                    { status: 401 }
                );
            }
        } else {
            console.log('[Cron API] Running in development mode - skipping auth check');
        }

        console.log('[Cron API] Starting scheduled review cycle processing');

        // Process scheduled review cycles
        const result = await processScheduledReviewCycles();

        console.log('[Cron API] Processing complete:', result);

        return NextResponse.json({
            success: true,
            message: 'Review cycles processed successfully',
            ...result,
        });
    } catch (error) {
        console.error('[Cron API] Error processing review cycles:', error);

        return NextResponse.json(
            {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error',
                timestamp: new Date().toISOString(),
            },
            { status: 500 }
        );
    }
}

/**
 * POST endpoint for manual triggering (development/testing)
 */
export async function POST(request: NextRequest) {
    // Only allow in development or with proper authentication
    if (process.env.NODE_ENV === 'production') {
        const authHeader = request.headers.get('authorization');
        const cronSecret = process.env.CRON_SECRET;

        if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            );
        }
    }

    try {
        console.log('[Cron API] Manual trigger initiated');

        const result = await processScheduledReviewCycles();

        return NextResponse.json({
            success: true,
            message: 'Review cycles processed successfully (manual trigger)',
            ...result,
        });
    } catch (error) {
        console.error('[Cron API] Error processing review cycles:', error);

        return NextResponse.json(
            {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error',
            },
            { status: 500 }
        );
    }
}
