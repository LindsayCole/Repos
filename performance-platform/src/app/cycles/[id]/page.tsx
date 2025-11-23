import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { getCurrentUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { redirect, notFound } from 'next/navigation';
import { ChevronLeft, Calendar, Repeat, Users, Play, CheckCircle2 } from 'lucide-react';
import Link from 'next/link';
import { format } from 'date-fns';
import CycleProgressChart from '@/components/cycles/CycleProgressChart';
import LaunchCycleButton from '@/components/cycles/LaunchCycleButton';
import CycleStatusBadge from '@/components/cycles/CycleStatusBadge';

export default async function CycleDetailPage({ params }: { params: { id: string } }) {
    const user = await getCurrentUser();

    if (!user) {
        redirect('/login');
    }

    // Only HR can access this page
    if (user.role !== 'HR') {
        redirect('/dashboard');
    }

    const cycle = await prisma.reviewCycle.findUnique({
        where: { id: params.id },
        include: {
            template: true,
            reviews: {
                include: {
                    employee: true,
                },
                orderBy: {
                    createdAt: 'desc',
                },
            },
        },
    });

    if (!cycle) {
        notFound();
    }

    // Calculate progress
    const totalReviews = cycle.reviews.length;
    const completedReviews = cycle.reviews.filter(r => r.status === 'COMPLETED').length;
    const pendingEmployee = cycle.reviews.filter(r => r.status === 'PENDING_EMPLOYEE').length;
    const pendingManager = cycle.reviews.filter(r => r.status === 'PENDING_MANAGER').length;
    const completionRate = totalReviews > 0 ? Math.round((completedReviews / totalReviews) * 100) : 0;

    // Parse departments if exists
    const departments = cycle.departments ? JSON.parse(cycle.departments) : null;

    // Frequency labels
    const frequencyLabels: Record<string, string> = {
        MONTHLY: 'Monthly',
        QUARTERLY: 'Quarterly',
        SEMI_ANNUAL: 'Semi-Annual',
        ANNUAL: 'Annual',
    };

    return (
        <div className="max-w-4xl mx-auto space-y-8">
            <Link
                href="/cycles"
                className="inline-flex items-center gap-2 text-slate-400 hover:text-white transition-colors"
            >
                <ChevronLeft className="w-4 h-4" />
                Back to Cycles
            </Link>

            <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                        <h1 className="text-4xl font-bold text-white">{cycle.name}</h1>
                        <CycleStatusBadge isActive={cycle.isActive} />
                    </div>
                    {cycle.description && (
                        <p className="text-slate-400">{cycle.description}</p>
                    )}
                </div>
                <LaunchCycleButton cycleId={cycle.id} cycleName={cycle.name} />
            </div>

            {/* Cycle Details */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="space-y-2">
                    <div className="flex items-center gap-3">
                        <div className="p-3 bg-purple-500/10 rounded-lg">
                            <Repeat className="w-5 h-5 text-purple-400" />
                        </div>
                        <div>
                            <div className="text-sm text-slate-400">Frequency</div>
                            <div className="text-lg font-medium text-white">
                                {frequencyLabels[cycle.frequency] || cycle.frequency}
                            </div>
                        </div>
                    </div>
                </Card>

                {cycle.nextRunDate && (
                    <Card className="space-y-2">
                        <div className="flex items-center gap-3">
                            <div className="p-3 bg-blue-500/10 rounded-lg">
                                <Calendar className="w-5 h-5 text-blue-400" />
                            </div>
                            <div>
                                <div className="text-sm text-slate-400">Next Run</div>
                                <div className="text-lg font-medium text-white">
                                    {format(new Date(cycle.nextRunDate), 'MMM d, yyyy')}
                                </div>
                            </div>
                        </div>
                    </Card>
                )}

                <Card className="space-y-2">
                    <div className="flex items-center gap-3">
                        <div className="p-3 bg-green-500/10 rounded-lg">
                            <Users className="w-5 h-5 text-green-400" />
                        </div>
                        <div>
                            <div className="text-sm text-slate-400">Target</div>
                            <div className="text-lg font-medium text-white">
                                {cycle.includeAllUsers ? 'All Users' : departments?.join(', ') || 'Custom'}
                            </div>
                        </div>
                    </div>
                </Card>
            </div>

            {/* Additional Details */}
            <Card>
                <h2 className="text-xl font-semibold text-white mb-4">Cycle Configuration</h2>
                <div className="space-y-3 text-sm">
                    <div className="flex items-center justify-between py-2 border-b border-slate-800">
                        <span className="text-slate-400">Template</span>
                        <span className="text-white font-medium">{cycle.template.title}</span>
                    </div>
                    <div className="flex items-center justify-between py-2 border-b border-slate-800">
                        <span className="text-slate-400">Start Date</span>
                        <span className="text-white font-medium">
                            {format(new Date(cycle.startDate), 'MMM d, yyyy')}
                        </span>
                    </div>
                    {cycle.lastRunDate && (
                        <div className="flex items-center justify-between py-2 border-b border-slate-800">
                            <span className="text-slate-400">Last Run</span>
                            <span className="text-white font-medium">
                                {format(new Date(cycle.lastRunDate), 'MMM d, yyyy')}
                            </span>
                        </div>
                    )}
                    <div className="flex items-center justify-between py-2">
                        <span className="text-slate-400">Total Reviews Created</span>
                        <span className="text-white font-medium">{totalReviews}</span>
                    </div>
                </div>
            </Card>

            {/* Progress Chart */}
            {totalReviews > 0 && (
                <Card>
                    <h2 className="text-xl font-semibold text-white mb-6">Review Progress</h2>
                    <CycleProgressChart
                        total={totalReviews}
                        completed={completedReviews}
                        pendingEmployee={pendingEmployee}
                        pendingManager={pendingManager}
                        completionRate={completionRate}
                    />
                </Card>
            )}

            {/* Recent Reviews */}
            {cycle.reviews.length > 0 && (
                <Card>
                    <h2 className="text-xl font-semibold text-white mb-6">Recent Reviews</h2>
                    <div className="space-y-3">
                        {cycle.reviews.slice(0, 10).map((review) => (
                            <Link
                                key={review.id}
                                href={`/reviews/${review.id}`}
                                className="flex items-center justify-between p-4 bg-slate-800/30 rounded-lg border border-slate-800 hover:border-cyan-500/50 transition-colors"
                            >
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-cyan-500 to-purple-500 flex items-center justify-center text-white font-medium">
                                        {review.employee.name.charAt(0)}
                                    </div>
                                    <div>
                                        <div className="text-white font-medium">{review.employee.name}</div>
                                        <div className="text-sm text-slate-400">
                                            {format(new Date(review.createdAt), 'MMM d, yyyy')}
                                        </div>
                                    </div>
                                </div>
                                <div>
                                    {review.status === 'COMPLETED' && (
                                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-500/10 text-green-400 border border-green-500/30">
                                            <CheckCircle2 className="w-3 h-3 mr-1" />
                                            Completed
                                        </span>
                                    )}
                                    {review.status === 'PENDING_EMPLOYEE' && (
                                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-500/10 text-blue-400 border border-blue-500/30">
                                            Pending Employee
                                        </span>
                                    )}
                                    {review.status === 'PENDING_MANAGER' && (
                                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-orange-500/10 text-orange-400 border border-orange-500/30">
                                            Pending Manager
                                        </span>
                                    )}
                                </div>
                            </Link>
                        ))}
                    </div>
                </Card>
            )}
        </div>
    );
}
