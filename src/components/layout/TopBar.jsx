import { useEffect, useState, forwardRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  Bell,
  LogOut,
  Menu,
  Plus,
  Search,
  Settings,
  UserPlus,
  PanelLeftClose,
  PanelLeftOpen,
  ChevronRight,
  Home,
  LayoutGrid,
  Grid,
  Users,
  Calendar,
  Sparkles,
} from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { useLogout } from '@/features/auth/hooks/useAuth';
import { useUnreadCount, useLiveNotifications } from '@/features/notifications/hooks/useNotifications';
import { useLiveMessages } from '@/features/messages/hooks/useMessages';
import { useLiveChatNotifications } from '@/features/chat/hooks/useChat';
import { unlockNotifySound } from '@/lib/notifySound';
import { hasPermission, PERMISSIONS } from '@/lib/permissions';
import { canInvite, getRoleLabel } from '@/lib/roles';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { UserAvatar } from '@/components/UserAvatar';
import { cn } from '@/lib/utils';

/**
 * Keys here MUST match the section ids produced by getSectionFromPath()
 * in IconRail.jsx (home | planner | ai | teams | dashboard | more).
 */
const SECTION_ICONS = {
  home: Home,
  planner: Calendar,
  ai: Sparkles,
  teams: Users,
  dashboard: LayoutGrid,
  more: Grid,
};

const SECTION_NAMES = {
  home: 'Home',
  planner: 'Planner',
  ai: 'AI',
  teams: 'Teams',
  dashboard: 'Dashboards',
  more: 'More',
};

/**
 * TopBar — ClickUp 3.0 Header
 * Contains sidebar toggle, breadcrumb path, universal search, quick create, and user profile.
 */
export const TopBar = forwardRef(function TopBar(
  { onMenuClick, onInvite, onCreate, panelOpen, onTogglePanel, activeSection = 'home', createButtonRef },
  _ref
) {
  const [accountOpen, setAccountOpen] = useState(false);
  const [search, setSearch] = useState('');
  const location = useLocation();
  const user = useAuthStore((s) => s.user);
  const logout = useLogout();
  const navigate = useNavigate();
  const { data: unreadCount = 0 } = useUnreadCount();

  useLiveNotifications();
  useLiveMessages();
  useLiveChatNotifications();

  useEffect(() => {
    unlockNotifySound();
  }, []);

  const showInvite = canInvite(user?.role) || hasPermission(user, PERMISSIONS.USER_INVITE);

  const CurrentIcon = SECTION_ICONS[activeSection] || Home;
  const sectionTitle = SECTION_NAMES[activeSection] || 'Workspace';

  // Derive sub-page breadcrumb label
  const getSubpageTitle = () => {
    const p = location.pathname;
    if (p.includes('/my-tasks')) return 'My Tasks';
    if (p.includes('/agenda')) return 'Agenda';
    if (p.includes('/meetings')) return 'Meetings';
    if (p.includes('/assigned-comments')) return 'Assigned Comments';
    if (p === '/all-tasks') return 'All Tasks';
    if (p.includes('/teams/people')) return 'All People';
    if (p.includes('/teams/all')) return 'All Teams';
    if (p.includes('/teams/org')) return 'Org Chart';
    if (p.includes('/teams/analytics')) return 'Analytics';
    if (p.includes('/projects/')) return 'Board View';
    if (p === '/projects') return 'All Spaces';
    if (p === '/boards') return 'Task Boards';
    if (p === '/inbox') return 'Inbox';
    if (p.startsWith('/inbox') && p.includes('view=chat')) return 'Chat';
    if (p.startsWith('/inbox') && p.includes('view=queries')) return 'Queries';
    if (p === '/approvals') return 'Approval Queue';
    if (p === '/reports') return 'Overview';
    if (p === '/audit') return 'System Logs';
    if (p.startsWith('/ai/chat')) return 'Chat';
    if (p === '/ai/skills') return 'Skills';
    if (p === '/ai/analytics') return 'Analytics';
    if (p === '/ai/connections') return 'Connections';
    if (p === '/ai/agents/new') return 'Create Agent';
    if (p === '/ai/agents/mine') return 'My Agents';
    if (p === '/ai/agents') return 'All Agents';
    if (p === '/ai') return 'Ask or Create';
    if (p === '/settings') return 'Preferences';
    return null;
  };

  const subpage = getSubpageTitle();

  const closeAccount = () => setAccountOpen(false);

  const goToSettings = () => {
    closeAccount();
    navigate('/settings');
  };

  const confirmSignOut = () => {
    closeAccount();
    logout.mutate();
  };

  return (
    <>
      <header className="flex h-[52px] shrink-0 items-center justify-between border-b border-border-subtle bg-surface-0/85 px-3 backdrop-blur-md lg:px-4">
        {/* ── Left: Sidebar Collapse Toggle & Breadcrumb ── */}
        <div className="flex min-w-0 items-center gap-2">
          <button
            type="button"
            className="flex h-8 w-8 items-center justify-center rounded-lg text-text-secondary transition-colors duration-[120ms] hover:bg-surface-2 hover:text-text-primary lg:hidden"
            onClick={onMenuClick}
            aria-label="Open navigation menu"
          >
            <Menu className="h-4 w-4" />
          </button>

          <button
            type="button"
            onClick={onTogglePanel}
            className="hidden h-7 w-7 items-center justify-center rounded-lg text-text-muted transition-colors duration-[120ms] hover:bg-surface-2 hover:text-text-primary lg:flex"
            title={panelOpen ? 'Collapse sidebar panel' : 'Expand sidebar panel'}
            aria-label="Toggle panel"
          >
            {panelOpen ? <PanelLeftClose className="h-4 w-4" /> : <PanelLeftOpen className="h-4 w-4" />}
          </button>

          <div className="flex items-center gap-1.5 truncate text-[13px]">
            <span className="flex items-center gap-1.5 truncate font-semibold tracking-[-0.01em] text-text-primary">
              <CurrentIcon className="h-3.5 w-3.5 shrink-0 text-text-muted" strokeWidth={2} />
              <span>{sectionTitle}</span>
            </span>

            {subpage && (
              <>
                <ChevronRight className="h-3 w-3 shrink-0 text-text-disabled" />
                <span className="truncate font-normal text-text-muted">{subpage}</span>
              </>
            )}
          </div>
        </div>

        {/* ── Center: Search Bar ── */}
        <div className="relative mx-auto hidden w-full max-w-md flex-1 px-4 md:block">
          <Search className="pointer-events-none absolute left-7 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-text-muted" />
          <Input
            placeholder="Search tasks, spaces, people…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-8 rounded-lg border-transparent bg-surface-1 pl-8 pr-14 text-[12.5px] placeholder:text-text-muted hover:bg-surface-2 focus-visible:border-brand-400 focus-visible:bg-surface-0"
          />
          <kbd className="pointer-events-none absolute right-7 top-1/2 flex h-5 -translate-y-1/2 select-none items-center gap-0.5 rounded border border-border-subtle bg-surface-0 px-1.5 text-[10px] font-semibold text-text-muted">
            ⌘K
          </kbd>
        </div>

        {/* ── Right Actions ── */}
        <div className="flex shrink-0 items-center gap-1.5">
          {onCreate && (
            <Button
              ref={createButtonRef}
              size="sm"
              className="h-8 gap-1.5 rounded-lg px-2.5 text-[12px] font-semibold"
              onClick={onCreate}
            >
              <Plus className="h-3.5 w-3.5" />
              <span>New</span>
            </Button>
          )}

          {showInvite && (
            <Button
              variant="ghost"
              size="sm"
              className="hidden h-8 gap-1.5 rounded-lg px-2.5 text-[12px] sm:inline-flex"
              onClick={onInvite}
            >
              <UserPlus className="h-3.5 w-3.5 opacity-70" />
              <span>Invite</span>
            </Button>
          )}

          <Link
            to="/inbox?view=activity"
            className="relative flex h-8 w-8 items-center justify-center rounded-lg text-text-secondary transition-colors duration-[120ms] hover:bg-surface-2 hover:text-text-primary"
            aria-label={`Notifications (${unreadCount} unread)`}
          >
            <Bell className="h-4 w-4" />
            {unreadCount > 0 && (
              <span
                aria-hidden
                className={cn(
                  'absolute -right-0.5 -top-0.5 flex h-4 min-w-[16px] items-center justify-center rounded-full px-1',
                  'bg-brand-500 text-[9px] font-semibold tabular-nums text-white ring-2 ring-surface-0'
                )}
              >
                {unreadCount > 99 ? '99+' : unreadCount}
              </span>
            )}
          </Link>

          <button
            type="button"
            onClick={() => setAccountOpen(true)}
            className={cn(
              'flex h-8 items-center gap-2 rounded-lg px-1 pr-2',
              'transition-colors duration-[120ms]',
              'hover:bg-surface-2',
              accountOpen && 'bg-surface-2'
            )}
            aria-haspopup="dialog"
            aria-expanded={accountOpen}
            title="Account"
          >
            <UserAvatar user={user} name={user?.name || 'User'} size="xs" className="h-6 w-6 rounded-md" />
            <span className="hidden max-w-[110px] truncate text-[12.5px] font-medium text-text-primary md:inline">
              {user?.name}
            </span>
          </button>
        </div>
      </header>

      {/* Compact centered account modal — avoids header dropdown overlap on busy pages */}
      <Modal
        open={accountOpen}
        onClose={closeAccount}
        title="Account"
        description="Manage your session for this workspace."
        size="sm"
        className="max-w-[380px]"
        bodyClassName="space-y-4 !py-4"
      >
        <div className="flex items-center gap-3 rounded-xl border border-border-subtle bg-surface-1 px-3.5 py-3">
          <UserAvatar user={user} name={user?.name || 'User'} size="md" />
          <div className="min-w-0 flex-1">
            <p className="truncate text-[14px] font-semibold text-text-primary">{user?.name || 'User'}</p>
            <p className="truncate text-[12px] text-text-muted">{user?.email}</p>
            <span className="mt-1.5 inline-flex rounded-md bg-brand-50 px-1.5 py-0.5 text-[10px] font-semibold text-brand-700">
              {getRoleLabel(user?.role)}
            </span>
          </div>
        </div>

        <button
          type="button"
          onClick={goToSettings}
          className="flex w-full items-center gap-2.5 rounded-xl border border-border-subtle px-3.5 py-2.5 text-left text-[13px] font-medium text-text-secondary transition hover:bg-surface-1 hover:text-text-primary"
        >
          <Settings className="h-4 w-4 shrink-0 opacity-70" />
          Account settings
        </button>

        <div className="flex items-center justify-end gap-2 border-t border-border-subtle pt-4">
          <Button type="button" variant="outline" size="sm" onClick={closeAccount}>
            Stay signed in
          </Button>
          <Button
            type="button"
            size="sm"
            variant="destructive"
            className="gap-1.5"
            disabled={logout.isPending}
            onClick={confirmSignOut}
          >
            <LogOut className="h-3.5 w-3.5" />
            {logout.isPending ? 'Signing out…' : 'Sign out'}
          </Button>
        </div>
      </Modal>
    </>
  );
});
