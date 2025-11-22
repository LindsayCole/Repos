// TypeScript type definitions for the application

import { User as PrismaUser, FormTemplate, FormSection, FormQuestion, PerformanceReview, ReviewResponse } from '@prisma/client';

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
};

export interface PerformanceMetric {
    label: string;
    value: number;
    color: string;
}

export interface EmailParams {
    to: string;
    subject: string;
    html: string;
}

export type ReviewMode = 'EMPLOYEE' | 'MANAGER' | 'VIEW';

export interface ReviewFormData {
    [questionId: string]: {
        rating: number;
        comment: string;
    };
}
