'use client';

import { Button } from '@/components/ui/Button';
import { Trash2 } from 'lucide-react';
import { deleteTemplate } from '@/app/actions/builder';
import { useState } from 'react';
import { UI_TEXT, ERRORS, SUCCESS_MESSAGES } from '@/lib/constants';

export default function DeleteTemplateButton({ templateId, reviewCount }: { templateId: string, reviewCount: number }) {
    const [isDeleting, setIsDeleting] = useState(false);

    const handleDelete = async (e: React.MouseEvent) => {
        e.preventDefault(); // Prevent navigation to template details
        e.stopPropagation();

        if (reviewCount > 0) {
            alert(ERRORS.TEMPLATE_DELETE_IN_USE);
            return;
        }

        if (!confirm('Are you sure you want to delete this template? This action cannot be undone.')) {
            return;
        }

        setIsDeleting(true);
        try {
            await deleteTemplate(templateId);
            // Toast notification would go here
        } catch (error) {
            console.error(error);
            alert(ERRORS.TEMPLATE_DELETE_FAILED);
        } finally {
            setIsDeleting(false);
        }
    };

    return (
        <Button
            variant="danger"
            size="sm"
            onClick={handleDelete}
            disabled={isDeleting || reviewCount > 0}
            className="opacity-0 group-hover:opacity-100 transition-opacity"
        >
            <Trash2 size={16} />
        </Button>
    );
}
