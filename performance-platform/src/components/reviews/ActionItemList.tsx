'use client';

import { useState, useMemo } from 'react';
import { ActionItem } from '@prisma/client';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { FilterSelect, FilterOption } from '@/components/ui/FilterSelect';
import ActionItemCard from './ActionItemCard';
import AddActionItemForm from './AddActionItemForm';
import { UI_TEXT } from '@/lib/constants';

interface ActionItemListProps {
    reviewId: string;
    actionItems: ActionItem[];
    canEdit: boolean;
}

const statusFilterOptions: FilterOption[] = [
    { value: 'all', label: 'All Items' },
    { value: 'PENDING', label: 'Pending' },
    { value: 'IN_PROGRESS', label: 'In Progress' },
    { value: 'COMPLETED', label: 'Completed' }
];

const priorityFilterOptions: FilterOption[] = [
    { value: 'all', label: 'All Priorities' },
    { value: 'HIGH', label: 'High Priority' },
    { value: 'MEDIUM', label: 'Medium Priority' },
    { value: 'LOW', label: 'Low Priority' }
];

const categoryFilterOptions: FilterOption[] = [
    { value: 'all', label: 'All Categories' },
    { value: 'SKILL_DEVELOPMENT', label: 'Skill Development' },
    { value: 'PERFORMANCE_IMPROVEMENT', label: 'Performance Improvement' },
    { value: 'CAREER_GROWTH', label: 'Career Growth' },
    { value: 'OTHER', label: 'Other' }
];

export default function ActionItemList({ reviewId, actionItems, canEdit }: ActionItemListProps) {
    const [showAddForm, setShowAddForm] = useState(false);
    const [editingItem, setEditingItem] = useState<ActionItem | null>(null);
    const [statusFilter, setStatusFilter] = useState('all');
    const [priorityFilter, setPriorityFilter] = useState('all');
    const [categoryFilter, setCategoryFilter] = useState('all');

    // Filter and group action items
    const { pending, inProgress, completed } = useMemo(() => {
        let filtered = actionItems;

        // Apply status filter
        if (statusFilter !== 'all') {
            filtered = filtered.filter(item => item.status === statusFilter);
        }

        // Apply priority filter
        if (priorityFilter !== 'all') {
            filtered = filtered.filter(item => item.priority === priorityFilter);
        }

        // Apply category filter
        if (categoryFilter !== 'all') {
            filtered = filtered.filter(item => item.category === categoryFilter);
        }

        return {
            pending: filtered.filter(item => item.status === 'PENDING'),
            inProgress: filtered.filter(item => item.status === 'IN_PROGRESS'),
            completed: filtered.filter(item => item.status === 'COMPLETED')
        };
    }, [actionItems, statusFilter, priorityFilter, categoryFilter]);

    const handleEdit = (item: ActionItem) => {
        setEditingItem(item);
        setShowAddForm(true);
    };

    const handleFormSuccess = () => {
        setShowAddForm(false);
        setEditingItem(null);
    };

    const handleFormCancel = () => {
        setShowAddForm(false);
        setEditingItem(null);
    };

    return (
        <div className="space-y-6">
            {/* Header with Add Button and Filters */}
            <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
                <div className="flex-1">
                    {canEdit && (
                        <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => setShowAddForm(!showAddForm)}
                            className="w-full sm:w-auto"
                        >
                            <Plus size={16} className="mr-1" />
                            {UI_TEXT.ADD_ACTION_ITEM}
                        </Button>
                    )}
                </div>

                {/* Filters */}
                {actionItems.length > 0 && (
                    <div className="flex flex-wrap gap-2 w-full sm:w-auto">
                        <div className="w-full sm:w-40">
                            <FilterSelect
                                value={statusFilter}
                                onChange={(value) => setStatusFilter(value as string)}
                                options={statusFilterOptions}
                                placeholder="Filter by status"
                            />
                        </div>
                        <div className="w-full sm:w-40">
                            <FilterSelect
                                value={priorityFilter}
                                onChange={(value) => setPriorityFilter(value as string)}
                                options={priorityFilterOptions}
                                placeholder="Filter by priority"
                            />
                        </div>
                        <div className="w-full sm:w-48">
                            <FilterSelect
                                value={categoryFilter}
                                onChange={(value) => setCategoryFilter(value as string)}
                                options={categoryFilterOptions}
                                placeholder="Filter by category"
                            />
                        </div>
                    </div>
                )}
            </div>

            {/* Add/Edit Form */}
            {showAddForm && (
                <AddActionItemForm
                    reviewId={reviewId}
                    editingItem={editingItem}
                    onCancel={handleFormCancel}
                    onSuccess={handleFormSuccess}
                />
            )}

            {/* Action Items List */}
            {actionItems.length === 0 ? (
                <div className="text-center py-12 bg-slate-800/20 border border-slate-700 rounded-lg">
                    <p className="text-slate-400 mb-4">{UI_TEXT.NO_ACTION_ITEMS}</p>
                    {canEdit && (
                        <Button
                            variant="primary"
                            size="sm"
                            onClick={() => setShowAddForm(true)}
                        >
                            <Plus size={16} className="mr-1" />
                            {UI_TEXT.ADD_ACTION_ITEM}
                        </Button>
                    )}
                </div>
            ) : (
                <div className="space-y-6">
                    {/* Pending Items */}
                    {pending.length > 0 && (
                        <div>
                            <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wide mb-3">
                                Pending ({pending.length})
                            </h3>
                            <div className="space-y-2">
                                {pending.map(item => (
                                    <ActionItemCard
                                        key={item.id}
                                        actionItem={item}
                                        canEdit={canEdit}
                                        onEdit={handleEdit}
                                    />
                                ))}
                            </div>
                        </div>
                    )}

                    {/* In Progress Items */}
                    {inProgress.length > 0 && (
                        <div>
                            <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wide mb-3">
                                In Progress ({inProgress.length})
                            </h3>
                            <div className="space-y-2">
                                {inProgress.map(item => (
                                    <ActionItemCard
                                        key={item.id}
                                        actionItem={item}
                                        canEdit={canEdit}
                                        onEdit={handleEdit}
                                    />
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Completed Items */}
                    {completed.length > 0 && (
                        <div>
                            <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wide mb-3">
                                Completed ({completed.length})
                            </h3>
                            <div className="space-y-2">
                                {completed.map(item => (
                                    <ActionItemCard
                                        key={item.id}
                                        actionItem={item}
                                        canEdit={canEdit}
                                        onEdit={handleEdit}
                                    />
                                ))}
                            </div>
                        </div>
                    )}

                    {/* No results after filtering */}
                    {pending.length === 0 && inProgress.length === 0 && completed.length === 0 && (
                        <div className="text-center py-8 bg-slate-800/20 border border-slate-700 rounded-lg">
                            <p className="text-slate-400">No action items match the selected filters.</p>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
