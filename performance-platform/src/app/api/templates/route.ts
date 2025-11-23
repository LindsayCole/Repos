import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import { ERRORS } from '@/lib/constants';

export async function GET() {
    try {
        const user = await getCurrentUser();

        if (!user) {
            return NextResponse.json(
                { error: ERRORS.AUTH_REQUIRED },
                { status: 401 }
            );
        }

        if (user.role !== 'HR') {
            return NextResponse.json(
                { error: ERRORS.AUTH_UNAUTHORIZED },
                { status: 403 }
            );
        }

        const templates = await prisma.formTemplate.findMany({
            select: {
                id: true,
                title: true,
                description: true,
                createdAt: true,
                updatedAt: true,
            },
            orderBy: {
                createdAt: 'desc'
            }
        });

        return NextResponse.json(templates);
    } catch (error) {
        console.error('Error fetching templates:', error);
        return NextResponse.json(
            { error: ERRORS.INTERNAL_ERROR },
            { status: 500 }
        );
    }
}
