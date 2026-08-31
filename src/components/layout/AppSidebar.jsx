import { useMemo, useState } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Inbox,
  CheckSquare,
  FolderKanban,
  LayoutGrid,
  Building2,
  BarChart3,
  ScrollText,
  ClipboardCheck,
  Settings,
  UserPlus,
  ChevronDown,
  ChevronRight,
  ChevronLeft,
  ChevronRight as ChevronRightIcon,
} from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { useUnreadCount } from '@/features/notifications/hooks/useNotifications';
import { usePendingApprovals } from '@/features/tasks/hooks/useTasks';
import { useProjects, useLiveSpaces } from '@/features/projects/hooks/useProjects';
import { canApproveTasks, getRoleLabel, ROLES } from '@/lib/roles';
import { hasPermission, PERMISSIONS } from '@/lib/permissions';
import { cn } from '@/lib/utils';
import { BrandLogo } from '@/components/BrandLogo';
import { projectPath } from '@/features/spaces/spaceKinds';

/* ============================================================
   AppSidebar — BIWORKSPACE Design System
   Single, unified sidebar used GLOBALLY across all routes.
   No more HomeSidebar / IconRail split — one sidebar, one truth.
   
   Width: 260px (expanded) | 64px (collapsed)
   Both states are stable so the content pane never shifts
   width due to route changes.
   ============================================================ */

function sortByName(items) {
  return [...items].sort((a, b) =>
    String(a.name || '').localeCompare(String(b.name || ''), undefined, {
      sensitivity: 'base',
      numeric: true,
    })
  );
}

/** Single nav item row */
function NavItem({ to, end, label, icon: Icon, badge, matchPrefix, collapsed }) {
  const location = useLocation();
  const prefixActive = matchPrefix && location.pathname.startsWith(matchPrefix);

  return (
    <NavLink
      to={to}
      end={end}
      title={collapsed ? label : undefined}
      className={({ isActive }) => {
        const active = isActive || prefixActive;
        return cn(
          'group relative flex items-center gap-2.5 rounded-xl',
          'text-[13px] font-medium',
          'transition-all duration-[120ms] ease-[cubic-bezier(0.4,0,0.2,1)]',
          collapsed
            ? 'h-9 w-9 justify-center mx-auto'
            : 'px-2.5 py-2 w-full',
          active
            ? 'bg-[var(--color-sidebar-active)] text-[var(--color-sidebar-text-active)]'
            : 'text-[var(--color-sidebar-text)] hover:bg-[var(--color-sidebar-surface)] hover:text-[var(--color-sidebar-text-active)]'
        );
      }}
    >
      {({ isActive }) => {
        const active = isActive || prefixActive;
        return (
          <>
            {/* Active left accent bar */}
            {active && !collapsed && (
              <span
                aria-hidden
                className="absolute -left-0.5 top-1.5 bottom-1.5 w-0.5 rounded-r-full bg-brand-400"
              />
            )}

            <Icon
              className={cn(
                'h-[17px] w-[17px] shrink-0',
                active ? 'text-brand-400' : 'opacity-65 group-hover:opacity-100'
              )}
            />

            {!collapsed && (
              <>
                <span className="flex-1 truncate">{label}</span>
                {badge != null && badge > 0 && (
                  <span className="flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-brand-500 px-1 text-[10px] font-bold text-white">
                    {badge > 99 ? '99+' : badge}
                  </span>
                )}
              </>
            )}

            {/* Collapsed unread dot */}
            {collapsed && badge != null && badge > 0 && (
              <span
                aria-hidden
                className="absolute right-1 top-1 h-1.5 w-1.5 rounded-full bg-brand-400"
              />
            )}

            {/* Collapsed tooltip */}
            {collapsed && (
              <span
                aria-hidden
                className={cn(
                  'pointer-events-none absolute left-full ml-3 whitespace-nowrap',
                  'rounded-lg border border-white/10 bg-[#1e1e2e] px-2.5 py-1.5',
                  'text-[11px] font-semibold tracking-wide text-white shadow-xl',
                  'opacity-0 scale-95 origin-left z-50',
                  'group-hover:opacity-100 group-hover:scale-100',
                  'transition-all duration-[120ms]'
                )}
              >
                {label}
              </span>
            )}
          </>
        );
      }}
    </NavLink>
  );
}

/** Collapsible section header for projects tree */
function SectionHeader({ label, collapsed, open, onToggle, to, count }) {
  const navigate = useNavigate();
  if (collapsed) return null;
  return (
    <div className="mb-1 mt-5 flex items-center gap-1 px-1">
      <button
        type="button"
        onClick={onToggle}
        className="rounded-md p-1 transition-all duration-[120ms] hover:bg-[var(--color-sidebar-surface)]"
        style={{ color: 'var(--color-sidebar-text)' }}
      >
        <ChevronDown
          className={cn(
            'h-3.5 w-3.5 transition-transform duration-[120ms]',
            !open && '-rotate-90'
          )}
        />
      </button>
      <button
        type="button"
        onClick={() => to && navigate(to)}
        className="min-w-0 flex-1 truncate px-1 text-[10px] font-semibold uppercase tracking-[0.1em] hover:opacity-80 transition-opacity text-left"
        style={{ color: 'var(--color-sidebar-text)', opacity: 0.5 }}
      >
        {label}
        {count != null && (
          <span className="ml-1.5 tabular-nums text-[10px] font-bold opacity-70">
            {count}
          </span>
        )}
      </button>
    </div>
  );
}

export function AppSidebar({ collapsed, onToggle, onInvite }) {
  const user = useAuthStore((s) => s.user);
  const location = useLocation();
  const [projectsOpen, setProjectsOpen] = useState(true);

  useLiveSpaces();

  const showApprovals =
    canApproveTasks(user?.role) || hasPermission(user, PERMISSIONS.TASK_APPROVE);
  const showInvite = hasPermission(user, PERMISSIONS.USER_INVITE);
  const showAudit =
    hasPermission(user, PERMISSIONS.AUDIT_VIEW) || user?.role === ROLES.SUPER_ADMIN;
  const canViewProjects = hasPermission(user, PERMISSIONS.PROJECT_VIEW);

  const { data: unreadCount = 0 } = useUnreadCount();
  const { data: pendingApprovals = [] } = usePendingApprovals(showApprovals);
  const { data: projectsData } = useProjects({ limit: 100 });

  const projects = projectsData?.data ?? [];
  const orderedProjects = useMemo(() => sortByName(projects), [projects]);
  const approvalCount = pendingApprovals.length;

  const activeEntityId = useMemo(() => {
    const m = location.pathname.match(/^\/(?:spaces|projects)\/([a-f0-9]{24})/i);
    return m?.[1] || null;
  }, [location.pathname]);

  const initials = user?.name
    ? user.name.split(' ').map((n) => n[0]).slice(0, 2).join('').toUpperCase()
    : 'U';

  return (
    <aside
      className={cn(
        'sidebar-dark flex h-full shrink-0 flex-col',
        'transition-[width] duration-[200ms] ease-[cubic-bezier(0.4,0,0.2,1)]',
        collapsed ? 'w-16' : 'w-[260px]'
      )}
      style={{ backgroundColor: 'var(--color-sidebar-bg)' }}
    >
      {/* ── Brand header ── */}
      <div
        className={cn(
          'flex h-[52px] shrink-0 items-center px-3',
          collapsed ? 'justify-center' : 'gap-2.5'
        )}
        style={{ borderBottom: '1px solid var(--color-sidebar-border)' }}
      >
        <BrandLogo collapsed={collapsed} size="md" dark />
      </div>

      {/* ── Scrollable nav body ── */}
      <div className="flex-1 overflow-y-auto px-2 py-3 space-y-0.5">

        {/* ---- MAIN NAV ---- */}
        {!collapsed && (
          <p
            className="mb-1.5 px-2 text-[10px] font-semibold uppercase tracking-[0.1em]"
            style={{ color: 'var(--color-sidebar-text)', opacity: 0.45 }}
          >
            Workspace
          </p>
        )}

        <NavItem to="/" end label="Home" icon={LayoutDashboard} collapsed={collapsed} />
        <NavItem to="/inbox" label="Inbox" icon={Inbox} badge={unreadCount} collapsed={collapsed} matchPrefix="/inbox" />
        <NavItem to="/home/my-tasks" label="My Tasks" icon={CheckSquare} collapsed={collapsed} matchPrefix="/home/my-tasks" />

        {showApprovals && (
          <NavItem
            to="/approvals"
            label="Approvals"
            icon={ClipboardCheck}
            badge={approvalCount}
            collapsed={collapsed}
            matchPrefix="/approvals"
          />
        )}

        {/* ---- SPACES ---- */}
        {!collapsed && canViewProjects && (
          <div className="pt-2">
            <p
              className="mb-1.5 px-2 text-[10px] font-semibold uppercase tracking-[0.1em]"
              style={{ color: 'var(--color-sidebar-text)', opacity: 0.45 }}
            >
              Spaces
            </p>
          </div>
        )}
        {collapsed && <div className="my-2 h-px" style={{ background: 'var(--color-sidebar-border)' }} />}

        {canViewProjects && (
          <NavItem to="/projects" label="Projects" icon={FolderKanban} collapsed={collapsed} matchPrefix="/projects" />
        )}
        {canViewProjects && (
          <NavItem to="/boards" label="Boards" icon={LayoutGrid} collapsed={collapsed} matchPrefix="/boards" />
        )}

        {/* ---- PEOPLE ---- */}
        {!collapsed && (
          <div className="pt-2">
            <p
              className="mb-1.5 px-2 text-[10px] font-semibold uppercase tracking-[0.1em]"
              style={{ color: 'var(--color-sidebar-text)', opacity: 0.45 }}
            >
              People
            </p>
          </div>
        )}
        {collapsed && <div className="my-2 h-px" style={{ background: 'var(--color-sidebar-border)' }} />}

        <NavItem
          to="/teams/people"
          label="Teams"
          icon={Building2}
          collapsed={collapsed}
          matchPrefix="/teams"
        />

        {/* ---- INSIGHTS ---- */}
        {!collapsed && (
          <div className="pt-2">
            <p
              className="mb-1.5 px-2 text-[10px] font-semibold uppercase tracking-[0.1em]"
              style={{ color: 'var(--color-sidebar-text)', opacity: 0.45 }}
            >
              Insights
            </p>
          </div>
        )}
        {collapsed && <div className="my-2 h-px" style={{ background: 'var(--color-sidebar-border)' }} />}

        <NavItem to="/reports" label="Reports" icon={BarChart3} collapsed={collapsed} matchPrefix="/reports" />
        {showAudit && (
          <NavItem to="/audit" label="Audit Logs" icon={ScrollText} collapsed={collapsed} matchPrefix="/audit" />
        )}

        {/* ---- PROJECTS TREE ---- */}
        {!collapsed && canViewProjects && (
          <>
            <SectionHeader
              label="Projects"
              collapsed={collapsed}
              open={projectsOpen}
              onToggle={() => setProjectsOpen((v) => !v)}
              to="/projects"
              count={orderedProjects.length}
            />

            {projectsOpen && (
              <div
                className="ml-3 mt-0.5 space-y-0.5 border-l pl-2"
                style={{ borderColor: 'var(--color-sidebar-border)' }}
              >
                {orderedProjects.length === 0 ? (
                  <p
                    className="px-2 py-2 text-[11px]"
                    style={{ color: 'var(--color-sidebar-text)', opacity: 0.4 }}
                  >
                    No projects yet
                  </p>
                ) : (
                  orderedProjects.map((project) => {
                    const active = activeEntityId === String(project._id);
                    return (
                      <NavLink
                        key={project._id}
                        to={projectPath(project._id)}
                        className={cn(
                          'flex items-center gap-2 rounded-lg px-2 py-1.5 text-[12px]',
                          'transition-all duration-[120ms]',
                          active
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
                          <span
                            className="shrink-0 tabular-nums text-[10px] font-bold"
                            style={{ color: 'var(--color-sidebar-text)', opacity: 0.4 }}
                          >
                            {project.openTaskCount}
                          </span>
                        )}
                      </NavLink>
                    );
                  })
                )}
              </div>
            )}
          </>
        )}
      </div>

      {/* ── Footer ── */}
      <div
        className="shrink-0 p-2 space-y-1"
        style={{ borderTop: '1px solid var(--color-sidebar-border)' }}
      >
        {/* Invite */}
        {showInvite && (
          <button
            type="button"
            onClick={onInvite}
            title={collapsed ? 'Invite people' : undefined}
            className={cn(
              'group flex w-full items-center gap-2.5 rounded-xl text-[13px] font-medium',
              'text-[var(--color-sidebar-text)]',
              'transition-all duration-[120ms]',
              'hover:bg-[var(--color-sidebar-surface)] hover:text-[var(--color-sidebar-text-active)]',
              collapsed ? 'h-9 w-9 justify-center mx-auto' : 'px-2.5 py-2'
            )}
          >
            <UserPlus className="h-[17px] w-[17px] shrink-0 opacity-65 group-hover:opacity-100" />
            {!collapsed && <span>Invite people</span>}
          </button>
        )}

        {/* Settings */}
        <NavLink
          to="/settings"
          title={collapsed ? 'Settings' : undefined}
          className={({ isActive }) =>
            cn(
              'flex items-center gap-2.5 rounded-xl text-[13px] font-medium',
              'transition-all duration-[120ms]',
              collapsed ? 'h-9 w-9 justify-center mx-auto' : 'px-2.5 py-2 w-full',
              isActive
                ? 'bg-[var(--color-sidebar-active)] text-[var(--color-sidebar-text-active)]'
                : 'text-[var(--color-sidebar-text)] hover:bg-[var(--color-sidebar-surface)] hover:text-[var(--color-sidebar-text-active)]'
            )
          }
        >
          <Settings className="h-[17px] w-[17px] shrink-0 opacity-65" />
          {!collapsed && <span>Settings</span>}
        </NavLink>

        {/* User card */}
        {!collapsed && (
          <div
            className="rounded-xl px-3 py-2.5"
            style={{ backgroundColor: 'var(--color-sidebar-surface)' }}
          >
            <div className="flex items-center gap-2.5">
              {/* Gradient avatar */}
              <div
                className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-[11px] font-bold text-white shadow-sm"
                style={{
                  background: 'linear-gradient(135deg, var(--color-brand-500), var(--color-brand-700))',
                }}
              >
                {initials}
              </div>
              <div className="min-w-0">
                <p
                  className="truncate text-[12px] font-semibold"
                  style={{ color: 'var(--color-sidebar-text-active)' }}
                >
                  {user?.name}
                </p>
                <p
                  className="truncate text-[11px]"
                  style={{ color: 'var(--color-sidebar-text)', opacity: 0.55 }}
                >
                  {getRoleLabel(user?.role)}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Collapse toggle */}
        <button
          type="button"
          onClick={onToggle}
          className={cn(
            'flex w-full items-center justify-center gap-1.5 rounded-xl',
            'text-[11px] font-medium transition-all duration-[120ms]',
            'text-[var(--color-sidebar-text)] hover:bg-[var(--color-sidebar-surface)] hover:text-[var(--color-sidebar-text-active)]',
            collapsed ? 'h-9 py-2' : 'px-2 py-2'
          )}
        >
          {collapsed ? (
            <ChevronRightIcon className="h-4 w-4" />
          ) : (
            <>
              <ChevronLeft className="h-3.5 w-3.5" />
              <span style={{ opacity: 0.6 }}>Collapse</span>
            </>
          )}
        </button>
      </div>
    </aside>
  );
}
