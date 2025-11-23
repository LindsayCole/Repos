'use client';

import { useState, useMemo } from 'react';
import { SearchInput } from '@/components/ui/SearchInput';
import { FilterSelect, FilterOption } from '@/components/ui/FilterSelect';
import { Card } from '@/components/ui/Card';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { UI_TEXT } from '@/lib/constants';
import Link from 'next/link';
import PerformanceChart from '@/components/dashboard/PerformanceChart';
import DeadlineIndicator from '@/components/ui/DeadlineIndicator';

interface Employee {
    id: string;
    name: string;
    email: string;
    department: string | null;
    reviewsAsEmployee: Array<{
        id: string;
        status: string;
        overallScore: number | null;
        updatedAt: Date;
        dueDate?: Date | null;
        template: {
            title: string;
        };
        actionItems?: Array<{
            id: string;
            status: string;
            targetDate: Date | null;
        }>;
    }>;
}

interface TeamPageClientProps {
    employees: Employee[];
}

const filterOptions: FilterOption[] = [
    { value: 'all', label: 'All Employees' },
    { value: 'hasPending', label: 'Has Pending Reviews' },
    { value: 'hasCompleted', label: 'Has Completed Reviews' }
];

export function TeamPageClient({ employees }: TeamPageClientProps) {
    const [searchQuery, setSearchQuery] = useState('');
    const [filterValue, setFilterValue] = useState('all');

    const filteredEmployees = useMemo(() => {
        let filtered = employees;

        // Apply search filter
        if (searchQuery.trim()) {
            const query = searchQuery.toLowerCase();
            filtered = filtered.filter(employee =>
                employee.name.toLowerCase().includes(query) ||
                employee.email.toLowerCase().includes(query) ||
                employee.department?.toLowerCase().includes(query)
            );
        }

        // Apply review status filter
        if (filterValue === 'hasPending') {
            filtered = filtered.filter(employee =>
                employee.reviewsAsEmployee.some(r => r.status === 'PENDING_MANAGER')
            );
        } else if (filterValue === 'hasCompleted') {
            filtered = filtered.filter(employee =>
                employee.reviewsAsEmployee.some(r => r.status === 'COMPLETED')
            );
        }

        return filtered;
    }, [employees, searchQuery, filterValue]);

    // Helper function to get score color
    const getScoreColor = (score: number | null) => {
        if (!score) return { bg: 'bg-slate-700', text: 'text-slate-400', border: 'border-slate-600' };
        if (score >= 3.5) return { bg: 'bg-green-500/20', text: 'text-green-300', border: 'border-green-500/30' };
        if (score >= 2.5) return { bg: 'bg-purple-500/20', text: 'text-purple-300', border: 'border-purple-500/30' };
        if (score >= 1.5) return { bg: 'bg-orange-500/20', text: 'text-orange-300', border: 'border-orange-500/30' };
        return { bg: 'bg-red-500/20', text: 'text-red-300', border: 'border-red-500/30' };
    };

    return (
        <>
            {/* Search and Filter Controls */}
            <div className="flex flex-col sm:flex-row gap-4 mb-6">
                <div className="flex-1">
                    <SearchInput
                        value={searchQuery}
                        onChange={setSearchQuery}
                        placeholder="Search employees by name, email, or department..."
                    />
                </div>
                <div className="sm:w-64">
                    <FilterSelect
                        value={filterValue}
                        onChange={(value) => setFilterValue(value as string)}
                        options={filterOptions}
                        placeholder="Filter employees"
                    />
                </div>
            </div>

            {/* Results Count */}
            <div className="mb-4">
                <p className="text-sm text-slate-400">
                    Showing {filteredEmployees.length} of {employees.length} employees
                </p>
            </div>

            {/* Employees Grid */}
            {filteredEmployees.length === 0 ? (
                <Card>
                    <p className="text-slate-400 text-center py-8">
                        {employees.length === 0 ? UI_TEXT.NO_DIRECT_REPORTS : 'No employees match your search criteria'}
                    </p>
                </Card>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {filteredEmployees.map(employee => {
                        const completedReviews = employee.reviewsAsEmployee.filter(r => r.status === 'COMPLETED');
                        const pendingReviews = employee.reviewsAsEmployee.filter(r => r.status === 'PENDING_MANAGER');

                        // Sort pending reviews by due date (overdue first, then by closest due date)
                        const sortedPendingReviews = [...pendingReviews].sort((a, b) => {
                            if (!a.dueDate && !b.dueDate) return 0;
                            if (!a.dueDate) return 1;
                            if (!b.dueDate) return -1;
                            return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
                        });

                        // Calculate average overall score
                        const reviewsWithScores = completedReviews.filter(r => r.overallScore !== null);
                        const avgScore = reviewsWithScores.length > 0
                            ? reviewsWithScores.reduce((sum, r) => sum + (r.overallScore || 0), 0) / reviewsWithScores.length
                            : null;

                        const scoreColors = getScoreColor(avgScore);

                        // Prepare score data for performance chart
                        const employeeScoreData = reviewsWithScores.map(review => ({
                            date: review.updatedAt.toISOString(),
                            score: review.overallScore!,
                            templateTitle: review.template.title
                        }));

                        // Calculate action item stats
                        const allActionItems = employee.reviewsAsEmployee.flatMap(r => r.actionItems || []);
                        const pendingActionItems = allActionItems.filter(item => item.status === 'PENDING' || item.status === 'IN_PROGRESS');
                        const overdueActionItems = pendingActionItems.filter(item =>
                            item.targetDate && new Date(item.targetDate) < new Date()
                        );

                        return (
                            <Card key={employee.id} className="space-y-4">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <h3 className="text-xl font-semibold text-cyan-400">{employee.name}</h3>
                                        <p className="text-sm text-slate-400">{employee.email}</p>
                                        {employee.department && (
                                            <p className="text-xs text-slate-500 mt-1">{employee.department}</p>
                                        )}
                                    </div>
                                    <div className="text-right space-y-2">
                                        <div className={`px-3 py-2 rounded-lg ${scoreColors.bg} border ${scoreColors.border}`}>
                                            <div className="text-xs text-slate-400">Avg Score</div>
                                            <div className={`text-2xl font-bold ${scoreColors.text}`}>
                                                {avgScore !== null ? avgScore.toFixed(2) : '--'}
                                            </div>
                                            <div className="text-xs text-slate-500">/ 4.0</div>
                                        </div>
                                        <div className="text-xs text-slate-500">{UI_TEXT.COMPLETED_REVIEWS(completedReviews.length)}</div>
                                    </div>
                                </div>

                                {/* Action Items Summary */}
                                {(pendingActionItems.length > 0 || overdueActionItems.length > 0) && (
                                    <div className="flex gap-2">
                                        {pendingActionItems.length > 0 && (
                                            <div className="flex-1 px-3 py-2 bg-cyan-500/10 border border-cyan-500/30 rounded-lg">
                                                <div className="text-xs text-slate-400">Action Items</div>
                                                <div className="text-lg font-bold text-cyan-300">{pendingActionItems.length}</div>
                                            </div>
                                        )}
                                        {overdueActionItems.length > 0 && (
                                            <div className="flex-1 px-3 py-2 bg-orange-500/10 border border-orange-500/30 rounded-lg relative">
                                                <div className="text-xs text-slate-400">Overdue</div>
                                                <div className="text-lg font-bold text-orange-300">{overdueActionItems.length}</div>
                                                <div className="absolute -top-1 -right-1 w-3 h-3 bg-orange-500 rounded-full animate-pulse" />
                                            </div>
                                        )}
                                    </div>
                                )}

                                {sortedPendingReviews.length > 0 && (
                                    <div className="space-y-2">
                                        <div className="p-3 bg-orange-500/10 border border-orange-500/30 rounded-lg">
                                            <p className="text-sm text-orange-300 mb-2">
                                                {UI_TEXT.PENDING_REVIEWS(sortedPendingReviews.length)}
                                            </p>
                                            {sortedPendingReviews.slice(0, 2).map(review => (
                                                <div key={review.id} className="mt-2 flex items-center justify-between">
                                                    <span className="text-xs text-slate-400">{review.template.title}</span>
                                                    {review.dueDate && (
                                                        <DeadlineIndicator dueDate={new Date(review.dueDate)} size="sm" />
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                <div className="pt-4 border-t border-slate-700">
                                    <h4 className="text-sm font-semibold text-slate-300 mb-3">Recent Reviews</h4>
                                    {employee.reviewsAsEmployee.length === 0 ? (
                                        <p className="text-xs text-slate-500">No reviews yet</p>
                                    ) : (
                                        <div className="space-y-2">
                                            {employee.reviewsAsEmployee.slice(0, 3).map(review => (
                                                <Link key={review.id} href={`/reviews/${review.id}`}>
                                                    <div className="flex justify-between items-center p-2 bg-slate-800/30 rounded hover:bg-slate-800/50 transition-colors">
                                                        <span className="text-sm text-slate-300">{review.template.title}</span>
                                                        <StatusBadge status={review.status as 'PENDING_EMPLOYEE' | 'PENDING_MANAGER' | 'COMPLETED'} size="sm" />
                                                    </div>
                                                </Link>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                <PerformanceChart scores={employeeScoreData} />
                            </Card>
                        );
                    })}
                </div>
            )}
        </>
    );
}
