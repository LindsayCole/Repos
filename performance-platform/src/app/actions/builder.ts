'use server';

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

export async function createTemplate(title: string, description: string, userId: string) {
    const template = await prisma.formTemplate.create({
        data: {
            title,
            description,
            createdById: userId,
        },
    });

    revalidatePath('/builder');
    return template;
}

export async function updateTemplate(id: string, title: string, description: string) {
    await prisma.formTemplate.update({
        where: { id },
        data: { title, description },
    });
    revalidatePath(`/builder/${id}`);
}

export async function deleteTemplate(id: string) {
    // Check if template has any reviews
    const reviewCount = await prisma.performanceReview.count({
        where: { templateId: id }
    });

    if (reviewCount > 0) {
        throw new Error('Cannot delete template that is being used in active reviews.');
    }

    await prisma.formTemplate.delete({
        where: { id }
    });

    revalidatePath('/builder');
}

export async function addSection(templateId: string, title: string, order: number) {
    await prisma.formSection.create({
        data: {
            title,
            order,
            templateId,
        },
    });
    revalidatePath(`/builder/${templateId}`);
}

export async function addQuestion(templateId: string, sectionId: string, text: string, order: number) {
    await prisma.formQuestion.create({
        data: {
            text,
            order,
            sectionId,
            helpText: '',
        },
    });
    revalidatePath(`/builder/${templateId}`);
}

export async function deleteSection(templateId: string, sectionId: string) {
    await prisma.formSection.delete({
        where: { id: sectionId },
    });
    revalidatePath(`/builder/${templateId}`);
}

export async function deleteQuestion(templateId: string, questionId: string) {
    await prisma.formQuestion.delete({
        where: { id: questionId },
    });
    revalidatePath(`/builder/${templateId}`);
}

export async function updateQuestionText(questionId: string, text: string) {
    await prisma.formQuestion.update({
        where: { id: questionId },
        data: { text },
    });
}
