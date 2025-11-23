interface GoalStatusBadgeProps {
    status: string;
}

export default function GoalStatusBadge({ status }: GoalStatusBadgeProps) {
    const statusConfig = {
        NOT_STARTED: {
            label: 'Not Started',
            className: 'bg-slate-700 text-slate-300',
        },
        IN_PROGRESS: {
            label: 'In Progress',
            className: 'bg-blue-500/10 text-blue-400 border border-blue-500/30',
        },
        COMPLETED: {
            label: 'Completed',
            className: 'bg-green-500/10 text-green-400 border border-green-500/30',
        },
        CANCELLED: {
            label: 'Cancelled',
            className: 'bg-red-500/10 text-red-400 border border-red-500/30',
        },
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.NOT_STARTED;

    return (
        <span
            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.className}`}
        >
            {config.label}
        </span>
    );
}
