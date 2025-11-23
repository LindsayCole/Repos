import { getCurrentUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { UI_TEXT } from '@/lib/constants';
import { redirect } from 'next/navigation';
import { TeamPageClient } from '@/components/team/TeamPageClient';

export default async function TeamPage() {
    const user = await getCurrentUser();

    if (!user || user.role !== 'MANAGER') {
        redirect('/dashboard');
    }

    // Fetch all employees under this manager
    const employees = await prisma.user.findMany({
        where: { managerId: user.id },
        include: {
            reviewsAsEmployee: {
                include: {
                    template: true,
                    actionItems: {
                        where: {
                            status: {
                                in: ['PENDING', 'IN_PROGRESS']
                            }
                        }
                    }
                },
                orderBy: { createdAt: 'desc' },
            },
        },
    });

    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-4xl font-bold text-white mb-2">{UI_TEXT.TEAM_TITLE}</h1>
                <p className="text-slate-400">{UI_TEXT.TEAM_SUBTITLE}</p>
            </div>

            <TeamPageClient employees={employees} />
        </div>
    );
}
