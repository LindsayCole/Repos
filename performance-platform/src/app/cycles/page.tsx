import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { getCurrentUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { Plus, Calendar, Repeat, Users } from 'lucide-react';
import CycleCard from '@/components/cycles/CycleCard';

export default async function CyclesPage() {
    const user = await getCurrentUser();

    if (!user) {
        redirect('/login');
    }

    // Only HR can access this page
    if (user.role !== 'HR') {
        redirect('/dashboard');
    }

    // Fetch all review cycles
    const cycles = await prisma.reviewCycle.findMany({
        include: {
            template: true,
            reviews: {
                select: {
                    id: true,
                    status: true,
                },
            },
        },
        orderBy: [
            { isActive: 'desc' },
            { nextRunDate: 'asc' },
        ],
    });

    // Calculate stats
    const activeCycles = cycles.filter(c => c.isActive);
    const upcomingCycles = cycles.filter(c =>
        c.isActive && c.nextRunDate && new Date(c.nextRunDate) <= new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
    );

    return (
        <div className="space-y-8">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-4xl font-bold text-white mb-2">Review Cycles</h1>
                    <p className="text-slate-400">Automate performance reviews across your organization</p>
                </div>
                <Link href="/cycles/new">
                    <Button className="gap-2">
                        <Plus className="w-4 h-4" />
                        New Cycle
                    </Button>
                </Link>
            </div>

            {/* Stats Overview */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="space-y-2">
                    <div className="flex items-center gap-3">
                        <div className="p-3 bg-blue-500/10 rounded-lg">
                            <Repeat className="w-6 h-6 text-blue-400" />
                        </div>
                        <div>
                            <div className="text-sm text-slate-400">Active Cycles</div>
                            <div className="text-2xl font-bold text-white">{activeCycles.length}</div>
                        </div>
                    </div>
                </Card>

                <Card className="space-y-2">
                    <div className="flex items-center gap-3">
                        <div className="p-3 bg-orange-500/10 rounded-lg">
                            <Calendar className="w-6 h-6 text-orange-400" />
                        </div>
                        <div>
                            <div className="text-sm text-slate-400">Due in 30 Days</div>
                            <div className="text-2xl font-bold text-white">{upcomingCycles.length}</div>
                        </div>
                    </div>
                </Card>

                <Card className="space-y-2">
                    <div className="flex items-center gap-3">
                        <div className="p-3 bg-green-500/10 rounded-lg">
                            <Users className="w-6 h-6 text-green-400" />
                        </div>
                        <div>
                            <div className="text-sm text-slate-400">Total Cycles</div>
                            <div className="text-2xl font-bold text-white">{cycles.length}</div>
                        </div>
                    </div>
                </Card>
            </div>

            {/* Cycles List */}
            <div className="space-y-4">
                <h2 className="text-xl font-semibold text-white">All Review Cycles</h2>

                {cycles.length === 0 ? (
                    <Card className="p-12 text-center border border-dashed border-slate-800">
                        <div className="inline-flex p-4 bg-slate-800/30 rounded-full mb-4">
                            <Repeat className="w-8 h-8 text-slate-500" />
                        </div>
                        <h3 className="text-lg font-medium text-white mb-2">No review cycles yet</h3>
                        <p className="text-slate-400 mb-6">
                            Create your first automated review cycle to streamline performance management
                        </p>
                        <Link href="/cycles/new">
                            <Button className="gap-2">
                                <Plus className="w-4 h-4" />
                                Create Your First Cycle
                            </Button>
                        </Link>
                    </Card>
                ) : (
                    <div className="grid grid-cols-1 gap-4">
                        {cycles.map((cycle) => (
                            <CycleCard key={cycle.id} cycle={cycle} />
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
