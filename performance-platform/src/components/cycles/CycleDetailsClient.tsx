'use client';

import { useState } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { StatusBadge } from '@/components/ui/StatusBadge';
import Link from 'next/link';
import { Search, Mail, Download, CheckCircle, Clock } from 'lucide-react';
import { sendCycleReminders } from '@/app/actions/cycles';
import { UI_TEXT } from '@/lib/constants';

interface Review {
    id: string;
    status: 'PENDING_EMPLOYEE' | 'PENDING_MANAGER' | 'COMPLETED';
    dueDate: Date | null;
    employee: {
        id: string;
        name: string;
        email: string;
        department: string | null;
    };
    manager: {
        id: string;
        name: string;
        email: string;
    };
    template: {
        id: string;
        title: string;
    };
}

interface Props {
    cycleId: string;
    reviews: Review[];
    hasPendingReviews: boolean;
}

export default function CycleDetailsClient({ cycleId, reviews, hasPendingReviews }: Props) {
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState<string>('ALL');
    const [sendingReminders, setSendingReminders] = useState(false);

    const handleSendReminders = async () => {
        try {
            setSendingReminders(true);
            const result = await sendCycleReminders(cycleId);
            alert(result.message);
        } catch (error) {
            alert(error instanceof Error ? error.message : 'Failed to send reminders');
        } finally {
            setSendingReminders(false);
        }
    };

    // Filter reviews
    const filteredReviews = reviews.filter((review) => {
        const matchesSearch =
            review.employee.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            review.employee.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
            review.manager.name.toLowerCase().includes(searchQuery.toLowerCase());

        const matchesStatus =
            statusFilter === 'ALL' || review.status === statusFilter;

        return matchesSearch && matchesStatus;
    });

    const getDeadlineColor = (dueDate: Date | null) => {
        if (!dueDate) return 'text-slate-400';
        const now = new Date();
        const due = new Date(dueDate);
        const daysUntilDue = Math.ceil((due.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

        if (daysUntilDue < 0) return 'text-red-400';
        if (daysUntilDue <= 3) return 'text-orange-400';
        return 'text-slate-400';
    };

    return (
        <Card className="space-y-6">
            <div className="flex items-center justify-between">
                <h2 className="text-2xl font-semibold text-white">Reviews in This Cycle</h2>
                <div className="flex gap-3">
                    {hasPendingReviews && (
                        <Button
                            variant="secondary"
                            size="sm"
                            onClick={handleSendReminders}
                            disabled={sendingReminders}
                        >
                            {sendingReminders ? (
                                <>Sending...</>
                            ) : (
                                <>
                                    <Mail size={16} className="mr-2" />
                                    {UI_TEXT.SEND_REMINDERS}
                                </>
                            )}
                        </Button>
                    )}
                    <Button variant="ghost" size="sm">
                        <Download size={16} className="mr-2" />
                        {UI_TEXT.EXPORT_CYCLE_REPORT}
                    </Button>
                </div>
            </div>

            {/* Filters */}
            <div className="flex gap-4">
                <div className="flex-1 relative">
                    <Search
                        className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-500"
                        size={18}
                    />
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search by employee or manager name..."
                        className="w-full pl-10 pr-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
                    />
                </div>
                <div className="w-64">
                    <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-cyan-500"
                    >
                        <option value="ALL">All Statuses</option>
                        <option value="PENDING_EMPLOYEE">Pending Self-Eval</option>
                        <option value="PENDING_MANAGER">Pending Manager Review</option>
                        <option value="COMPLETED">Completed</option>
                    </select>
                </div>
            </div>

            {/* Reviews Table */}
            <div className="overflow-x-auto">
                <table className="w-full">
                    <thead className="border-b border-slate-800">
                        <tr className="text-left text-sm text-slate-400">
                            <th className="pb-3 font-medium">Employee</th>
                            <th className="pb-3 font-medium">Department</th>
                            <th className="pb-3 font-medium">Manager</th>
                            <th className="pb-3 font-medium">Status</th>
                            <th className="pb-3 font-medium">Due Date</th>
                            <th className="pb-3 font-medium">Action</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800">
                        {filteredReviews.map((review) => {
                            const deadlineColor = getDeadlineColor(review.dueDate);
                            const isOverdue = review.dueDate && new Date(review.dueDate) < new Date();

                            return (
                                <tr key={review.id} className="hover:bg-slate-800/30 transition-colors">
                                    <td className="py-4">
                                        <div>
                                            <div className="text-white font-medium">{review.employee.name}</div>
                                            <div className="text-sm text-slate-400">{review.employee.email}</div>
                                        </div>
                                    </td>
                                    <td className="py-4 text-slate-300">
                                        {review.employee.department || 'N/A'}
                                    </td>
                                    <td className="py-4 text-slate-300">{review.manager.name}</td>
                                    <td className="py-4">
                                        <StatusBadge status={review.status} size="sm" />
                                    </td>
                                    <td className="py-4">
                                        <div className={`text-sm ${deadlineColor}`}>
                                            {review.dueDate
                                                ? new Date(review.dueDate).toLocaleDateString()
                                                : 'No due date'}
                                            {isOverdue && review.status !== 'COMPLETED' && (
                                                <div className="text-xs text-red-400">Overdue</div>
                                            )}
                                        </div>
                                    </td>
                                    <td className="py-4">
                                        <Link href={`/review/${review.id}`}>
                                            <Button variant="ghost" size="sm">
                                                View
                                            </Button>
                                        </Link>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>

                {filteredReviews.length === 0 && (
                    <div className="text-center py-12 text-slate-500">
                        No reviews found matching your criteria
                    </div>
                )}

                {filteredReviews.length > 0 && (
                    <div className="mt-4 text-sm text-slate-400">
                        Showing {filteredReviews.length} of {reviews.length} reviews
                    </div>
                )}
            </div>
        </Card>
    );
}
