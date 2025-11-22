import { cn } from '@/lib/utils';
import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
    size?: 'sm' | 'md' | 'lg';
}

export function Button({
    children,
    className,
    variant = 'primary',
    size = 'md',
    ...props
}: ButtonProps) {
    const variants = {
        primary: "bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-semibold shadow-[0_0_20px_rgba(6,182,212,0.3)] hover:shadow-[0_0_30px_rgba(6,182,212,0.5)]",
        secondary: "bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700",
        ghost: "bg-transparent hover:bg-slate-800/50 text-slate-400 hover:text-slate-200",
        danger: "bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20"
    };

    const sizes = {
        sm: "px-3 py-1.5 text-sm",
        md: "px-5 py-2.5",
        lg: "px-8 py-4 text-lg"
    };

    return (
        <button
            className={cn(
                "rounded-xl transition-all duration-300 active:scale-95 disabled:opacity-50 disabled:pointer-events-none",
                variants[variant],
                sizes[size],
                className
            )}
            {...props}
        >
            {children}
        </button>
    );
}
