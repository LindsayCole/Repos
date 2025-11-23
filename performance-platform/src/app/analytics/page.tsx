import { getCurrentUser } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { Card } from '@/components/ui/Card';
import MetricCard from '@/components/analytics/MetricCard';
import {
    getOverviewMetrics,
    getReviewStatusBreakdown,
    getReviewsByMonth,
    getScoresByDepartment,
    getTopPerformers,
    getTemplateUsage,
} from '@/app/actions/analytics';
import {
    BarChart3,
    Users,
    CheckCircle,
    TrendingUp,
    Calendar,
    Award,
    FileText,
    Download,
} from 'lucide-react';
import { Suspense } from 'react';
import TimeRangeSelector from '@/components/analytics/TimeRangeSelector';
import ExportButton from '@/components/analytics/ExportButton';

interface AnalyticsPageProps {
    searchParams: { timeRange?: string };
}

export default async function AnalyticsPage({ searchParams }: AnalyticsPageProps) {
    const user = await getCurrentUser();

    // HR only access
    if (!user || user.role !== 'HR') {
        redirect('/dashboard');
    }

    const timeRange = searchParams.timeRange || 'all';

    // Fetch all analytics data
    const [
        overviewMetrics,
        statusBreakdown,
        reviewsByMonth,
        scoresByDepartment,
        performers,
        templateUsage,
    ] = await Promise.all([
        getOverviewMetrics(timeRange),
        getReviewStatusBreakdown(),
        getReviewsByMonth(12),
        getScoresByDepartment(),
        getTopPerformers(5),
        getTemplateUsage(),
    ]);

    // Calculate trend direction
    const completionTrend =
        overviewMetrics.completionRate > overviewMetrics.previousPeriodCompletion
            ? 'up'
            : overviewMetrics.completionRate < overviewMetrics.previousPeriodCompletion
            ? 'down'
            : 'neutral';

    const scoreTrend =
        overviewMetrics.averageScore > overviewMetrics.previousPeriodScore
            ? 'up'
            : overviewMetrics.averageScore < overviewMetrics.previousPeriodScore
            ? 'down'
            : 'neutral';

    const completionChange =
        overviewMetrics.previousPeriodCompletion > 0
            ? Math.round(
                  ((overviewMetrics.completionRate - overviewMetrics.previousPeriodCompletion) /
                      overviewMetrics.previousPeriodCompletion) *
                      100
              )
            : 0;

    const scoreChange =
        overviewMetrics.previousPeriodScore > 0
            ? Math.round(
                  ((overviewMetrics.averageScore - overviewMetrics.previousPeriodScore) /
                      overviewMetrics.previousPeriodScore) *
                      100
              )
            : 0;

    return (
        <div className="space-y-8">
            {/* Header */}
            <div className="flex justify-between items-start">
                <div>
                    <h1 className="text-4xl font-bold text-white mb-2">Analytics & Reports</h1>
                    <p className="text-slate-400">
                        Comprehensive insights into performance review metrics and trends
                    </p>
                </div>
                <div className="flex gap-3">
                    <TimeRangeSelector currentRange={timeRange} />
                    <ExportButton />
                </div>
            </div>

            {/* Section 1: Overview Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <MetricCard
                    title="Total Reviews"
                    value={overviewMetrics.totalReviews}
                    icon={FileText}
                    colorScheme="cyan"
                />
                <MetricCard
                    title="Active Reviews"
                    value={overviewMetrics.activeReviews}
                    icon={Calendar}
                    colorScheme="purple"
                />
                <MetricCard
                    title="Completion Rate"
                    value={`${overviewMetrics.completionRate}%`}
                    change={completionChange}
                    trend={completionTrend}
                    icon={CheckCircle}
                    colorScheme="green"
                />
                <MetricCard
                    title="Average Score"
                    value={overviewMetrics.averageScore > 0 ? overviewMetrics.averageScore.toFixed(2) : '--'}
                    change={scoreChange}
                    trend={scoreTrend}
                    icon={TrendingUp}
                    colorScheme="orange"
                />
            </div>

            {/* Section 2: Review Status Breakdown */}
            <Card>
                <h2 className="text-2xl font-bold text-cyan-400 mb-6">Review Status Breakdown</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <StatusCard
                        label="Pending Employee"
                        count={statusBreakdown.pendingEmployee.count}
                        percentage={statusBreakdown.pendingEmployee.percentage}
                        color="orange"
                    />
                    <StatusCard
                        label="Pending Manager"
                        count={statusBreakdown.pendingManager.count}
                        percentage={statusBreakdown.pendingManager.percentage}
                        color="purple"
                    />
                    <StatusCard
                        label="Completed"
                        count={statusBreakdown.completed.count}
                        percentage={statusBreakdown.completed.percentage}
                        color="green"
                    />
                    <StatusCard
                        label="Overdue"
                        count={statusBreakdown.overdue.count}
                        percentage={statusBreakdown.overdue.percentage}
                        color="red"
                    />
                </div>
            </Card>

            {/* Section 3: Reviews Over Time */}
            <Card>
                <h2 className="text-2xl font-bold text-cyan-400 mb-6">Reviews Over Time</h2>
                <ReviewsChart data={reviewsByMonth} />
            </Card>

            {/* Section 4: Scores by Department */}
            <Card>
                <h2 className="text-2xl font-bold text-cyan-400 mb-6">Scores by Department</h2>
                <DepartmentScoresTable departments={scoresByDepartment} />
            </Card>

            {/* Section 5: Top/Bottom Performers */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                    <h2 className="text-2xl font-bold text-green-400 mb-6 flex items-center gap-2">
                        <Award className="text-green-400" />
                        Top Performers
                    </h2>
                    <PerformersTable performers={performers.top} type="top" />
                </Card>
                <Card>
                    <h2 className="text-2xl font-bold text-orange-400 mb-6 flex items-center gap-2">
                        <TrendingUp className="text-orange-400" />
                        Improvement Opportunities
                    </h2>
                    <PerformersTable performers={performers.bottom} type="bottom" />
                </Card>
            </div>

            {/* Section 6: Template Usage */}
            <Card>
                <h2 className="text-2xl font-bold text-cyan-400 mb-6">Template Usage Statistics</h2>
                <TemplateUsageTable templates={templateUsage} />
            </Card>
        </div>
    );
}

// Status Card Component
function StatusCard({
    label,
    count,
    percentage,
    color,
}: {
    label: string;
    count: number;
    percentage: number;
    color: 'green' | 'orange' | 'purple' | 'red';
}) {
    const colorClasses = {
        green: {
            bg: 'bg-green-500/20',
            text: 'text-green-400',
            bar: 'bg-green-500',
        },
        orange: {
            bg: 'bg-orange-500/20',
            text: 'text-orange-400',
            bar: 'bg-orange-500',
        },
        purple: {
            bg: 'bg-purple-500/20',
            text: 'text-purple-400',
            bar: 'bg-purple-500',
        },
        red: {
            bg: 'bg-red-500/20',
            text: 'text-red-400',
            bar: 'bg-red-500',
        },
    };

    const colors = colorClasses[color];

    return (
        <div className={`p-6 rounded-xl ${colors.bg} border border-${color}-500/30`}>
            <div className="text-sm text-slate-400 mb-2">{label}</div>
            <div className={`text-3xl font-bold ${colors.text} mb-2`}>{count}</div>
            <div className="flex items-center gap-2">
                <div className="flex-1 bg-slate-700/50 h-2 rounded-full overflow-hidden">
                    <div className={`${colors.bar} h-full transition-all duration-500`} style={{ width: `${percentage}%` }}></div>
                </div>
                <span className="text-sm text-slate-400">{percentage}%</span>
            </div>
        </div>
    );
}

// Reviews Chart Component
function ReviewsChart({ data }: { data: { month: string; created: number; completed: number }[] }) {
    if (data.length === 0) {
        return (
            <div className="text-center py-12 text-slate-500">
                No data available for the selected time range
            </div>
        );
    }

    const maxValue = Math.max(...data.flatMap((d) => [d.created, d.completed]), 1);

    return (
        <div className="space-y-4">
            <div className="flex justify-end gap-6 text-sm">
                <div className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded bg-cyan-500"></div>
                    <span className="text-slate-400">Created</span>
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded bg-purple-500"></div>
                    <span className="text-slate-400">Completed</span>
                </div>
            </div>
            <div className="space-y-6">
                {data.map((item) => (
                    <div key={item.month} className="space-y-2">
                        <div className="text-sm text-slate-400 font-medium">{item.month}</div>
                        <div className="flex gap-2">
                            <div className="flex-1 space-y-1">
                                <div className="flex items-center gap-2">
                                    <div
                                        className="bg-cyan-500 h-8 rounded transition-all duration-500"
                                        style={{ width: `${(item.created / maxValue) * 100}%` }}
                                    ></div>
                                    <span className="text-sm text-cyan-400 font-medium min-w-[30px]">
                                        {item.created}
                                    </span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <div
                                        className="bg-purple-500 h-8 rounded transition-all duration-500"
                                        style={{ width: `${(item.completed / maxValue) * 100}%` }}
                                    ></div>
                                    <span className="text-sm text-purple-400 font-medium min-w-[30px]">
                                        {item.completed}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

// Department Scores Table Component
function DepartmentScoresTable({
    departments,
}: {
    departments: {
        department: string;
        employeeCount: number;
        avgScore: number;
        reviewsCompleted: number;
        completionRate: number;
    }[];
}) {
    if (departments.length === 0) {
        return <div className="text-center py-12 text-slate-500">No department data available</div>;
    }

    const getScoreColor = (score: number) => {
        if (score >= 3.5) return 'text-green-400 bg-green-500/20';
        if (score >= 2.5) return 'text-purple-400 bg-purple-500/20';
        if (score >= 1.5) return 'text-orange-400 bg-orange-500/20';
        return 'text-red-400 bg-red-500/20';
    };

    return (
        <div className="overflow-x-auto">
            <table className="w-full">
                <thead>
                    <tr className="border-b border-slate-800">
                        <th className="text-left py-3 px-4 text-sm font-semibold text-slate-400">Department</th>
                        <th className="text-center py-3 px-4 text-sm font-semibold text-slate-400">Employees</th>
                        <th className="text-center py-3 px-4 text-sm font-semibold text-slate-400">Avg Score</th>
                        <th className="text-center py-3 px-4 text-sm font-semibold text-slate-400">Reviews Completed</th>
                        <th className="text-center py-3 px-4 text-sm font-semibold text-slate-400">Completion Rate</th>
                    </tr>
                </thead>
                <tbody>
                    {departments.map((dept) => (
                        <tr key={dept.department} className="border-b border-slate-800/50 hover:bg-slate-800/30 transition-colors">
                            <td className="py-4 px-4 text-white font-medium">{dept.department}</td>
                            <td className="py-4 px-4 text-center text-slate-300">{dept.employeeCount}</td>
                            <td className="py-4 px-4 text-center">
                                <span className={`inline-block px-3 py-1 rounded-full font-semibold ${getScoreColor(dept.avgScore)}`}>
                                    {dept.avgScore > 0 ? dept.avgScore.toFixed(2) : '--'}
                                </span>
                            </td>
                            <td className="py-4 px-4 text-center text-slate-300">{dept.reviewsCompleted}</td>
                            <td className="py-4 px-4 text-center">
                                <div className="flex items-center justify-center gap-2">
                                    <div className="w-20 bg-slate-700 h-2 rounded-full overflow-hidden">
                                        <div
                                            className="bg-cyan-500 h-full transition-all duration-500"
                                            style={{ width: `${dept.completionRate}%` }}
                                        ></div>
                                    </div>
                                    <span className="text-sm text-slate-400 min-w-[45px]">{dept.completionRate}%</span>
                                </div>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}

// Performers Table Component
function PerformersTable({
    performers,
    type,
}: {
    performers: { id: string; name: string; department: string; avgScore: number; reviewCount: number }[];
    type: 'top' | 'bottom';
}) {
    if (performers.length === 0) {
        return <div className="text-center py-12 text-slate-500">No data available</div>;
    }

    const getScoreColor = (score: number) => {
        if (score >= 3.5) return 'text-green-400 bg-green-500/20';
        if (score >= 2.5) return 'text-purple-400 bg-purple-500/20';
        if (score >= 1.5) return 'text-orange-400 bg-orange-500/20';
        return 'text-red-400 bg-red-500/20';
    };

    return (
        <div className="space-y-3">
            {performers.map((performer, index) => (
                <div
                    key={performer.id}
                    className="flex items-center gap-4 p-4 bg-slate-800/30 rounded-lg hover:bg-slate-800/50 transition-colors"
                >
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${
                        type === 'top' ? 'bg-green-500/20 text-green-400' : 'bg-orange-500/20 text-orange-400'
                    }`}>
                        {index + 1}
                    </div>
                    <div className="flex-1">
                        <div className="text-white font-medium">{performer.name}</div>
                        <div className="text-sm text-slate-400">{performer.department}</div>
                    </div>
                    <div className="text-center">
                        <div className={`px-3 py-1 rounded-full font-semibold ${getScoreColor(performer.avgScore)}`}>
                            {performer.avgScore.toFixed(2)}
                        </div>
                        <div className="text-xs text-slate-500 mt-1">{performer.reviewCount} reviews</div>
                    </div>
                </div>
            ))}
        </div>
    );
}

// Template Usage Table Component
function TemplateUsageTable({
    templates,
}: {
    templates: {
        templateId: string;
        templateName: string;
        reviewsCreated: number;
        completionRate: number;
        avgScore: number;
    }[];
}) {
    if (templates.length === 0) {
        return <div className="text-center py-12 text-slate-500">No template usage data available</div>;
    }

    const getScoreColor = (score: number) => {
        if (score >= 3.5) return 'text-green-400 bg-green-500/20';
        if (score >= 2.5) return 'text-purple-400 bg-purple-500/20';
        if (score >= 1.5) return 'text-orange-400 bg-orange-500/20';
        return 'text-red-400 bg-red-500/20';
    };

    return (
        <div className="overflow-x-auto">
            <table className="w-full">
                <thead>
                    <tr className="border-b border-slate-800">
                        <th className="text-left py-3 px-4 text-sm font-semibold text-slate-400">Template Name</th>
                        <th className="text-center py-3 px-4 text-sm font-semibold text-slate-400">Reviews Created</th>
                        <th className="text-center py-3 px-4 text-sm font-semibold text-slate-400">Completion Rate</th>
                        <th className="text-center py-3 px-4 text-sm font-semibold text-slate-400">Avg Score</th>
                    </tr>
                </thead>
                <tbody>
                    {templates.map((template) => (
                        <tr key={template.templateId} className="border-b border-slate-800/50 hover:bg-slate-800/30 transition-colors">
                            <td className="py-4 px-4 text-white font-medium">{template.templateName}</td>
                            <td className="py-4 px-4 text-center text-slate-300">{template.reviewsCreated}</td>
                            <td className="py-4 px-4 text-center">
                                <div className="flex items-center justify-center gap-2">
                                    <div className="w-20 bg-slate-700 h-2 rounded-full overflow-hidden">
                                        <div
                                            className="bg-cyan-500 h-full transition-all duration-500"
                                            style={{ width: `${template.completionRate}%` }}
                                        ></div>
                                    </div>
                                    <span className="text-sm text-slate-400 min-w-[45px]">{template.completionRate}%</span>
                                </div>
                            </td>
                            <td className="py-4 px-4 text-center">
                                <span className={`inline-block px-3 py-1 rounded-full font-semibold ${
                                    template.avgScore > 0 ? getScoreColor(template.avgScore) : 'text-slate-400 bg-slate-700/20'
                                }`}>
                                    {template.avgScore > 0 ? template.avgScore.toFixed(2) : '--'}
                                </span>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}
