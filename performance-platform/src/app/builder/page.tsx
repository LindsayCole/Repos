import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { getCurrentUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { UI_TEXT } from '@/lib/constants';
import DeleteTemplateButton from '@/components/builder/DeleteTemplateButton';

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
                <h1 className="text-3xl font-bold text-white">Form Templates</h1>
                <Link href="/builder/new">
                    <Button variant="primary">Create New Template</Button>
                </Link>
            </div>

            {templates.length === 0 ? (
                <Card>
                    <p className="text-slate-400 text-center py-8">No templates created yet.</p>
                </Card>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {templates.map(template => (
                        <Link href={`/builder/${template.id}`} key={template.id}>
                            <Card className="hover:bg-slate-800/50 transition-colors h-full flex flex-col justify-between group relative">
                                <div>
                                    <div className="flex justify-between items-start">
                                        <h2 className="text-xl font-semibold text-cyan-400 mb-2">{template.title}</h2>
                                        <DeleteTemplateButton
                                            templateId={template.id}
                                            reviewCount={template._count.reviews}
                                        />
                                    </div>
                                    <p className="text-sm text-slate-400 mb-4 line-clamp-2">{template.description || 'No description'}</p>
                                </div>
                                <div className="text-xs text-slate-500 flex justify-between items-center pt-4 border-t border-slate-800">
                                    <span>{UI_TEXT.TEMPLATE_SECTIONS(template._count.sections)}</span>
                                    <span>{UI_TEXT.TEMPLATE_REVIEWS(template._count.reviews)}</span>
                                </div>
                            </Card>
                        </Link>
                    ))}
                </div>
            )}
        </div>
    );
}
