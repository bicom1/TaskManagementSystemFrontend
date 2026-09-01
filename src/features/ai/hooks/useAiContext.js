import { useMemo } from 'react';
import { useHomeOverview } from '@/features/home/hooks/useHome';
import { useProjects } from '@/features/projects/hooks/useProjects';

export function buildAiResponse(prompt, context = {}) {
  const { userName, projectCount = 0, taskCount = 0, projects = [] } = context;
  const lower = prompt.toLowerCase();

  if (lower.includes('status report') || lower.includes('project status')) {
    const names = projects.slice(0, 3).map((p) => p.name).join(', ');
    return `Here's a draft status report for ${userName || 'your workspace'}:

**Overview**
You have ${projectCount} active project${projectCount === 1 ? '' : 's'} and ${taskCount} open task${taskCount === 1 ? '' : 's'}.

**Active projects**
${names || 'No projects yet — create one from the sidebar to get started.'}

**Suggested next steps**
1. Review overdue tasks in My Tasks
2. Update assignees on blocked items
3. Share this summary with your team in Inbox

Want me to expand any section or pull task details from a specific project?`;
  }

  if (lower.includes('brainstorm') || lower.includes('marketing')) {
    return `**Marketing launch brainstorm**

**Phase 1 — Pre-launch (Weeks 1–2)**
- Finalize messaging and landing page
- Build email waitlist sequence
- Prepare social teasers

**Phase 2 — Launch (Week 3)**
- Product Hunt / community posts
- Influencer & partner outreach
- Live demo webinar

**Phase 3 — Post-launch (Weeks 4–6)**
- Collect feedback and iterate
- Retarget engaged visitors
- Publish case studies

I can turn this into tasks in a project — just tell me which project to use.`;
  }

  if (lower.includes('draft') && lower.includes('email')) {
    return `**Subject:** Project update — progress & next steps

Hi team,

I wanted to share a quick update on our current work:

• We've made solid progress across active projects
• Key deliverables are on track for this sprint
• A few items need attention — I'll follow up individually

Please reply if you have questions or blockers.

Best,
${userName || 'Your name'}

---
I can tailor this with specific project names or dates — what should I include?`;
  }

  if (lower.includes('find') || lower.includes('search') || lower.includes('pending') || lower.includes('task')) {
    return `I searched your workspace context:

• **${taskCount}** open tasks across your projects
• **${projectCount}** active projects

Go to **My Tasks** or **All Tasks** to filter by assignee, status, or project. I can help you write a summary or create a report once you tell me which project to focus on.

Try: "Summarize tasks in [project name]"`;
  }

  return `Thanks for your question! I'm Brain — your workspace AI assistant.

I can help you:
• Summarize projects and tasks
• Draft emails and status reports
• Brainstorm strategies and plans
• Find work across your workspace

You have **${projectCount}** project${projectCount === 1 ? '' : 's'} and **${taskCount}** open tasks right now. What would you like to explore?`;
}

export function useAiContext() {
  const { data: home } = useHomeOverview();
  const { data: projectsData } = useProjects({ limit: 50 });
  const user = home?.user;

  return useMemo(() => {
    const projects = projectsData?.data ?? [];
    const taskCount =
      home?.cards?.my_tasks?.items?.length ??
      home?.cards?.assigned_to_me?.count ??
      0;

    return {
      userName: user?.name?.split(' ')[0],
      projectCount: projects.filter((p) => p.status !== 'archived').length,
      taskCount,
      projects,
    };
  }, [home, projectsData, user]);
}
