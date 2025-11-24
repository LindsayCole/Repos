import { z } from 'zod';

export const templateSchema = z.object({
    title: z.string().min(3, 'Title must be at least 3 characters').max(50, 'Title must be less than 50 characters'),
    description: z.string().max(200, 'Description must be less than 200 characters').optional(),
});

export const sectionSchema = z.object({
    title: z.string().min(2, 'Section title must be at least 2 characters'),
});

export const questionSchema = z.object({
    text: z.string().min(5, 'Question text must be at least 5 characters'),
});

export const reviewResponseSchema = z.object({
    rating: z.number().min(1).max(4),
    comment: z.string().min(10, 'Comment must be at least 10 characters'),
});
