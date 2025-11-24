'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { createReviewCycle } from '@/app/actions/reviews';
import { UI_TEXT, ERRORS, SUCCESS_MESSAGES } from '@/lib/constants';
import { X } from 'lucide-react';

interface User {
    id: string;
    name: string;
    role: string;
}

interface Template {
    id: string;
    title: string;
}

interface ReviewCreationModalProps {
    isOpen: boolean;
    onClose: () => void;
    templates: Template[];
    employees: User[];
    managers: User[];
}

export default function ReviewCreationModal({ isOpen, onClose, templates, employees, managers }: ReviewCreationModalProps) {
    const [selectedTemplate, setSelectedTemplate] = useState('');
    const [selectedEmployee, setSelectedEmployee] = useState('');
    const [selectedManager, setSelectedManager] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);

        try {
            await createReviewCycle(selectedTemplate, selectedEmployee, selectedManager);
            alert(SUCCESS_MESSAGES.REVIEW_CREATED);
            onClose();
        } catch (error) {
            console.error(error);
            alert(ERRORS.REVIEW_CREATE_FAILED);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
            <div className="bg-slate-900 border border-slate-700 rounded-xl p-6 w-full max-w-md shadow-2xl relative">
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 text-slate-400 hover:text-white"
                >
                    <X size={20} />
                </button>

                <h2 className="text-xl font-bold text-white mb-6">Start New Review Cycle</h2>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-300 mb-1">Select Template</label>
                        <select
                            className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
                            value={selectedTemplate}
                            onChange={(e) => setSelectedTemplate(e.target.value)}
                            required
                        >
                            <option value="">Choose a template...</option>
                            {templates.map(t => (
                                <option key={t.id} value={t.id}>{t.title}</option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-300 mb-1">Select Employee</label>
                        <select
                            className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
                            value={selectedEmployee}
                            onChange={(e) => setSelectedEmployee(e.target.value)}
                            required
                        >
                            <option value="">Choose an employee...</option>
                            {employees.map(e => (
                                <option key={e.id} value={e.id}>{e.name}</option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-300 mb-1">Select Manager</label>
                        <select
                            className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
                            value={selectedManager}
                            onChange={(e) => setSelectedManager(e.target.value)}
                            required
                        >
                            <option value="">Choose a manager...</option>
                            {managers.map(m => (
                                <option key={m.id} value={m.id}>{m.name}</option>
                            ))}
                        </select>
                    </div>

                    <div className="pt-4 flex justify-end gap-3">
                        <Button type="button" variant="ghost" onClick={onClose}>Cancel</Button>
                        <Button type="submit" variant="primary" disabled={isLoading}>
                            {isLoading ? UI_TEXT.SAVING : 'Start Review'}
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
}
