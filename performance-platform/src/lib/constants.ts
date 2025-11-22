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
} as const;

export type ErrorKey = keyof typeof ERRORS;
export type SuccessKey = keyof typeof SUCCESS_MESSAGES;
