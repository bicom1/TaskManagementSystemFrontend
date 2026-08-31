import { useLocation, useNavigate } from 'react-router-dom';
import {
  Sparkles,
  Users,
  LayoutDashboard,
  CalendarDays,
  Grid,
  UserPlus,
  House,
} from 'lucide-react';
import { useUnreadCount } from '@/features/notifications/hooks/useNotifications';
import { cn } from '@/lib/utils';

/* ============================================================
   IconRail — the darkest surface in the product.
   One accent colour, held quietly: the active item is the only
   thing with any weight. A thin brand bar marks it on the rail
   edge; everything else is monochrome.
   ============================================================ */

export function getSectionFromPath(pathname) {
  if (pathname.startsWith('/inbox')) return 'home';
  if (
    pathname.startsWith('/home/agenda') ||
    pathname.startsWith('/home/meetings')
  )
    return 'planner';
  if (
    pathname.startsWith('/home/my-tasks') ||
    pathname.startsWith('/home/assigned-comments') ||
    pathname === '/all-tasks'
  )
    return 'home';
  if (pathname.startsWith('/projects') || pathname.startsWith('/spaces')) return 'home';
  if (pathname.startsWith('/boards') || pathname.startsWith('/reports')) return 'dashboard';
  if (pathname.startsWith('/teams')) return 'teams';
  if (pathname.startsWith('/ai')) return 'ai';
  if (pathname.startsWith('/audit') || pathname.startsWith('/approvals') || pathname.startsWith('/settings'))
    return 'more';
  return 'home';
}

export function getSectionDefaultPath(sectionId) {
  const map = {
    home: '/',
    planner: '/home/agenda',
    ai: '/ai',
    teams: '/teams/all',
    dashboard: '/boards',
    more: '/settings',
  };
  return map[sectionId] ?? '/';
}

const RAIL_ITEMS = [
  { id: 'home', label: 'Home', icon: House },
  { id: 'planner', label: 'Planner', icon: CalendarDays },
  { id: 'ai', label: 'AI', icon: Sparkles },
  { id: 'teams', label: 'Teams', icon: Users },
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'more', label: 'More', icon: Grid },
];

function RailButton({ item, active, badge, onClick }) {
  const { icon: Icon, label } = item;
  return (
    <button
      type="button"
      onClick={onClick}
      aria-current={active ? 'page' : undefined}
      className="group relative flex w-full flex-col items-center gap-1 py-1 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-400/60 rounded-xl"
    >
      {/* rail-edge accent for the active section */}
      <span
        aria-hidden
        className={cn(
          'absolute -left-2 top-1/2 -translate-y-1/2 w-[3px] rounded-r-full bg-brand-400',
          'transition-all duration-200 ease-[cubic-bezier(0.4,0,0.2,1)]',
          active ? 'h-7 opacity-100' : 'h-0 opacity-0'
        )}
      />

      <span
        className={cn(
          'relative flex h-9 w-9 items-center justify-center rounded-xl',
          'transition-colors duration-150',
          active
            ? 'bg-white/[0.14] ring-1 ring-inset ring-white/10'
            : 'group-hover:bg-white/[0.05]'
        )}
      >
        <Icon
          className={cn(
            'h-[18px] w-[18px] transition-colors duration-150',
            active
              ? 'text-brand-200'
              : 'text-zinc-500 group-hover:text-zinc-200'
          )}
          strokeWidth={active ? 2.2 : 1.8}
        />

        {badge > 0 && (
          <span className="absolute -right-1 -top-1 flex h-[15px] min-w-[15px] items-center justify-center rounded-full bg-brand-500 px-1 text-[9px] font-semibold tabular-nums text-white ring-2 ring-[color:var(--color-rail-bg)]">
            {badge > 99 ? '99+' : badge}
          </span>
        )}
      </span>

      <span
        className={cn(
          'text-[9.5px] font-medium tracking-[0.02em] transition-colors duration-150',
          active ? 'text-zinc-100' : 'text-zinc-500 group-hover:text-zinc-300'
        )}
      >
        {label}
      </span>
    </button>
  );
}

export function IconRail({ activeSection, onSectionClick, onInviteClick }) {
  const location = useLocation();
  const navigate = useNavigate();
  const { data: unreadCount = 0 } = useUnreadCount();

  const currentSection = activeSection || getSectionFromPath(location.pathname);

  const handleRailClick = (sectionId) => {
    onSectionClick(sectionId);
    // Only navigate when actually switching sections. Re-clicking the active
    // rail item just toggles the detail panel (handled by the parent) and must
    // not yank the user off their current sub-page.
    if (sectionId !== currentSection) {
      navigate(getSectionDefaultPath(sectionId));
    }
  };

  return (
    <aside
      className="flex h-full w-[60px] shrink-0 flex-col items-center py-3 select-none z-30"
      style={{ backgroundColor: 'var(--color-rail-bg)' }}
    >
      <div className="flex w-full flex-col items-center gap-1.5 px-2">
        {RAIL_ITEMS.map((item) => (
          <RailButton
            key={item.id}
            item={item}
            active={currentSection === item.id}
            badge={item.id === 'home' ? unreadCount : 0}
            onClick={() => handleRailClick(item.id)}
          />
        ))}
      </div>

      <div className="flex-1" />

      <div className="w-full px-2">
        <button
          type="button"
          onClick={onInviteClick}
          className="group flex w-full flex-col items-center gap-1 py-1 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-400/60 rounded-xl"
        >
          <span className="flex h-9 w-9 items-center justify-center rounded-xl transition-colors duration-150 group-hover:bg-white/[0.05]">
            <UserPlus className="h-[18px] w-[18px] text-zinc-500 transition-colors duration-150 group-hover:text-zinc-200" strokeWidth={1.8} />
          </span>
          <span className="text-[9.5px] font-medium tracking-[0.02em] text-zinc-500 transition-colors duration-150 group-hover:text-zinc-300">
            Invite
          </span>
        </button>
      </div>
    </aside>
  );
}
