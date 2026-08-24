import { Suspense, useState } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { CheckSquare, FolderKanban, Mail, UserPlus, Users } from 'lucide-react';
import { IconRail } from './IconRail';
import { HomeSidebar } from './HomeSidebar';
import { AppSidebar } from './AppSidebar';
import { TopBar } from './TopBar';
import { InviteModal } from '@/components/InviteModal';
import { CreateSpaceWizard } from '@/features/spaces/components/CreateSpaceWizard';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/utils';
import { LoadingScreen } from '@/components/ui/Spinner';
import { useLiveSpaces } from '@/features/projects/hooks/useProjects';

function isHomeSection(pathname) {
  return (
    pathname === '/' ||
    pathname.startsWith('/home') ||
    pathname.startsWith('/inbox')
  );
}

export function AppShell() {
  const location = useLocation();
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(false);
  const [homeSidebarCollapsed, setHomeSidebarCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [spaceWizardOpen, setSpaceWizardOpen] = useState(false);

  useLiveSpaces();

  const homeMode = isHomeSection(location.pathname);

  return (
    <div className="flex h-screen overflow-hidden border border-hairline bg-canvas">
      <div className="hidden h-full border-r border-hairline lg:flex">
        <IconRail pathname={location.pathname} />
        {homeMode ? (
          <HomeSidebar
            collapsed={homeSidebarCollapsed}
            onToggleCollapse={() => setHomeSidebarCollapsed((v) => !v)}
            onInvite={() => setInviteOpen(true)}
            onCreate={() => setCreateOpen(true)}
          />
        ) : (
          <AppSidebar
            collapsed={collapsed}
            onToggle={() => setCollapsed((v) => !v)}
            onInvite={() => setInviteOpen(true)}
            hideBrand
          />
        )}
      </div>

      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-ink/40" onClick={() => setMobileOpen(false)} />
          <div className="absolute inset-y-0 left-0 flex border-r border-hairline bg-paper shadow-xl">
            <IconRail pathname={location.pathname} />
            {homeMode ? (
              <HomeSidebar
                collapsed={false}
                onToggleCollapse={() => setMobileOpen(false)}
                onInvite={() => {
                  setMobileOpen(false);
                  setInviteOpen(true);
                }}
                onCreate={() => {
                  setMobileOpen(false);
                  setCreateOpen(true);
                }}
              />
            ) : (
              <div className="w-[260px]">
                <AppSidebar
                  collapsed={false}
                  onToggle={() => setMobileOpen(false)}
                  onInvite={() => {
                    setMobileOpen(false);
                    setInviteOpen(true);
                  }}
                  hideBrand
                />
              </div>
            )}
          </div>
        </div>
      )}

      <div className="flex min-w-0 flex-1 flex-col">
        <TopBar
          onMenuClick={() => setMobileOpen(true)}
          onInvite={() => setInviteOpen(true)}
          onCreate={() => setCreateOpen(true)}
        />
        <main className={cn('flex-1 overflow-x-hidden overflow-y-auto border-t border-hairline bg-canvas')}>
          <Suspense fallback={<LoadingScreen message="Loading workspace…" />}>
            <Outlet />
          </Suspense>
        </main>
      </div>

      <InviteModal open={inviteOpen} onClose={() => setInviteOpen(false)} />
      <CreateSpaceWizard open={spaceWizardOpen} onClose={() => setSpaceWizardOpen(false)} />

      <Modal open={createOpen} onClose={() => setCreateOpen(false)} title="Create">
        <div className="grid gap-2">
          <Button
            className="justify-start normal-case tracking-normal"
            onClick={() => {
              setCreateOpen(false);
              navigate('/home/my-tasks?add=1');
            }}
          >
            <CheckSquare className="h-4 w-4" />
            Add task
          </Button>
          <Button
            variant="outline"
            className="justify-start normal-case tracking-normal"
            onClick={() => {
              setCreateOpen(false);
              setSpaceWizardOpen(true);
            }}
          >
            <FolderKanban className="h-4 w-4" />
            New Space
          </Button>
          <Button
            variant="outline"
            className="justify-start normal-case tracking-normal"
            onClick={() => {
              setCreateOpen(false);
              navigate('/teams/all');
            }}
          >
            <Users className="h-4 w-4" />
            New team
          </Button>
          <Button
            variant="outline"
            className="justify-start normal-case tracking-normal"
            onClick={() => {
              setCreateOpen(false);
              setInviteOpen(true);
            }}
          >
            <UserPlus className="h-4 w-4" />
            Invite people
          </Button>
          <Button
            variant="outline"
            className="justify-start normal-case tracking-normal"
            onClick={() => {
              setCreateOpen(false);
              navigate('/inbox');
            }}
          >
            <Mail className="h-4 w-4" />
            New inbox message
          </Button>
        </div>
      </Modal>
    </div>
  );
}
