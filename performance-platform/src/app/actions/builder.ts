'use server';

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth';

async function requireHR() {
    const user = await getCurrentUser();
    if (!user || user.role !== 'HR') {
        throw new Error('Unauthorized: Only HR can perform this action');
    }
    return user;
}

export async function createTemplate(title: string, description: string, userId: string) {
    const user = await requireHR();

    // Ensure the userId passed matches the authenticated user (or just use the auth user id)
    if (userId !== user.id) {
        throw new Error('Unauthorized: User ID mismatch');
    }

    const template = await prisma.formTemplate.create({
        data: {
            title,
            description,
            createdById: user.id,
        },
    });

    revalidatePath('/builder');
    return template;
}

export async function updateTemplate(id: string, title: string, description: string) {
    await requireHR();
    await prisma.formTemplate.update({
        where: { id },
        data: { title, description },
    });
    revalidatePath(`/builder/${id}`);
}

export async function deleteTemplate(id: string) {
    await requireHR();
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
    await requireHR();
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
    await requireHR();
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
    await requireHR();
    await prisma.formSection.delete({
        where: { id: sectionId },
    });
    revalidatePath(`/builder/${templateId}`);
}

export async function deleteQuestion(templateId: string, questionId: string) {
    await requireHR();
    await prisma.formQuestion.delete({
        where: { id: questionId },
    });
    revalidatePath(`/builder/${templateId}`);
}

export async function updateQuestionText(questionId: string, text: string) {
    await requireHR();
    await prisma.formQuestion.update({
        where: { id: questionId },
        data: { text },
    });
}
