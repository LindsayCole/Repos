'use client';

import { Filter, ChevronDown } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';
import { cn } from '@/lib/utils';

export interface FilterOption {
    value: string;
    label: string;
}

interface FilterSelectProps {
    value: string | string[];
    onChange: (value: string | string[]) => void;
    options: FilterOption[];
    placeholder?: string;
    className?: string;
    multiSelect?: boolean;
}

export function FilterSelect({
    value,
    onChange,
    options,
    placeholder = 'Filter...',
    className,
    multiSelect = false
}: FilterSelectProps) {
    const [isOpen, setIsOpen] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleSelect = (optionValue: string) => {
        if (multiSelect) {
            const currentValues = Array.isArray(value) ? value : [];
            const newValues = currentValues.includes(optionValue)
                ? currentValues.filter(v => v !== optionValue)
                : [...currentValues, optionValue];
            onChange(newValues);
        } else {
            onChange(optionValue);
            setIsOpen(false);
        }
    };

    const isSelected = (optionValue: string) => {
        if (multiSelect) {
            return Array.isArray(value) && value.includes(optionValue);
        }
        return value === optionValue;
    };

    const getDisplayText = () => {
        if (multiSelect && Array.isArray(value) && value.length > 0) {
            const selectedOptions = options.filter(opt => value.includes(opt.value));
            return selectedOptions.map(opt => opt.label).join(', ');
        }
        if (!multiSelect && value) {
            const selectedOption = options.find(opt => opt.value === value);
            return selectedOption?.label || placeholder;
        }
        return placeholder;
    };

    return (
        <div ref={containerRef} className={cn('relative', className)}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="w-full flex items-center justify-between gap-2 pl-12 pr-4 py-3 bg-slate-900/50 border border-slate-800 rounded-xl text-slate-200 hover:border-slate-700 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500/50 transition-all duration-300"
            >
                <Filter className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <span className={cn(
                    'truncate text-left',
                    !value || (Array.isArray(value) && value.length === 0) ? 'text-slate-500' : 'text-slate-200'
                )}>
                    {getDisplayText()}
                </span>
                <ChevronDown className={cn(
                    'w-5 h-5 text-slate-400 transition-transform duration-200',
                    isOpen && 'rotate-180'
                )} />
            </button>

            {isOpen && (
                <div className="absolute z-50 w-full mt-2 bg-slate-900 border border-slate-800 rounded-xl shadow-2xl overflow-hidden animate-in fade-in duration-200">
                    <div className="max-h-64 overflow-y-auto">
                        {options.map((option) => (
                            <button
                                key={option.value}
                                onClick={() => handleSelect(option.value)}
                                className={cn(
                                    'w-full px-4 py-3 text-left transition-colors duration-150',
                                    isSelected(option.value)
                                        ? 'bg-cyan-500/20 text-cyan-300 font-medium'
                                        : 'text-slate-300 hover:bg-slate-800/50'
                                )}
                            >
                                <div className="flex items-center gap-2">
                                    {multiSelect && (
                                        <div className={cn(
                                            'w-4 h-4 border-2 rounded transition-colors',
                                            isSelected(option.value)
                                                ? 'bg-cyan-500 border-cyan-500'
                                                : 'border-slate-600'
                                        )}>
                                            {isSelected(option.value) && (
                                                <svg className="w-full h-full text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                                </svg>
                                            )}
                                        </div>
                                    )}
                                    <span>{option.label}</span>
                                </div>
                            </button>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
