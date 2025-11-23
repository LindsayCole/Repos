import { Button } from '@/components/ui/Button';
import { getCurrentUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { UI_TEXT } from '@/lib/constants';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { BuilderPageClient } from '@/components/builder/BuilderPageClient';

export default async function BuilderPage() {
    const user = await getCurrentUser();
    if (user?.role !== 'HR') redirect('/dashboard');

    const templates = await prisma.formTemplate.findMany({
        where: { createdById: user.id },
        orderBy: { createdAt: 'desc' },
        include: { _count: { select: { sections: true, reviews: true } } }
    });

    return (
        <div className="space-y-8">
            <div className="flex justify-between items-center">
                <h1 className="text-3xl font-bold text-white">{UI_TEXT.BUILDER_TITLE}</h1>
                <Link href="/builder/new">
                    <Button variant="primary">{UI_TEXT.CREATE_TEMPLATE}</Button>
                </Link>
            </div>

            <BuilderPageClient templates={templates} />
        </div>
    );
}
