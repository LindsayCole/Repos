'use client';

import { submitEmployeeReview, submitManagerReview } from '@/app/actions/reviews';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { motion } from 'framer-motion';
import { useState } from 'react';

type Props = {
    review: any;
    mode: 'EMPLOYEE' | 'MANAGER' | 'VIEW';
    user: any;
};

export default function ReviewForm({ review, mode, user }: Props) {
    const [responses, setResponses] = useState<Record<string, { rating: number, comment: string }>>({});
    const [submitting, setSubmitting] = useState(false);

    // Initialize responses from existing data if any
    // ... (omitted for brevity, would map review.responses)

    const handleRatingChange = (questionId: string, rating: number) => {
        setResponses(prev => ({
            ...prev,
            [questionId]: { ...prev[questionId], rating }
        }));
    };

    const handleCommentChange = (questionId: string, comment: string) => {
        setResponses(prev => ({
            ...prev,
            [questionId]: { ...prev[questionId], comment }
        }));
    };

    const handleSubmit = async () => {
        setSubmitting(true);
        try {
            if (mode === 'EMPLOYEE') {
                await submitEmployeeReview(review.id, responses);
            } else if (mode === 'MANAGER') {
                await submitManagerReview(review.id, responses);
            }
        } catch (error) {
            console.error(error);
            setSubmitting(false);
        }
    };

    const ratings = [
        { value: 1, label: 'Met Some' },
        { value: 2, label: 'Fully Met' },
        { value: 3, label: 'Exceeded' },
        { value: 4, label: 'Significantly Exceeded' },
    ];

    return (
        <div className="space-y-8 pb-20">
            {review.template.sections.map((section: any) => (
                <div key={section.id} className="space-y-6">
                    <h2 className="text-2xl font-semibold text-primary border-b border-border pb-2">
                        {section.title}
                    </h2>

                    {section.questions.map((question: any) => {
                        const existingResponse = review.responses.find((r: any) => r.questionId === question.id);
                        const currentRating = responses[question.id]?.rating || (mode === 'MANAGER' ? existingResponse?.managerRating : existingResponse?.selfRating);
                        const currentComment = responses[question.id]?.comment || (mode === 'MANAGER' ? existingResponse?.managerComment : existingResponse?.selfComment);

                        return (
                            <Card key={question.id} className="space-y-4 transition-colors hover:bg-accent/50">
                                <div className="space-y-2">
                                    <p className="text-lg text-foreground">{question.text}</p>
                                    {question.helpText && <p className="text-sm text-muted-foreground">{question.helpText}</p>}
                                </div>

                                {mode !== 'VIEW' ? (
                                    <div className="space-y-4 pt-4">
                                        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                                            {ratings.map((r) => (
                                                <button
                                                    key={r.value}
                                                    onClick={() => handleRatingChange(question.id, r.value)}
                                                    className={`
                            p-3 rounded-md text-sm font-medium transition-all duration-200 border
                            ${currentRating === r.value
                                                            ? 'bg-primary text-primary-foreground border-primary shadow-sm'
                                                            : 'bg-background text-muted-foreground border-input hover:bg-accent hover:text-accent-foreground'}
                          `}
                                                >
                                                    {r.label}
                                                </button>
                                            ))}
                                        </div>

                                        <textarea
                                            value={currentComment || ''}
                                            onChange={(e) => handleCommentChange(question.id, e.target.value)}
                                            placeholder="Add comments or examples..."
                                            className="w-full bg-background border border-input rounded-md p-3 text-foreground focus:outline-none focus:ring-2 focus:ring-ring transition-colors min-h-[100px]"
                                        />
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-2 gap-4 pt-4 text-sm">
                                        <div className="p-3 bg-secondary/50 rounded-lg">
                                            <span className="block text-muted-foreground mb-1">Self Rating</span>
                                            <span className="text-primary font-medium">
                                                {ratings.find(r => r.value === existingResponse?.selfRating)?.label || '-'}
                                            </span>
                                            {existingResponse?.selfComment && (
                                                <p className="mt-2 text-foreground italic">"{existingResponse.selfComment}"</p>
                                            )}
                                        </div>
                                        <div className="p-3 bg-secondary/50 rounded-lg">
                                            <span className="block text-muted-foreground mb-1">Manager Rating</span>
                                            <span className="text-primary font-medium">
                                                {ratings.find(r => r.value === existingResponse?.managerRating)?.label || '-'}
                                            </span>
                                            {existingResponse?.managerComment && (
                                                <p className="mt-2 text-foreground italic">"{existingResponse.managerComment}"</p>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </Card>
                        );
                    })}
                </div>
            ))}

            {mode !== 'VIEW' && (
                <div className="fixed bottom-8 right-8 z-50 flex flex-col items-end gap-2">
                    {(() => {
                        const totalQuestions = review.template.sections.reduce((acc: number, section: any) => acc + section.questions.length, 0);
                        const answeredQuestions = Object.values(responses).filter(r => r.rating > 0).length;
                        const isComplete = answeredQuestions === totalQuestions;

                        return (
                            <>
                                {!isComplete && (
                                    <div className="bg-destructive/10 border border-destructive/20 text-destructive px-4 py-2 rounded-lg text-sm backdrop-blur-md shadow-lg mb-2">
                                        Please answer all {totalQuestions} questions ({answeredQuestions}/{totalQuestions} completed)
                                    </div>
                                )}
                                <Button
                                    size="lg"
                                    onClick={handleSubmit}
                                    disabled={submitting || !isComplete}
                                    className={`shadow-xl transition-all ${isComplete ? 'shadow-primary/20' : 'opacity-50 cursor-not-allowed'}`}
                                >
                                    {submitting ? 'Submitting...' : 'Submit Review'}
                                </Button>
                            </>
                        );
                    })()}
                </div>
            )}
        </div>
    );
}
