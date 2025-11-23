'use client';

import { useState } from 'react';
import { ActionItem } from '@prisma/client';
import { Calendar, Pencil, Trash2, CheckCircle2, Circle } from 'lucide-react';
import { updateActionItem, deleteActionItem } from '@/app/actions/action-items';
import { useToast } from '@/lib/toast';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import DeadlineIndicator from '@/components/ui/DeadlineIndicator';
import { ACTION_ITEM_CATEGORIES, ACTION_ITEM_PRIORITIES, ACTION_ITEM_STATUSES } from '@/lib/constants';
import { cn } from '@/lib/utils';

interface ActionItemCardProps {
    actionItem: ActionItem;
    canEdit: boolean;
    onEdit?: (actionItem: ActionItem) => void;
}

export default function ActionItemCard({ actionItem, canEdit, onEdit }: ActionItemCardProps) {
    const [isExpanded, setIsExpanded] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const [showDeleteDialog, setShowDeleteDialog] = useState(false);
    const [isUpdating, setIsUpdating] = useState(false);
    const toast = useToast();

    const getPriorityColor = (priority: string) => {
        switch (priority) {
            case 'HIGH':
                return 'bg-red-500/20 text-red-300 border-red-500/30';
            case 'MEDIUM':
                return 'bg-orange-500/20 text-orange-300 border-orange-500/30';
            case 'LOW':
                return 'bg-blue-500/20 text-blue-300 border-blue-500/30';
            default:
                return 'bg-slate-500/20 text-slate-300 border-slate-500/30';
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'PENDING':
                return 'bg-slate-500/20 text-slate-300 border-slate-500/30';
            case 'IN_PROGRESS':
                return 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30';
            case 'COMPLETED':
                return 'bg-green-500/20 text-green-300 border-green-500/30';
            case 'CANCELLED':
                return 'bg-red-500/20 text-red-300 border-red-500/30';
            default:
                return 'bg-slate-500/20 text-slate-300 border-slate-500/30';
        }
    };

    const getCategoryColor = () => {
        return 'bg-purple-500/20 text-purple-300 border-purple-500/30';
    };

    const isOverdue = actionItem.targetDate &&
        new Date(actionItem.targetDate) < new Date() &&
        actionItem.status !== 'COMPLETED' &&
        actionItem.status !== 'CANCELLED';

    const handleToggleComplete = async () => {
        if (!canEdit) return;

        setIsUpdating(true);
        try {
            const newStatus = actionItem.status === 'COMPLETED' ? 'PENDING' : 'COMPLETED';
            await updateActionItem(actionItem.id, { status: newStatus });
            toast.success(`Action item ${newStatus === 'COMPLETED' ? 'completed' : 'reopened'}`);
        } catch (error) {
            toast.error('Failed to update action item');
        } finally {
            setIsUpdating(false);
        }
    };

    const handleDelete = async () => {
        setIsDeleting(true);
        try {
            await deleteActionItem(actionItem.id);
            toast.success('Action item deleted');
            setShowDeleteDialog(false);
        } catch (error) {
            toast.error('Failed to delete action item');
        } finally {
            setIsDeleting(false);
        }
    };

    return (
        <>
            <div className={cn(
                "bg-slate-800/30 border rounded-lg p-4 transition-all",
                isOverdue ? "border-red-500/50 bg-red-500/5" : "border-slate-700",
                actionItem.status === 'COMPLETED' && "opacity-60"
            )}>
                <div className="flex items-start gap-3">
                    {/* Completion Checkbox */}
                    <button
                        onClick={handleToggleComplete}
                        disabled={!canEdit || isUpdating}
                        className={cn(
                            "mt-1 flex-shrink-0 transition-colors",
                            canEdit && !isUpdating ? "cursor-pointer hover:text-cyan-400" : "cursor-not-allowed"
                        )}
                    >
                        {actionItem.status === 'COMPLETED' ? (
                            <CheckCircle2 size={20} className="text-green-400" />
                        ) : (
                            <Circle size={20} className="text-slate-400" />
                        )}
                    </button>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                        {/* Title and Actions */}
                        <div className="flex items-start justify-between gap-2 mb-2">
                            <h4 className={cn(
                                "text-base font-medium text-slate-200 flex-1",
                                actionItem.status === 'COMPLETED' && "line-through text-slate-400"
                            )}>
                                {actionItem.title}
                            </h4>

                            {canEdit && (
                                <div className="flex items-center gap-1 flex-shrink-0">
                                    <button
                                        onClick={() => onEdit?.(actionItem)}
                                        className="p-1.5 text-slate-400 hover:text-cyan-400 hover:bg-slate-700/50 rounded transition-colors"
                                        title="Edit"
                                    >
                                        <Pencil size={14} />
                                    </button>
                                    <button
                                        onClick={() => setShowDeleteDialog(true)}
                                        className="p-1.5 text-slate-400 hover:text-red-400 hover:bg-slate-700/50 rounded transition-colors"
                                        title="Delete"
                                    >
                                        <Trash2 size={14} />
                                    </button>
                                </div>
                            )}
                        </div>

                        {/* Badges */}
                        <div className="flex flex-wrap gap-2 mb-3">
                            {/* Priority Badge */}
                            <span className={cn(
                                "px-2 py-0.5 rounded text-xs font-medium border",
                                getPriorityColor(actionItem.priority)
                            )}>
                                {ACTION_ITEM_PRIORITIES[actionItem.priority as keyof typeof ACTION_ITEM_PRIORITIES]}
                            </span>

                            {/* Status Badge */}
                            <span className={cn(
                                "px-2 py-0.5 rounded text-xs font-medium border",
                                getStatusColor(actionItem.status)
                            )}>
                                {ACTION_ITEM_STATUSES[actionItem.status as keyof typeof ACTION_ITEM_STATUSES]}
                            </span>

                            {/* Category Badge */}
                            {actionItem.category && (
                                <span className={cn(
                                    "px-2 py-0.5 rounded text-xs font-medium border",
                                    getCategoryColor()
                                )}>
                                    {ACTION_ITEM_CATEGORIES[actionItem.category as keyof typeof ACTION_ITEM_CATEGORIES]}
                                </span>
                            )}
                        </div>

                        {/* Target Date */}
                        {actionItem.targetDate && (
                            <div className="mb-3">
                                <DeadlineIndicator
                                    dueDate={new Date(actionItem.targetDate)}
                                    size="sm"
                                />
                            </div>
                        )}

                        {/* Description */}
                        {actionItem.description && (
                            <div className="mt-2">
                                <p className={cn(
                                    "text-sm text-slate-400 transition-all",
                                    !isExpanded && "line-clamp-2"
                                )}>
                                    {actionItem.description}
                                </p>
                                <button
                                    onClick={() => setIsExpanded(!isExpanded)}
                                    className="text-xs text-cyan-400 hover:text-cyan-300 mt-1 transition-colors"
                                >
                                    {isExpanded ? 'Show less' : 'Show more'}
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Delete Confirmation Dialog */}
            <ConfirmDialog
                isOpen={showDeleteDialog}
                title="Delete Action Item"
                message="Are you sure you want to delete this action item? This action cannot be undone."
                confirmLabel={isDeleting ? "Deleting..." : "Delete"}
                cancelLabel="Cancel"
                variant="danger"
                onConfirm={handleDelete}
                onCancel={() => setShowDeleteDialog(false)}
            />
        </>
    );
}
