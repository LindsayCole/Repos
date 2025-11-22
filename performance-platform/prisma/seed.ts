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

    console.log({ hr, manager, employee, template })
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
