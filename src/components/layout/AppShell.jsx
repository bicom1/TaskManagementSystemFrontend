import { Suspense, useState } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import { CheckSquare, FolderKanban, Mail, UserPlus, Users } from 'lucide-react';
import { AppSidebar } from './AppSidebar';
import { TopBar } from './TopBar';
import { InviteModal } from '@/components/InviteModal';
import { CreateSpaceWizard } from '@/features/spaces/components/CreateSpaceWizard';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { LoadingScreen } from '@/components/ui/Spinner';
import { useLiveSpaces } from '@/features/projects/hooks/useProjects';

/* ============================================================
   AppShell — BIWORKSPACE Global Layout
   
   Structure:
   ┌──────────────┬─────────────────────────────────────────┐
   │              │  TopBar (48px, always)                  │
   │  AppSidebar  ├─────────────────────────────────────────┤
   │  (1 sidebar, │                                         │
   │  always the  │  <Outlet /> — page content              │
   │  same width) │  (container never shifts width)         │
   │              │                                         │
   └──────────────┴─────────────────────────────────────────┘

   The sidebar is the ONLY sidebar — no IconRail + HomeSidebar 
   duplication, no route-based sidebar switching.
   
   Content pane width = 100vw − sidebarWidth
   Since sidebar width is determined solely by `collapsed` state
   (not by route), navigating between tabs never changes the
   content pane width.
   ============================================================ */

export function AppShell() {
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [spaceWizardOpen, setSpaceWizardOpen] = useState(false);

  useLiveSpaces();

  return (
    <div
      className="flex h-screen overflow-hidden"
      style={{ backgroundColor: 'var(--color-sidebar-bg)' }}
    >
      {/* ══ Desktop Sidebar — exactly one, globally ══ */}
      <div className="hidden h-full lg:flex shrink-0">
        <AppSidebar
          collapsed={collapsed}
          onToggle={() => setCollapsed((v) => !v)}
          onInvite={() => setInviteOpen(true)}
        />
      </div>

      {/* ══ Mobile sidebar drawer ══ */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-[rgba(13,13,20,0.65)] backdrop-blur-sm"
            onClick={() => setMobileOpen(false)}
          />
          {/* Drawer */}
          <div className="absolute inset-y-0 left-0 animate-[slideRight_200ms_ease_both] shrink-0">
            <AppSidebar
              collapsed={false}
              onToggle={() => setMobileOpen(false)}
              onInvite={() => {
                setMobileOpen(false);
                setInviteOpen(true);
              }}
            />
          </div>
        </div>
      )}

      {/* ══ Content Pane — fixed container, never shifts width on tab change ══ */}
      <div
        className="flex min-w-0 flex-1 flex-col overflow-hidden rounded-tl-2xl rounded-bl-2xl"
        style={{ backgroundColor: 'var(--color-surface-1)' }}
      >
        {/* Single global TopBar */}
        <TopBar
          onMenuClick={() => setMobileOpen(true)}
          onInvite={() => setInviteOpen(true)}
          onCreate={() => setCreateOpen(true)}
        />

        {/* Page content — only this area scrolls */}
        <main
          className="flex-1 overflow-x-hidden overflow-y-auto"
          style={{ backgroundColor: 'var(--color-surface-1)' }}
        >
          <Suspense fallback={<LoadingScreen message="Loading…" />}>
            <Outlet />
          </Suspense>
        </main>
      </div>

      {/* ══ Global Modals ══ */}
      <InviteModal open={inviteOpen} onClose={() => setInviteOpen(false)} />
      <CreateSpaceWizard open={spaceWizardOpen} onClose={() => setSpaceWizardOpen(false)} />

      {/* Create new — rich tile picker */}
      <Modal open={createOpen} onClose={() => setCreateOpen(false)} title="Create new">
        <div className="grid gap-1.5">
          {[
            {
              icon: CheckSquare,
              color: 'bg-brand-50 text-brand-600',
              title: 'Add task',
              desc: 'Create a new personal task',
              action: () => { setCreateOpen(false); navigate('/home/my-tasks?add=1'); },
            },
            {
              icon: FolderKanban,
              color: 'bg-violet-50 text-violet-600',
              title: 'New project',
              desc: 'Organise tasks in a project space',
              action: () => { setCreateOpen(false); setSpaceWizardOpen(true); },
            },
            {
              icon: Users,
              color: 'bg-emerald-50 text-emerald-600',
              title: 'New team',
              desc: 'Group people into a team',
              action: () => { setCreateOpen(false); navigate('/teams/all'); },
            },
            {
              icon: UserPlus,
              color: 'bg-amber-50 text-amber-600',
              title: 'Invite people',
              desc: 'Bring teammates into your workspace',
              action: () => { setCreateOpen(false); setInviteOpen(true); },
            },
            {
              icon: Mail,
              color: 'bg-rose-50 text-rose-600',
              title: 'New message',
              desc: 'Send an inbox message',
              action: () => { setCreateOpen(false); navigate('/inbox'); },
            },
          ].map(({ icon: Icon, color, title, desc, action }) => (
            <Button
              key={title}
              variant="ghost"
              className="justify-start gap-3 rounded-xl px-3 py-2.5 h-auto"
              onClick={action}
            >
              <span className={`flex h-8 w-8 items-center justify-center rounded-lg ${color}`}>
                <Icon className="h-4 w-4" />
              </span>
              <span className="flex flex-col text-left">
                <span className="text-[13px] font-semibold text-text-primary">{title}</span>
                <span className="text-[11px] text-text-muted">{desc}</span>
              </span>
            </Button>
          ))}
        </div>
      </Modal>
    </div>
  );
}
