'use client';

import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { createTemplate, updateTemplate, addSection, addQuestion, deleteSection, deleteQuestion, updateQuestionText, updateQuestionRoles } from '@/app/actions/builder';
import { Plus, Trash2, ChevronDown, ChevronUp } from 'lucide-react';
import { useToast } from '@/lib/toast';
import { SUCCESS_MESSAGES } from '@/lib/constants';

export default function TemplateEditor({ template, userId }: { template: any, userId: string }) {
    const router = useRouter();
    const toast = useToast();
    const [isPending, startTransition] = useTransition();
    const [title, setTitle] = useState(template?.title || '');
    const [description, setDescription] = useState(template?.description || '');
    const [sections, setSections] = useState(template?.sections || []);
    const [newSectionTitle, setNewSectionTitle] = useState('');
    const [expandedRoleSelectors, setExpandedRoleSelectors] = useState<Record<string, boolean>>({});

    const handleSaveInfo = async () => {
        startTransition(async () => {
            try {
                if (template) {
                    const result = await updateTemplate(template.id, title, description);
                    if (result?.message) {
                        toast.success(result.message);
                    }
                } else {
                    const result = await createTemplate(title, description, userId);
                    if (result?.message) {
                        toast.success(result.message);
                    }
                    if (result?.template) {
                        router.replace(`/builder/${result.template.id}`); // Replace to avoid back to /new
                    }
                }
            } catch (e) {
                console.error(e);
                toast.error(e instanceof Error ? e.message : 'Failed to save template');
            }
        });
    };

    const handleAddSection = async () => {
        if (!template || !newSectionTitle) return;
        startTransition(async () => {
            try {
                const newSections = await addSection(template.id, newSectionTitle, sections.length + 1);
                setSections(newSections);
                setNewSectionTitle('');
                toast.success('Section added successfully');
            } catch (e) {
                console.error(e);
                toast.error(e instanceof Error ? e.message : 'Failed to add section');
            }
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
            try {
                const newSections = await deleteSection(template.id, sectionId);
                setSections(newSections);
                toast.success(SUCCESS_MESSAGES.TEMPLATE_DELETED);
            } catch (e) {
                console.error(e);
                toast.error(e instanceof Error ? e.message : 'Failed to delete section');
            }
        });
    };

    const handleDeleteQuestion = async (questionId: string) => {
        if (!template) return;
        startTransition(async () => {
            try {
                const newSections = await deleteQuestion(template.id, questionId);
                setSections(newSections);
                toast.success('Question deleted successfully');
            } catch (e) {
                console.error(e);
                toast.error(e instanceof Error ? e.message : 'Failed to delete question');
            }
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

    const toggleRoleSelector = (questionId: string) => {
        setExpandedRoleSelectors(prev => ({
            ...prev,
            [questionId]: !prev[questionId]
        }));
    };

    const getQuestionRoles = (question: any): string[] => {
        if (!question.applicableRoles) return [];
        try {
            const parsed = JSON.parse(question.applicableRoles);
            return Array.isArray(parsed) ? parsed : [];
        } catch {
            return [];
        }
    };

    const handleRoleToggle = (questionId: string, role: string, currentRoles: string[]) => {
        if (!template) return;
        const newRoles = currentRoles.includes(role)
            ? currentRoles.filter(r => r !== role)
            : [...currentRoles, role];

        startTransition(async () => {
            await updateQuestionRoles(template.id, questionId, newRoles.length > 0 ? newRoles : null);
            // Update local state
            const updatedSections = sections.map((section: any) => ({
                ...section,
                questions: section.questions.map((q: any) =>
                    q.id === questionId
                        ? { ...q, applicableRoles: newRoles.length > 0 ? JSON.stringify(newRoles) : null }
                        : q
                )
            }));
            setSections(updatedSections);
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
                            {section.questions.map((question: any, questionIndex: number) => {
                                const roles = getQuestionRoles(question);
                                const isExpanded = expandedRoleSelectors[question.id];
                                const availableRoles = ['EMPLOYEE', 'MANAGER', 'HR'];

                                return (
                                    <div key={question.id} className="space-y-2 p-3 bg-slate-950/30 rounded-lg">
                                        <div className="flex items-center gap-2">
                                            <input
                                                type="text"
                                                value={question.text}
                                                onChange={(e) => handleQuestionTextChange(sectionIndex, questionIndex, e.target.value)}
                                                onBlur={(e) => handleQuestionTextBlur(question.id, e.target.value)}
                                                placeholder="Question text..."
                                                className="flex-grow bg-slate-950/50 border border-slate-800 rounded-lg p-2 text-slate-300 focus:outline-none focus:border-cyan-500/50"
                                            />
                                            <Button variant="danger" size="sm" onClick={() => handleDeleteQuestion(question.id)} disabled={isPending}>
                                                <Trash2 size={14} />
                                            </Button>
                                        </div>

                                        {/* Role Badges */}
                                        <div className="flex items-center gap-2 flex-wrap">
                                            <span className="text-xs text-slate-500">Visible to:</span>
                                            {roles.length === 0 ? (
                                                <span className="px-2 py-1 text-xs rounded-full bg-slate-700 text-slate-300">
                                                    All Roles
                                                </span>
                                            ) : (
                                                roles.map((role) => (
                                                    <span
                                                        key={role}
                                                        className={`px-2 py-1 text-xs rounded-full ${
                                                            role === 'HR' ? 'bg-purple-500/20 text-purple-300' :
                                                            role === 'MANAGER' ? 'bg-blue-500/20 text-blue-300' :
                                                            'bg-green-500/20 text-green-300'
                                                        }`}
                                                    >
                                                        {role}
                                                    </span>
                                                ))
                                            )}
                                            <button
                                                onClick={() => toggleRoleSelector(question.id)}
                                                className="text-xs text-cyan-400 hover:text-cyan-300 flex items-center gap-1"
                                            >
                                                {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                                                {isExpanded ? 'Hide' : 'Edit'} Roles
                                            </button>
                                        </div>

                                        {/* Role Selector */}
                                        {isExpanded && (
                                            <div className="pt-2 border-t border-slate-800">
                                                <p className="text-xs text-slate-500 mb-2">
                                                    Select which roles can see this question (leave all unchecked for all roles):
                                                </p>
                                                <div className="flex gap-3">
                                                    {availableRoles.map((role) => (
                                                        <label
                                                            key={role}
                                                            className="flex items-center gap-2 cursor-pointer"
                                                        >
                                                            <input
                                                                type="checkbox"
                                                                checked={roles.includes(role)}
                                                                onChange={() => handleRoleToggle(question.id, role, roles)}
                                                                disabled={isPending}
                                                                className="w-4 h-4 rounded border-slate-700 bg-slate-900 text-cyan-500 focus:ring-cyan-500 focus:ring-offset-0 cursor-pointer"
                                                            />
                                                            <span className="text-sm text-slate-300">{role}</span>
                                                        </label>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
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
