'use client';

import { useState, useMemo } from 'react';
import { SearchInput } from '@/components/ui/SearchInput';
import { FilterSelect, FilterOption } from '@/components/ui/FilterSelect';
import { Card } from '@/components/ui/Card';
import { TemplateCard } from '@/components/builder/TemplateCard';
import { UI_TEXT } from '@/lib/constants';

interface Template {
    id: string;
    title: string;
    description: string | null;
    _count: {
        sections: number;
        reviews: number;
    };
}

interface BuilderPageClientProps {
    templates: Template[];
}

const filterOptions: FilterOption[] = [
    { value: 'all', label: 'All Templates' },
    { value: 'hasReviews', label: 'Has Reviews' },
    { value: 'noReviews', label: 'No Reviews' }
];

export function BuilderPageClient({ templates }: BuilderPageClientProps) {
    const [searchQuery, setSearchQuery] = useState('');
    const [filterValue, setFilterValue] = useState('all');

    const filteredTemplates = useMemo(() => {
        let filtered = templates;

        // Apply search filter
        if (searchQuery.trim()) {
            const query = searchQuery.toLowerCase();
            filtered = filtered.filter(template =>
                template.title.toLowerCase().includes(query) ||
                template.description?.toLowerCase().includes(query)
            );
        }

        // Apply review filter
        if (filterValue === 'hasReviews') {
            filtered = filtered.filter(template => template._count.reviews > 0);
        } else if (filterValue === 'noReviews') {
            filtered = filtered.filter(template => template._count.reviews === 0);
        }

        return filtered;
    }, [templates, searchQuery, filterValue]);

    return (
        <>
            {/* Search and Filter Controls */}
            <div className="flex flex-col sm:flex-row gap-4 mb-6">
                <div className="flex-1">
                    <SearchInput
                        value={searchQuery}
                        onChange={setSearchQuery}
                        placeholder="Search templates by title or description..."
                    />
                </div>
                <div className="sm:w-64">
                    <FilterSelect
                        value={filterValue}
                        onChange={(value) => setFilterValue(value as string)}
                        options={filterOptions}
                        placeholder="Filter templates"
                    />
                </div>
            </div>

            {/* Results Count */}
            <div className="mb-4">
                <p className="text-sm text-slate-400">
                    Showing {filteredTemplates.length} of {templates.length} templates
                </p>
            </div>

            {/* Templates Grid */}
            {filteredTemplates.length === 0 ? (
                <Card>
                    <p className="text-slate-400 text-center py-8">
                        {templates.length === 0 ? UI_TEXT.NO_TEMPLATES : 'No templates match your search criteria'}
                    </p>
                </Card>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredTemplates.map(template => (
                        <TemplateCard key={template.id} template={template} />
                    ))}
                </div>
            )}
        </>
    );
}
