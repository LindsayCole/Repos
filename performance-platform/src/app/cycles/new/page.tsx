import { Card } from '@/components/ui/Card';
import { getCurrentUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { redirect } from 'next/navigation';
import CycleForm from '@/components/cycles/CycleForm';
import { ChevronLeft } from 'lucide-react';
import Link from 'next/link';

export default async function NewCyclePage() {
    const user = await getCurrentUser();

    if (!user) {
        redirect('/login');
    }

    // Only HR can access this page
    if (user.role !== 'HR') {
        redirect('/dashboard');
    }

    // Fetch templates for the form
    const templates = await prisma.formTemplate.findMany({
        select: {
            id: true,
            title: true,
        },
        orderBy: {
            createdAt: 'desc',
        },
    });

    return (
        <div className="max-w-3xl mx-auto space-y-8">
            <Link
                href="/cycles"
                className="inline-flex items-center gap-2 text-slate-400 hover:text-white transition-colors"
            >
                <ChevronLeft className="w-4 h-4" />
                Back to Cycles
            </Link>

            <div>
                <h1 className="text-4xl font-bold text-white mb-2">Create Review Cycle</h1>
                <p className="text-slate-400">
                    Set up an automated performance review cycle for your organization
                </p>
            </div>

            <Card>
                <CycleForm templates={templates} />
            </Card>
        </div>
    );
}
