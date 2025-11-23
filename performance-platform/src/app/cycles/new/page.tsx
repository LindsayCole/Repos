'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { createReviewCycle, getEligibleEmployees } from '@/app/actions/cycles';
import { useRouter } from 'next/navigation';
import { Calendar, Users, CheckCircle, ArrowLeft, ArrowRight, Loader2, Search, Filter } from 'lucide-react';
import { UI_TEXT } from '@/lib/constants';
import { motion, AnimatePresence } from 'framer-motion';

interface Employee {
    id: string;
    name: string;
    email: string;
    department: string | null;
    manager: {
        id: string;
        name: string;
    } | null;
}

interface Template {
    id: string;
    title: string;
    description: string | null;
}

interface CycleFormData {
    name: string;
    description: string;
    startDate: string;
    endDate: string;
    dueDate: string;
    templateId: string;
}

export default function NewCyclePage() {
    const router = useRouter();
    const [currentStep, setCurrentStep] = useState(1);
    const [loading, setLoading] = useState(false);
    const [employees, setEmployees] = useState<Employee[]>([]);
    const [templates, setTemplates] = useState<Template[]>([]);
    const [selectedEmployees, setSelectedEmployees] = useState<Set<string>>(new Set());
    const [searchQuery, setSearchQuery] = useState('');
    const [departmentFilter, setDepartmentFilter] = useState<string>('');
    const [departments, setDepartments] = useState<string[]>([]);

    const [formData, setFormData] = useState<CycleFormData>({
        name: '',
        description: '',
        startDate: '',
        endDate: '',
        dueDate: '',
        templateId: '',
    });

    // Fetch employees and templates on mount
    useEffect(() => {
        const fetchData = async () => {
            try {
                const [employeesData, templatesResponse] = await Promise.all([
                    getEligibleEmployees(),
                    fetch('/api/templates').then(res => res.json())
                ]);

                setEmployees(employeesData);
                setTemplates(templatesResponse);

                // Extract unique departments
                const uniqueDepts = [...new Set(
                    employeesData
                        .map((emp: Employee) => emp.department)
                        .filter((dept): dept is string => dept !== null)
                )];
                setDepartments(uniqueDepts);
            } catch (error) {
                console.error('Error fetching data:', error);
            }
        };

        fetchData();
    }, []);

    const handleNext = () => {
        if (currentStep < 3) {
            setCurrentStep(currentStep + 1);
        }
    };

    const handleBack = () => {
        if (currentStep > 1) {
            setCurrentStep(currentStep - 1);
        }
    };

    const handleEmployeeToggle = (employeeId: string) => {
        const newSelected = new Set(selectedEmployees);
        if (newSelected.has(employeeId)) {
            newSelected.delete(employeeId);
        } else {
            newSelected.add(employeeId);
        }
        setSelectedEmployees(newSelected);
    };

    const handleSelectAll = () => {
        if (selectedEmployees.size === filteredEmployees.length) {
            setSelectedEmployees(new Set());
        } else {
            setSelectedEmployees(new Set(filteredEmployees.map(emp => emp.id)));
        }
    };

    const handleSubmit = async () => {
        try {
            setLoading(true);

            const result = await createReviewCycle(
                {
                    name: formData.name,
                    description: formData.description,
                    startDate: new Date(formData.startDate),
                    endDate: new Date(formData.endDate),
                    dueDate: new Date(formData.dueDate),
                    templateId: formData.templateId,
                },
                Array.from(selectedEmployees)
            );

            if (result.success) {
                router.push(`/cycles/${result.cycle.id}`);
            }
        } catch (error) {
            console.error('Error creating cycle:', error);
            alert(error instanceof Error ? error.message : 'Failed to create review cycle');
        } finally {
            setLoading(false);
        }
    };

    // Filter employees based on search and department
    const filteredEmployees = employees.filter((employee) => {
        const matchesSearch = employee.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            employee.email.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesDepartment = !departmentFilter || employee.department === departmentFilter;
        return matchesSearch && matchesDepartment;
    });

    const canProceedStep1 = formData.name && formData.startDate && formData.endDate && formData.dueDate && formData.templateId;
    const canProceedStep2 = selectedEmployees.size > 0;

    return (
        <div className="max-w-5xl mx-auto space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-4xl font-bold text-white mb-2">
                        {UI_TEXT.CREATE_CYCLE}
                    </h1>
                    <p className="text-slate-400">Create a new performance review cycle</p>
                </div>
                <Button variant="ghost" onClick={() => router.push('/cycles')}>
                    <ArrowLeft size={16} className="mr-2" />
                    Back to Cycles
                </Button>
            </div>

            {/* Step Indicator */}
            <div className="flex items-center justify-center gap-4 mb-8">
                {[1, 2, 3].map((step) => (
                    <div key={step} className="flex items-center">
                        <div
                            className={`flex items-center justify-center w-10 h-10 rounded-full border-2 transition-all ${currentStep >= step
                                    ? 'border-cyan-500 bg-cyan-500/20 text-cyan-300'
                                    : 'border-slate-700 text-slate-500'
                                }`}
                        >
                            {step}
                        </div>
                        <div className={`ml-2 text-sm font-medium ${currentStep >= step ? 'text-white' : 'text-slate-500'
                            }`}>
                            {step === 1 && UI_TEXT.CYCLE_DETAILS}
                            {step === 2 && UI_TEXT.SELECT_EMPLOYEES}
                            {step === 3 && UI_TEXT.REVIEW_CONFIRM}
                        </div>
                        {step < 3 && (
                            <div
                                className={`w-16 h-0.5 mx-4 ${currentStep > step ? 'bg-cyan-500' : 'bg-slate-700'
                                    }`}
                            />
                        )}
                    </div>
                ))}
            </div>

            <AnimatePresence mode="wait">
                {/* Step 1: Cycle Details */}
                {currentStep === 1 && (
                    <motion.div
                        key="step1"
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                    >
                        <Card className="space-y-6">
                            <div className="flex items-center gap-3 mb-4">
                                <Calendar className="text-cyan-400" size={24} />
                                <h2 className="text-2xl font-semibold text-white">
                                    {UI_TEXT.CYCLE_DETAILS}
                                </h2>
                            </div>

                            <div className="grid grid-cols-1 gap-6">
                                <div>
                                    <label className="block text-sm font-medium text-slate-300 mb-2">
                                        Cycle Name <span className="text-red-400">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                        placeholder="e.g., Q1 2025 Performance Reviews"
                                        className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-slate-300 mb-2">
                                        Description
                                    </label>
                                    <textarea
                                        value={formData.description}
                                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                        placeholder="Optional description for this review cycle"
                                        rows={3}
                                        className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
                                    />
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-slate-300 mb-2">
                                            Start Date <span className="text-red-400">*</span>
                                        </label>
                                        <input
                                            type="date"
                                            value={formData.startDate}
                                            onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                                            className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-cyan-500"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-slate-300 mb-2">
                                            End Date <span className="text-red-400">*</span>
                                        </label>
                                        <input
                                            type="date"
                                            value={formData.endDate}
                                            onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                                            className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-cyan-500"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-slate-300 mb-2">
                                            Due Date <span className="text-red-400">*</span>
                                        </label>
                                        <input
                                            type="date"
                                            value={formData.dueDate}
                                            onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                                            className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-cyan-500"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-slate-300 mb-2">
                                        Review Template <span className="text-red-400">*</span>
                                    </label>
                                    <select
                                        value={formData.templateId}
                                        onChange={(e) => setFormData({ ...formData, templateId: e.target.value })}
                                        className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-cyan-500"
                                    >
                                        <option value="">Select a template</option>
                                        {templates.map((template) => (
                                            <option key={template.id} value={template.id}>
                                                {template.title}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                        </Card>
                    </motion.div>
                )}

                {/* Step 2: Select Employees */}
                {currentStep === 2 && (
                    <motion.div
                        key="step2"
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                    >
                        <Card className="space-y-6">
                            <div className="flex items-center justify-between mb-4">
                                <div className="flex items-center gap-3">
                                    <Users className="text-cyan-400" size={24} />
                                    <h2 className="text-2xl font-semibold text-white">
                                        {UI_TEXT.SELECT_EMPLOYEES}
                                    </h2>
                                </div>
                                <div className="text-cyan-400 font-semibold">
                                    {UI_TEXT.EMPLOYEES_SELECTED(selectedEmployees.size)}
                                </div>
                            </div>

                            <div className="flex gap-4">
                                <div className="flex-1 relative">
                                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-500" size={18} />
                                    <input
                                        type="text"
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        placeholder="Search by name or email..."
                                        className="w-full pl-10 pr-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
                                    />
                                </div>
                                <div className="w-64">
                                    <select
                                        value={departmentFilter}
                                        onChange={(e) => setDepartmentFilter(e.target.value)}
                                        className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-cyan-500"
                                    >
                                        <option value="">All Departments</option>
                                        {departments.map((dept) => (
                                            <option key={dept} value={dept}>
                                                {dept}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <div className="flex items-center gap-2">
                                <input
                                    type="checkbox"
                                    id="select-all"
                                    checked={selectedEmployees.size === filteredEmployees.length && filteredEmployees.length > 0}
                                    onChange={handleSelectAll}
                                    className="w-4 h-4 rounded border-slate-700 bg-slate-800 text-cyan-500 focus:ring-cyan-500"
                                />
                                <label htmlFor="select-all" className="text-sm font-medium text-slate-300 cursor-pointer">
                                    Select All ({filteredEmployees.length})
                                </label>
                            </div>

                            <div className="max-h-96 overflow-y-auto space-y-2">
                                {filteredEmployees.map((employee) => (
                                    <div
                                        key={employee.id}
                                        className={`p-4 rounded-lg border transition-all cursor-pointer ${selectedEmployees.has(employee.id)
                                                ? 'bg-cyan-500/10 border-cyan-500/50'
                                                : 'bg-slate-800/50 border-slate-700 hover:border-slate-600'
                                            }`}
                                        onClick={() => handleEmployeeToggle(employee.id)}
                                    >
                                        <div className="flex items-center gap-4">
                                            <input
                                                type="checkbox"
                                                checked={selectedEmployees.has(employee.id)}
                                                onChange={() => handleEmployeeToggle(employee.id)}
                                                className="w-4 h-4 rounded border-slate-700 bg-slate-800 text-cyan-500 focus:ring-cyan-500"
                                            />
                                            <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-2">
                                                <div>
                                                    <div className="text-white font-medium">{employee.name}</div>
                                                    <div className="text-sm text-slate-400">{employee.email}</div>
                                                </div>
                                                <div className="text-sm text-slate-400">
                                                    {employee.department || 'No Department'}
                                                </div>
                                                <div className="text-sm text-slate-400">
                                                    Manager: {employee.manager?.name || 'None'}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {filteredEmployees.length === 0 && (
                                <div className="text-center py-12 text-slate-500">
                                    No employees found matching your criteria
                                </div>
                            )}
                        </Card>
                    </motion.div>
                )}

                {/* Step 3: Review & Confirm */}
                {currentStep === 3 && (
                    <motion.div
                        key="step3"
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                    >
                        <Card className="space-y-6">
                            <div className="flex items-center gap-3 mb-4">
                                <CheckCircle className="text-cyan-400" size={24} />
                                <h2 className="text-2xl font-semibold text-white">
                                    {UI_TEXT.REVIEW_CONFIRM}
                                </h2>
                            </div>

                            <div className="space-y-6">
                                <div className="p-6 bg-slate-800/50 rounded-lg space-y-4">
                                    <h3 className="text-lg font-semibold text-cyan-400">Cycle Summary</h3>
                                    <div className="grid grid-cols-2 gap-4 text-sm">
                                        <div>
                                            <span className="text-slate-400">Name:</span>
                                            <div className="text-white font-medium">{formData.name}</div>
                                        </div>
                                        <div>
                                            <span className="text-slate-400">Template:</span>
                                            <div className="text-white font-medium">
                                                {templates.find(t => t.id === formData.templateId)?.title}
                                            </div>
                                        </div>
                                        <div>
                                            <span className="text-slate-400">Start Date:</span>
                                            <div className="text-white font-medium">
                                                {new Date(formData.startDate).toLocaleDateString()}
                                            </div>
                                        </div>
                                        <div>
                                            <span className="text-slate-400">End Date:</span>
                                            <div className="text-white font-medium">
                                                {new Date(formData.endDate).toLocaleDateString()}
                                            </div>
                                        </div>
                                        <div>
                                            <span className="text-slate-400">Due Date:</span>
                                            <div className="text-white font-medium">
                                                {new Date(formData.dueDate).toLocaleDateString()}
                                            </div>
                                        </div>
                                        <div>
                                            <span className="text-slate-400">Reviews to Create:</span>
                                            <div className="text-cyan-400 font-bold text-lg">
                                                {selectedEmployees.size}
                                            </div>
                                        </div>
                                    </div>
                                    {formData.description && (
                                        <div>
                                            <span className="text-slate-400">Description:</span>
                                            <div className="text-white">{formData.description}</div>
                                        </div>
                                    )}
                                </div>

                                <div className="p-6 bg-cyan-500/10 border border-cyan-500/30 rounded-lg">
                                    <h3 className="text-lg font-semibold text-cyan-400 mb-3">
                                        {UI_TEXT.REVIEWS_TO_CREATE(selectedEmployees.size)}
                                    </h3>
                                    <div className="max-h-48 overflow-y-auto space-y-2">
                                        {employees
                                            .filter((emp) => selectedEmployees.has(emp.id))
                                            .map((emp) => (
                                                <div
                                                    key={emp.id}
                                                    className="flex justify-between items-center text-sm p-2 bg-slate-800/50 rounded"
                                                >
                                                    <span className="text-white">{emp.name}</span>
                                                    <span className="text-slate-400">{emp.email}</span>
                                                </div>
                                            ))}
                                    </div>
                                </div>

                                <div className="p-4 bg-orange-500/10 border border-orange-500/30 rounded-lg">
                                    <p className="text-sm text-orange-300">
                                        <strong>Note:</strong> Creating this cycle will send email notifications to all {selectedEmployees.size} employees.
                                        Reviews will be created in batches to ensure optimal performance.
                                    </p>
                                </div>
                            </div>
                        </Card>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Navigation Buttons */}
            <div className="flex justify-between">
                <Button
                    variant="ghost"
                    onClick={handleBack}
                    disabled={currentStep === 1}
                >
                    <ArrowLeft size={16} className="mr-2" />
                    Previous
                </Button>

                {currentStep < 3 ? (
                    <Button
                        onClick={handleNext}
                        disabled={
                            (currentStep === 1 && !canProceedStep1) ||
                            (currentStep === 2 && !canProceedStep2)
                        }
                    >
                        Next
                        <ArrowRight size={16} className="ml-2" />
                    </Button>
                ) : (
                    <Button
                        onClick={handleSubmit}
                        disabled={loading}
                    >
                        {loading ? (
                            <>
                                <Loader2 size={16} className="mr-2 animate-spin" />
                                Creating...
                            </>
                        ) : (
                            'Create Review Cycle'
                        )}
                    </Button>
                )}
            </div>
        </div>
    );
}
