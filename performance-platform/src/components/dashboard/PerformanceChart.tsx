'use client';

import { Card } from '@/components/ui/Card';
import { motion } from 'framer-motion';
import { format } from 'date-fns';

interface ScoreData {
    date: string;
    score: number;
    templateTitle: string;
}

interface PerformanceChartProps {
    scores?: ScoreData[];
}

export default function PerformanceChart({ scores = [] }: PerformanceChartProps) {
    const maxValue = 4; // Our scale is 1-4

    // If no scores, show empty state
    if (scores.length === 0) {
        return (
            <Card>
                <h2 className="text-xl font-semibold text-purple-400 mb-6">Performance Trend</h2>
                <div className="text-center py-8">
                    <p className="text-slate-500 text-sm">No completed reviews yet</p>
                </div>
            </Card>
        );
    }

    // Get latest score and calculate average
    const latestScore = scores[0]?.score || 0;
    const avgScore = scores.length > 0
        ? scores.reduce((sum, s) => sum + s.score, 0) / scores.length
        : 0;

    // Determine score trend (comparing latest to average of previous)
    const isImproving = scores.length > 1 && latestScore > avgScore;

    return (
        <Card>
            <h2 className="text-xl font-semibold text-purple-400 mb-6">Performance Trend</h2>
            <div className="space-y-6">
                {/* Latest Score Highlight */}
                <div className="p-4 bg-slate-800/30 rounded-lg border border-purple-500/20">
                    <div className="flex justify-between items-center mb-2">
                        <span className="text-sm text-slate-400">Latest Score</span>
                        {scores.length > 1 && (
                            <span className={`text-xs px-2 py-1 rounded ${isImproving ? 'bg-green-500/20 text-green-300' : 'bg-slate-700 text-slate-400'}`}>
                                {isImproving ? '↑ Improving' : '→ Stable'}
                            </span>
                        )}
                    </div>
                    <div className="text-3xl font-bold text-purple-400">
                        {latestScore.toFixed(2)}
                    </div>
                    <div className="text-xs text-slate-500 mt-1">/ {maxValue}</div>
                </div>

                {/* Score History */}
                <div className="space-y-3">
                    <h3 className="text-sm font-semibold text-slate-300">Recent Reviews</h3>
                    {scores.slice(0, 5).map((scoreData, index) => {
                        const percentage = (scoreData.score / maxValue) * 100;
                        const colorClass =
                            scoreData.score >= 3.5 ? 'bg-green-500' :
                            scoreData.score >= 2.5 ? 'bg-purple-500' :
                            scoreData.score >= 1.5 ? 'bg-orange-500' : 'bg-red-500';

                        return (
                            <div key={index}>
                                <div className="flex justify-between text-xs mb-2">
                                    <span className="text-slate-400">
                                        {format(new Date(scoreData.date), 'MMM d, yyyy')}
                                    </span>
                                    <span className="text-white font-medium">
                                        {scoreData.score.toFixed(2)}
                                    </span>
                                </div>
                                <div className="w-full bg-slate-800/50 h-2 rounded-full overflow-hidden">
                                    <motion.div
                                        className={`${colorClass} h-full rounded-full`}
                                        initial={{ width: 0 }}
                                        animate={{ width: `${percentage}%` }}
                                        transition={{ duration: 0.8, delay: index * 0.1, ease: 'easeOut' }}
                                    />
                                </div>
                                <div className="text-xs text-slate-500 mt-1 truncate">
                                    {scoreData.templateTitle}
                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* Average Score */}
                {scores.length > 1 && (
                    <div className="pt-4 border-t border-slate-700">
                        <div className="flex justify-between items-center">
                            <span className="text-sm text-slate-400">Average Score</span>
                            <span className="text-lg font-semibold text-cyan-400">
                                {avgScore.toFixed(2)} / {maxValue}
                            </span>
                        </div>
                    </div>
                )}
            </div>
        </Card>
    );
}
