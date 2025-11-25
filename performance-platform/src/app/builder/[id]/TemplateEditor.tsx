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

    const [addingSection, setAddingSection] = useState(false);
    const [addingQuestionTo, setAddingQuestionTo] = useState<string | null>(null);
    const [newSectionTitle, setNewSectionTitle] = useState('');
    const [newQuestionText, setNewQuestionText] = useState('');

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
        if (!newSectionTitle.trim()) return;

        try {
            sectionSchema.parse({ title: newSectionTitle });
            startTransition(async () => {
                await addSection(template.id, newSectionTitle, template.sections.length);
                setAddingSection(false);
                setNewSectionTitle('');
            });
        } catch (error) {
            if (error instanceof ZodError) {
                alert((error as any).errors[0].message);
            }
        }
    };

    const handleAddQuestion = (sectionId: string) => {
        if (!newQuestionText.trim()) return;

        try {
            questionSchema.parse({ text: newQuestionText });
            startTransition(async () => {
                await addQuestion(template.id, sectionId, newQuestionText, 0);
                setAddingQuestionTo(null);
                setNewQuestionText('');
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
                            <label className="block text-sm font-medium text-muted-foreground mb-1">Template Title</label>
                            <input
                                type="text"
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                onBlur={handleUpdateTemplate}
                                className={`w-full bg-background border ${errors.title ? 'border-destructive' : 'border-input'} rounded-md px-3 py-2 text-foreground focus:outline-none focus:ring-2 focus:ring-ring`}
                            />
                            {errors.title && <p className="text-destructive text-xs mt-1">{errors.title}</p>}
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-muted-foreground mb-1">Description</label>
                            <textarea
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                onBlur={handleUpdateTemplate}
                                className={`w-full bg-background border ${errors.description ? 'border-destructive' : 'border-input'} rounded-md px-3 py-2 text-foreground focus:outline-none focus:ring-2 focus:ring-ring`}
                                rows={2}
                            />
                            {errors.description && <p className="text-destructive text-xs mt-1">{errors.description}</p>}
                        </div>
                    </div>
                    <div className="text-right">
                        {/* Status indicator */}
                        {isPending ? (
                            <span className="text-sm text-primary animate-pulse">Saving...</span>
                        ) : (
                            <span className="text-sm text-muted-foreground">All changes saved</span>
                        )}
                    </div>
                </div>
            </Card>

            <div className="space-y-6">
                {template.sections.map((section) => (
                    <Card key={section.id} className="relative group">
                        <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Button variant="destructive" size="sm" onClick={() => startTransition(() => deleteSection(template.id, section.id))}>
                                <Trash2 size={16} />
                            </Button>
                        </div>

                        <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                            <GripVertical size={20} className="text-muted-foreground cursor-move" />
                            {section.title}
                        </h3>

                        <div className="space-y-3 pl-6 border-l-2 border-border">
                            {section.questions.map((question) => (
                                <div key={question.id} className="flex items-center gap-3 group/question">
                                    <GripVertical size={16} className="text-muted-foreground cursor-move" />
                                    <input
                                        type="text"
                                        defaultValue={question.text}
                                        onBlur={(e) => startTransition(() => updateQuestionText(question.id, e.target.value))}
                                        className="flex-1 bg-transparent border-b border-transparent hover:border-border focus:border-primary focus:outline-none py-1 text-foreground transition-colors"
                                    />
                                    <button
                                        onClick={() => startTransition(() => deleteQuestion(template.id, question.id))}
                                        className="text-muted-foreground hover:text-destructive opacity-0 group-hover/question:opacity-100 transition-opacity"
                                    >
                                        <Trash2 size={14} />
                                    </button>
                                </div>
                            ))}

                            {addingQuestionTo === section.id ? (
                                <div className="flex items-center gap-2 mt-2 animate-in fade-in slide-in-from-top-2">
                                    <input
                                        autoFocus
                                        type="text"
                                        value={newQuestionText}
                                        onChange={(e) => setNewQuestionText(e.target.value)}
                                        onKeyDown={(e) => e.key === 'Enter' && handleAddQuestion(section.id)}
                                        placeholder="Enter question text..."
                                        className="flex-1 bg-background border border-input rounded-md px-3 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                                    />
                                    <Button size="sm" onClick={() => handleAddQuestion(section.id)}>Add</Button>
                                    <Button size="sm" variant="ghost" onClick={() => { setAddingQuestionTo(null); setNewQuestionText(''); }}>Cancel</Button>
                                </div>
                            ) : (
                                <Button variant="ghost" size="sm" onClick={() => setAddingQuestionTo(section.id)} className="mt-2 text-muted-foreground hover:text-foreground">
                                    <Plus size={16} className="mr-2" />
                                    Add Question
                                </Button>
                            )}
                        </div>
                    </Card>
                ))}

                {addingSection ? (
                    <Card className="animate-in fade-in slide-in-from-top-4 border-dashed border-2 border-primary/50">
                        <div className="flex items-center gap-4">
                            <input
                                autoFocus
                                type="text"
                                value={newSectionTitle}
                                onChange={(e) => setNewSectionTitle(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleAddSection()}
                                placeholder="Enter section title..."
                                className="flex-1 bg-background border border-input rounded-md px-4 py-2 focus:outline-none focus:ring-2 focus:ring-ring"
                            />
                            <Button onClick={handleAddSection}>Add Section</Button>
                            <Button variant="ghost" onClick={() => { setAddingSection(false); setNewSectionTitle(''); }}>Cancel</Button>
                        </div>
                    </Card>
                ) : (
                    <Button variant="outline" className="w-full py-8 border-dashed border-2 border-border hover:border-primary/50 hover:bg-accent/50 text-muted-foreground" onClick={() => setAddingSection(true)}>
                        <Plus size={24} className="mb-2" />
                        Add New Section
                    </Button>
                )}
            </div>
        </div>
    );
}
