'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import ReviewCreationModal from './ReviewCreationModal';

interface User {
    id: string;
    name: string;
    role: string;
}

interface Template {
    id: string;
    title: string;
}

interface StartReviewButtonProps {
    templates: Template[];
    employees: User[];
    managers: User[];
}

export default function StartReviewButton({ templates, employees, managers }: StartReviewButtonProps) {
    const [isModalOpen, setIsModalOpen] = useState(false);

    return (
        <>
            <Button variant="primary" onClick={() => setIsModalOpen(true)}>
                Start New Review
            </Button>

            <ReviewCreationModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                templates={templates}
                employees={employees}
                managers={managers}
            />
        </>
    );
}
