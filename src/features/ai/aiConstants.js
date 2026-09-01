export const AI_MODELS = [
  { id: 'max', label: 'Max', desc: 'Best for complex tasks' },
  { id: 'fast', label: 'Fast', desc: 'Quick responses' },
];

export const AI_QUICK_ACTIONS = [
  {
    id: 'status-report',
    title: 'Status Report',
    prompt: 'Create a project status report summarizing progress, blockers, and next steps for my active projects.',
    icon: 'report',
  },
  {
    id: 'brainstorm',
    title: 'Brainstorm Strategy',
    prompt: 'Brainstorm a marketing launch strategy with timeline, channels, and key milestones.',
    icon: 'sparkle',
  },
  {
    id: 'draft-email',
    title: 'Draft Email',
    prompt: 'Draft a professional client update email covering recent progress and upcoming deliverables.',
    icon: 'pen',
  },
  {
    id: 'search-tasks',
    title: 'Search Tasks',
    prompt: 'Find pending development tasks assigned to me and group them by priority.',
    icon: 'search',
  },
];

export const AI_SKILLS = [
  { id: 'summarize', name: 'Summarize', desc: 'Condense long threads and docs', icon: '📝' },
  { id: 'translate', name: 'Translate', desc: 'Translate content across languages', icon: '🌐' },
  { id: 'write', name: 'Write', desc: 'Draft emails, docs, and updates', icon: '✍️' },
  { id: 'analyze', name: 'Analyze', desc: 'Insights from tasks and reports', icon: '📊' },
];

export const AI_CONNECTIONS = [
  { id: 'slack', name: 'Slack', connected: false },
  { id: 'google', name: 'Google Workspace', connected: true },
  { id: 'github', name: 'GitHub', connected: false },
  { id: 'notion', name: 'Notion', connected: false },
];

export const DEFAULT_AGENTS = [
  { id: 'standup', name: 'Daily Standup', emoji: '📋', owner: 'workspace' },
  { id: 'writer', name: 'Content Writer', emoji: '✍️', owner: 'workspace' },
];
