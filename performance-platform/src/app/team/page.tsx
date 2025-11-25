import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { getCurrentUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import PerformanceChart from '@/components/dashboard/PerformanceChart';

export default async function TeamPage() {
    const user = await getCurrentUser();

    if (!user || (user.role !== 'MANAGER' && user.role !== 'HR')) {
        redirect('/dashboard');
    }

    // Fetch employees based on role
    const whereClause = user.role === 'HR' ? {} : { managerId: user.id };

    const employees = await prisma.user.findMany({
        where: whereClause,
        include: {
            reviewsAsEmployee: {
                include: {
                    template: true,
                },
                orderBy: { createdAt: 'desc' },
            },
        },
    });

    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-3xl font-bold text-foreground mb-2">My Team</h1>
                <p className="text-muted-foreground">Overview of your direct reports and their performance.</p>
            </div>

            {employees.length === 0 ? (
                <Card>
                    <p className="text-muted-foreground text-center py-8">No direct reports found.</p>
                </Card>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {employees.map(employee => {
                        const completedReviews = employee.reviewsAsEmployee.filter(r => r.status === 'COMPLETED');
                        const pendingReviews = employee.reviewsAsEmployee.filter(r => r.status === 'PENDING_MANAGER');

                        return (
                            <Card key={employee.id} className="space-y-4">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <h3 className="text-xl font-semibold text-foreground">{employee.name}</h3>
                                        <p className="text-sm text-muted-foreground">{employee.email}</p>
                                        {employee.department && (
                                            <p className="text-xs text-muted-foreground mt-1">{employee.department}</p>
                                        )}
                                    </div>
                                    <div className="text-right">
                                        <div className="text-2xl font-bold text-primary">{completedReviews.length}</div>
                                        <div className="text-xs text-muted-foreground">Completed Reviews</div>
                                    </div>
                                </div>

                                {pendingReviews.length > 0 && (
                                    <div className="p-3 bg-orange-500/10 border border-orange-500/20 rounded-lg">
                                        <p className="text-sm text-orange-600 dark:text-orange-400">
                                            {pendingReviews.length} review{pendingReviews.length > 1 ? 's' : ''} awaiting your input
                                        </p>
                                    </div>
                                )}

                                <div className="pt-4 border-t border-border">
                                    <h4 className="text-sm font-semibold text-foreground mb-3">Recent Reviews</h4>
                                    {employee.reviewsAsEmployee.length === 0 ? (
                                        <p className="text-xs text-muted-foreground">No reviews yet</p>
                                    ) : (
                                        <div className="space-y-2">
                                            {employee.reviewsAsEmployee.slice(0, 3).map(review => (
                                                <Link key={review.id} href={`/reviews/${review.id}`}>
                                                    <div className="flex justify-between items-center p-2 bg-secondary/50 rounded hover:bg-secondary transition-colors">
                                                        <span className="text-sm text-foreground">{review.template.title}</span>
                                                        <span className={`text-xs px-2 py-1 rounded ${review.status === 'COMPLETED' ? 'bg-green-500/10 text-green-600 dark:text-green-400' :
                                                            review.status === 'PENDING_MANAGER' ? 'bg-orange-500/10 text-orange-600 dark:text-orange-400' :
                                                                'bg-blue-500/10 text-blue-600 dark:text-blue-400'
                                                            }`}>
                                                            {review.status.replace('_', ' ')}
                                                        </span>
                                                    </div>
                                                </Link>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                <PerformanceChart userId={employee.id} />
                            </Card>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
