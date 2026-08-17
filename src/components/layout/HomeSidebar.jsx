import { NavLink, useNavigate } from 'react-router-dom';
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
} from 'lucide-react';
import { useMemo, useState } from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { UserAvatar } from '@/components/UserAvatar';
import { useAuthStore } from '@/store/authStore';
import { useHomeOverview } from '@/features/home/hooks/useHome';
import { hasPermission, PERMISSIONS } from '@/lib/permissions';
import { format } from 'date-fns';

const FILTERS = [
  { id: 'all', label: 'All' },
  { id: 'nav', label: 'Navigation' },
  { id: 'tasks', label: 'My Tasks' },
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

export function HomeSidebar({ onInvite, onCreate, collapsed = false, onToggleCollapse }) {
  const [tasksOpen, setTasksOpen] = useState(true);
  const [searchOpen, setSearchOpen] = useState(false);
  const [filterOpen, setFilterOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState('all');

  const user = useAuthStore((s) => s.user);
  const navigate = useNavigate();
  const { data: home } = useHomeOverview();
  const showInvite = hasPermission(user, PERMISSIONS.USER_INVITE);

  const projects = home?.workspace?.projects ?? [];
  const teams = home?.workspace?.teams ?? [];
  const meetings = home?.cards?.meetings ?? [];
  const locations = home?.cards?.locations ?? [];

  const q = query.trim().toLowerCase();

  const homeLinks = useMemo(
    () =>
      [
        { to: '/inbox', label: 'Inbox', icon: Inbox },
        { to: '/inbox', label: 'Replies', icon: MessageSquareReply },
        { to: '/home/assigned-comments', label: 'Assigned Comments', icon: MessageSquareText },
        { to: '/home/meetings', label: 'Meetings', icon: Video },
        { to: '/home/meetings', label: 'Locations', icon: MapPin },
      ].filter((item) => matchesQuery(item.label, q)),
    [q]
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
    () => projects.filter((p) => matchesQuery(p.name, q)),
    [projects, q]
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

  const showNav = filter === 'all' || filter === 'nav';
  const showTasks = filter === 'all' || filter === 'tasks';
  const showTeams = filter === 'all' || filter === 'teams';
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
    <aside className="flex h-full w-[240px] shrink-0 flex-col border-r border-hairline bg-paper">
      {/* Top toolbar: collapse + search + filter | Create */}
      <div className="border-b border-hairline p-2">
        <div className="mb-2 flex items-center gap-1">
          <button
            type="button"
            onClick={onToggleCollapse}
            className="flex h-8 w-8 items-center justify-center rounded-md text-graphite hover:bg-cloud hover:text-ink"
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
              'flex h-8 w-8 items-center justify-center rounded-md hover:bg-cloud',
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
              'flex h-8 w-8 items-center justify-center rounded-md hover:bg-cloud',
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
            <Button size="sm" className="h-8 px-3 normal-case tracking-normal" onClick={onCreate}>
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
        {showNav && (
          <nav className="space-y-0.5">
            {homeLinks.length === 0 && q ? (
              <p className="px-2 py-1 text-xs text-graphite">No matching links</p>
            ) : (
              homeLinks.map((item) => {
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
                    <span className="truncate">{item.label}</span>
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
