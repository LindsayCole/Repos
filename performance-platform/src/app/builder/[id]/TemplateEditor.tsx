'use client';

import { useState, useTransition } from 'react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Plus, Trash2, GripVertical } from 'lucide-react';
import { updateTemplate, addSection, addQuestion, deleteSection, deleteQuestion, updateQuestionText } from '@/app/actions/builder';
import { templateSchema, sectionSchema, questionSchema } from '@/lib/validations';
import { z, ZodError } from 'zod';

interface TemplateWithSections {
    id: string;
    title: string;
    description: string | null;
    sections: {
        id: string;
        title: string;
        order: number;
        questions: {
            id: string;
            text: string;
            order: number;
        }[];
    }[];
}

export default function TemplateEditor({ template }: { template: TemplateWithSections }) {
    const [isPending, startTransition] = useTransition();
    const [title, setTitle] = useState(template.title);
    const [description, setDescription] = useState(template.description || '');
    const [errors, setErrors] = useState<{ [key: string]: string }>({});

    const handleUpdateTemplate = () => {
        try {
            templateSchema.parse({ title, description });
            setErrors({});
            startTransition(async () => {
                await updateTemplate(template.id, title, description);
            });
        } catch (error) {
            if (error instanceof ZodError) {
                const newErrors: { [key: string]: string } = {};
                (error as any).errors.forEach((err: any) => {
                    if (err.path[0]) newErrors[err.path[0] as string] = err.message;
                });
                setErrors(newErrors);
            }
        }
    };

    const handleAddSection = () => {
        const title = prompt('Enter section title:');
        if (!title) return;

        try {
            sectionSchema.parse({ title });
            startTransition(async () => {
                await addSection(template.id, title, template.sections.length);
            });
        } catch (error) {
            if (error instanceof ZodError) {
                alert((error as any).errors[0].message);
            }
        }
    };

    const handleAddQuestion = (sectionId: string) => {
        const text = prompt('Enter question text:');
        if (!text) return;

        try {
            questionSchema.parse({ text });
            startTransition(async () => {
                await addQuestion(template.id, sectionId, text, 0); // Order handling is simplified for MVP
            });
        } catch (error) {
            if (error instanceof ZodError) {
                alert((error as any).errors[0].message);
            }
        }
    };

    return (
        <div className="space-y-8">
            <Card className="space-y-4">
                <div className="flex justify-between items-start">
                    <div className="space-y-4 flex-1 mr-8">
                        <div>
                            <label className="block text-sm font-medium text-slate-400 mb-1">Template Title</label>
                            <input
                                type="text"
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                onBlur={handleUpdateTemplate}
                                className={`w-full bg-slate-800 border ${errors.title ? 'border-red-500' : 'border-slate-700'} rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-cyan-500`}
                            />
                            {errors.title && <p className="text-red-400 text-xs mt-1">{errors.title}</p>}
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-400 mb-1">Description</label>
                            <textarea
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                onBlur={handleUpdateTemplate}
                                className={`w-full bg-slate-800 border ${errors.description ? 'border-red-500' : 'border-slate-700'} rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-cyan-500`}
                                rows={2}
                            />
                            {errors.description && <p className="text-red-400 text-xs mt-1">{errors.description}</p>}
                        </div>
                    </div>
                    <div className="text-right">
                        {/* Status indicator */}
                        {isPending ? (
                            <span className="text-sm text-cyan-400 animate-pulse">Saving...</span>
                        ) : (
                            <span className="text-sm text-slate-500">All changes saved</span>
                        )}
                    </div>
                </div>
            </Card>

            <div className="space-y-6">
                {template.sections.map((section) => (
                    <Card key={section.id} className="relative group">
                        <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Button variant="danger" size="sm" onClick={() => startTransition(() => deleteSection(template.id, section.id))}>
                                <Trash2 size={16} />
                            </Button>
                        </div>

                        <h3 className="text-lg font-semibold text-purple-400 mb-4 flex items-center gap-2">
                            <GripVertical size={20} className="text-slate-600 cursor-move" />
                            {section.title}
                        </h3>

                        <div className="space-y-3 pl-6 border-l-2 border-slate-800">
                            {section.questions.map((question) => (
                                <div key={question.id} className="flex items-center gap-3 group/question">
                                    <GripVertical size={16} className="text-slate-700 cursor-move" />
                                    <input
                                        type="text"
                                        defaultValue={question.text}
                                        onBlur={(e) => startTransition(() => updateQuestionText(question.id, e.target.value))}
                                        className="flex-1 bg-transparent border-b border-transparent hover:border-slate-700 focus:border-cyan-500 focus:outline-none py-1 text-slate-300 transition-colors"
                                    />
                                    <button
                                        onClick={() => startTransition(() => deleteQuestion(template.id, question.id))}
                                        className="text-slate-600 hover:text-red-400 opacity-0 group-hover/question:opacity-100 transition-opacity"
                                    >
                                        <Trash2 size={14} />
                                    </button>
                                </div>
                            ))}

                            <Button variant="ghost" size="sm" onClick={() => handleAddQuestion(section.id)} className="mt-2">
                                <Plus size={16} className="mr-2" />
                                Add Question
                            </Button>
                        </div>
                    </Card>
                ))}

                <Button variant="secondary" className="w-full py-8 border-dashed border-2 border-slate-700 hover:border-cyan-500/50" onClick={handleAddSection}>
                    <Plus size={24} className="mb-2" />
                    Add New Section
                </Button>
            </div>
        </div>
    );
}
