/** Mirrors backend space.constant.js for the Create Space wizard */

export const SPACE_PERMISSION_OPTIONS = [
  { value: 'full_edit', label: 'Full edit' },
  { value: 'edit', label: 'Edit' },
  { value: 'comment', label: 'Comment' },
  { value: 'view', label: 'View only' },
];

export const WORKFLOW_TEMPLATES = {
  starter: {
    id: 'starter',
    name: 'Starter',
    description: 'For everyday tasks.',
    defaultViews: ['list', 'board'],
    statuses: [
      { key: 'todo', label: 'TO DO', color: '#9ca3af' },
      { key: 'in_progress', label: 'IN PROGRESS', color: '#7c3aed' },
      { key: 'done', label: 'COMPLETE', color: '#22c55e' },
    ],
    clickApps: [
      'tags',
      'time_estimates',
      'priority',
      'time_tracking',
      'incomplete_warning',
      'assignees',
      'due_dates',
      'checklists',
    ],
  },
  marketing: {
    id: 'marketing',
    name: 'Marketing Teams',
    description: 'Run effective campaigns.',
    defaultViews: ['list', 'board', 'calendar'],
    statuses: [
      { key: 'backlog', label: 'IDEAS', color: '#9ca3af' },
      { key: 'todo', label: 'PLANNED', color: '#3b82f6' },
      { key: 'in_progress', label: 'IN PROGRESS', color: '#7c3aed' },
      { key: 'in_review', label: 'REVIEW', color: '#f59e0b' },
      { key: 'done', label: 'PUBLISHED', color: '#22c55e' },
    ],
    clickApps: ['tags', 'priority', 'assignees', 'due_dates', 'time_estimates', 'checklists'],
  },
  project_management: {
    id: 'project_management',
    name: 'Project Management',
    description: 'Plan, manage, and execute projects.',
    defaultViews: ['list', 'board', 'calendar'],
    statuses: [
      { key: 'backlog', label: 'BACKLOG', color: '#9ca3af' },
      { key: 'todo', label: 'TO DO', color: '#3b82f6' },
      { key: 'in_progress', label: 'IN PROGRESS', color: '#7c3aed' },
      { key: 'in_review', label: 'IN REVIEW', color: '#f59e0b' },
      { key: 'done', label: 'DONE', color: '#22c55e' },
    ],
    clickApps: [
      'tags',
      'time_estimates',
      'priority',
      'time_tracking',
      'incomplete_warning',
      'assignees',
      'due_dates',
      'checklists',
    ],
  },
  product_engineering: {
    id: 'product_engineering',
    name: 'Product + Engineering',
    description: 'Streamline your product lifecycle.',
    defaultViews: ['list', 'board'],
    statuses: [
      { key: 'backlog', label: 'BACKLOG', color: '#9ca3af' },
      { key: 'todo', label: 'READY', color: '#3b82f6' },
      { key: 'in_progress', label: 'IN PROGRESS', color: '#7c3aed' },
      { key: 'in_review', label: 'CODE REVIEW', color: '#f59e0b' },
      { key: 'done', label: 'SHIPPED', color: '#22c55e' },
    ],
    clickApps: [
      'tags',
      'time_estimates',
      'priority',
      'time_tracking',
      'incomplete_warning',
      'assignees',
      'due_dates',
      'checklists',
    ],
  },
};

export const WORKFLOW_TEMPLATE_LIST = Object.values(WORKFLOW_TEMPLATES);

export const VIEW_LABELS = {
  list: 'List',
  board: 'Board',
  calendar: 'Calendar',
  docs: 'Docs',
  channel: 'Channel',
};

export const CLICK_APP_LABELS = {
  tags: 'Tags',
  time_estimates: 'Time Estimates',
  priority: 'Priority',
  time_tracking: 'Time Tracking',
  incomplete_warning: 'Incomplete Warning',
  assignees: 'Assignees',
  due_dates: 'Due Dates',
  checklists: 'Checklists',
};

export function getWorkflowTemplate(id = 'starter') {
  return WORKFLOW_TEMPLATES[id] || WORKFLOW_TEMPLATES.starter;
}
