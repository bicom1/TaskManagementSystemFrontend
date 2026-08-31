import { NavLink } from 'react-router-dom';
import {
  Home,
  CalendarDays,
  Bell,
  Users,
  LayoutDashboard,
  FolderKanban,
  BarChart3,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { UserAvatar } from '@/components/UserAvatar';
import { useAuthStore } from '@/store/authStore';
import { useUnreadCount } from '@/features/notifications/hooks/useNotifications';

/**
 * IconRail — BIWORKSPACE Design System
 *
 * The ultra-narrow icon-only left rail.
 * Dark background with brand-gradient active indicators.
 * Accessible CSS-only tooltips via [title] + :hover pseudo-element.
 */
const railItems = [
  { to: '/', label: 'Home', icon: Home, end: true, match: (p) => p === '/' || p.startsWith('/home') },
  { to: '/home/my-tasks', label: 'My Tasks', icon: CalendarDays, match: (p) => p.startsWith('/home/my-tasks') },
  { to: '/inbox', label: 'Inbox', icon: Bell, match: (p) => p.startsWith('/inbox'), badge: true },
  { to: '/teams/people', label: 'Teams', icon: Users, match: (p) => p.startsWith('/teams') },
  { to: '/boards', label: 'Analytics', icon: LayoutDashboard, match: (p) => p.startsWith('/boards') || p.startsWith('/reports') },
  { to: '/projects', label: 'Projects', icon: FolderKanban, match: (p) => p.startsWith('/projects') || p.startsWith('/all-tasks') },
];

export function IconRail({ pathname }) {
  const user = useAuthStore((s) => s.user);
  const { data: unreadCount = 0 } = useUnreadCount();

  return (
    <aside
      className="sidebar-dark flex h-full w-[52px] shrink-0 flex-col items-center py-3"
      style={{ backgroundColor: 'var(--color-sidebar-bg)' }}
    >
      {/* User avatar at top */}
      <div className="mb-3 shrink-0">
        <UserAvatar
          user={user}
          size="md"
          rounded="lg"
          className="ring-2 ring-white/15 hover:ring-white/30 transition-all duration-150"
          title={user?.name}
        />
      </div>

      {/* Divider */}
      <div
        className="mb-3 h-px w-8 shrink-0 rounded-full"
        style={{ background: 'var(--color-sidebar-border)' }}
      />

      {/* Nav items */}
      <nav className="flex flex-1 flex-col items-center gap-0.5">
        {railItems.map((item) => {
          const Icon = item.icon;
          const active = item.match(pathname);
          const showBadge = item.badge && unreadCount > 0;

          return (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              title={item.label}
              className={cn(
                'group relative flex h-9 w-9 items-center justify-center rounded-xl',
                'transition-all duration-[120ms] ease-[cubic-bezier(0.4,0,0.2,1)]',
                active
                  ? 'bg-brand-500/20 text-white'
                  : 'text-[rgba(255,255,255,0.45)] hover:bg-white/8 hover:text-[rgba(255,255,255,0.85)]'
              )}
            >
              {/* Active left indicator */}
              {active && (
                <span
                  aria-hidden
                  className="absolute -left-1 top-1/2 h-5 w-0.5 -translate-y-1/2 rounded-r-full bg-brand-400"
                />
              )}
              <Icon className="h-[17px] w-[17px]" />

              {/* Unread badge */}
              {showBadge && (
                <span
                  aria-hidden
                  className="absolute right-1 top-1 h-1.5 w-1.5 rounded-full bg-brand-400"
                />
              )}

              {/* CSS tooltip — appears on hover to the right */}
              <span
                aria-hidden
                className={cn(
                  'pointer-events-none absolute left-full ml-3 whitespace-nowrap',
                  'rounded-lg border border-white/10 bg-[#1e1e2e] px-2.5 py-1.5',
                  'text-[11px] font-semibold tracking-wide text-white shadow-xl',
                  'opacity-0 scale-95 origin-left',
                  'group-hover:opacity-100 group-hover:scale-100',
                  'transition-all duration-[120ms] ease-[cubic-bezier(0.4,0,0.2,1)]',
                  'z-50'
                )}
              >
                {item.label}
              </span>
            </NavLink>
          );
        })}
      </nav>

      {/* Reports at bottom */}
      <NavLink
        to="/reports"
        title="Reports"
        className="flex h-9 w-9 items-center justify-center rounded-xl text-[rgba(255,255,255,0.35)] transition-all duration-[120ms] hover:bg-white/8 hover:text-[rgba(255,255,255,0.85)]"
      >
        <BarChart3 className="h-[17px] w-[17px]" />
      </NavLink>
    </aside>
  );
}
