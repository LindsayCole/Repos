// TypeScript type definitions for the application

import { User as PrismaUser, FormTemplate, FormSection, FormQuestion, PerformanceReview, ReviewResponse, ReviewCycle, ActionItem } from '@prisma/client';

export type User = PrismaUser;

export type TemplateWithSections = FormTemplate & {
    sections: (FormSection & {
        questions: FormQuestion[];
    })[];
};

export type ReviewWithDetails = PerformanceReview & {
    template: TemplateWithSections;
    employee: User;
    manager: User;
    responses: (ReviewResponse & {
        question: FormQuestion;
    })[];
};

export type ReviewTask = PerformanceReview & {
    template: FormTemplate;
    employee?: User;
    dueDate?: Date | string | null;
    responses?: ReviewResponse[];
    cycle?: {
        id: string;
        name: string;
        dueDate: Date;
    } | null;
};

export interface PerformanceMetric {
    label: string;
    value: number;
    color: string;
}

export type ReviewMode = 'EMPLOYEE' | 'MANAGER' | 'VIEW';

export interface ReviewFormData {
    [questionId: string]: {
        rating: number;
        comment: string;
    };
}

export type ActionItemCategory = 'SKILL_DEVELOPMENT' | 'PERFORMANCE_IMPROVEMENT' | 'CAREER_GROWTH' | 'OTHER';
export type ActionItemPriority = 'HIGH' | 'MEDIUM' | 'LOW';
export type ActionItemStatus = 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';

export type ActionItemWithReview = ActionItem & {
    review: PerformanceReview & {
        template: FormTemplate;
        employee: User;
    };
};
