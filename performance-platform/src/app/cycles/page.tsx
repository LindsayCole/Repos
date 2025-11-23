import { getCurrentUser } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { getAllCycles } from '@/app/actions/cycles';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import Link from 'next/link';
import { Calendar, Users, CheckCircle, Clock } from 'lucide-react';
import { UI_TEXT } from '@/lib/constants';

export default async function ReviewCyclesPage() {
    const user = await getCurrentUser();

    if (!user) {
        redirect('/login');
    }

    if (user.role !== 'HR') {
        redirect('/dashboard');
    }

    const cycles = await getAllCycles();

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

    return (
        <div className="space-y-8">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-4xl font-bold text-white mb-2">
                        {UI_TEXT.CYCLES_TITLE}
                    </h1>
                    <p className="text-slate-400">{UI_TEXT.CYCLES_SUBTITLE}</p>
                </div>
                <Link href="/cycles/new">
                    <Button>
                        <Calendar size={16} className="mr-2" />
                        {UI_TEXT.CREATE_CYCLE}
                    </Button>
                </Link>
            </div>

            {cycles.length === 0 ? (
                <Card className="p-12 text-center border-dashed">
                    <Calendar size={48} className="mx-auto mb-4 text-slate-600" />
                    <p className="text-slate-500 mb-6">{UI_TEXT.NO_CYCLES}</p>
                    <Link href="/cycles/new">
                        <Button>
                            {UI_TEXT.CREATE_CYCLE}
                        </Button>
                    </Link>
                </Card>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {cycles.map((cycle) => {
                        const isOverdue = new Date(cycle.dueDate) < new Date() && cycle.status === 'ACTIVE';

                        return (
                            <Link key={cycle.id} href={`/cycles/${cycle.id}`}>
                                <Card className="hover:border-cyan-500/50 transition-all duration-300 cursor-pointer h-full">
                                    <div className="space-y-4">
                                        <div className="flex justify-between items-start">
                                            <div className="flex-1">
                                                <h3 className="text-xl font-semibold text-white mb-2">
                                                    {cycle.name}
                                                </h3>
                                                {cycle.description && (
                                                    <p className="text-sm text-slate-400 mb-3 line-clamp-2">
                                                        {cycle.description}
                                                    </p>
                                                )}
                                            </div>
                                            <span
                                                className={`px-2 py-1 rounded text-xs font-medium border whitespace-nowrap ml-2 ${getStatusColor(
                                                    cycle.status
                                                )}`}
                                            >
                                                {getStatusText(cycle.status)}
                                            </span>
                                        </div>

                                        <div className="space-y-2 text-sm">
                                            <div className="flex items-center text-slate-400">
                                                <Calendar size={14} className="mr-2" />
                                                <span>
                                                    {new Date(cycle.startDate).toLocaleDateString()} -{' '}
                                                    {new Date(cycle.endDate).toLocaleDateString()}
                                                </span>
                                            </div>
                                            <div className="flex items-center text-slate-400">
                                                <Clock size={14} className="mr-2" />
                                                <span className={isOverdue ? 'text-red-400' : ''}>
                                                    Due: {new Date(cycle.dueDate).toLocaleDateString()}
                                                    {isOverdue && ' (Overdue)'}
                                                </span>
                                            </div>
                                            <div className="flex items-center text-slate-400">
                                                <Users size={14} className="mr-2" />
                                                <span>{cycle.reviewCount} reviews</span>
                                            </div>
                                        </div>

                                        <div className="pt-4 border-t border-slate-800">
                                            <div className="flex justify-between items-center mb-2">
                                                <span className="text-sm text-slate-400">Progress</span>
                                                <span className="text-sm font-semibold text-cyan-400">
                                                    {cycle.completionPercentage}%
                                                </span>
                                            </div>
                                            <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                                                <div
                                                    className="bg-gradient-to-r from-cyan-500 to-purple-500 h-full transition-all duration-500"
                                                    style={{ width: `${cycle.completionPercentage}%` }}
                                                />
                                            </div>
                                            <div className="flex justify-between mt-2 text-xs text-slate-500">
                                                <span>{cycle.completedCount} completed</span>
                                                <span>{cycle.reviewCount - cycle.completedCount} pending</span>
                                            </div>
                                        </div>

                                        {cycle.completionPercentage === 100 && (
                                            <div className="flex items-center justify-center gap-2 text-green-400 text-sm font-medium">
                                                <CheckCircle size={16} />
                                                <span>All Reviews Complete</span>
                                            </div>
                                        )}
                                    </div>
                                </Card>
                            </Link>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
