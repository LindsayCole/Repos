import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('🌱 Seeding Standard Performance Review Template...');

    // 1. Get the HR user to assign as creator
    const hrUser = await prisma.user.findFirst({
        where: { role: 'HR' }
    });

    if (!hrUser) {
        console.error('❌ No HR user found. Please run the main seed first.');
        return;
    }

    // 2. Create the Template
    const template = await prisma.formTemplate.create({
        data: {
            title: 'Quarterly Performance Review (Q4 2024)',
            description: 'Standard evaluation of Core Values, Key Results, and Leadership behaviors. Please rate each item on a scale of 1-4.',
            createdById: hrUser.id,
            sections: {
                create: [
                    {
                        title: 'Core Values & Behaviors',
                        order: 1,
                        questions: {
                            create: [
                                { text: 'Ownership: Takes responsibility for outcomes and proactively solves problems.', order: 1 },
                                { text: 'Collaboration: Works effectively with others and builds strong relationships.', order: 2 },
                                { text: 'Innovation: Suggests new ideas and improvements to existing processes.', order: 3 },
                                { text: 'Communication: Communicates clearly, concisely, and respectfully.', order: 4 }
                            ]
                        }
                    },
                    {
                        title: 'Key Results & Objectives',
                        order: 2,
                        questions: {
                            create: [
                                { text: 'Goal Achievement: Met or exceeded defined quarterly goals/OKRs.', order: 1 },
                                { text: 'Quality of Work: Delivers high-quality work with minimal errors.', order: 2 },
                                { text: 'Productivity: Manages time effectively and meets deadlines.', order: 3 }
                            ]
                        }
                    },
                    {
                        title: 'Leadership & Growth',
                        order: 3,
                        questions: {
                            create: [
                                { text: 'Mentorship: Actively helps peers grow and shares knowledge.', order: 1 },
                                { text: 'Adaptability: Handles change and ambiguity with resilience.', order: 2 },
                                { text: 'Strategic Thinking: Understands the broader business context of their work.', order: 3 }
                            ]
                        }
                    }
                ]
            }
        }
    });

    console.log(`✅ Created Template: ${template.title}`);
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
