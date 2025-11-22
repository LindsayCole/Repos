import { auth } from "@/auth";
import { prisma } from '@/lib/prisma';

export async function getCurrentUser() {
    const session = await auth();

    if (!session?.user?.id) return null;

    const user = await prisma.user.findUnique({
        where: { id: session.user.id },
        include: {
            manager: true,
            employees: true,
        }
    });

    return user;
}
