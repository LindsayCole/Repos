'use client';

import { useState, useMemo } from 'react';
import { FilterSelect, FilterOption } from '@/components/ui/FilterSelect';
import { Card } from '@/components/ui/Card';
import ReviewTaskCard from '@/components/dashboard/ReviewTaskCard';
import { UI_TEXT } from '@/lib/constants';
import { ReviewTask } from '@/types';
import { getDeadlineStatus } from '@/lib/deadlines';

interface DashboardPageClientProps {
    allReviews: ReviewTask[];
}

export function DashboardPageClient({ allReviews }: DashboardPageClientProps) {
    const [statusFilter, setStatusFilter] = useState('all');
    const [templateFilter, setTemplateFilter] = useState('all');

    // Get all unique templates from reviews
    const allTemplates = useMemo(() => {
        const templates = new Map<string, string>();
        allReviews.forEach(review => {
            templates.set(review.template.id, review.template.title);
        });
        return Array.from(templates.entries()).map(([id, title]) => ({ id, title }));
    }, [allReviews]);

    const statusOptions: FilterOption[] = [
        { value: 'all', label: 'All Status' },
        { value: 'PENDING_EMPLOYEE', label: 'Pending Employee' },
        { value: 'PENDING_MANAGER', label: 'Pending Manager' }
    ];

    const templateOptions: FilterOption[] = [
        { value: 'all', label: 'All Templates' },
        ...allTemplates.map(template => ({
            value: template.id,
            label: template.title
        }))
    ];

    const filteredAndSortedReviews = useMemo(() => {
        let filtered = allReviews;

        // Apply status filter
        if (statusFilter !== 'all') {
            filtered = filtered.filter(review => review.status === statusFilter);
        }

        // Apply template filter
        if (templateFilter !== 'all') {
            filtered = filtered.filter(review => review.template.id === templateFilter);
        }

        // Sort by due date (overdue first, then by closest due date)
        const sorted = [...filtered].sort((a, b) => {
            if (!a.dueDate && !b.dueDate) return 0;
            if (!a.dueDate) return 1;
            if (!b.dueDate) return -1;
            return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
        });

        // Separate overdue and upcoming reviews
        const overdue = sorted.filter(review =>
            review.dueDate && getDeadlineStatus(new Date(review.dueDate)) === 'overdue'
        );
        const upcoming = sorted.filter(review =>
            !review.dueDate || getDeadlineStatus(new Date(review.dueDate)) !== 'overdue'
        );

        return { overdue, upcoming, all: filtered };
    }, [allReviews, statusFilter, templateFilter]);

    const totalFiltered = filteredAndSortedReviews.all.length;
    const totalReviews = allReviews.length;

    return (
        <Card className="md:col-span-2 space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <h2 className="text-xl font-semibold text-cyan-400">Your Tasks</h2>

                <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
                    <FilterSelect
                        value={statusFilter}
                        onChange={(value) => setStatusFilter(value as string)}
                        options={statusOptions}
                        placeholder="Filter by status"
                        className="sm:w-48"
                    />
                    <FilterSelect
                        value={templateFilter}
                        onChange={(value) => setTemplateFilter(value as string)}
                        options={templateOptions}
                        placeholder="Filter by template"
                        className="sm:w-48"
                    />
                </div>
            </div>

            {/* Results Count */}
            {(statusFilter !== 'all' || templateFilter !== 'all') && (
                <p className="text-sm text-slate-400">
                    Showing {totalFiltered} of {totalReviews} tasks
                </p>
            )}

            {totalFiltered === 0 ? (
                <div className="p-8 text-center border border-dashed border-slate-800 rounded-xl">
                    <p className="text-slate-500">
                        {totalReviews === 0 ? UI_TEXT.NO_PENDING_TASKS : 'No tasks match your filters'}
                    </p>
                </div>
            ) : (
                <>
                    {filteredAndSortedReviews.overdue.length > 0 && (
                        <>
                            <div className="flex items-center gap-2 pb-4 border-b border-red-500/30">
                                <h3 className="text-xl font-semibold text-red-400">Overdue Reviews</h3>
                                <span className="px-2 py-1 text-xs bg-red-500/20 text-red-300 rounded-full border border-red-500/30">
                                    {filteredAndSortedReviews.overdue.length}
                                </span>
                            </div>
                            <div className="space-y-4">
                                {filteredAndSortedReviews.overdue.map((review: ReviewTask) => {
                                    const isEmployee = review.status === 'PENDING_EMPLOYEE';
                                    return (
                                        <ReviewTaskCard key={review.id} review={review} type={isEmployee ? 'employee' : 'manager'} />
                                    );
                                })}
                            </div>
                        </>
                    )}

                    {filteredAndSortedReviews.upcoming.length > 0 && (
                        <div className={filteredAndSortedReviews.overdue.length > 0 ? 'pt-6 border-t border-slate-700' : ''}>
                            {filteredAndSortedReviews.overdue.length > 0 && (
                                <h3 className="text-xl font-semibold text-cyan-400 mb-4">Upcoming Tasks</h3>
                            )}
                            <div className="space-y-4">
                                {filteredAndSortedReviews.upcoming.map((review: ReviewTask) => {
                                    const isEmployee = review.status === 'PENDING_EMPLOYEE';
                                    return (
                                        <ReviewTaskCard key={review.id} review={review} type={isEmployee ? 'employee' : 'manager'} />
                                    );
                                })}
                            </div>
                        </div>
                    )}
                </>
            )}
        </Card>
    );
}
