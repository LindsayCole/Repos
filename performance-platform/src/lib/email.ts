import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY || 'mock_key'); // Use mock key if not set

interface EmailParams {
    to: string;
    subject: string;
    html: string;
}

export async function sendEmail({ to, subject, html }: EmailParams) {
    if (process.env.RESEND_API_KEY) {
        try {
            const { data, error } = await resend.emails.send({
                from: 'Performance Platform <onboarding@resend.dev>', // Replace with your domain
                to,
                subject,
                html,
            });

            if (error) {
                console.error('Resend Error:', error);
                return { success: false, error };
            }
            console.log('Email sent:', data);
            return { success: true, data };
        } catch (error) {
            console.error('Send Email Error:', error);
            return { success: false, error };
        }
    } else {
        console.log('--- MOCK EMAIL ---');
        console.log('To:', to);
        console.log('Subject:', subject);
        console.log('HTML:', html);
        console.log('--- END MOCK EMAIL ---');
        return { success: true, data: { id: 'mock_id' } };
    }
}

// Email Templates
export const reviewAssignedEmail = (employeeName: string, reviewTitle: string) => ({
    subject: `New Performance Review Assigned: ${reviewTitle}`,
    html: `<p>Hi ${employeeName},</p><p>A new performance review, "${reviewTitle}", has been assigned to you. Please log in to complete your self-evaluation.</p>`,
});

export const selfEvalSubmittedEmail = (employeeName: string, managerName: string, reviewTitle: string) => ({
    subject: `Self-Evaluation Submitted by ${employeeName} for ${reviewTitle}`,
    html: `<p>Hi ${managerName},</p><p>${employeeName} has submitted their self-evaluation for the "${reviewTitle}" review. Please log in to complete the manager review.</p>`,
});

export const reviewCompletedEmail = (employeeName: string, managerName: string, reviewTitle: string) => ({
    subject: `Performance Review Completed for ${employeeName}`,
    html: `<p>Hi ${employeeName} and ${managerName},</p><p>The performance review "${reviewTitle}" for ${employeeName} has been completed by ${managerName}.</p>`,
});

// Goal Email Templates
export const goalCreatedEmail = (employeeName: string, managerName: string, goalTitle: string) => ({
    subject: `New Goal Created: ${goalTitle}`,
    html: `<p>Hi ${managerName},</p><p>${employeeName} has created a new goal: "${goalTitle}". You can track their progress in the Performance Platform.</p>`,
});

export const goalCompletedEmail = (employeeName: string, managerName: string, goalTitle: string) => ({
    subject: `Goal Completed: ${goalTitle}`,
    html: `<p>Hi ${employeeName} and ${managerName},</p><p>Congratulations! The goal "${goalTitle}" has been marked as completed. Great work!</p>`,
});

export const goalMilestoneEmail = (employeeName: string, managerName: string, goalTitle: string, milestone: number) => ({
    subject: `Goal Milestone Reached: ${milestone}% - ${goalTitle}`,
    html: `<p>Hi ${managerName},</p><p>${employeeName} has reached ${milestone}% progress on their goal: "${goalTitle}". Keep up the great work!</p>`,
});
