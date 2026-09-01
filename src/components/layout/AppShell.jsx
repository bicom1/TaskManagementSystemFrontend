import { Suspense, useState, useEffect } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { CheckSquare, FolderKanban, Mail, UserPlus, Users } from 'lucide-react';
import { IconRail, getSectionFromPath } from './IconRail';
import { SidebarPanel } from './SidebarPanel';
import { TopBar } from './TopBar';
import { InviteModal } from '@/components/InviteModal';
import { CreateSpaceWizard } from '@/features/spaces/components/CreateSpaceWizard';
import { Modal } from '@/components/ui/Modal';
import { LoadingScreen } from '@/components/ui/Spinner';
import { useLiveSpaces } from '@/features/projects/hooks/useProjects';

/* ============================================================
   AppShell — ClickUp 3.0 Layout
   - Leftmost: IconRail (64px solid pitch black #050508)
   - Middle: SidebarPanel (240px clean white #ffffff)
   - Right: Main Content Area (Fixed container, TopBar + Page)
   ============================================================ */

export function AppShell() {
  const location = useLocation();
  const navigate = useNavigate();

  const [activeSection, setActiveSection] = useState(() => getSectionFromPath(location.pathname));
  const [panelOpen, setPanelOpen] = useState(true);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [spaceWizardOpen, setSpaceWizardOpen] = useState(false);

  useLiveSpaces();

  // Sync active section when path changes
  useEffect(() => {
    const matched = getSectionFromPath(location.pathname);
    setActiveSection(matched);
  }, [location.pathname]);

  const handleSectionClick = (sectionId) => {
    if (activeSection === sectionId) {
      setPanelOpen((prev) => !prev);
    } else {
      setActiveSection(sectionId);
      setPanelOpen(true);
    }
  };

  return (
    <div className="flex h-screen w-screen overflow-hidden select-none bg-[#050508]">
      {/* ══ Desktop Dual Rail: IconRail (64px) + SidebarPanel (240px) ══ */}
      <div className="hidden h-full lg:flex shrink-0">
        <IconRail
          activeSection={activeSection}
          panelOpen={panelOpen}
          onSectionClick={handleSectionClick}
          onInviteClick={() => setInviteOpen(true)}
        />
        {panelOpen && (
          <SidebarPanel
            activeSection={activeSection}
            onInvite={() => setInviteOpen(true)}
            onToggleCollapse={() => setPanelOpen(false)}
            onCreateClick={() => setCreateOpen(true)}
            onAddProject={() => setSpaceWizardOpen(true)}
          />
        )}
      </div>

      {/* ══ Mobile Drawer (Overlay) ══ */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-xs"
            onClick={() => setMobileOpen(false)}
          />
          <div className="absolute inset-y-0 left-0 flex animate-[slideRight_200ms_ease_both] z-10 shadow-2xl">
            <IconRail
              activeSection={activeSection}
              panelOpen={true}
              onSectionClick={(sec) => {
                handleSectionClick(sec);
                setMobileOpen(false);
              }}
              onInviteClick={() => {
                setMobileOpen(false);
                setInviteOpen(true);
              }}
            />
            <SidebarPanel
              activeSection={activeSection}
              onInvite={() => {
                setMobileOpen(false);
                setInviteOpen(true);
              }}
              onToggleCollapse={() => setMobileOpen(false)}
              onCreateClick={() => {
                setMobileOpen(false);
                setCreateOpen(true);
              }}
              onAddProject={() => {
                setMobileOpen(false);
                setSpaceWizardOpen(true);
              }}
            />
          </div>
        </div>
      )}

      {/* ══ Main App Container ══ */}
      <div className="flex min-w-0 flex-1 flex-col overflow-hidden bg-[#f8f9fa]">
        {/* TopBar */}
        <TopBar
          onMenuClick={() => setMobileOpen(true)}
          onInvite={() => setInviteOpen(true)}
          onCreate={() => setCreateOpen(true)}
          panelOpen={panelOpen}
          onTogglePanel={() => setPanelOpen((prev) => !prev)}
          activeSection={activeSection}
        />

        {/* Scrollable Page Outlet */}
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-[#f8f9fa]">
          <Suspense fallback={<LoadingScreen message="Loading workspace…" />}>
            <Outlet />
          </Suspense>
        </main>
      </div>

      {/* ══ Global Modals ══ */}
      <InviteModal open={inviteOpen} onClose={() => setInviteOpen(false)} />
      <CreateSpaceWizard open={spaceWizardOpen} onClose={() => setSpaceWizardOpen(false)} />

      {/* Quick Create Modal */}
      <Modal open={createOpen} onClose={() => setCreateOpen(false)} title="Create New" size="md">
        <div className="grid gap-2">
          {[
            {
              icon: CheckSquare,
              color: 'bg-emerald-500/10 text-emerald-600 border border-emerald-500/20',
              title: 'New Task',
              desc: 'Create and assign a task to yourself or team',
              action: () => {
                setCreateOpen(false);
                navigate('/home/my-tasks?add=1');
              },
            },
            {
              icon: FolderKanban,
              color: 'bg-violet-500/10 text-violet-600 border border-violet-500/20',
              title: 'New Space / Project',
              desc: 'Organize tasks into folders, lists, and boards',
              action: () => {
                setCreateOpen(false);
                setSpaceWizardOpen(true);
              },
            },
            {
              icon: Users,
              color: 'bg-cyan-500/10 text-cyan-600 border border-cyan-500/20',
              title: 'New Team',
              desc: 'Group coworkers and manage team workload',
              action: () => {
                setCreateOpen(false);
                navigate('/teams/all');
              },
            },
            {
              icon: UserPlus,
              color: 'bg-amber-500/10 text-amber-600 border border-amber-500/20',
              title: 'Invite Member',
              desc: 'Add collaborators to this workspace via email',
              action: () => {
                setCreateOpen(false);
                setInviteOpen(true);
              },
            },
            {
              icon: Mail,
              color: 'bg-rose-500/10 text-rose-600 border border-rose-500/20',
              title: 'New Direct Message',
              desc: 'Send an instant notification or private message',
              action: () => {
                setCreateOpen(false);
                navigate('/inbox');
              },
            },
          ].map(({ icon: Icon, color, title, desc, action }) => (
            <button
              key={title}
              type="button"
              className="flex items-center gap-3.5 rounded-xl border border-gray-200 bg-white p-3 text-left transition-all duration-100 hover:border-brand-500/40 hover:bg-gray-50 hover:shadow-2xs"
              onClick={action}
            >
              <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${color}`}>
                <Icon className="h-5 w-5" />
              </span>
              <span className="flex flex-col min-w-0">
                <span className="text-[13.5px] font-semibold text-gray-900">{title}</span>
                <span className="text-[11.5px] text-gray-500">{desc}</span>
              </span>
            </button>
          ))}
        </div>
      </Modal>
    </div>
  );
}
