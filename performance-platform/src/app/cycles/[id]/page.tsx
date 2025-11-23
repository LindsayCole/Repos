import { getCurrentUser } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { getCycleDetails, sendCycleReminders } from '@/app/actions/cycles';
import { Card } from '@/components/ui/Card';
import { StatusBadge } from '@/components/ui/StatusBadge';
import Link from 'next/link';
import { Calendar, Users, CheckCircle, Clock, Mail, ArrowLeft, AlertCircle } from 'lucide-react';
import { UI_TEXT } from '@/lib/constants';
import CycleDetailsClient from '@/components/cycles/CycleDetailsClient';

interface PageProps {
    params: {
        id: string;
    };
}

export default async function CycleDetailPage({ params }: PageProps) {
    const user = await getCurrentUser();

    if (!user) {
        redirect('/login');
    }

    if (user.role !== 'HR') {
        redirect('/dashboard');
    }

    const cycle = await getCycleDetails(params.id);

    if (!cycle) {
        return (
            <div className="text-center py-12">
                <p className="text-slate-500">Cycle not found</p>
            </div>
        );
    }

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'ACTIVE':
                return 'bg-green-500/20 text-green-300 border-green-500/30';
            case 'COMPLETED':
                return 'bg-slate-500/20 text-slate-300 border-slate-500/30';
            case 'DRAFT':
                return 'bg-orange-500/20 text-orange-300 border-orange-500/30';
            default:
                return 'bg-slate-500/20 text-slate-300 border-slate-500/30';
        }
    };

    const getStatusText = (status: string) => {
        switch (status) {
            case 'ACTIVE':
                return UI_TEXT.CYCLE_STATUS_ACTIVE;
            case 'COMPLETED':
                return UI_TEXT.CYCLE_STATUS_COMPLETED;
            case 'DRAFT':
                return UI_TEXT.CYCLE_STATUS_DRAFT;
            default:
                return status;
        }
    };

    const isOverdue = new Date(cycle.dueDate) < new Date() && cycle.status === 'ACTIVE';

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Link href="/cycles">
                        <button className="p-2 hover:bg-slate-800 rounded-lg transition-colors">
                            <ArrowLeft size={20} className="text-slate-400" />
                        </button>
                    </Link>
                    <div>
                        <h1 className="text-4xl font-bold text-white mb-2">
                            {cycle.name}
                        </h1>
                        <p className="text-slate-400">{cycle.description || 'Review cycle details and progress'}</p>
                    </div>
                </div>
                <span
                    className={`px-3 py-1.5 rounded-lg text-sm font-medium border ${getStatusColor(
                        cycle.status
                    )}`}
                >
                    {getStatusText(cycle.status)}
                </span>
            </div>

            {/* Key Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <Card className="space-y-2">
                    <div className="flex items-center gap-2 text-slate-400">
                        <Users size={18} />
                        <span className="text-sm">Total Reviews</span>
                    </div>
                    <div className="text-3xl font-bold text-white">
                        {cycle.stats.totalReviews}
                    </div>
                </Card>

                <Card className="space-y-2">
                    <div className="flex items-center gap-2 text-slate-400">
                        <CheckCircle size={18} />
                        <span className="text-sm">Completed</span>
                    </div>
                    <div className="text-3xl font-bold text-green-400">
                        {cycle.stats.completedReviews}
                    </div>
                </Card>

                <Card className="space-y-2">
                    <div className="flex items-center gap-2 text-slate-400">
                        <Clock size={18} />
                        <span className="text-sm">Pending</span>
                    </div>
                    <div className="text-3xl font-bold text-orange-400">
                        {cycle.stats.pendingEmployee + cycle.stats.pendingManager}
                    </div>
                </Card>

                <Card className="space-y-2">
                    <div className="flex items-center gap-2 text-slate-400">
                        <Calendar size={18} />
                        <span className="text-sm">Due Date</span>
                    </div>
                    <div className={`text-lg font-bold ${isOverdue ? 'text-red-400' : 'text-white'}`}>
                        {new Date(cycle.dueDate).toLocaleDateString()}
                        {isOverdue && (
                            <div className="text-xs text-red-400 font-normal mt-1">Overdue</div>
                        )}
                    </div>
                </Card>
            </div>

            {/* Progress Section */}
            <Card className="space-y-6">
                <div className="flex items-center justify-between">
                    <h2 className="text-2xl font-semibold text-cyan-400">{UI_TEXT.CYCLE_PROGRESS}</h2>
                    <div className="text-3xl font-bold text-cyan-400">
                        {cycle.stats.completionPercentage}%
                    </div>
                </div>

                <div className="w-full bg-slate-800 h-4 rounded-full overflow-hidden">
                    <div
                        className="bg-gradient-to-r from-cyan-500 to-purple-500 h-full transition-all duration-500"
                        style={{ width: `${cycle.stats.completionPercentage}%` }}
                    />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="p-4 bg-blue-500/10 border border-blue-500/30 rounded-lg">
                        <div className="text-sm text-slate-400 mb-1">Pending Self-Evaluation</div>
                        <div className="text-2xl font-bold text-blue-300">
                            {cycle.stats.pendingEmployee}
                        </div>
                    </div>
                    <div className="p-4 bg-orange-500/10 border border-orange-500/30 rounded-lg">
                        <div className="text-sm text-slate-400 mb-1">Pending Manager Review</div>
                        <div className="text-2xl font-bold text-orange-300">
                            {cycle.stats.pendingManager}
                        </div>
                    </div>
                    <div className="p-4 bg-green-500/10 border border-green-500/30 rounded-lg">
                        <div className="text-sm text-slate-400 mb-1">Completed</div>
                        <div className="text-2xl font-bold text-green-300">
                            {cycle.stats.completedReviews}
                        </div>
                    </div>
                </div>
            </Card>

            {/* Cycle Information */}
            <Card className="space-y-4">
                <h2 className="text-xl font-semibold text-white">Cycle Information</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div>
                        <span className="text-slate-400">Start Date:</span>
                        <div className="text-white font-medium">
                            {new Date(cycle.startDate).toLocaleDateString()}
                        </div>
                    </div>
                    <div>
                        <span className="text-slate-400">End Date:</span>
                        <div className="text-white font-medium">
                            {new Date(cycle.endDate).toLocaleDateString()}
                        </div>
                    </div>
                    <div>
                        <span className="text-slate-400">Created By:</span>
                        <div className="text-white font-medium">
                            {cycle.createdBy.name}
                        </div>
                    </div>
                    <div>
                        <span className="text-slate-400">Created On:</span>
                        <div className="text-white font-medium">
                            {new Date(cycle.createdAt).toLocaleDateString()}
                        </div>
                    </div>
                </div>
            </Card>

            {/* Warning for overdue reviews */}
            {isOverdue && cycle.stats.completionPercentage < 100 && (
                <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-lg flex items-start gap-3">
                    <AlertCircle size={20} className="text-red-400 mt-0.5" />
                    <div>
                        <h3 className="text-red-400 font-semibold mb-1">Overdue Reviews</h3>
                        <p className="text-sm text-red-300">
                            This review cycle is past its due date with {cycle.stats.pendingEmployee + cycle.stats.pendingManager} reviews still pending.
                            Consider sending reminders to participants.
                        </p>
                    </div>
                </div>
            )}

            {/* Reviews Table - Client Component for interactivity */}
            <CycleDetailsClient
                cycleId={cycle.id}
                reviews={cycle.reviews}
                hasPendingReviews={cycle.stats.pendingEmployee + cycle.stats.pendingManager > 0}
            />
        </div>
    );
}
