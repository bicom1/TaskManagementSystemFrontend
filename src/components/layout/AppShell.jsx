import { Suspense, useRef, useState, useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import {
  IconRail,
  getSectionFromPath,
  sectionOwnsPath,
  readStoredSection,
  storeSection,
} from './IconRail';
import { SidebarPanel } from './SidebarPanel';
import { TopBar } from './TopBar';
import { InviteModal } from '@/components/InviteModal';
import { CreateProjectFlow } from '@/features/spaces/components/CreateProjectFlow';
import { useCreateProjectUiStore } from '@/features/spaces/createProjectUiStore';
import { useLiveSpaces } from '@/features/projects/hooks/useProjects';
import { useLiveUsers, usePresenceSync } from '@/features/presence/usePresence';
import { cn } from '@/lib/utils';

export function AppShell() {
  const location = useLocation();
  const createBtnRef = useRef(null);

  const [activeSection, setActiveSection] = useState(() => {
    // Restore the section this tab was in, but only if it still contains the
    // current route — otherwise the URL decides (deep link, shared link, new tab).
    const stored = readStoredSection();
    if (stored && sectionOwnsPath(stored, location.pathname)) return stored;
    return getSectionFromPath(location.pathname);
  });
  const [panelOpen, setPanelOpen] = useState(true);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [inviteOpen, setInviteOpen] = useState(false);

  const createMenuOpen = useCreateProjectUiStore((s) => s.menuOpen);
  const createMenuCentered = useCreateProjectUiStore((s) => s.menuCentered);
  const spaceWizardOpen = useCreateProjectUiStore((s) => s.wizardOpen);
  const openCreateMenu = useCreateProjectUiStore((s) => s.openCreateMenu);
  const closeCreateMenu = useCreateProjectUiStore((s) => s.closeCreateMenu);
  const openCreateWizard = useCreateProjectUiStore((s) => s.openCreateWizard);
  const closeCreateWizard = useCreateProjectUiStore((s) => s.closeCreateWizard);

  useLiveSpaces();
  usePresenceSync();
  useLiveUsers();

  useEffect(() => {
    // Stay put when the section you are already in contains this route — only
    // routes that belong elsewhere move the rail.
    setActiveSection((current) =>
      sectionOwnsPath(current, location.pathname)
        ? current
        : getSectionFromPath(location.pathname)
    );
  }, [location.pathname]);

  useEffect(() => {
    storeSection(activeSection);
  }, [activeSection]);

  const handleSectionClick = (sectionId) => {
    if (activeSection === sectionId) {
      setPanelOpen((prev) => !prev);
    } else {
      setActiveSection(sectionId);
      setPanelOpen(true);
    }
  };

  const openCreate = ({ centered = true } = {}) => openCreateMenu({ centered });

  return (
    <div className="flex h-dvh max-h-dvh w-full overflow-hidden select-none bg-[#050508]">
      <div className="hidden h-full min-h-0 lg:flex shrink-0">
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
            onCreateClick={() => openCreate({ centered: true })}
            onAddProject={() => openCreate({ centered: true })}
          />
        )}
      </div>

      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-xs"
            onClick={() => setMobileOpen(false)}
          />
          <div className="absolute inset-y-0 left-0 flex animate-[slideRight_200ms_ease_both] z-10 shadow-2xl">
            <IconRail
              activeSection={activeSection}
              panelOpen
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
                openCreate({ centered: true });
              }}
              onAddProject={() => {
                setMobileOpen(false);
                openCreate({ centered: true });
              }}
            />
          </div>
        </div>
      )}

      <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden bg-[#f8f9fa]">
        <TopBar
          createButtonRef={createBtnRef}
          onMenuClick={() => setMobileOpen(true)}
          onInvite={() => setInviteOpen(true)}
          onCreate={() => openCreate({ centered: false })}
          panelOpen={panelOpen}
          onTogglePanel={() => setPanelOpen((prev) => !prev)}
          activeSection={activeSection}
        />

        <main
          className={cn(
            'flex min-h-0 flex-1 flex-col bg-[#f8f9fa]',
            // Inbox (all views) stays locked to the shell — never grow the document
            location.pathname.startsWith('/inbox')
              ? 'overflow-hidden'
              : 'overflow-x-hidden overflow-y-auto'
          )}
        >
          <div
            className={cn(
              'flex min-h-0 flex-col',
              location.pathname.startsWith('/inbox') && 'h-full overflow-hidden'
            )}
          >
            <Suspense fallback={null}>
              <Outlet />
            </Suspense>
          </div>
        </main>
      </div>

      <InviteModal open={inviteOpen} onClose={() => setInviteOpen(false)} />

      <CreateProjectFlow
        menuOpen={createMenuOpen}
        onMenuClose={closeCreateMenu}
        anchorRef={createBtnRef}
        menuCentered={createMenuCentered}
        wizardOpen={spaceWizardOpen}
        onWizardOpen={openCreateWizard}
        onWizardClose={closeCreateWizard}
      />
    </div>
  );
}
