import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

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

        // Header
        doc.setFillColor(15, 23, 42); // Slate 900
        doc.rect(0, 0, 210, 40, 'F');

        doc.setTextColor(255, 255, 255);
        doc.setFontSize(24);
        doc.text('Performance Review', 20, 25);

        doc.setFontSize(10);
        doc.setTextColor(148, 163, 184); // Slate 400
        doc.text(`Generated on ${new Date().toLocaleDateString()}`, 20, 35);

        let yPosition = 50;

        // Review Details Table
        (doc as any).autoTable({
            startY: yPosition,
            head: [['Review Details', '']],
            body: [
                ['Employee', review.employee.name],
                ['Manager', review.manager.name],
                ['Review Cycle', review.template.title],
                ['Status', review.status],
                ['Completion Date', review.updatedAt.toLocaleDateString()],
            ],
            theme: 'grid',
            headStyles: { fillColor: [6, 182, 212] }, // Cyan 500
            styles: { fontSize: 10, cellPadding: 5 },
            columnStyles: { 0: { fontStyle: 'bold', width: 50 } },
        });

        yPosition = (doc as any).lastAutoTable.finalY + 15;

        // Sections
        review.template.sections.forEach(section => {
            // Section Title
            doc.setTextColor(6, 182, 212); // Cyan 500
            doc.setFontSize(16);
            doc.text(section.title, 20, yPosition);
            yPosition += 10;

            const tableBody = section.questions.map(question => {
                const response = review.responses.find(r => r.questionId === question.id);
                return [
                    question.text,
                    response?.selfRating || '-',
                    response?.selfComment || '-',
                    response?.managerRating || '-',
                    response?.managerComment || '-'
                ];
            });

            (doc as any).autoTable({
                startY: yPosition,
                head: [['Question', 'Self Rating', 'Self Comment', 'Mgr Rating', 'Mgr Comment']],
                body: tableBody,
                theme: 'striped',
                headStyles: { fillColor: [15, 23, 42] }, // Slate 900
                styles: { fontSize: 9, cellPadding: 3, overflow: 'linebreak' },
                columnStyles: {
                    0: { width: 60 },
                    1: { width: 20, halign: 'center' },
                    2: { width: 45 },
                    3: { width: 20, halign: 'center' },
                    4: { width: 45 }
                },
            });

            yPosition = (doc as any).lastAutoTable.finalY + 15;

            // Add page if needed
            if (yPosition > 250) {
                doc.addPage();
                yPosition = 20;
            }
        });

        // Summary / Sign-off area
        if (yPosition > 220) {
            doc.addPage();
            yPosition = 20;
        }

        yPosition += 10;
        doc.setDrawColor(148, 163, 184);
        doc.line(20, yPosition, 90, yPosition); // Employee Sig
        doc.line(120, yPosition, 190, yPosition); // Manager Sig

        doc.setFontSize(10);
        doc.setTextColor(100);
        doc.text('Employee Signature', 20, yPosition + 5);
        doc.text('Manager Signature', 120, yPosition + 5);

        // Generate PDF buffer
        const pdfBuffer = Buffer.from(doc.output('arraybuffer'));

        return new NextResponse(pdfBuffer, {
            headers: {
                'Content-Type': 'application/pdf',
                'Content-Disposition': `attachment; filename="${review.employee.name.replace(/\s+/g, '_')}_Review.pdf"`,
            },
        });
    } catch (error) {
        console.error('Error generating PDF:', error);
        return NextResponse.json({ error: 'Failed to generate PDF' }, { status: 500 });
    }
}
