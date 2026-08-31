import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import {
  Inbox,
  MessageSquareReply,
  MessageSquareText,
  Video,
  CheckSquare,
  ChevronDown,
  ChevronRight,
  Plus,
  UserPlus,
  Hash,
  MoreHorizontal,
  MapPin,
  Building2,
  Search,
  ListFilter,
  PanelLeftClose,
  PanelLeftOpen,
  X,
  FolderKanban,
  Bell,
} from 'lucide-react';
import { useMemo, useState } from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { UserAvatar } from '@/components/UserAvatar';
import { useAuthStore } from '@/store/authStore';
import { useHomeOverview } from '@/features/home/hooks/useHome';
import { useLiveSpaces, useProjects } from '@/features/projects/hooks/useProjects';
import {
  useNotifications,
  useUnreadCount,
} from '@/features/notifications/hooks/useNotifications';
import { hasPermission, PERMISSIONS } from '@/lib/permissions';
import {
  projectPath,
} from '@/features/spaces/spaceKinds';
import { format, formatDistanceToNow } from 'date-fns';

const FILTERS = [
  { id: 'all', label: 'All' },
  { id: 'nav', label: 'Navigation' },
  { id: 'tasks', label: 'My Tasks' },
  { id: 'projects', label: 'Projects' },
  { id: 'teams', label: 'Teams' },
  { id: 'channels', label: 'Channels' },
  { id: 'upcoming', label: 'Meetings & Locations' },
];

function matchesQuery(text, q) {
  if (!q) return true;
  return String(text || '').toLowerCase().includes(q);
}

function locationSearchHasAdd() {
  if (typeof window === 'undefined') return false;
  return new URLSearchParams(window.location.search).get('add') === '1';
}

function sortByName(items) {
  return [...items].sort((a, b) =>
    String(a.name || '').localeCompare(String(b.name || ''), undefined, {
      sensitivity: 'base',
      numeric: true,
    })
  );
}

export function HomeSidebar({ onInvite, collapsed = false, onToggleCollapse }) {
  const [tasksOpen, setTasksOpen] = useState(true);
  const [projectsOpen, setProjectsOpen] = useState(true);
  const [inboxPreviewOpen, setInboxPreviewOpen] = useState(true);
  const [searchOpen, setSearchOpen] = useState(false);
  const [filterOpen, setFilterOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState('all');

  const user = useAuthStore((s) => s.user);
  const navigate = useNavigate();
  const location = useLocation();
  const { data: home } = useHomeOverview();
  const { data: projectsData } = useProjects({ limit: 100 });
  const { data: unreadCount = 0 } = useUnreadCount();
  const { data: notifRes } = useNotifications({ limit: 8 });
  useLiveSpaces();

  const showInvite = hasPermission(user, PERMISSIONS.USER_INVITE);
  const canViewProjects = hasPermission(user, PERMISSIONS.PROJECT_VIEW);

  const catalogProjects = projectsData?.data ?? [];
  const overviewProjects = home?.workspace?.projects ?? [];
  const teams = home?.workspace?.teams ?? [];
  const meetings = home?.cards?.meetings ?? [];
  const locations = home?.cards?.locations ?? [];
  const recentNotifications = notifRes?.data ?? notifRes ?? [];

  const q = query.trim().toLowerCase();

  const orderedProjects = useMemo(() => {
    return sortByName(catalogProjects).filter((p) => matchesQuery(p.name, q));
  }, [catalogProjects, q]);

  const homeLinks = useMemo(
    () =>
      [
        { to: '/inbox', label: 'Inbox', icon: Inbox, badge: unreadCount },
        { to: '/inbox?tab=notifications', label: 'Notifications', icon: Bell, badge: unreadCount },
        { to: '/inbox', label: 'Replies', icon: MessageSquareReply },
        { to: '/home/assigned-comments', label: 'Assigned Comments', icon: MessageSquareText },
        { to: '/home/meetings', label: 'Meetings', icon: Video },
        { to: '/home/meetings', label: 'Locations', icon: MapPin },
      ].filter((item) => matchesQuery(item.label, q)),
    [q, unreadCount]
  );

  const myTaskLinks = useMemo(
    () =>
      [
        { to: '/home/my-tasks?view=assigned', label: 'Assigned to me', tint: true },
        { to: '/home/my-tasks?view=today', label: 'Today & Overdue' },
        { to: '/home/my-tasks?view=personal', label: 'Personal List' },
        { to: '/home/my-tasks?add=1', label: 'Add task', icon: 'plus' },
      ].filter((item) => matchesQuery(item.label, q)),
    [q]
  );

  const filteredTeams = useMemo(
    () => teams.filter((t) => matchesQuery(t.name, q)),
    [teams, q]
  );

  const filteredProjects = useMemo(
    () => overviewProjects.filter((p) => matchesQuery(p.name, q)),
    [overviewProjects, q]
  );

  const filteredMeetings = useMemo(
    () => meetings.filter((m) => matchesQuery(m.title, q) || matchesQuery(m.team?.name, q)),
    [meetings, q]
  );

  const filteredLocations = useMemo(
    () =>
      locations.filter(
        (loc) => matchesQuery(loc.name, q) || matchesQuery(loc.city, q)
      ),
    [locations, q]
  );

  const activeEntityId = useMemo(() => {
    const m = location.pathname.match(/^\/(?:spaces|projects)\/([a-f0-9]{24})/i);
    return m?.[1] || null;
  }, [location.pathname]);

  const showNav = filter === 'all' || filter === 'nav';
  const showTasks = filter === 'all' || filter === 'tasks';
  const showTeams = filter === 'all' || filter === 'teams';
  const showProjects = (filter === 'all' || filter === 'projects') && canViewProjects;
  const showChannels = filter === 'all' || filter === 'channels';
  const showUpcoming = filter === 'all' || filter === 'upcoming';

  if (collapsed) {
    return (
      <aside className="sidebar-dark flex h-full w-12 shrink-0 flex-col items-center py-3" style={{ backgroundColor: 'var(--color-sidebar-bg)' }}>
        <button
          type="button"
          onClick={onToggleCollapse}
          className="mb-3 flex h-9 w-9 items-center justify-center rounded-xl transition-all duration-[120ms] hover:bg-[var(--color-sidebar-surface)]"
          style={{ color: 'var(--color-sidebar-text)' }}
          title="Open sidebar"
          aria-label="Open sidebar"
        >
          <PanelLeftOpen className="h-4 w-4" />
        </button>
        <button
          type="button"
          onClick={() => {
            onToggleCollapse?.();
            navigate('/inbox');
          }}
          className="relative mb-2 flex h-9 w-9 items-center justify-center rounded-xl transition-all duration-[120ms] hover:bg-[var(--color-sidebar-surface)]"
          style={{ color: 'var(--color-sidebar-text)' }}
          title="Inbox"
          aria-label="Inbox"
        >
          <Inbox className="h-4 w-4" />
          {unreadCount > 0 && (
            <span className="absolute right-1 top-1 h-2 w-2 rounded-full bg-brand-400" />
          )}
        </button>
        <button
          type="button"
          onClick={() => {
            setSearchOpen(true);
            setFilterOpen(false);
            onToggleCollapse?.();
          }}
          className="mb-1 flex h-9 w-9 items-center justify-center rounded-xl transition-all duration-[120ms] hover:bg-[var(--color-sidebar-surface)]"
          style={{ color: 'var(--color-sidebar-text)' }}
          title="Search sidebar"
          aria-label="Search sidebar"
        >
          <Search className="h-4 w-4" />
        </button>
        <button
          type="button"
          onClick={() => {
            setFilterOpen(true);
            setSearchOpen(false);
            onToggleCollapse?.();
          }}
          className="flex h-9 w-9 items-center justify-center rounded-xl transition-all duration-[120ms] hover:bg-[var(--color-sidebar-surface)]"
          style={{ color: 'var(--color-sidebar-text)' }}
          title="Filter sidebar"
          aria-label="Filter sidebar"
        >
          <ListFilter className="h-4 w-4" />
        </button>
        {showInvite && (
          <button
            type="button"
            onClick={onInvite}
            className="mt-auto flex h-9 w-9 items-center justify-center rounded-xl transition-all duration-[120ms] hover:bg-[var(--color-sidebar-surface)]"
            style={{ color: 'var(--color-sidebar-text)' }}
            title="Invite"
            aria-label="Invite"
          >
            <UserPlus className="h-4 w-4" />
          </button>
        )}
      </aside>
    );
  }

  return (
    <aside className="sidebar-dark flex h-full w-[248px] shrink-0 flex-col" style={{ backgroundColor: 'var(--color-sidebar-bg)' }}>
      {/* Top toolbar: collapse + search + filter */}
      <div className="p-2.5" style={{ borderBottom: '1px solid var(--color-sidebar-border)' }}>
        <div className="mb-2 flex items-center gap-1">
          <button
            type="button"
            onClick={onToggleCollapse}
            className="flex h-8 w-8 items-center justify-center rounded-lg transition-all duration-[120ms] hover:bg-[var(--color-sidebar-surface)]"
          style={{ color: 'var(--color-sidebar-text)' }}
            title="Close sidebar"
            aria-label="Close sidebar"
          >
            <PanelLeftClose className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => {
              setSearchOpen((v) => !v);
              setFilterOpen(false);
            }}
            className={cn(
              'flex h-8 w-8 items-center justify-center rounded-lg transition-all duration-[120ms]',
              searchOpen ? 'bg-[var(--color-sidebar-active)] text-[var(--color-sidebar-text-active)]' : 'hover:bg-[var(--color-sidebar-surface)]'
            )}
            style={{ color: 'var(--color-sidebar-text)' }}
            title="Search sidebar"
            aria-label="Search sidebar"
          >
            <Search className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => {
              setFilterOpen((v) => !v);
              setSearchOpen(false);
            }}
            className={cn(
              'flex h-8 w-8 items-center justify-center rounded-lg transition-all duration-[120ms]',
              filterOpen || filter !== 'all'
                ? 'bg-[var(--color-sidebar-active)] text-[var(--color-sidebar-text-active)]'
                : 'hover:bg-[var(--color-sidebar-surface)]'
            )}
            style={{ color: 'var(--color-sidebar-text)' }}
            title="Filter sidebar"
            aria-label="Filter sidebar"
          >
            <ListFilter className="h-4 w-4" />
          </button>
        </div>

        {searchOpen && (
          <div className="relative mb-1">
            <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 pointer-events-none" style={{ color: 'var(--color-sidebar-text)' }} />
            <Input
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search sidebar…"
              className="h-8 pl-8 pr-8 text-[13px] border-[rgba(255,255,255,0.12)] bg-[var(--color-sidebar-surface)] text-[var(--color-sidebar-text-active)] placeholder:text-[var(--color-sidebar-text)] focus-visible:border-brand-400"
            />
            {query && (
              <button
                type="button"
                onClick={() => setQuery('')}
                className="absolute right-2 top-1/2 -translate-y-1/2 transition-opacity hover:opacity-100 opacity-60"
                style={{ color: 'var(--color-sidebar-text)' }}
                aria-label="Clear search"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        )}

        {filterOpen && (
          <div className="mb-1 flex flex-wrap gap-1 rounded-xl p-1.5" style={{ background: 'var(--color-sidebar-surface)', border: '1px solid var(--color-sidebar-border)' }}>
            {FILTERS.map((f) => (
              <button
                key={f.id}
                type="button"
                onClick={() => setFilter(f.id)}
                className={cn(
                  'rounded-lg px-2 py-1 text-[11px] font-medium transition-all duration-[100ms]',
                  filter === f.id
                    ? 'bg-brand-500 text-white shadow-sm'
                    : 'hover:bg-[var(--color-sidebar-active)]'
                )}
                style={{ color: filter === f.id ? 'white' : 'var(--color-sidebar-text)' }}
              >
                {f.label}
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="flex-1 overflow-y-auto px-2 py-2">
        {/* Inbox + live notification previews (chat-app style) */}
        {showNav && (
          <div className="mb-3 overflow-hidden rounded-xl" style={{ border: '1px solid var(--color-sidebar-border)', backgroundColor: 'var(--color-sidebar-surface)' }}>
            <button
              type="button"
              onClick={() => setInboxPreviewOpen((v) => !v)}
              className="flex w-full items-center gap-2 px-2.5 py-2 text-left transition-all duration-[120ms] hover:bg-[var(--color-sidebar-active)]"
            >
              {inboxPreviewOpen ? (
                <ChevronDown className="h-3.5 w-3.5 shrink-0" style={{ color: 'var(--color-sidebar-text)' }} />
              ) : (
                <ChevronRight className="h-3.5 w-3.5 shrink-0" style={{ color: 'var(--color-sidebar-text)' }} />
              )}
              <Bell className="h-3.5 w-3.5 shrink-0" style={{ color: 'var(--color-sidebar-text)' }} />
              <span className="flex-1 text-[10px] font-semibold uppercase tracking-[0.1em]" style={{ color: 'var(--color-sidebar-text)', opacity: 0.5 }}>
                Notifications
              </span>
              {unreadCount > 0 && (
                <span className="rounded-full bg-brand-500 px-1.5 py-0.5 text-[10px] font-bold tabular-nums text-white">
                  {unreadCount > 99 ? '99+' : unreadCount}
                </span>
              )}
            </button>

            {inboxPreviewOpen && (
              <div style={{ borderTop: '1px solid var(--color-sidebar-border)', backgroundColor: 'var(--color-sidebar-bg)' }}>
                {Array.isArray(recentNotifications) && recentNotifications.length > 0 ? (
                  <div className="max-h-[168px] overflow-y-auto">
                    {recentNotifications.slice(0, 6).map((n) => (
                      <button
                        key={n._id}
                        type="button"
                        onClick={() => navigate('/inbox?tab=notifications')}
                        className={cn(
                          'flex w-full gap-2 px-2.5 py-2 text-left transition-all duration-[100ms] hover:bg-[var(--color-sidebar-surface)]',
                          !n.isRead && 'bg-brand-500/5'
                        )}
                        style={{ borderBottom: '1px solid var(--color-sidebar-border)' }}
                      >
                        <span
                          className={cn(
                            'mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full',
                            n.isRead ? 'opacity-0' : 'bg-brand-400'
                          )}
                        />
                        <div className="min-w-0 flex-1">
                          <p
                            className={cn(
                              'line-clamp-2 text-[11px] leading-snug',
                              n.isRead ? '' : 'font-semibold'
                            )}
                            style={{ color: n.isRead ? 'var(--color-sidebar-text)' : 'var(--color-sidebar-text-active)' }}
                          >
                            {n.message}
                          </p>
                          {n.createdAt && (
                            <p className="mt-0.5 text-[10px]" style={{ color: 'var(--color-sidebar-text)', opacity: 0.5 }}>
                              {formatDistanceToNow(new Date(n.createdAt), { addSuffix: true })}
                            </p>
                          )}
                        </div>
                      </button>
                    ))}
                  </div>
                ) : (
                  <p className="px-2.5 py-2.5 text-[11px]" style={{ color: 'var(--color-sidebar-text)', opacity: 0.5 }}>
                    You&apos;re all caught up
                  </p>
                )}
              </div>
            )}

            <NavLink
              to="/inbox"
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-2.5 px-2.5 py-2.5 text-[13px] font-semibold transition-all duration-[120ms]',
                  isActive ? 'bg-[var(--color-sidebar-active)] text-[var(--color-sidebar-text-active)]' : 'hover:bg-[var(--color-sidebar-surface)]'
                )
              }
              style={{ borderTop: '1px solid var(--color-sidebar-border)', color: 'var(--color-sidebar-text-active)' }}
            >
              <Inbox className="h-4 w-4 shrink-0" />
              <span className="flex-1 truncate">Inbox</span>
              {unreadCount > 0 && (
                <span className="rounded-full bg-brand-500 px-1.5 py-0.5 text-[10px] font-bold tabular-nums text-white">
                  {unreadCount > 99 ? '99+' : unreadCount}
                </span>
              )}
            </NavLink>
          </div>
        )}

        {showNav && (
          <nav className="space-y-0.5">
            {homeLinks.length === 0 && q ? (
              <p className="px-2 py-1 text-[12px]" style={{ color: 'var(--color-sidebar-text)', opacity: 0.5 }}>No matching links</p>
            ) : (
              homeLinks
                .filter((item) => item.label !== 'Inbox')
                .map((item) => {
                  const Icon = item.icon;
                  return (
                    <NavLink
                      key={`${item.to}-${item.label}`}
                      to={item.to}
                      className={({ isActive }) =>
                        cn(
                          'flex items-center gap-2.5 rounded-xl px-2.5 py-2 text-[13px] font-medium transition-all duration-[120ms]',
                          isActive
                            ? 'bg-[var(--color-sidebar-active)] text-[var(--color-sidebar-text-active)]'
                            : 'text-[var(--color-sidebar-text)] hover:bg-[var(--color-sidebar-surface)] hover:text-[var(--color-sidebar-text-active)]'
                        )
                      }
                    >
                      <Icon className="h-[17px] w-[17px] shrink-0 opacity-75" />
                      <span className="min-w-0 flex-1 truncate">{item.label}</span>
                      {item.badge > 0 && (
                        <span className="rounded-full bg-brand-500 px-1.5 py-0.5 text-[10px] font-bold tabular-nums text-white">
                          {item.badge > 99 ? '99+' : item.badge}
                        </span>
                      )}
                    </NavLink>
                  );
                })
            )}
          </nav>
        )}

        {showTasks && (
          <div className={cn(showNav && 'mt-3')}>
            <button
              type="button"
              onClick={() => setTasksOpen((v) => !v)}
              className="flex w-full items-center gap-2 rounded-xl px-2.5 py-2 text-[13px] font-semibold transition-all duration-[120ms] hover:bg-[var(--color-sidebar-surface)]"
              style={{ color: 'var(--color-sidebar-text-active)' }}
            >
              {tasksOpen ? (
                <ChevronDown className="h-3.5 w-3.5" />
              ) : (
                <ChevronRight className="h-3.5 w-3.5" />
              )}
              <CheckSquare className="h-[17px] w-[17px]" />
              <span className="flex-1 text-left">My Tasks</span>
            </button>
            {tasksOpen && (
              <div className="ml-2 space-y-0.5 border-l pl-2" style={{ borderColor: 'var(--color-sidebar-border)' }}>
                {myTaskLinks.length === 0 && q ? (
                  <p className="px-2 py-1 text-[11px]" style={{ color: 'var(--color-sidebar-text)', opacity: 0.5 }}>No matching tasks</p>
                ) : (
                  myTaskLinks.map((item) => (
                    <NavLink
                      key={item.to}
                      to={item.to}
                      className={({ isActive }) =>
                        cn(
                          'flex items-center gap-2 rounded-xl px-2.5 py-1.5 text-[12px] transition-all duration-[120ms]',
                          isActive || (item.icon === 'plus' && locationSearchHasAdd(item.to))
                            ? 'bg-[var(--color-sidebar-active)] font-semibold text-[var(--color-sidebar-text-active)]'
                            : 'text-[var(--color-sidebar-text)] hover:bg-[var(--color-sidebar-surface)] hover:text-[var(--color-sidebar-text-active)]',
                          item.icon === 'plus' && 'text-brand-400'
                        )
                      }
                    >
                      {item.icon === 'plus' ? (
                        <Plus className="h-4 w-4 text-brand-400" />
                      ) : item.tint ? (
                        <UserAvatar
                          user={user}
                          size="xs"
                          rounded="md"
                          className="h-5 w-5 text-[10px]"
                        />
                      ) : (
                        <span className="h-5 w-5" />
                      )}
                      <span className="truncate">{item.label}</span>
                    </NavLink>
                  ))
                )}
                {!q && (
                  <button
                    type="button"
                    className="flex w-full items-center gap-2 rounded-xl px-2.5 py-1.5 text-[12px] transition-all duration-[120ms] hover:bg-[var(--color-sidebar-surface)]"
                    style={{ color: 'var(--color-sidebar-text)', opacity: 0.6 }}
                  >
                    <MoreHorizontal className="h-4 w-4" />
                    More
                  </button>
                )}
              </div>
            )}
          </div>
        )}

        {showProjects && (
          <div className="mt-5">
            <div className="mb-0.5 flex items-center gap-1 px-1">
              <button
                type="button"
                onClick={() => setProjectsOpen((v) => !v)}
                className="rounded-md p-1 transition-all duration-[120ms] hover:bg-[var(--color-sidebar-surface)]"
                style={{ color: 'var(--color-sidebar-text)' }}
                title={projectsOpen ? 'Collapse projects' : 'Expand projects'}
                aria-expanded={projectsOpen}
              >
                <ChevronDown
                  className={cn(
                    'h-3.5 w-3.5 transition-transform',
                    !projectsOpen && '-rotate-90'
                  )}
                />
              </button>
              <NavLink
                to="/projects"
                className={({ isActive }) =>
                  cn(
                    'flex min-w-0 flex-1 items-center gap-1.5 truncate rounded-lg px-1.5 py-1.5 text-[12px] font-semibold uppercase tracking-[0.08em] transition-all duration-[120ms]',
                    isActive && !activeEntityId
                      ? 'text-[var(--color-sidebar-text-active)]'
                      : 'hover:text-[var(--color-sidebar-text-active)]'
                  )
                }
                style={{ color: 'var(--color-sidebar-text)', opacity: 0.6 }}
              >
                <FolderKanban className="h-3.5 w-3.5 shrink-0" />
                <span className="truncate">Projects</span>
                <span className="ml-auto tabular-nums text-[10px] font-bold" style={{ color: 'var(--color-sidebar-text)', opacity: 0.4 }}>
                  {orderedProjects.length}
                </span>
              </NavLink>
            </div>
            {projectsOpen && (
              <div className="ml-2 space-y-0.5 border-l pl-2" style={{ borderColor: 'var(--color-sidebar-border)' }}>
                {orderedProjects.length === 0 ? (
                  <p className="px-2 py-2 text-[11px]" style={{ color: 'var(--color-sidebar-text)', opacity: 0.4 }}>
                    {q ? 'No matching projects' : 'No projects yet'}
                  </p>
                ) : (
                  orderedProjects.map((project) => (
                    <NavLink
                      key={project._id}
                      to={projectPath(project._id)}
                      className={cn(
                        'flex items-center gap-2 rounded-lg px-2 py-1.5 text-[12px] transition-all duration-[120ms]',
                        activeEntityId === String(project._id)
                          ? 'bg-[var(--color-sidebar-active)] font-semibold text-[var(--color-sidebar-text-active)]'
                          : 'text-[var(--color-sidebar-text)] hover:bg-[var(--color-sidebar-surface)] hover:text-[var(--color-sidebar-text-active)]'
                      )}
                    >
                      <span
                        className="flex h-5 w-5 shrink-0 items-center justify-center rounded-md text-[9px] font-bold text-white shadow-sm"
                        style={{ backgroundColor: project.color || 'var(--color-brand-600)' }}
                      >
                        {(project.icon || project.name?.[0] || 'P').toString().slice(0, 1)}
                      </span>
                      <span className="min-w-0 flex-1 truncate">{project.name}</span>
                      {project.openTaskCount > 0 && (
                        <span className="shrink-0 tabular-nums text-[10px] font-bold" style={{ color: 'var(--color-sidebar-text)', opacity: 0.4 }}>
                          {project.openTaskCount}
                        </span>
                      )}
                    </NavLink>
                  ))
                )}
              </div>
            )}
          </div>
        )}

        {showTeams && (
          <div className="mt-5 px-2.5">
            <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.1em]" style={{ color: 'var(--color-sidebar-text)', opacity: 0.45 }}>
              My Teams
            </p>
            <div className="space-y-0.5">
              {filteredTeams.length === 0 ? (
                <p className="px-2 py-1 text-[11px]" style={{ color: 'var(--color-sidebar-text)', opacity: 0.4 }}>
                  {q ? 'No matching teams' : 'Join a team to see it here'}
                </p>
              ) : (
                filteredTeams.map((team) => (
                  <button
                    key={team._id}
                    type="button"
                    onClick={() => navigate(`/teams/${team._id}`)}
                    className="flex w-full items-center gap-2 truncate rounded-xl px-2 py-1.5 text-left text-[13px] transition-all duration-[120ms] hover:bg-[var(--color-sidebar-surface)] hover:text-[var(--color-sidebar-text-active)]"
                    style={{ color: 'var(--color-sidebar-text)' }}
                  >
                    <Building2 className="h-3.5 w-3.5 shrink-0 opacity-60" />
                    <span className="truncate">{team.name}</span>
                  </button>
                ))
              )}
            </div>
          </div>
        )}

        {showChannels && (
          <>
            <div className="mt-5 px-2.5">
              <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.1em]" style={{ color: 'var(--color-sidebar-text)', opacity: 0.45 }}>
                AI Chats
              </p>
              <button
                type="button"
                onClick={() => navigate('/home')}
                className="flex w-full items-center gap-2 rounded-xl px-2 py-2 text-[13px] transition-all duration-[120ms] hover:bg-[var(--color-sidebar-surface)] hover:text-[var(--color-sidebar-text-active)]"
                style={{ color: 'var(--color-sidebar-text)' }}
              >
                <Plus className="h-3.5 w-3.5" />
                Ask, Build, Create
              </button>
            </div>

            <div className="mt-5 px-2.5">
              <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.1em]" style={{ color: 'var(--color-sidebar-text)', opacity: 0.45 }}>
                Channels
              </p>
              <div className="space-y-0.5">
                {filteredProjects.length === 0 ? (
                  <p className="px-2 py-1 text-[11px]" style={{ color: 'var(--color-sidebar-text)', opacity: 0.4 }}>
                    {q ? 'No matching channels' : 'Projects appear when you join a team'}
                  </p>
                ) : (
                  filteredProjects.slice(0, 8).map((p) => (
                    <NavLink
                      key={p._id}
                      to={`/projects/${p._id}`}
                      className={({ isActive }) =>
                        cn(
                          'flex items-center gap-2 truncate rounded-xl px-2 py-1.5 text-[12px] transition-all duration-[120ms]',
                          isActive
                            ? 'bg-[var(--color-sidebar-active)] font-semibold text-[var(--color-sidebar-text-active)]'
                            : 'text-[var(--color-sidebar-text)] hover:bg-[var(--color-sidebar-surface)] hover:text-[var(--color-sidebar-text-active)]'
                        )
                      }
                    >
                      <Hash className="h-3.5 w-3.5 shrink-0 opacity-60" />
                      <span className="truncate">{p.name}</span>
                    </NavLink>
                  ))
                )}
              </div>
            </div>
          </>
        )}

        {showUpcoming && (filteredMeetings.length > 0 || filteredLocations.length > 0) && (
          <div className="mt-5 px-2.5 pb-3">
            <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.1em]" style={{ color: 'var(--color-sidebar-text)', opacity: 0.45 }}>
              Upcoming
            </p>
            {filteredMeetings.slice(0, 3).map((m) => (
              <button
                key={m._id}
                type="button"
                onClick={() => navigate('/home/meetings')}
                className="mb-1 flex w-full flex-col rounded-xl px-2 py-1.5 text-left transition-all duration-[120ms] hover:bg-[var(--color-sidebar-surface)]"
              >
                <span className="truncate text-[13px]" style={{ color: 'var(--color-sidebar-text-active)' }}>{m.title}</span>
                <span className="text-[11px]" style={{ color: 'var(--color-sidebar-text)', opacity: 0.5 }}>
                  {format(new Date(m.startsAt), 'MMM d · h:mm a')}
                  {m.team?.name ? ` · ${m.team.name}` : ''}
                </span>
              </button>
            ))}
            {filteredLocations.slice(0, 2).map((loc) => (
              <div
                key={loc._id}
                className="flex items-center gap-2 px-2 py-1 text-[11px]"
                style={{ color: 'var(--color-sidebar-text)', opacity: 0.5 }}
              >
                <MapPin className="h-3 w-3" />
                <span className="truncate">
                  {loc.name}
                  {loc.city ? ` · ${loc.city}` : ''}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {showInvite && (
        <div className="p-2" style={{ borderTop: '1px solid var(--color-sidebar-border)' }}>
          <button
            type="button"
            onClick={onInvite}
            className="flex w-full items-center gap-2 rounded-xl px-2.5 py-2 text-[13px] font-medium transition-all duration-[120ms] hover:bg-[var(--color-sidebar-surface)] hover:text-[var(--color-sidebar-text-active)]"
            style={{ color: 'var(--color-sidebar-text)' }}
          >
            <UserPlus className="h-[17px] w-[17px] opacity-70" />
            Invite
          </button>
        </div>
      )}
    </aside>
  );
}
