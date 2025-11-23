import { Card } from '@/components/ui/Card';
import { getCurrentUser } from '@/lib/auth';
import { redirect } from 'next/navigation';
import GoalForm from '@/components/goals/GoalForm';
import { ChevronLeft } from 'lucide-react';
import Link from 'next/link';

export default async function NewGoalPage() {
    const user = await getCurrentUser();

    if (!user) {
        redirect('/login');
    }

    return (
        <div className="max-w-3xl mx-auto space-y-8">
            <Link
                href="/goals"
                className="inline-flex items-center gap-2 text-slate-400 hover:text-white transition-colors"
            >
                <ChevronLeft className="w-4 h-4" />
                Back to Goals
            </Link>

            <div>
                <h1 className="text-4xl font-bold text-white mb-2">Create New Goal</h1>
                <p className="text-slate-400">
                    Set a clear objective and track your progress toward achieving it
                </p>
            </div>

            <Card>
                <GoalForm userId={user.id} managerId={user.managerId || undefined} />
            </Card>
        </div>
    );
}
