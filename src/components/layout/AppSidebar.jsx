import { useMemo, useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Inbox,
  FolderKanban,
  UserPlus,
  BarChart3,
  Settings,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Building2,
  LayoutGrid,
  ClipboardCheck,
  ScrollText,
} from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { useUnreadCount } from '@/features/notifications/hooks/useNotifications';
import { usePendingApprovals } from '@/features/tasks/hooks/useTasks';
import { useLiveSpaces, useProjects } from '@/features/projects/hooks/useProjects';
import { canApproveTasks, getRoleLabel, ROLES } from '@/lib/roles';
import { hasPermission, PERMISSIONS } from '@/lib/permissions';
import { cn } from '@/lib/utils';
import { BrandLogo } from '@/components/BrandLogo';
import { projectPath } from '@/features/spaces/spaceKinds';

const primaryNav = [
  { to: '/', label: 'Home', icon: LayoutDashboard, end: true },
  { to: '/inbox', label: 'Inbox', icon: Inbox, badge: 'unread' },
  { to: '/projects', label: 'Projects', icon: FolderKanban, permission: PERMISSIONS.PROJECT_VIEW },
  { to: '/boards', label: 'Boards', icon: LayoutGrid, permission: PERMISSIONS.PROJECT_VIEW },
  { to: '/teams/people', label: 'Teams', icon: Building2, matchPrefix: '/teams', permission: PERMISSIONS.TEAM_VIEW },
  { to: '/reports', label: 'Reports', icon: BarChart3, permission: PERMISSIONS.REPORT_VIEW },
];

function sortByName(items) {
  return [...items].sort((a, b) =>
    String(a.name || '').localeCompare(String(b.name || ''), undefined, {
      sensitivity: 'base',
      numeric: true,
    })
  );
}

export function AppSidebar({ collapsed, onToggle, onInvite, hideBrand = false }) {
  const user = useAuthStore((s) => s.user);
  const location = useLocation();
  const showApprovals = canApproveTasks(user?.role) || hasPermission(user, PERMISSIONS.TASK_APPROVE);
  const showInvite = hasPermission(user, PERMISSIONS.USER_INVITE);
  const showAudit = hasPermission(user, PERMISSIONS.AUDIT_VIEW) || user?.role === ROLES.SUPER_ADMIN;
  const canViewProjects = hasPermission(user, PERMISSIONS.PROJECT_VIEW);

  const { data: unreadCount = 0 } = useUnreadCount();
  const { data: pendingApprovals = [] } = usePendingApprovals(showApprovals);
  const { data: projectsData } = useProjects({ limit: 100 });
  const projects = projectsData?.data ?? [];
  useLiveSpaces();

  const [projectsExpanded, setProjectsExpanded] = useState(false);

  const approvalCount = pendingApprovals.length;
  const activeEntityId = useMemo(() => {
    const m = location.pathname.match(/^\/(?:spaces|projects)\/([a-f0-9]{24})/i);
    return m?.[1] || null;
  }, [location.pathname]);

  const orderedProjects = useMemo(() => sortByName(projects), [projects]);

  const navItems = [
    ...primaryNav.slice(0, 2),
    ...(showApprovals
      ? [{ to: '/approvals', label: 'Approvals', icon: ClipboardCheck, badge: 'approvals' }]
      : []),
    ...primaryNav.slice(2).filter((item) => !item.permission || hasPermission(user, item.permission)),
    ...(showAudit ? [{ to: '/audit', label: 'Audit logs', icon: ScrollText }] : []),
  ];

  return (
    <aside
      className={cn(
        'flex h-full flex-col border-r border-hairline bg-cloud transition-all duration-200',
        collapsed ? 'w-[72px]' : 'w-[260px]'
      )}
    >
      {!hideBrand && (
        <div
          className={cn(
            'flex h-14 items-center border-b border-hairline px-3',
            collapsed ? 'justify-center' : 'gap-2'
          )}
        >
          <BrandLogo collapsed={collapsed} size="md" />
        </div>
      )}

      <div className="flex-1 overflow-y-auto px-2 py-3">
        <nav className="space-y-0.5">
          {navItems.map((item) => {
            const Icon = item.icon;
            let badge = null;
            if (item.badge === 'unread' && unreadCount > 0) badge = unreadCount;
            if (item.badge === 'approvals' && approvalCount > 0) badge = approvalCount;

            return (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                title={item.label}
                className={({ isActive }) => {
                  const prefixActive =
                    item.matchPrefix && location.pathname.startsWith(item.matchPrefix);
                  const active = isActive || prefixActive;
                  return cn(
                    'flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors',
                    collapsed && 'justify-center px-0',
                    active
                      ? 'bg-paper text-ink shadow-soft-lift'
                      : 'text-charcoal hover:bg-paper/90 hover:text-ink'
                  );
                }}
              >
                <Icon className="h-[18px] w-[18px] shrink-0" />
                {!collapsed && (
                  <>
                    <span className="flex-1 truncate">{item.label}</span>
                    {badge != null && (
                      <span className="rounded-md bg-primary px-1.5 py-0.5 text-[10px] font-bold text-on-ink">
                        {badge > 99 ? '99+' : badge}
                      </span>
                    )}
                  </>
                )}
              </NavLink>
            );
          })}
        </nav>

        {showInvite && (
          <div className="mt-3">
            {!collapsed ? (
              <button
                type="button"
                onClick={onInvite}
                className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-charcoal transition hover:bg-paper/90 hover:text-ink"
              >
                <UserPlus className="h-[18px] w-[18px]" />
                Invite people
              </button>
            ) : (
              <button
                type="button"
                onClick={onInvite}
                className="flex h-10 w-full items-center justify-center rounded-md text-charcoal hover:bg-paper/80 hover:text-ink"
                title="Invite people"
              >
                <UserPlus className="h-[18px] w-[18px]" />
              </button>
            )}
          </div>
        )}

        {!collapsed && canViewProjects && (
          <div className="mt-6">
            <div className="mb-1 flex items-center gap-1 px-2">
              <button
                type="button"
                onClick={() => setProjectsExpanded((v) => !v)}
                className="rounded p-1 text-graphite hover:bg-paper hover:text-ink"
                title={projectsExpanded ? 'Collapse' : 'Expand'}
                aria-expanded={projectsExpanded}
              >
                <ChevronDown
                  className={cn(
                    'h-3.5 w-3.5 transition-transform',
                    !projectsExpanded && '-rotate-90'
                  )}
                />
              </button>
              <NavLink
                to="/projects"
                className={({ isActive }) =>
                  cn(
                    'min-w-0 flex-1 truncate rounded-md px-1.5 py-1.5 text-sm font-medium',
                    isActive && !activeEntityId
                      ? 'bg-paper text-ink'
                      : 'text-charcoal hover:bg-paper/80'
                  )
                }
              >
                All Projects
                <span className="ml-1.5 tabular-nums text-[11px] font-semibold text-graphite">
                  {orderedProjects.length}
                </span>
              </NavLink>
            </div>

            {projectsExpanded && (
              <div className="ml-2 space-y-0.5 border-l border-hairline pl-2">
                {orderedProjects.length === 0 ? (
                  <p className="px-2 py-2 text-xs text-graphite">No projects yet</p>
                ) : (
                  orderedProjects.map((project) => (
                    <NavLink
                      key={project._id}
                      to={projectPath(project._id)}
                      className={cn(
                        'flex items-center gap-2 rounded-md px-2 py-1.5 text-sm',
                        activeEntityId === String(project._id)
                          ? 'bg-paper font-medium text-ink'
                          : 'text-charcoal hover:bg-paper/80'
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
        )}
      </div>

      <div className="border-t border-hairline p-2">
        <NavLink
          to="/settings"
          title="Settings"
          className={({ isActive }) =>
            cn(
              'mb-1 flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium',
              collapsed && 'justify-center px-0',
              isActive ? 'bg-paper text-ink' : 'text-charcoal hover:bg-paper/80'
            )
          }
        >
          <Settings className="h-[18px] w-[18px]" />
          {!collapsed && <span>Settings</span>}
        </NavLink>

        {!collapsed && (
          <div className="mt-1 rounded-md bg-paper px-3 py-2">
            <p className="truncate text-xs font-medium text-ink">{user?.name}</p>
            <p className="truncate text-[11px] text-graphite">{getRoleLabel(user?.role)}</p>
          </div>
        )}

        <button
          type="button"
          onClick={onToggle}
          className="mt-2 flex w-full items-center justify-center gap-2 rounded-md px-2 py-2 text-xs font-medium text-graphite hover:bg-paper hover:text-ink"
        >
          {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
          {!collapsed && 'Collapse'}
        </button>
      </div>
    </aside>
  );
}
