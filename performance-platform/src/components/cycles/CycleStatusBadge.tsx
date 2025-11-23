interface CycleStatusBadgeProps {
    isActive: boolean;
}

export default function CycleStatusBadge({ isActive }: CycleStatusBadgeProps) {
    if (isActive) {
        return (
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-500/10 text-green-400 border border-green-500/30">
                Active
            </span>
        );
    }

    return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-700 text-slate-300">
            Inactive
        </span>
    );
}
