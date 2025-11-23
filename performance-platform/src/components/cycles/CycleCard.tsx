import Link from 'next/link';
import { Card } from '@/components/ui/Card';
import { Calendar, Repeat, Users, TrendingUp } from 'lucide-react';
import { format } from 'date-fns';
import CycleStatusBadge from './CycleStatusBadge';

interface CycleCardProps {
    cycle: {
        id: string;
        name: string;
        description: string | null;
        frequency: string;
        nextRunDate: Date | null;
        lastRunDate: Date | null;
        isActive: boolean;
        includeAllUsers: boolean;
        departments: string | null;
        reviews: {
            id: string;
            status: string;
        }[];
    };
}

export default function CycleCard({ cycle }: CycleCardProps) {
    const frequencyLabels: Record<string, string> = {
        MONTHLY: 'Monthly',
        QUARTERLY: 'Quarterly',
        SEMI_ANNUAL: 'Semi-Annual',
        ANNUAL: 'Annual',
    };

    const totalReviews = cycle.reviews.length;
    const completedReviews = cycle.reviews.filter(r => r.status === 'COMPLETED').length;
    const completionRate = totalReviews > 0 ? Math.round((completedReviews / totalReviews) * 100) : 0;

    const isUpcoming = cycle.nextRunDate && new Date(cycle.nextRunDate) <= new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    return (
        <Link href={`/cycles/${cycle.id}`}>
            <Card className="hover:border-cyan-500/50 transition-colors cursor-pointer">
                <div className="space-y-4">
                    {/* Header */}
                    <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                                <h3 className="text-lg font-semibold text-white">{cycle.name}</h3>
                                <CycleStatusBadge isActive={cycle.isActive} />
                                {isUpcoming && cycle.isActive && (
                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-orange-500/10 text-orange-400 border border-orange-500/30">
                                        Due Soon
                                    </span>
                                )}
                            </div>
                            {cycle.description && (
                                <p className="text-slate-400 text-sm line-clamp-2">{cycle.description}</p>
                            )}
                        </div>
                    </div>

                    {/* Meta Info */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div className="flex items-center gap-2 text-slate-400">
                            <Repeat className="w-4 h-4" />
                            <span>{frequencyLabels[cycle.frequency] || cycle.frequency}</span>
                        </div>
                        {cycle.nextRunDate && (
                            <div className="flex items-center gap-2 text-slate-400">
                                <Calendar className="w-4 h-4" />
                                <span className={isUpcoming ? 'text-orange-400' : ''}>
                                    {format(new Date(cycle.nextRunDate), 'MMM d')}
                                </span>
                            </div>
                        )}
                        <div className="flex items-center gap-2 text-slate-400">
                            <Users className="w-4 h-4" />
                            <span>{cycle.includeAllUsers ? 'All Users' : 'Departments'}</span>
                        </div>
                        {totalReviews > 0 && (
                            <div className="flex items-center gap-2 text-slate-400">
                                <TrendingUp className="w-4 h-4" />
                                <span>{completionRate}% Complete</span>
                            </div>
                        )}
                    </div>

                    {/* Progress Bar */}
                    {totalReviews > 0 && (
                        <div className="space-y-2">
                            <div className="flex items-center justify-between text-sm">
                                <span className="text-slate-400">{completedReviews} of {totalReviews} reviews</span>
                            </div>
                            <div className="w-full bg-slate-700 h-2 rounded-full overflow-hidden">
                                <div
                                    className="h-full bg-gradient-to-r from-cyan-500 to-purple-500 rounded-full transition-all"
                                    style={{ width: `${completionRate}%` }}
                                />
                            </div>
                        </div>
                    )}
                </div>
            </Card>
        </Link>
    );
}
