import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import jsPDF from 'jspdf';

export async function GET(request: NextRequest) {
    const searchParams = request.nextUrl.searchParams;
    const reviewId = searchParams.get('reviewId');

    if (!reviewId) {
        return NextResponse.json({ error: 'Review ID required' }, { status: 400 });
    }

    try {
        // Fetch review with all related data
        const review = await prisma.performanceReview.findUnique({
            where: { id: reviewId },
            include: {
                employee: true,
                manager: true,
                template: {
                    include: {
                        sections: {
                            include: {
                                questions: {
                                    orderBy: { order: 'asc' },
                                },
                            },
                            orderBy: { order: 'asc' },
                        },
                    },
                },
                responses: {
                    include: {
                        question: true,
                    },
                },
            },
        });

        if (!review) {
            return NextResponse.json({ error: 'Review not found' }, { status: 404 });
        }

        // Create PDF
        const doc = new jsPDF();
        let yPosition = 20;

        // Title
        doc.setFontSize(20);
        doc.text('Performance Review Report', 20, yPosition);
        yPosition += 15;

        // Employee info
        doc.setFontSize(12);
        doc.text(`Employee: ${review.employee.name}`, 20, yPosition);
        yPosition += 7;
        doc.text(`Manager: ${review.manager.name}`, 20, yPosition);
        yPosition += 7;
        doc.text(`Review: ${review.template.title}`, 20, yPosition);
        yPosition += 7;
        doc.text(`Status: ${review.status}`, 20, yPosition);
        yPosition += 15;

        // Sections and questions
        review.template.sections.forEach(section => {
            // Section header
            doc.setFontSize(14);
            doc.text(section.title, 20, yPosition);
            yPosition += 10;

            section.questions.forEach(question => {
                const response = review.responses.find(r => r.questionId === question.id);

                // Question
                doc.setFontSize(10);
                doc.text(question.text, 25, yPosition);
                yPosition += 6;

                if (response) {
                    // Self rating
                    doc.setFontSize(9);
                    doc.text(`Self Rating: ${response.selfRating || 'N/A'}`, 30, yPosition);
                    yPosition += 5;
                    if (response.selfComment) {
                        const commentLines = doc.splitTextToSize(`Self Comment: ${response.selfComment}`, 150);
                        doc.text(commentLines, 30, yPosition);
                        yPosition += commentLines.length * 5;
                    }

                    // Manager rating
                    doc.text(`Manager Rating: ${response.managerRating || 'N/A'}`, 30, yPosition);
                    yPosition += 5;
                    if (response.managerComment) {
                        const commentLines = doc.splitTextToSize(`Manager Comment: ${response.managerComment}`, 150);
                        doc.text(commentLines, 30, yPosition);
                        yPosition += commentLines.length * 5;
                    }
                }

                yPosition += 5;

                // Check if we need a new page
                if (yPosition > 270) {
                    doc.addPage();
                    yPosition = 20;
                }
            });

            yPosition += 5;
        });

        // Generate PDF buffer
        const pdfBuffer = Buffer.from(doc.output('arraybuffer'));

        return new NextResponse(pdfBuffer, {
            headers: {
                'Content-Type': 'application/pdf',
                'Content-Disposition': `attachment; filename="${review.employee.name}_${review.template.title}_Review.pdf"`,
            },
        });
    } catch (error) {
        console.error('Error generating PDF:', error);
        return NextResponse.json({ error: 'Failed to generate PDF' }, { status: 500 });
    }
}
