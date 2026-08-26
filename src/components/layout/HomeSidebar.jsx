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
  isProjectKind,
  isSpaceKind,
  projectPath,
  spacePath,
} from '@/features/spaces/spaceKinds';
import { format, formatDistanceToNow } from 'date-fns';

const FILTERS = [
  { id: 'all', label: 'All' },
  { id: 'nav', label: 'Navigation' },
  { id: 'tasks', label: 'My Tasks' },
  { id: 'spaces', label: 'Spaces & Projects' },
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

export function HomeSidebar({ onInvite, onCreate, collapsed = false, onToggleCollapse }) {
  const [tasksOpen, setTasksOpen] = useState(true);
  const [spacesOpen, setSpacesOpen] = useState(true);
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

  const spaces = useMemo(() => {
    const list = catalogProjects.filter((p) => isSpaceKind(p.kind));
    return sortByName(list).filter((p) => matchesQuery(p.name, q));
  }, [catalogProjects, q]);

  const orderedProjects = useMemo(() => {
    const list = catalogProjects.filter((p) => isProjectKind(p.kind));
    return sortByName(list).filter((p) => matchesQuery(p.name, q));
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
  const showSpacesProjects = (filter === 'all' || filter === 'spaces') && canViewProjects;
  const showChannels = filter === 'all' || filter === 'channels';
  const showUpcoming = filter === 'all' || filter === 'upcoming';

  if (collapsed) {
    return (
      <aside className="flex h-full w-12 shrink-0 flex-col items-center border-r border-hairline bg-paper py-3">
        <button
          type="button"
          onClick={onToggleCollapse}
          className="mb-3 flex h-9 w-9 items-center justify-center rounded-md text-graphite hover:bg-cloud hover:text-ink"
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
          className="relative mb-2 flex h-9 w-9 items-center justify-center rounded-md text-graphite hover:bg-cloud hover:text-ink"
          title="Inbox"
          aria-label="Inbox"
        >
          <Inbox className="h-4 w-4" />
          {unreadCount > 0 && (
            <span className="absolute right-1 top-1 h-2 w-2 rounded-full bg-primary" />
          )}
        </button>
        <button
          type="button"
          onClick={onCreate}
          className="mb-2 flex h-9 w-9 items-center justify-center rounded-md border border-primary bg-primary text-on-ink hover:bg-primary-bright"
          title="Create"
          aria-label="Create"
        >
          <Plus className="h-4 w-4" />
        </button>
        <button
          type="button"
          onClick={() => {
            setSearchOpen(true);
            setFilterOpen(false);
            onToggleCollapse?.();
          }}
          className="mb-1 flex h-9 w-9 items-center justify-center rounded-md text-graphite hover:bg-cloud hover:text-ink"
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
          className="flex h-9 w-9 items-center justify-center rounded-md text-graphite hover:bg-cloud hover:text-ink"
          title="Filter sidebar"
          aria-label="Filter sidebar"
        >
          <ListFilter className="h-4 w-4" />
        </button>
        {showInvite && (
          <button
            type="button"
            onClick={onInvite}
            className="mt-auto flex h-9 w-9 items-center justify-center rounded-md text-graphite hover:bg-cloud hover:text-ink"
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
    <aside className="flex h-full w-[248px] shrink-0 flex-col border-r border-hairline bg-paper">
      {/* Top toolbar: collapse + search + filter | Create */}
      <div className="border-b border-hairline p-2.5">
        <div className="mb-2 flex items-center gap-1">
          <button
            type="button"
            onClick={onToggleCollapse}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-graphite transition hover:bg-cloud hover:text-ink"
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
              'flex h-8 w-8 items-center justify-center rounded-lg transition hover:bg-cloud',
              searchOpen ? 'bg-cloud text-ink' : 'text-graphite hover:text-ink'
            )}
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
              'flex h-8 w-8 items-center justify-center rounded-lg transition hover:bg-cloud',
              filterOpen || filter !== 'all'
                ? 'bg-cloud text-ink'
                : 'text-graphite hover:text-ink'
            )}
            title="Filter sidebar"
            aria-label="Filter sidebar"
          >
            <ListFilter className="h-4 w-4" />
          </button>
          <div className="ml-auto">
            <Button
              size="sm"
              className="h-8 rounded-lg px-3 normal-case tracking-normal"
              onClick={onCreate}
            >
              <Plus className="h-3.5 w-3.5" />
              Create
            </Button>
          </div>
        </div>

        {searchOpen && (
          <div className="relative mb-1">
            <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-graphite" />
            <Input
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search sidebar…"
              className="h-8 border-hairline pl-8 pr-8 text-sm"
            />
            {query && (
              <button
                type="button"
                onClick={() => setQuery('')}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-graphite hover:text-ink"
                aria-label="Clear search"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        )}

        {filterOpen && (
          <div className="mb-1 flex flex-wrap gap-1 rounded-md border border-hairline bg-cloud p-1.5">
            {FILTERS.map((f) => (
              <button
                key={f.id}
                type="button"
                onClick={() => setFilter(f.id)}
                className={cn(
                  'rounded px-2 py-1 text-[11px] font-medium',
                  filter === f.id
                    ? 'bg-paper text-ink shadow-sm'
                    : 'text-graphite hover:text-ink'
                )}
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
          <div className="mb-3 overflow-hidden rounded-xl border border-hairline bg-cloud/50">
            <button
              type="button"
              onClick={() => setInboxPreviewOpen((v) => !v)}
              className="flex w-full items-center gap-2 px-2.5 py-2 text-left transition hover:bg-cloud"
            >
              {inboxPreviewOpen ? (
                <ChevronDown className="h-3.5 w-3.5 shrink-0 text-graphite" />
              ) : (
                <ChevronRight className="h-3.5 w-3.5 shrink-0 text-graphite" />
              )}
              <Bell className="h-3.5 w-3.5 shrink-0 text-graphite" />
              <span className="flex-1 text-[11px] font-semibold uppercase tracking-wide text-graphite">
                Notifications
              </span>
              {unreadCount > 0 && (
                <span className="rounded-full bg-primary px-1.5 py-0.5 text-[10px] font-bold tabular-nums text-on-ink">
                  {unreadCount > 99 ? '99+' : unreadCount}
                </span>
              )}
            </button>

            {inboxPreviewOpen && (
              <div className="border-t border-hairline bg-paper">
                {Array.isArray(recentNotifications) && recentNotifications.length > 0 ? (
                  <div className="max-h-[168px] overflow-y-auto">
                    {recentNotifications.slice(0, 6).map((n) => (
                      <button
                        key={n._id}
                        type="button"
                        onClick={() => navigate('/inbox?tab=notifications')}
                        className={cn(
                          'flex w-full gap-2 border-b border-hairline/70 px-2.5 py-2 text-left last:border-b-0 hover:bg-cloud/60',
                          !n.isRead && 'bg-primary/5'
                        )}
                      >
                        <span
                          className={cn(
                            'mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full',
                            n.isRead ? 'bg-transparent' : 'bg-primary'
                          )}
                        />
                        <div className="min-w-0 flex-1">
                          <p
                            className={cn(
                              'line-clamp-2 text-[11px] leading-snug',
                              n.isRead ? 'text-charcoal' : 'font-medium text-ink'
                            )}
                          >
                            {n.message}
                          </p>
                          {n.createdAt && (
                            <p className="mt-0.5 text-[10px] text-graphite">
                              {formatDistanceToNow(new Date(n.createdAt), { addSuffix: true })}
                            </p>
                          )}
                        </div>
                      </button>
                    ))}
                  </div>
                ) : (
                  <p className="px-2.5 py-2.5 text-[11px] text-graphite">
                    You&apos;re all caught up
                  </p>
                )}
              </div>
            )}

            <NavLink
              to="/inbox"
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-2.5 border-t border-hairline px-2.5 py-2.5 text-sm font-semibold',
                  isActive ? 'bg-cloud text-ink' : 'text-ink hover:bg-cloud/70'
                )
              }
            >
              <Inbox className="h-4 w-4 shrink-0" />
              <span className="flex-1 truncate">Inbox</span>
              {unreadCount > 0 && (
                <span className="rounded-full bg-cloud px-1.5 py-0.5 text-[10px] font-bold tabular-nums text-charcoal">
                  {unreadCount > 99 ? '99+' : unreadCount}
                </span>
              )}
            </NavLink>
          </div>
        )}

        {showNav && (
          <nav className="space-y-0.5">
            {homeLinks.length === 0 && q ? (
              <p className="px-2 py-1 text-xs text-graphite">No matching links</p>
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
                          'flex items-center gap-2.5 rounded-md px-2.5 py-2 text-sm font-medium',
                          isActive ? 'bg-cloud text-ink' : 'text-charcoal hover:bg-cloud/70'
                        )
                      }
                    >
                      <Icon className="h-4 w-4 shrink-0" />
                      <span className="min-w-0 flex-1 truncate">{item.label}</span>
                      {item.badge > 0 && (
                        <span className="rounded-full bg-primary/10 px-1.5 py-0.5 text-[10px] font-bold tabular-nums text-primary">
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
              className="flex w-full items-center gap-2 rounded-md px-2.5 py-2 text-sm font-semibold text-ink hover:bg-cloud"
            >
              {tasksOpen ? (
                <ChevronDown className="h-4 w-4" />
              ) : (
                <ChevronRight className="h-4 w-4" />
              )}
              <CheckSquare className="h-4 w-4" />
              <span className="flex-1 text-left">My Tasks</span>
            </button>
            {tasksOpen && (
              <div className="ml-2 space-y-0.5 border-l border-hairline pl-2">
                {myTaskLinks.length === 0 && q ? (
                  <p className="px-2 py-1 text-xs text-graphite">No matching tasks</p>
                ) : (
                  myTaskLinks.map((item) => (
                    <NavLink
                      key={item.to}
                      to={item.to}
                      className={({ isActive }) =>
                        cn(
                          'flex items-center gap-2 rounded-md border border-transparent px-2.5 py-1.5 text-sm',
                          isActive || (item.icon === 'plus' && locationSearchHasAdd(item.to))
                            ? 'border-hairline bg-cloud font-medium text-ink'
                            : 'text-charcoal hover:border-hairline hover:bg-cloud/70',
                          item.icon === 'plus' && 'text-primary'
                        )
                      }
                    >
                      {item.icon === 'plus' ? (
                        <Plus className="h-4 w-4 text-primary" />
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
                    className="flex w-full items-center gap-2 rounded-md border border-transparent px-2.5 py-1.5 text-sm text-graphite hover:border-hairline hover:bg-cloud"
                  >
                    <MoreHorizontal className="h-4 w-4" />
                    More
                  </button>
                )}
              </div>
            )}
          </div>
        )}

        {showSpacesProjects && (
          <>
            <div className="mt-4">
              <div className="mb-0.5 flex items-center gap-1 px-1">
                <button
                  type="button"
                  onClick={() => setSpacesOpen((v) => !v)}
                  className="rounded p-1 text-graphite hover:bg-cloud hover:text-ink"
                  title={spacesOpen ? 'Collapse spaces' : 'Expand spaces'}
                  aria-expanded={spacesOpen}
                >
                  <ChevronDown
                    className={cn(
                      'h-3.5 w-3.5 transition-transform',
                      !spacesOpen && '-rotate-90'
                    )}
                  />
                </button>
                <NavLink
                  to="/spaces"
                  className={({ isActive }) =>
                    cn(
                      'min-w-0 flex-1 truncate rounded-md px-1.5 py-1.5 text-[11px] font-semibold uppercase tracking-[0.08em]',
                      isActive && !activeEntityId
                        ? 'bg-cloud text-ink'
                        : 'text-graphite hover:bg-cloud/80'
                    )
                  }
                >
                  Spaces
                  <span className="ml-1.5 tabular-nums font-semibold normal-case tracking-normal">
                    {spaces.length}
                  </span>
                </NavLink>
                <button
                  type="button"
                  onClick={onCreate}
                  className="rounded p-0.5 text-graphite hover:bg-cloud hover:text-ink"
                  title="Create"
                >
                  <Plus className="h-3.5 w-3.5" />
                </button>
              </div>
              {spacesOpen && (
                <div className="ml-2 space-y-0.5 border-l border-hairline pl-2">
                  {spaces.length === 0 ? (
                    <p className="px-2 py-2 text-xs text-graphite">
                      {q ? 'No matching spaces' : 'No spaces yet'}
                    </p>
                  ) : (
                    spaces.map((space) => (
                      <NavLink
                        key={space._id}
                        to={spacePath(space._id)}
                        className={cn(
                          'flex items-center gap-2 rounded-md px-2 py-1.5 text-sm',
                          activeEntityId === String(space._id)
                            ? 'bg-cloud font-medium text-ink'
                            : 'text-charcoal hover:bg-cloud/80'
                        )}
                      >
                        <span
                          className="flex h-5 w-5 shrink-0 items-center justify-center rounded text-[10px] font-bold text-white"
                          style={{ backgroundColor: space.color || '#292524' }}
                        >
                          {(space.icon || space.name?.[0] || 'S').toString().slice(0, 1)}
                        </span>
                        <span className="min-w-0 flex-1 truncate">{space.name}</span>
                      </NavLink>
                    ))
                  )}
                </div>
              )}
            </div>

            <div className="mt-3">
              <div className="mb-0.5 flex items-center gap-1 px-1">
                <button
                  type="button"
                  onClick={() => setProjectsOpen((v) => !v)}
                  className="rounded p-1 text-graphite hover:bg-cloud hover:text-ink"
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
                      'flex min-w-0 flex-1 items-center gap-1.5 truncate rounded-md px-1.5 py-1.5 text-sm font-medium',
                      isActive && !activeEntityId
                        ? 'bg-cloud text-ink'
                        : 'text-charcoal hover:bg-cloud/80'
                    )
                  }
                >
                  <FolderKanban className="h-3.5 w-3.5 shrink-0" />
                  <span className="truncate">Projects</span>
                  <span className="ml-auto tabular-nums text-[10px] font-semibold text-graphite">
                    {orderedProjects.length}
                  </span>
                </NavLink>
                <button
                  type="button"
                  onClick={onCreate}
                  className="rounded p-0.5 text-graphite hover:bg-cloud hover:text-ink"
                  title="Create"
                >
                  <Plus className="h-3.5 w-3.5" />
                </button>
              </div>
              {projectsOpen && (
                <div className="ml-2 space-y-0.5 border-l border-hairline pl-2">
                  {orderedProjects.length === 0 ? (
                    <p className="px-2 py-2 text-xs text-graphite">
                      {q ? 'No matching projects' : 'No projects yet'}
                    </p>
                  ) : (
                    orderedProjects.map((project) => (
                      <NavLink
                        key={project._id}
                        to={projectPath(project._id)}
                        className={cn(
                          'flex items-center gap-2 rounded-md px-2 py-1.5 text-sm',
                          activeEntityId === String(project._id)
                            ? 'bg-cloud font-medium text-ink'
                            : 'text-charcoal hover:bg-cloud/80'
                        )}
                      >
                        <span
                          className="flex h-5 w-5 shrink-0 items-center justify-center rounded text-[10px] font-bold text-white"
                          style={{ backgroundColor: project.color || '#292524' }}
                        >
                          {(project.icon || project.name?.[0] || 'P').toString().slice(0, 1)}
                        </span>
                        <span className="min-w-0 flex-1 truncate">{project.name}</span>
                        {project.openTaskCount > 0 && (
                          <span className="shrink-0 tabular-nums text-[10px] font-semibold text-graphite">
                            {project.openTaskCount}
                          </span>
                        )}
                      </NavLink>
                    ))
                  )}
                </div>
              )}
            </div>
          </>
        )}

        {showTeams && (
          <div className="mt-5 px-2.5">
            <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-graphite">
              My Teams
            </p>
            <div className="space-y-0.5">
              {filteredTeams.length === 0 ? (
                <p className="px-2 py-1 text-xs text-graphite">
                  {q ? 'No matching teams' : 'Join a team to see it here'}
                </p>
              ) : (
                filteredTeams.map((team) => (
                  <button
                    key={team._id}
                    type="button"
                    onClick={() => navigate(`/teams/${team._id}`)}
                    className="flex w-full items-center gap-2 truncate rounded-md px-2 py-1.5 text-left text-sm text-charcoal hover:bg-cloud"
                  >
                    <Building2 className="h-3.5 w-3.5 shrink-0 text-graphite" />
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
              <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-graphite">
                AI Chats
              </p>
              <button
                type="button"
                onClick={() => navigate('/home')}
                className="flex w-full items-center gap-2 rounded-md px-2 py-2 text-sm text-charcoal hover:bg-cloud"
              >
                <Plus className="h-3.5 w-3.5" />
                Ask, Build, Create
              </button>
            </div>

            <div className="mt-5 px-2.5">
              <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-graphite">
                Channels
              </p>
              <div className="space-y-0.5">
                {filteredProjects.length === 0 ? (
                  <p className="px-2 py-1 text-xs text-graphite">
                    {q ? 'No matching channels' : 'Projects appear when you join a team'}
                  </p>
                ) : (
                  filteredProjects.slice(0, 8).map((p) => (
                    <NavLink
                      key={p._id}
                      to={`/projects/${p._id}`}
                      className={({ isActive }) =>
                        cn(
                          'flex items-center gap-2 truncate rounded-md px-2 py-1.5 text-sm',
                          isActive
                            ? 'bg-cloud font-medium text-ink'
                            : 'text-charcoal hover:bg-cloud'
                        )
                      }
                    >
                      <Hash className="h-3.5 w-3.5 shrink-0 text-graphite" />
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
            <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-graphite">
              Upcoming
            </p>
            {filteredMeetings.slice(0, 3).map((m) => (
              <button
                key={m._id}
                type="button"
                onClick={() => navigate('/home/meetings')}
                className="mb-1 flex w-full flex-col rounded-md px-2 py-1.5 text-left hover:bg-cloud"
              >
                <span className="truncate text-sm text-ink">{m.title}</span>
                <span className="text-[11px] text-graphite">
                  {format(new Date(m.startsAt), 'MMM d · h:mm a')}
                  {m.team?.name ? ` · ${m.team.name}` : ''}
                </span>
              </button>
            ))}
            {filteredLocations.slice(0, 2).map((loc) => (
              <div
                key={loc._id}
                className="flex items-center gap-2 px-2 py-1 text-xs text-graphite"
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
        <div className="border-t border-hairline p-2">
          <button
            type="button"
            onClick={onInvite}
            className="flex w-full items-center gap-2 rounded-md px-2.5 py-2 text-sm font-medium text-charcoal hover:bg-cloud hover:text-ink"
          >
            <UserPlus className="h-4 w-4" />
            Invite
          </button>
        </div>
      )}
    </aside>
  );
}
