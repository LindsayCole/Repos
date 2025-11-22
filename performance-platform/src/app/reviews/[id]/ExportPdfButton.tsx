'use client';

import { Button } from '@/components/ui/Button';
import { Download } from 'lucide-react';
import { useState } from 'react';

interface ExportPdfButtonProps {
    reviewId: string;
    employeeName: string;
    templateTitle: string;
}

export default function ExportPdfButton({ reviewId, employeeName, templateTitle }: ExportPdfButtonProps) {
    const [loading, setLoading] = useState(false);

    const handleExport = async () => {
        setLoading(true);
        try {
            const response = await fetch(`/api/export-pdf?reviewId=${reviewId}`);
            const blob = await response.blob();

            // Create download link
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `${employeeName}_${templateTitle}_Review.pdf`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
        } catch (error) {
            console.error('Export failed:', error);
            alert('Failed to export PDF');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Button
            onClick={handleExport}
            disabled={loading}
            variant="secondary"
            size="sm"
        >
            <Download size={16} className="mr-2" />
            {loading ? 'Generating...' : 'Export PDF'}
        </Button>
    );
}
