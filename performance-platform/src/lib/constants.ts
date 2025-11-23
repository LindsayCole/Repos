// Centralized error messages and user-facing text

export const ERRORS = {
    // Authentication
    AUTH_REQUIRED: 'Authentication required. Please log in.',
    AUTH_FAILED: 'Login failed. User not found or error occurred.',
    AUTH_UNAUTHORIZED: 'You do not have permission to access this resource.',

    // Reviews
    REVIEW_NOT_FOUND: 'Review not found.',
    REVIEW_ID_REQUIRED: 'Review ID is required.',
    REVIEW_CREATE_FAILED: 'Failed to create review cycle.',
    REVIEW_SUBMIT_FAILED: 'Failed to submit review.',

    // Templates
    TEMPLATE_NOT_FOUND: 'Template not found.',
    TEMPLATE_DELETE_FAILED: 'Failed to delete template.',
    TEMPLATE_DELETE_IN_USE: 'Cannot delete template that is being used in active reviews.',

    // Performance Metrics
    METRICS_USER_ID_REQUIRED: 'User ID required to fetch performance metrics.',
    METRICS_FETCH_FAILED: 'Failed to fetch performance metrics.',

    // PDF Export
    PDF_EXPORT_FAILED: 'Failed to generate PDF.',

    // Email
    EMAIL_SEND_FAILED: 'Failed to send email notification.',

    // Generic
    INTERNAL_ERROR: 'An internal error occurred. Please try again.',
    VALIDATION_FAILED: 'Validation failed. Please check your input.',
} as const;

export const SUCCESS_MESSAGES = {
    REVIEW_CREATED: 'Review cycle created successfully.',
    REVIEW_SUBMITTED: 'Review submitted successfully.',
    TEMPLATE_CREATED: 'Template created successfully.',
    TEMPLATE_UPDATED: 'Template updated successfully.',
    TEMPLATE_DELETED: 'Template deleted successfully.',
    EMAIL_SENT: 'Email notification sent.',
} as const;

export const UI_TEXT = {
    // Dashboard
    DASHBOARD_WELCOME: (firstName: string) => `Welcome back, ${firstName}`,
    DASHBOARD_SUBTITLE: "Here's what's happening with your performance reviews.",
    NO_PENDING_TASKS: 'All caught up! No pending actions.',
    START_REVIEW: 'Start Review',
    REVIEW_ACTION: 'Review',

    // Builder
    BUILDER_TITLE: 'Form Templates',
    CREATE_TEMPLATE: 'Create New Template',
    NO_TEMPLATES: 'No templates created yet.',
    TEMPLATE_SECTIONS: (count: number) => `${count} Sections`,
    TEMPLATE_REVIEWS: (count: number) => `${count} Reviews`,

    // Team
    TEAM_TITLE: 'My Team',
    TEAM_SUBTITLE: 'Overview of your direct reports and their performance.',
    NO_DIRECT_REPORTS: 'No direct reports found.',
    COMPLETED_REVIEWS: (count: number) => `${count} Completed Reviews`,
    PENDING_REVIEWS: (count: number) => `${count} review${count !== 1 ? 's' : ''} awaiting your input`,

    // Navigation
    NAV_DASHBOARD: 'Dashboard',
    NAV_MY_TEAM: 'My Team',
    NAV_FORMS: 'Forms',
    NAV_CYCLES: 'Review Cycles',
    NAV_SIGN_OUT: 'Sign Out',

    // Review Statuses
    STATUS_SELF_EVAL: 'Self-Evaluation Required',
    STATUS_MANAGER_REVIEW: 'Manager Review',
    STATUS_COMPLETED: 'Completed',

    // Loading
    LOADING: 'Loading...',
    SAVING: 'Saving...',
    GENERATING: 'Generating...',

    // Buttons
    EXPORT_PDF: 'Export PDF',
    DELETE: 'Delete',
    CONFIRM: 'Confirm',
    CANCEL: 'Cancel',

    // Cycles
    CYCLES_TITLE: 'Review Cycles',
    CYCLES_SUBTITLE: 'Manage and track bulk performance review cycles',
    CREATE_CYCLE: 'Create New Cycle',
    NO_CYCLES: 'No review cycles created yet.',
    CYCLE_DETAILS: 'Cycle Details',
    CYCLE_PROGRESS: 'Cycle Progress',
    SELECT_EMPLOYEES: 'Select Employees',
    REVIEW_CONFIRM: 'Review & Confirm',
    EMPLOYEES_SELECTED: (count: number) => `${count} employee${count !== 1 ? 's' : ''} selected`,
    REVIEWS_TO_CREATE: (count: number) => `This will create ${count} review${count !== 1 ? 's' : ''}`,
    CYCLE_STATUS_DRAFT: 'Draft',
    CYCLE_STATUS_ACTIVE: 'Active',
    CYCLE_STATUS_COMPLETED: 'Completed',
    SEND_REMINDERS: 'Send Reminders to All Pending',
    EXPORT_CYCLE_REPORT: 'Export Cycle Report',

    // Action Items
    ACTION_ITEMS_TITLE: 'Development Plan',
    ADD_ACTION_ITEM: 'Add Action Item',
    NO_ACTION_ITEMS: 'No action items yet. Add items to track development goals.',
    MY_ACTION_ITEMS: 'My Action Items',
    VIEW_ALL_ACTION_ITEMS: 'View All',
    UPCOMING_ACTION_ITEMS: 'Upcoming Items',
} as const;

// Notification Types
export const NOTIFICATION_TYPES = {
    REVIEW_ASSIGNED: 'REVIEW_ASSIGNED',
    REVIEW_DUE_SOON: 'REVIEW_DUE_SOON',
    REVIEW_SUBMITTED: 'REVIEW_SUBMITTED',
    REVIEW_COMPLETED: 'REVIEW_COMPLETED',
    CYCLE_CREATED: 'CYCLE_CREATED',
} as const;

// Notification Message Templates
export const NOTIFICATION_MESSAGES = {
    REVIEW_ASSIGNED: (templateName: string) => ({
        title: 'New Review Assigned',
        message: `You have been assigned a ${templateName} review to complete.`
    }),
    REVIEW_DUE_SOON: (templateName: string, days: number) => ({
        title: 'Review Due Soon',
        message: `Your ${templateName} review is due in ${days} day${days !== 1 ? 's' : ''}.`
    }),
    REVIEW_OVERDUE: (templateName: string) => ({
        title: 'Review Overdue',
        message: `Your ${templateName} review is now overdue. Please complete it as soon as possible.`
    }),
    REVIEW_SUBMITTED: (employeeName: string, templateName: string) => ({
        title: 'Review Submitted',
        message: `${employeeName} has submitted their ${templateName} self-evaluation.`
    }),
    REVIEW_COMPLETED: (templateName: string) => ({
        title: 'Review Completed',
        message: `Your ${templateName} review has been completed by your manager.`
    }),
    CYCLE_CREATED: (cycleName: string, templateName: string) => ({
        title: 'New Review Cycle',
        message: `You have been assigned a review for the ${cycleName} cycle using the ${templateName} template.`
    }),
} as const;

// Action Item Constants
export const ACTION_ITEM_CATEGORIES = {
    SKILL_DEVELOPMENT: 'Skill Development',
    PERFORMANCE_IMPROVEMENT: 'Performance Improvement',
    CAREER_GROWTH: 'Career Growth',
    OTHER: 'Other'
} as const;

export const ACTION_ITEM_PRIORITIES = {
    HIGH: 'High',
    MEDIUM: 'Medium',
    LOW: 'Low'
} as const;

export const ACTION_ITEM_STATUSES = {
    PENDING: 'Pending',
    IN_PROGRESS: 'In Progress',
    COMPLETED: 'Completed',
    CANCELLED: 'Cancelled'
} as const;

export type ErrorKey = keyof typeof ERRORS;
export type SuccessKey = keyof typeof SUCCESS_MESSAGES;
export type NotificationType = keyof typeof NOTIFICATION_TYPES;
