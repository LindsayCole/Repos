'use server';

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { TemplateWithSections } from '@/types';
import { ERRORS, SUCCESS_MESSAGES } from '@/lib/constants';

export async function createTemplate(title: string, description: string, userId: string) {
    try {
        const template = await prisma.formTemplate.create({
            data: { title, description, createdById: userId }
        });
        revalidatePath('/builder');
        return { success: true, template, message: SUCCESS_MESSAGES.TEMPLATE_CREATED };
    } catch (error) {
        console.error('Error creating template:', error);
        throw new Error(ERRORS.INTERNAL_ERROR);
    }
}

export async function updateTemplate(id: string, title: string, description: string) {
    try {
        await prisma.formTemplate.update({
            where: { id },
            data: { title, description }
        });
        revalidatePath(`/builder/${id}`);
        revalidatePath('/builder');
        return { success: true, message: SUCCESS_MESSAGES.TEMPLATE_UPDATED };
    } catch (error) {
        console.error('Error updating template:', error);
        throw new Error(ERRORS.TEMPLATE_NOT_FOUND);
    }
}

async function getTemplateWithSections(templateId: string): Promise<TemplateWithSections | null> {
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
    try {
        await prisma.formSection.create({
            data: { templateId, title, order }
        });
        revalidatePath(`/builder/${templateId}`);
        const updatedTemplate = await getTemplateWithSections(templateId);
        return updatedTemplate?.sections || [];
    } catch (error) {
        console.error('Error adding section:', error);
        throw new Error(ERRORS.INTERNAL_ERROR);
    }
}

export async function addQuestion(templateId: string, sectionId: string, text: string, order: number, applicableRoles?: string[] | null) {
    try {
        await prisma.formQuestion.create({
            data: {
                sectionId,
                text,
                order,
                applicableRoles: applicableRoles && applicableRoles.length > 0 ? JSON.stringify(applicableRoles) : null
            }
        });
        revalidatePath(`/builder/${templateId}`);
        const updatedTemplate = await getTemplateWithSections(templateId);
        return updatedTemplate?.sections || [];
    } catch (error) {
        console.error('Error adding question:', error);
        throw new Error(ERRORS.INTERNAL_ERROR);
    }
}

export async function deleteSection(templateId: string, sectionId: string) {
    try {
        await prisma.formSection.delete({ where: { id: sectionId } });
        revalidatePath(`/builder/${templateId}`);
        const updatedTemplate = await getTemplateWithSections(templateId);
        return updatedTemplate?.sections || [];
    } catch (error) {
        console.error('Error deleting section:', error);
        throw new Error(ERRORS.TEMPLATE_DELETE_FAILED);
    }
}

export async function deleteQuestion(templateId: string, questionId: string) {
    try {
        await prisma.formQuestion.delete({ where: { id: questionId } });
        revalidatePath(`/builder/${templateId}`);
        const updatedTemplate = await getTemplateWithSections(templateId);
        return updatedTemplate?.sections || [];
    } catch (error) {
        console.error('Error deleting question:', error);
        throw new Error(ERRORS.TEMPLATE_DELETE_FAILED);
    }
}

export async function updateQuestionText(questionId: string, text: string) {
    try {
        await prisma.formQuestion.update({
            where: { id: questionId },
            data: { text }
        });
        // No revalidate needed here as it's on blur from client-side state
    } catch (error) {
        console.error('Error updating question text:', error);
        throw new Error(ERRORS.INTERNAL_ERROR);
    }
}

export async function updateQuestionRoles(templateId: string, questionId: string, applicableRoles: string[] | null) {
    try {
        await prisma.formQuestion.update({
            where: { id: questionId },
            data: {
                applicableRoles: applicableRoles && applicableRoles.length > 0 ? JSON.stringify(applicableRoles) : null
            }
        });
        revalidatePath(`/builder/${templateId}`);
    } catch (error) {
        console.error('Error updating question roles:', error);
        throw new Error(ERRORS.INTERNAL_ERROR);
    }
}

export async function deleteTemplate(templateId: string) {
    try {
        // Check if template is being used in any reviews
        const reviewCount = await prisma.review.count({
            where: { templateId }
        });

        if (reviewCount > 0) {
            throw new Error(ERRORS.TEMPLATE_DELETE_IN_USE);
        }

        // Delete the template (cascade will delete sections/questions)
        await prisma.formTemplate.delete({
            where: { id: templateId }
        });

        revalidatePath('/builder');
        return { success: true, message: SUCCESS_MESSAGES.TEMPLATE_DELETED };
    } catch (error) {
        console.error('Error deleting template:', error);
        if (error instanceof Error && error.message === ERRORS.TEMPLATE_DELETE_IN_USE) {
            throw error;
        }
        throw new Error(ERRORS.TEMPLATE_DELETE_FAILED);
    }
}
