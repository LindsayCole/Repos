'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { createReviewCycle } from '@/app/actions/review-cycles';

interface CycleFormProps {
    templates: {
        id: string;
        title: string;
    }[];
}

export default function CycleForm({ templates }: CycleFormProps) {
    const router = useRouter();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        frequency: 'ANNUAL',
        startDate: '',
        templateId: templates[0]?.id || '',
        includeAllUsers: true,
        departments: '',
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);

        try {
            const cycle = await createReviewCycle({
                name: formData.name,
                description: formData.description || undefined,
                frequency: formData.frequency,
                startDate: formData.startDate,
                templateId: formData.templateId,
                includeAllUsers: formData.includeAllUsers,
                departments: formData.departments ? formData.departments.split(',').map(d => d.trim()) : undefined,
            });

            router.push(`/cycles/${cycle.id}`);
        } catch (error) {
            console.error('Error creating cycle:', error);
            alert('Failed to create cycle. Please try again.');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            <div>
                <label htmlFor="name" className="block text-sm font-medium text-slate-300 mb-2">
                    Cycle Name *
                </label>
                <input
                    type="text"
                    id="name"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 transition-colors"
                    placeholder="e.g., 2025 Annual Performance Review"
                />
            </div>

            <div>
                <label htmlFor="description" className="block text-sm font-medium text-slate-300 mb-2">
                    Description
                </label>
                <textarea
                    id="description"
                    rows={3}
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 transition-colors resize-none"
                    placeholder="Describe the purpose of this review cycle..."
                />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                    <label htmlFor="frequency" className="block text-sm font-medium text-slate-300 mb-2">
                        Frequency *
                    </label>
                    <select
                        id="frequency"
                        required
                        value={formData.frequency}
                        onChange={(e) => setFormData({ ...formData, frequency: e.target.value })}
                        className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-cyan-500 transition-colors"
                    >
                        <option value="MONTHLY">Monthly</option>
                        <option value="QUARTERLY">Quarterly</option>
                        <option value="SEMI_ANNUAL">Semi-Annual</option>
                        <option value="ANNUAL">Annual</option>
                    </select>
                </div>

                <div>
                    <label htmlFor="startDate" className="block text-sm font-medium text-slate-300 mb-2">
                        Start Date *
                    </label>
                    <input
                        type="date"
                        id="startDate"
                        required
                        value={formData.startDate}
                        onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                        className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-cyan-500 transition-colors"
                    />
                </div>
            </div>

            <div>
                <label htmlFor="templateId" className="block text-sm font-medium text-slate-300 mb-2">
                    Review Template *
                </label>
                <select
                    id="templateId"
                    required
                    value={formData.templateId}
                    onChange={(e) => setFormData({ ...formData, templateId: e.target.value })}
                    className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-cyan-500 transition-colors"
                >
                    {templates.map((template) => (
                        <option key={template.id} value={template.id}>
                            {template.title}
                        </option>
                    ))}
                </select>
            </div>

            <div className="space-y-4">
                <label className="block text-sm font-medium text-slate-300">
                    Target Audience *
                </label>

                <div className="flex items-center gap-3">
                    <input
                        type="radio"
                        id="allUsers"
                        name="target"
                        checked={formData.includeAllUsers}
                        onChange={() => setFormData({ ...formData, includeAllUsers: true, departments: '' })}
                        className="w-4 h-4 text-cyan-500 bg-slate-800 border-slate-700 focus:ring-cyan-500"
                    />
                    <label htmlFor="allUsers" className="text-slate-300 cursor-pointer">
                        All employees with managers
                    </label>
                </div>

                <div className="flex items-start gap-3">
                    <input
                        type="radio"
                        id="departments"
                        name="target"
                        checked={!formData.includeAllUsers}
                        onChange={() => setFormData({ ...formData, includeAllUsers: false })}
                        className="w-4 h-4 mt-1 text-cyan-500 bg-slate-800 border-slate-700 focus:ring-cyan-500"
                    />
                    <div className="flex-1">
                        <label htmlFor="departments" className="text-slate-300 cursor-pointer block mb-2">
                            Specific departments
                        </label>
                        {!formData.includeAllUsers && (
                            <input
                                type="text"
                                placeholder="Engineering, Sales, Marketing"
                                value={formData.departments}
                                onChange={(e) => setFormData({ ...formData, departments: e.target.value })}
                                className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 transition-colors"
                            />
                        )}
                    </div>
                </div>
            </div>

            <div className="flex gap-3 pt-4 border-t border-slate-800">
                <Button
                    type="submit"
                    disabled={isSubmitting || !formData.name || !formData.startDate || !formData.templateId}
                    className="flex-1"
                >
                    {isSubmitting ? 'Creating...' : 'Create Cycle'}
                </Button>
                <Button
                    type="button"
                    onClick={() => router.back()}
                    className="bg-slate-700 hover:bg-slate-600 text-white"
                >
                    Cancel
                </Button>
            </div>
        </form>
    );
}
