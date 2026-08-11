import { NavLink } from 'react-router-dom';
import {
  Home,
  CalendarDays,
  Sparkles,
  Users,
  LayoutDashboard,
  Grid3X3,
  FolderKanban,
  Inbox,
  BarChart3,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { getAvatarColor, getInitials } from '@/lib/avatar';
import { useAuthStore } from '@/store/authStore';

const railItems = [
  { to: '/', label: 'Home', icon: Home, end: true, match: (p) => p === '/' || p.startsWith('/home') },
  { to: '/home/my-tasks', label: 'Planner', icon: CalendarDays, match: (p) => p.startsWith('/home/my-tasks') },
  { to: '/inbox', label: 'AI / Inbox', icon: Sparkles, match: (p) => p.startsWith('/inbox') },
  { to: '/teams/people', label: 'Teams', icon: Users, match: (p) => p.startsWith('/teams') },
  { to: '/boards', label: 'Dashboard', icon: LayoutDashboard, match: (p) => p.startsWith('/boards') || p.startsWith('/reports') },
  { to: '/projects', label: 'More', icon: Grid3X3, match: (p) => p.startsWith('/projects') || p.startsWith('/all-tasks') },
];

export function IconRail({ pathname }) {
  const user = useAuthStore((s) => s.user);
  const color = getAvatarColor(user?._id || user?.name);

  return (
    <aside className="flex h-full w-[56px] shrink-0 flex-col items-center border-r border-hairline bg-primary py-3 text-on-ink">
      <div
        className="mb-4 flex h-9 w-9 items-center justify-center rounded-lg text-xs font-bold text-white"
        style={{ backgroundColor: color }}
        title={user?.name}
      >
        {getInitials(user?.name || 'BW')}
      </div>

      <nav className="flex flex-1 flex-col items-center gap-1">
        {railItems.map((item) => {
          const Icon = item.icon;
          const active = item.match(pathname);
          return (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              title={item.label}
              className={cn(
                'flex h-10 w-10 items-center justify-center rounded-lg transition-colors',
                active ? 'bg-white/20 text-white' : 'text-white/75 hover:bg-white/15 hover:text-white'
              )}
            >
              <Icon className="h-[18px] w-[18px]" />
            </NavLink>
          );
        })}
      </nav>

      <NavLink
        to="/inbox"
        title="Inbox"
        className="mb-1 flex h-10 w-10 items-center justify-center rounded-lg text-white/75 hover:bg-white/15 hover:text-white"
      >
        <Inbox className="h-[18px] w-[18px]" />
      </NavLink>
      <NavLink
        to="/reports"
        title="Reports"
        className="flex h-10 w-10 items-center justify-center rounded-lg text-white/75 hover:bg-white/15 hover:text-white"
      >
        <BarChart3 className="h-[18px] w-[18px]" />
      </NavLink>
      <NavLink
        to="/projects"
        title="Projects"
        className="mt-1 flex h-10 w-10 items-center justify-center rounded-lg text-white/75 hover:bg-white/15 hover:text-white"
      >
        <FolderKanban className="h-[18px] w-[18px]" />
      </NavLink>
    </aside>
  );
}
