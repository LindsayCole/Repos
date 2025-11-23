import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { getCurrentUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { UI_TEXT } from '@/lib/constants';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { TemplateCard } from '@/components/builder/TemplateCard';

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

            {templates.length === 0 ? (
                <Card>
                    <p className="text-slate-400 text-center py-8">{UI_TEXT.NO_TEMPLATES}</p>
                </Card>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {templates.map(template => (
                        <TemplateCard key={template.id} template={template} />
                    ))}
                </div>
            )}
        </div>
    );
}
