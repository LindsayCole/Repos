'use client';

import { useState } from 'react';
import { ActionItem } from '@prisma/client';
import { createActionItem, updateActionItem } from '@/app/actions/action-items';
import { useToast } from '@/lib/toast';
import { Button } from '@/components/ui/Button';
import { ACTION_ITEM_CATEGORIES, ACTION_ITEM_PRIORITIES } from '@/lib/constants';

interface AddActionItemFormProps {
    reviewId: string;
    editingItem?: ActionItem | null;
    onCancel: () => void;
    onSuccess?: () => void;
}

export default function AddActionItemForm({ reviewId, editingItem, onCancel, onSuccess }: AddActionItemFormProps) {
    const [title, setTitle] = useState(editingItem?.title || '');
    const [description, setDescription] = useState(editingItem?.description || '');
    const [category, setCategory] = useState(editingItem?.category || 'SKILL_DEVELOPMENT');
    const [priority, setPriority] = useState(editingItem?.priority || 'MEDIUM');
    const [targetDate, setTargetDate] = useState(
        editingItem?.targetDate ? new Date(editingItem.targetDate).toISOString().split('T')[0] : ''
    );
    const [isSubmitting, setIsSubmitting] = useState(false);
    const toast = useToast();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!title.trim()) {
            toast.error('Title is required');
            return;
        }

        setIsSubmitting(true);
        try {
            if (editingItem) {
                // Update existing item
                await updateActionItem(editingItem.id, {
                    title: title.trim(),
                    description: description.trim() || undefined,
                    category: category || undefined,
                    priority,
                    targetDate: targetDate ? new Date(targetDate) : null,
                });
                toast.success('Action item updated');
            } else {
                // Create new item
                await createActionItem(
                    reviewId,
                    title.trim(),
                    description.trim() || undefined,
                    category || undefined,
                    priority,
                    targetDate ? new Date(targetDate) : undefined
                );
                toast.success('Action item created');
            }

            // Reset form
            setTitle('');
            setDescription('');
            setCategory('SKILL_DEVELOPMENT');
            setPriority('MEDIUM');
            setTargetDate('');

            onSuccess?.();
        } catch (error) {
            toast.error(editingItem ? 'Failed to update action item' : 'Failed to create action item');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="bg-slate-800/50 border border-slate-700 rounded-lg p-4 space-y-4">
            {/* Title */}
            <div>
                <label htmlFor="title" className="block text-sm font-medium text-slate-300 mb-1">
                    Title <span className="text-red-400">*</span>
                </label>
                <input
                    id="title"
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g., Improve communication skills"
                    className="w-full bg-slate-950/50 border border-slate-700 rounded-lg p-2.5 text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500/50 transition-colors"
                    required
                />
            </div>

            {/* Description */}
            <div>
                <label htmlFor="description" className="block text-sm font-medium text-slate-300 mb-1">
                    Description
                </label>
                <textarea
                    id="description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Detailed action plan and goals..."
                    rows={3}
                    className="w-full bg-slate-950/50 border border-slate-700 rounded-lg p-2.5 text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500/50 transition-colors resize-none"
                />
            </div>

            {/* Category and Priority */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Category */}
                <div>
                    <label htmlFor="category" className="block text-sm font-medium text-slate-300 mb-1">
                        Category
                    </label>
                    <select
                        id="category"
                        value={category}
                        onChange={(e) => setCategory(e.target.value)}
                        className="w-full bg-slate-950/50 border border-slate-700 rounded-lg p-2.5 text-slate-200 focus:outline-none focus:border-cyan-500/50 transition-colors"
                    >
                        {Object.entries(ACTION_ITEM_CATEGORIES).map(([key, label]) => (
                            <option key={key} value={key}>{label}</option>
                        ))}
                    </select>
                </div>

                {/* Priority */}
                <div>
                    <label htmlFor="priority" className="block text-sm font-medium text-slate-300 mb-1">
                        Priority
                    </label>
                    <select
                        id="priority"
                        value={priority}
                        onChange={(e) => setPriority(e.target.value)}
                        className="w-full bg-slate-950/50 border border-slate-700 rounded-lg p-2.5 text-slate-200 focus:outline-none focus:border-cyan-500/50 transition-colors"
                    >
                        {Object.entries(ACTION_ITEM_PRIORITIES).map(([key, label]) => (
                            <option key={key} value={key}>{label}</option>
                        ))}
                    </select>
                </div>
            </div>

            {/* Target Date */}
            <div>
                <label htmlFor="targetDate" className="block text-sm font-medium text-slate-300 mb-1">
                    Target Date
                </label>
                <input
                    id="targetDate"
                    type="date"
                    value={targetDate}
                    onChange={(e) => setTargetDate(e.target.value)}
                    className="w-full bg-slate-950/50 border border-slate-700 rounded-lg p-2.5 text-slate-200 focus:outline-none focus:border-cyan-500/50 transition-colors"
                />
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-2">
                <Button
                    type="button"
                    variant="secondary"
                    onClick={onCancel}
                    disabled={isSubmitting}
                    className="flex-1"
                >
                    Cancel
                </Button>
                <Button
                    type="submit"
                    variant="primary"
                    disabled={isSubmitting}
                    className="flex-1"
                >
                    {isSubmitting ? 'Saving...' : (editingItem ? 'Update' : 'Add Action Item')}
                </Button>
            </div>
        </form>
    );
}
