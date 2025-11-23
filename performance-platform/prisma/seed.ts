import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient({})

async function main() {
    // 1. Create Users (HR, Manager, Employee)
    const hr = await prisma.user.upsert({
        where: { email: 'hr@example.com' },
        update: {},
        create: {
            email: 'hr@example.com',
            name: 'HR Admin',
            role: 'HR',
        },
    })

    const manager = await prisma.user.upsert({
        where: { email: 'manager@example.com' },
        update: {},
        create: {
            email: 'manager@example.com',
            name: 'Manager Mike',
            role: 'MANAGER',
        },
    })

    const employee = await prisma.user.upsert({
        where: { email: 'employee@example.com' },
        update: {},
        create: {
            email: 'employee@example.com',
            name: 'Employee Emma',
            role: 'EMPLOYEE',
            managerId: manager.id,
        },
    })

    // 2. Create Form Template
    const template = await prisma.formTemplate.create({
        data: {
            title: 'Annual Performance Review 2025',
            description: 'Standard annual review for all staff.',
            createdById: hr.id,
            sections: {
                create: [
                    {
                        title: 'Behaviour',
                        order: 1,
                        questions: {
                            create: [
                                { text: 'Always open and willing to help others with new organizational structures, procedures and technology.', order: 1 },
                                { text: 'Comes to work each day with a can-do attitude and enjoys the chance to turn barriers into opportunities by creatively finding solutions to problems.', order: 2 },
                                { text: 'Provides clear, concise and respectful answers to inquiries from patients, team members and other departments. Is a willing and active participant in helping to resolve conflict.', order: 3 },
                                { text: 'Behaves courteously to calmly acknowledge the concerns of clients who may be hostile, rude, confused and/or frustrated.', order: 4 },
                                { text: 'Provides a great customer experience for client visits for all medical procedures.', order: 5 },
                                { text: 'Not afraid to ask for help when overwhelmed or as needed.', order: 6 },
                                { text: 'Creates an environment where colleagues feel valued, included, and heard.', order: 7 },
                                { text: 'Actively contributes to team discussions and decision-making.', order: 8 },
                            ]
                        }
                    },
                    {
                        title: 'Results',
                        order: 2,
                        questions: {
                            create: [
                                { text: 'Understands work deadlines and consistently organizes workflow to ensure they are met.', order: 1 },
                                { text: 'Updates internal spreadsheets and scheduling programs with up-to-date information on patients.', order: 2 },
                                { text: 'Meets established individual goals and team performance targets.', order: 3 },
                                { text: 'Uses time, tools and resources effectively and efficiently to maximize output.', order: 4 },
                                { text: 'I have gained new skills or knowledge this year.', order: 5 },
                                { text: 'Anticipates delays and communicates proactively to manage expectations.', order: 6 },
                                { text: 'Follows through on action items without requiring reminders or oversight.', order: 7 },
                                { text: 'Continuously seeks ways to achieve better performance outcomes.', order: 8 },
                            ]
                        }
                    }
                ]
            }
        }
    })

    // 3. Create Sample Goals
    const goal1 = await prisma.goal.create({
        data: {
            title: 'Complete Advanced TypeScript Course',
            description: 'Enhance technical skills by completing an advanced TypeScript certification course to improve code quality and maintainability.',
            status: 'IN_PROGRESS',
            progress: 65,
            targetDate: new Date('2025-12-31'),
            userId: employee.id,
            managerId: manager.id,
        },
    })

    const goal2 = await prisma.goal.create({
        data: {
            title: 'Lead Q2 Project Initiative',
            description: 'Take ownership of the Q2 customer dashboard redesign project from planning through deployment.',
            status: 'NOT_STARTED',
            progress: 0,
            targetDate: new Date('2025-06-30'),
            userId: employee.id,
            managerId: manager.id,
        },
    })

    const goal3 = await prisma.goal.create({
        data: {
            title: 'Improve Code Review Turnaround Time',
            description: 'Reduce average code review response time from 24 hours to under 8 hours to improve team velocity.',
            status: 'COMPLETED',
            progress: 100,
            targetDate: new Date('2025-03-31'),
            completionDate: new Date('2025-03-15'),
            userId: employee.id,
            managerId: manager.id,
        },
    })

    // 4. Create a Goal Update (progress history)
    await prisma.goalUpdate.create({
        data: {
            goalId: goal1.id,
            oldProgress: 45,
            newProgress: 65,
            note: 'Completed modules 5-8. Working on final project now.',
            createdById: employee.id,
        },
    })

    // 5. Create Review Cycle (Annual)
    const reviewCycle = await prisma.reviewCycle.create({
        data: {
            name: '2025 Annual Performance Review Cycle',
            description: 'Annual performance reviews for all employees across the organization.',
            frequency: 'ANNUAL',
            startDate: new Date('2025-01-01'),
            nextRunDate: new Date('2026-01-01'),
            templateId: template.id,
            isActive: true,
            includeAllUsers: true,
        },
    })

    // 6. Create Quarterly Review Cycle
    const quarterlyReviewCycle = await prisma.reviewCycle.create({
        data: {
            name: 'Q1 2025 Quarterly Check-ins',
            description: 'Lightweight quarterly performance check-ins for engineering department.',
            frequency: 'QUARTERLY',
            startDate: new Date('2025-04-01'),
            nextRunDate: new Date('2025-07-01'),
            templateId: template.id,
            isActive: true,
            departments: JSON.stringify(['Engineering', 'Product']),
            includeAllUsers: false,
        },
    })

    console.log({
        hr,
        manager,
        employee,
        template,
        goal1,
        goal2,
        goal3,
        reviewCycle,
        quarterlyReviewCycle
    })
}

main()
    .then(async () => {
        await prisma.$disconnect()
    })
    .catch(async (e) => {
        console.error(e)
        await prisma.$disconnect()
        process.exit(1)
    })
