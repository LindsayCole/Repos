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
                    <h2 className="text-2xl font-semibold text-cyan-400 border-b border-slate-800 pb-2">
                        {section.title}
                    </h2>

                    {section.questions.map((question: any) => {
                        const existingResponse = review.responses.find((r: any) => r.questionId === question.id);
                        const currentRating = responses[question.id]?.rating || (mode === 'MANAGER' ? existingResponse?.managerRating : existingResponse?.selfRating);
                        const currentComment = responses[question.id]?.comment || (mode === 'MANAGER' ? existingResponse?.managerComment : existingResponse?.selfComment);

                        return (
                            <Card key={question.id} className="space-y-4 transition-colors hover:bg-slate-900/80">
                                <div className="space-y-2">
                                    <p className="text-lg text-slate-200">{question.text}</p>
                                    {question.helpText && <p className="text-sm text-slate-500">{question.helpText}</p>}
                                </div>

                                {mode !== 'VIEW' ? (
                                    <div className="space-y-4 pt-4">
                                        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                                            {ratings.map((r) => (
                                                <button
                                                    key={r.value}
                                                    onClick={() => handleRatingChange(question.id, r.value)}
                                                    className={`
                            p-3 rounded-lg text-sm font-medium transition-all duration-200
                            ${currentRating === r.value
                                                            ? 'bg-cyan-500 text-slate-950 shadow-[0_0_15px_rgba(6,182,212,0.4)]'
                                                            : 'bg-slate-800 text-slate-400 hover:bg-slate-700'}
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
                                            className="w-full bg-slate-950/50 border border-slate-800 rounded-lg p-3 text-slate-300 focus:outline-none focus:border-cyan-500/50 transition-colors min-h-[100px]"
                                        />
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-2 gap-4 pt-4 text-sm">
                                        <div className="p-3 bg-slate-950/30 rounded-lg">
                                            <span className="block text-slate-500 mb-1">Self Rating</span>
                                            <span className="text-cyan-400 font-medium">
                                                {ratings.find(r => r.value === existingResponse?.selfRating)?.label || '-'}
                                            </span>
                                            {existingResponse?.selfComment && (
                                                <p className="mt-2 text-slate-300 italic">"{existingResponse.selfComment}"</p>
                                            )}
                                        </div>
                                        <div className="p-3 bg-slate-950/30 rounded-lg">
                                            <span className="block text-slate-500 mb-1">Manager Rating</span>
                                            <span className="text-purple-400 font-medium">
                                                {ratings.find(r => r.value === existingResponse?.managerRating)?.label || '-'}
                                            </span>
                                            {existingResponse?.managerComment && (
                                                <p className="mt-2 text-slate-300 italic">"{existingResponse.managerComment}"</p>
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
                                    <div className="bg-slate-900/90 border border-red-500/50 text-red-400 px-4 py-2 rounded-lg text-sm backdrop-blur-md shadow-xl mb-2">
                                        Please answer all {totalQuestions} questions ({answeredQuestions}/{totalQuestions} completed)
                                    </div>
                                )}
                                <Button
                                    size="lg"
                                    onClick={handleSubmit}
                                    disabled={submitting || !isComplete}
                                    className={`shadow-2xl transition-all ${isComplete ? 'shadow-cyan-500/20' : 'opacity-50 cursor-not-allowed'}`}
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
