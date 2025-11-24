import { getCurrentUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { redirect } from 'next/navigation';
import TemplateEditor from './TemplateEditor';

export default async function EditTemplatePage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const user = await getCurrentUser();
    if (user?.role !== 'HR') redirect('/dashboard');

    let template = null;
    if (id !== 'new') {
        template = await prisma.formTemplate.findUnique({
            where: { id: id },
            include: {
                sections: {
                    orderBy: { order: 'asc' },
                    include: {
                        questions: {
                            orderBy: { order: 'asc' }
                        }
                    }
                }
            }
        });
        // If template not found and not new, redirect back
        if (!template && id !== 'new') redirect('/builder');
    }

    if (!template) {
        redirect('/builder');
    }

    return <TemplateEditor template={template} />;
}
