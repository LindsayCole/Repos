'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import { Trash2 } from 'lucide-react';
import { deleteTemplate } from '@/app/actions/builder';
import { useToast } from '@/lib/toast';
import { UI_TEXT } from '@/lib/constants';

interface TemplateCardProps {
    template: {
        id: string;
        title: string;
        description: string | null;
        _count: {
            sections: number;
            reviews: number;
        };
    };
}

export function TemplateCard({ template }: TemplateCardProps) {
    const router = useRouter();
    const toast = useToast();
    const [isPending, startTransition] = useTransition();
    const [showDeleteDialog, setShowDeleteDialog] = useState(false);

    const handleDelete = async () => {
        startTransition(async () => {
            try {
                const result = await deleteTemplate(template.id);
                if (result?.message) {
                    toast.success(result.message);
                }
                setShowDeleteDialog(false);
                router.refresh();
            } catch (error) {
                console.error('Error deleting template:', error);
                toast.error(error instanceof Error ? error.message : 'Failed to delete template');
                setShowDeleteDialog(false);
            }
        });
    };

    const handleDeleteClick = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setShowDeleteDialog(true);
    };

    return (
        <>
            <Link href={`/builder/${template.id}`}>
                <Card className="hover:bg-slate-800/50 transition-colors h-full flex flex-col justify-between relative">
                    {/* Delete Button */}
                    <Button
                        variant="danger"
                        size="sm"
                        onClick={handleDeleteClick}
                        disabled={isPending}
                        className="absolute top-3 right-3 z-10"
                    >
                        <Trash2 size={14} />
                    </Button>

                    <div>
                        <h2 className="text-xl font-semibold text-cyan-400 mb-2 pr-12">{template.title}</h2>
                        <p className="text-sm text-slate-400 mb-4 line-clamp-2">{template.description || 'No description'}</p>
                    </div>
                    <div className="text-xs text-slate-500 flex justify-between">
                        <span>{UI_TEXT.TEMPLATE_SECTIONS(template._count.sections)}</span>
                        <span>{UI_TEXT.TEMPLATE_REVIEWS(template._count.reviews)}</span>
                    </div>
                </Card>
            </Link>

            <ConfirmDialog
                isOpen={showDeleteDialog}
                title="Delete Template"
                message={`Are you sure you want to delete "${template.title}"? This action cannot be undone.`}
                confirmLabel={isPending ? 'Deleting...' : 'Delete'}
                cancelLabel="Cancel"
                variant="danger"
                onConfirm={handleDelete}
                onCancel={() => setShowDeleteDialog(false)}
            />
        </>
    );
}
