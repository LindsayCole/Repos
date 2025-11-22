'use server';

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';

export async function createTemplate(title: string, description: string, userId: string) {
    const template = await prisma.formTemplate.create({
        data: { title, description, createdById: userId }
    });
    revalidatePath('/builder');
    return template;
}

export async function updateTemplate(id: string, title: string, description: string) {
    await prisma.formTemplate.update({
        where: { id },
        data: { title, description }
    });
    revalidatePath(`/builder/${id}`);
    revalidatePath('/builder');
}

async function getTemplateWithSections(templateId: string) {
    return prisma.formTemplate.findUnique({
        where: { id: templateId },
        include: {
            sections: {
                orderBy: { order: 'asc' },
                include: { questions: { orderBy: { order: 'asc' } } }
            }
        }
    });
}

export async function addSection(templateId: string, title: string, order: number) {
    await prisma.formSection.create({
        data: { templateId, title, order }
    });
    revalidatePath(`/builder/${templateId}`);
    const updatedTemplate = await getTemplateWithSections(templateId);
    return updatedTemplate?.sections || [];
}

export async function addQuestion(templateId: string, sectionId: string, text: string, order: number) {
    await prisma.formQuestion.create({
        data: { sectionId, text, order }
    });
    revalidatePath(`/builder/${templateId}`);
    const updatedTemplate = await getTemplateWithSections(templateId);
    return updatedTemplate?.sections || [];
}

export async function deleteSection(templateId: string, sectionId: string) {
    await prisma.formSection.delete({ where: { id: sectionId } });
    revalidatePath(`/builder/${templateId}`);
    const updatedTemplate = await getTemplateWithSections(templateId);
    return updatedTemplate?.sections || [];
}

export async function deleteQuestion(templateId: string, questionId: string) {
    await prisma.formQuestion.delete({ where: { id: questionId } });
    revalidatePath(`/builder/${templateId}`);
    const updatedTemplate = await getTemplateWithSections(templateId);
    return updatedTemplate?.sections || [];
}

export async function updateQuestionText(questionId: string, text: string) {
    await prisma.formQuestion.update({
        where: { id: questionId },
        data: { text }
    });
    // No revalidate needed here as it's on blur from client-side state
}
