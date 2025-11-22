'use client';

import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { createTemplate, updateTemplate, addSection, addQuestion, deleteSection, deleteQuestion, updateQuestionText } from '@/app/actions/builder';
import { Plus, Trash2 } from 'lucide-react';

export default function TemplateEditor({ template, userId }: { template: any, userId: string }) {
    const router = useRouter();
    const [isPending, startTransition] = useTransition();
    const [title, setTitle] = useState(template?.title || '');
    const [description, setDescription] = useState(template?.description || '');
    const [sections, setSections] = useState(template?.sections || []);
    const [newSectionTitle, setNewSectionTitle] = useState('');

    const handleSaveInfo = async () => {
        startTransition(async () => {
            try {
                if (template) {
                    await updateTemplate(template.id, title, description);
                } else {
                    const newTemplate = await createTemplate(title, description, userId);
                    router.replace(`/builder/${newTemplate.id}`); // Replace to avoid back to /new
                }
            } catch (e) { console.error(e); }
        });
    };

    const handleAddSection = async () => {
        if (!template || !newSectionTitle) return;
        startTransition(async () => {
            const newSections = await addSection(template.id, newSectionTitle, sections.length + 1);
            setSections(newSections);
            setNewSectionTitle('');
        });
    };

    const handleAddQuestion = async (sectionId: string, questionCount: number) => {
        if (!template) return;
        startTransition(async () => {
            const newSections = await addQuestion(template.id, sectionId, "New Question", questionCount + 1);
            setSections(newSections);
        });
    };

    const handleDeleteSection = async (sectionId: string) => {
        if (!template) return;
        startTransition(async () => {
            const newSections = await deleteSection(template.id, sectionId);
            setSections(newSections);
        });
    };

    const handleDeleteQuestion = async (questionId: string) => {
        if (!template) return;
        startTransition(async () => {
            const newSections = await deleteQuestion(template.id, questionId);
            setSections(newSections);
        });
    };

    const handleQuestionTextChange = (sectionIndex: number, questionIndex: number, newText: string) => {
        const newSections = [...sections];
        newSections[sectionIndex].questions[questionIndex].text = newText;
        setSections(newSections);
    };

    const handleQuestionTextBlur = (questionId: string, newText: string) => {
        startTransition(async () => {
            await updateQuestionText(questionId, newText);
        });
    };

    return (
        <div className="space-y-6 pb-20">
            <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Template Title"
                className="w-full bg-slate-950/50 border border-slate-800 rounded-lg p-3 text-2xl font-bold text-white focus:outline-none focus:border-cyan-500/50"
            />
            <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Template Description..."
                className="w-full bg-slate-950/50 border border-slate-800 rounded-lg p-3 text-slate-300 focus:outline-none focus:border-cyan-500/50 min-h-[100px]"
            />
            <Button onClick={handleSaveInfo} disabled={isPending}>{isPending ? 'Saving...' : 'Save Template Info'}</Button>

            <hr className="border-slate-800 my-8" />

            {template && (
                <div className="space-y-6">
                    <h2 className="text-xl font-semibold text-white">Sections</h2>
                    {sections.map((section: any, sectionIndex: number) => (
                        <Card key={section.id} className="space-y-4">
                            <div className="flex justify-between items-center">
                                <h3 className="text-lg font-semibold text-cyan-400">{section.title}</h3>
                                <Button variant="danger" size="sm" onClick={() => handleDeleteSection(section.id)} disabled={isPending}><Trash2 size={16} /></Button>
                            </div>
                            {section.questions.map((question: any, questionIndex: number) => (
                                <div key={question.id} className="flex items-center gap-2">
                                    <input
                                        type="text"
                                        value={question.text}
                                        onChange={(e) => handleQuestionTextChange(sectionIndex, questionIndex, e.target.value)}
                                        onBlur={(e) => handleQuestionTextBlur(question.id, e.target.value)}
                                        placeholder="Question text..."
                                        className="flex-grow bg-slate-950/50 border border-slate-800 rounded-lg p-2 text-slate-300 focus:outline-none focus:border-cyan-500/50"
                                    />
                                    <Button variant="danger" size="sm" onClick={() => handleDeleteQuestion(question.id)} disabled={isPending}><Trash2 size={14} /></Button>
                                </div>
                            ))}
                            <Button variant="secondary" size="sm" onClick={() => handleAddQuestion(section.id, section.questions.length)} disabled={isPending}><Plus size={16} className="mr-1" /> Add Question</Button>
                        </Card>
                    ))}
                    <div className="flex gap-2">
                        <input
                            type="text"
                            value={newSectionTitle}
                            onChange={(e) => setNewSectionTitle(e.target.value)}
                            placeholder="New Section Title"
                            className="flex-grow bg-slate-950/50 border border-slate-800 rounded-lg p-2 text-slate-300 focus:outline-none focus:border-cyan-500/50"
                        />
                        <Button onClick={handleAddSection} disabled={isPending || !newSectionTitle}><Plus size={16} className="mr-1" /> Add Section</Button>
                    </div>
                </div>
            )}
        </div>
    );
}
