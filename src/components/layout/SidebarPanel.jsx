import { useState } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import {
  Inbox,
  MessageSquareReply,
  MessageSquareText,
  Phone,
  UserCheck,
  MoreHorizontal,
  Plus,
  Hash,
  Sparkles,
  BarChart2,
  Users,
  Lock,
  Star,
  Layers,
  ChevronLeft,
  Settings,
  Shield,
  Clock,
  Calendar,
  FolderKanban,
  Building2,
  GitBranch,
} from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { useHomeOverview } from '@/features/home/hooks/useHome';
import { useArchiveProject, useLiveSpaces, useProjects } from '@/features/projects/hooks/useProjects';
import { useTeams } from '@/features/teams/hooks/useTeams';
import { useUsers } from '@/features/users/hooks/useUsers';
import { useUnreadCount } from '@/features/notifications/hooks/useNotifications';
import { usePendingApprovals } from '@/features/tasks/hooks/useTasks';
import { projectPath } from '@/features/spaces/spaceKinds';
import { ProjectSidebarItem } from '@/features/projects/components/ProjectSidebarItem';
import { EditProjectModal } from '@/features/projects/components/EditProjectModal';
import { DeleteProjectModal } from '@/features/projects/components/DeleteProjectModal';
import { UserAvatar } from '@/components/UserAvatar';
import { canManageOrg } from '@/lib/roles';
import { cn } from '@/lib/utils';

/* ============================================================
   SidebarPanel — ClickUp 3.0 Real Dynamic Detail Panel
   100% Live Backend Data: Real Teams, Real Projects/Channels,
   Real Workspace Members, Real Task & Meeting counts.
   Zero dummy / static data.
   ============================================================ */

function ClickUpNavItem({
  to,
  label,
  icon: Icon,
  iconNode,
  badge,
  end,
  matchPrefix,
  badgeColor = 'bg-[var(--color-surface-2)] text-[var(--color-text-secondary)]',
}) {
  const location = useLocation();
  const prefixActive = matchPrefix && location.pathname.startsWith(matchPrefix);

  return (
    <NavLink
      to={to}
      end={end}
      className={({ isActive }) => {
        const active = isActive || prefixActive;
        return cn(
          'group relative flex items-center gap-2.5 rounded-lg px-2.5 py-[7px] text-[13px] font-medium',
          'transition-colors duration-100',
          active
            ? 'bg-[var(--color-surface-2)] text-[var(--color-text-primary)] font-semibold'
            : 'text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-1)] hover:text-[var(--color-text-primary)]'
        );
      }}
    >
      {({ isActive }) => {
        const active = isActive || prefixActive;
        return (
          <>
            <span
              aria-hidden
              className={cn(
                'absolute left-0 top-1/2 h-4 w-[3px] -translate-y-1/2 rounded-r-full bg-brand-500 transition-opacity duration-100',
                active ? 'opacity-100' : 'opacity-0'
              )}
            />
            {iconNode ? (
              iconNode
            ) : Icon ? (
              <Icon
                className={cn(
                  'h-4 w-4 shrink-0 transition-colors',
                  active ? 'text-brand-600' : 'text-[var(--color-text-muted)] group-hover:text-[var(--color-text-secondary)]'
                )}
              />
            ) : null}

            <span className="min-w-0 flex-1 truncate">{label}</span>

            {badge != null && (
              <span
                className={cn(
                  'flex items-center justify-center rounded-md px-1.5 py-0.5 text-[10.5px] font-semibold tabular-nums',
                  badgeColor
                )}
              >
                {badge}
              </span>
            )}
          </>
        );
      }}
    </NavLink>
  );
}

function SectionTitle({ title, action }) {
  return (
    <div className="mb-1 mt-5 flex items-center justify-between px-2.5">
      <span
        className="text-[10.5px] font-semibold uppercase tracking-[0.09em]"
        style={{ color: 'var(--color-text-muted)' }}
      >
        {title}
      </span>
      {action}
    </div>
  );
}

function SidebarProjectsList({ projects, canManageProjects, limit }) {
  const location = useLocation();
  const archiveProject = useArchiveProject();
  const [editProject, setEditProject] = useState(null);
  const [deleteProject, setDeleteProject] = useState(null);

  const activeProjects = (limit ? projects.slice(0, limit) : projects).filter(
    (p) => p.status !== 'archived'
  );

  return (
    <>
      <div className="space-y-0.5">
        {activeProjects.length > 0 ? (
          activeProjects.map((project) => (
            <ProjectSidebarItem
              key={project._id}
              project={project}
              canManage={canManageProjects}
              isActive={location.pathname.startsWith(projectPath(project._id))}
              onEdit={setEditProject}
              onDelete={setDeleteProject}
              onArchive={(p) => archiveProject.mutate(p._id)}
            />
          ))
        ) : (
          <p className="px-2.5 py-1.5 text-[12px] text-gray-400">No channels yet</p>
        )}
      </div>

      <EditProjectModal
        project={editProject}
        open={Boolean(editProject)}
        onClose={() => setEditProject(null)}
      />
      <DeleteProjectModal
        project={deleteProject}
        open={Boolean(deleteProject)}
        onClose={() => setDeleteProject(null)}
      />
    </>
  );
}

/* ────────────────────────────────────────────────────────────
   1. HOME VIEW (100% Dynamic Data)
   ──────────────────────────────────────────────────────────── */
function HomeView({ onCreateClick, unreadCount, projects, home, users, user }) {
  const navigate = useNavigate();
  const isSuperAdmin = canManageOrg(user?.role);

  // Dynamic counts from live backend overview
  const assignedCount = home?.cards?.assigned_to_me?.length || 0;
  const meetingsCount = home?.cards?.meetings?.length || 0;
  const commentsCount = home?.cards?.commentNotifs?.length || 0;

  // Real teams from workspace overview
  const workspaceTeams = home?.workspace?.teams || [];

  // Real workspace colleagues (excluding current user or showing colleagues)
  const colleagues = users.filter((u) => u._id !== user?._id).slice(0, 6);

  return (
    <div className="flex-1 overflow-y-auto px-2.5 py-3 select-none">
      {/* Header */}
      <div className="mb-3 flex items-center justify-between px-1">
        <h2 className="text-[15px] font-semibold text-[var(--color-text-primary)] tracking-[-0.01em]">Home</h2>
        <button
          type="button"
          onClick={onCreateClick}
          className="flex items-center gap-1.5 rounded-lg bg-[var(--color-text-primary)] px-2.5 py-1 text-[12px] font-semibold text-white transition-colors hover:bg-black"
        >
          <Plus className="h-3.5 w-3.5" />
          <span>Create</span>
        </button>
      </div>

      {/* Main Home Menu */}
      <div className="space-y-0.5">
        <ClickUpNavItem
          to="/inbox"
          end
          label="Inbox"
          icon={Inbox}
          badge={unreadCount > 0 ? unreadCount : undefined}
          badgeColor="bg-brand-50 text-brand-700"
        />
        <ClickUpNavItem to="/inbox?tab=replies" label="Replies" icon={MessageSquareReply} />
        <ClickUpNavItem
          to="/home/assigned-comments"
          label="Assigned Comments"
          icon={MessageSquareText}
          badge={commentsCount > 0 ? commentsCount : undefined}
        />
        <ClickUpNavItem
          to="/home/meetings"
          label="Meetings"
          icon={Phone}
          badge={meetingsCount > 0 ? meetingsCount : undefined}
        />
        <ClickUpNavItem
          to="/home/my-tasks"
          label="My Tasks"
          icon={UserCheck}
          badge={assignedCount > 0 ? assignedCount : undefined}
          badgeColor="bg-brand-50 text-brand-700"
        />
        <ClickUpNavItem to="/all-tasks" label="All Tasks" icon={MoreHorizontal} />
      </div>

      {/* Real Channels / Projects Section */}
      <SectionTitle
        title="Channels &amp; Spaces"
        action={
          <button
            type="button"
            onClick={onCreateClick}
            className="flex h-5 w-5 items-center justify-center rounded text-gray-400 hover:bg-gray-100 hover:text-gray-700"
            title="Add Channel / Project"
          >
            <Plus className="h-3.5 w-3.5" />
          </button>
        }
      />
      <div className="space-y-0.5">
        <SidebarProjectsList
          projects={projects}
          canManageProjects={isSuperAdmin}
          limit={6}
        />
        <button
          type="button"
          onClick={onCreateClick}
          className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-1.5 text-[13px] font-medium text-gray-500 hover:bg-[#f4f5f7] hover:text-gray-900 transition-colors"
        >
          <Plus className="h-3.5 w-3.5" />
          <span>Add Channel / Space</span>
        </button>
      </div>

      {/* Real Direct Messages Section */}
      <SectionTitle title="Direct Messages" />
      <div className="space-y-0.5">
        {colleagues.length > 0 ? (
          colleagues.map((member) => (
            <NavLink
              key={member._id}
              to="/inbox"
              className="group flex items-center gap-2.5 rounded-lg px-2.5 py-1.5 text-[13px] font-medium text-gray-700 hover:bg-[#f4f5f7] hover:text-gray-950 transition-colors"
            >
              <div className="relative flex shrink-0">
                <UserAvatar user={member} size="xs" rounded="full" className="h-4.5 w-4.5 text-[9px]" />
                <span className="absolute -bottom-0.5 -right-0.5 h-1.5 w-1.5 rounded-full bg-emerald-500 ring-1 ring-white" />
              </div>
              <span className="min-w-0 flex-1 truncate">{member.name}</span>
            </NavLink>
          ))
        ) : (
          <p className="px-2.5 py-1.5 text-[12px] text-gray-400">No teammates yet</p>
        )}
        <NavLink
          to="/inbox"
          className="flex items-center gap-2.5 rounded-lg px-2.5 py-1.5 text-[13px] font-medium text-gray-700 hover:bg-[#f4f5f7] hover:text-gray-950 transition-colors"
        >
          <div className="relative flex shrink-0">
            <UserAvatar user={user} size="xs" rounded="full" className="h-4.5 w-4.5 text-[9px]" />
            <span className="absolute -bottom-0.5 -right-0.5 h-1.5 w-1.5 rounded-full bg-emerald-500 ring-1 ring-white" />
          </div>
          <span className="min-w-0 flex-1 truncate">{user?.name || 'You'} — You</span>
        </NavLink>
      </div>

      {/* Real Spaces / Teams Section */}
      <SectionTitle
        title="Teams &amp; Spaces"
        action={
          <button
            type="button"
            onClick={() => navigate('/projects')}
            className="flex h-5 w-5 items-center justify-center rounded hover:bg-gray-200 text-gray-500 hover:text-gray-900 transition-colors"
          >
            <Plus className="h-3.5 w-3.5" />
          </button>
        }
      />
      <div className="space-y-0.5 pb-4">
        <ClickUpNavItem to="/all-tasks" label="All Workspace Tasks" icon={Layers} />
        <ClickUpNavItem to="/projects" label="All Spaces" icon={FolderKanban} />
        {workspaceTeams.map((t) => (
          <ClickUpNavItem
            key={t._id}
            to={`/teams/${t._id}`}
            label={t.name}
            icon={Building2}
          />
        ))}
      </div>
    </div>
  );
}

/* ────────────────────────────────────────────────────────────
   2. AI VIEW (Real Tools & Workflows)
   ──────────────────────────────────────────────────────────── */
function AIView({ onCreateClick }) {
  const user = useAuthStore((s) => s.user);

  return (
    <div className="flex flex-1 flex-col h-full overflow-hidden select-none">
      <div className="flex-1 overflow-y-auto px-2.5 py-3">
        {/* Header */}
        <div className="mb-3 flex items-center justify-between px-1">
          <h2 className="text-[15px] font-semibold text-[var(--color-text-primary)] tracking-[-0.01em]">AI</h2>
          <button
            type="button"
            onClick={onCreateClick}
            className="flex items-center gap-1.5 rounded-lg bg-[var(--color-text-primary)] px-2.5 py-1 text-[12px] font-semibold text-white transition-colors hover:bg-black"
          >
            <Sparkles className="h-3.5 w-3.5" />
            <span>Create</span>
          </button>
        </div>

        {/* Main AI Links */}
        <div className="space-y-0.5">
          <ClickUpNavItem
            to="/ai"
            end
            label="Ask or Create"
            iconNode={
              <Sparkles className="h-4 w-4 shrink-0 text-brand-500" />
            }
          />
          <ClickUpNavItem to="/reports" label="Analytics &amp; Insights" icon={BarChart2} />
          <ClickUpNavItem to="/settings" label="AI Integrations" icon={Settings} />
        </div>

        {/* Workspace Assistant */}
        <SectionTitle title="Smart Assistant" />
        <div className="space-y-0.5">
          <ClickUpNavItem to="/ai" label="Workspace Chat" iconNode={<span className="text-sm">💬</span>} />
          <ClickUpNavItem to="/all-tasks" label="Task Auto-Summary" iconNode={<span className="text-sm">📋</span>} />
          <ClickUpNavItem to="/reports" label="Productivity Report" iconNode={<span className="text-sm">📊</span>} />
        </div>
      </div>

      {/* Account Info Footer */}
      <div className="shrink-0 border-t border-gray-200 bg-gray-50/70 px-4 py-2.5 flex items-center justify-between text-[11.5px] text-gray-600">
        <span className="font-semibold">{user?.name}</span>
        <span className="rounded bg-brand-50 px-1.5 py-0.5 text-[10.5px] font-semibold text-brand-700">
          {user?.role || 'Member'}
        </span>
      </div>
    </div>
  );
}

/* ────────────────────────────────────────────────────────────
   3. TEAMS VIEW (Real Dynamic Teams & Members)
   ──────────────────────────────────────────────────────────── */
function TeamsView({ teamsData, usersData }) {
  const teams = teamsData?.data || [];
  const totalPeople = usersData?.pagination?.total || usersData?.data?.length || 0;

  return (
    <div className="flex-1 overflow-y-auto px-2.5 py-3 select-none">
      {/* Header */}
      <div className="mb-3 px-1">
        <h2 className="text-[15px] font-semibold text-[var(--color-text-primary)] tracking-[-0.01em]">Teams</h2>
      </div>

      {/* Main Teams Menu */}
      <div className="space-y-0.5">
        <ClickUpNavItem to="/teams/all" end label="All Teams" icon={Users} badge={teams.length > 0 ? teams.length : undefined} />
        <ClickUpNavItem
          to="/teams/people"
          label="All People"
          iconNode={<span className="text-sm">📇</span>}
          badge={totalPeople > 0 ? totalPeople : undefined}
        />
        <ClickUpNavItem to="/teams/org" label="Org Chart" icon={GitBranch} />
        <ClickUpNavItem to="/teams/analytics" label="Team Analytics" icon={BarChart2} />
      </div>

      {/* My Teams Section (Real Dynamic Teams) */}
      <SectionTitle title="My Teams" />
      {teams.length > 0 ? (
        <div className="space-y-0.5">
          {teams.map((team) => (
            <ClickUpNavItem
              key={team._id}
              to={`/teams/${team._id}`}
              label={team.name}
              icon={Building2}
              badge={team.members?.length > 0 ? team.members.length : undefined}
            />
          ))}
        </div>
      ) : (
        <div className="rounded-xl border border-gray-200 bg-white p-5 text-center shadow-2xs">
          <div className="mx-auto mb-2 flex h-7 w-7 items-center justify-center rounded-lg bg-amber-50 text-amber-500">
            <Users className="h-4 w-4" />
          </div>
          <p className="text-[12px] text-gray-500 leading-relaxed">
            Once you are added to a Team you will see it here
          </p>
        </div>
      )}
    </div>
  );
}

/* ────────────────────────────────────────────────────────────
   4. DASHBOARD VIEW (Real Boards & Projects)
   ──────────────────────────────────────────────────────────── */
function DashboardView({ onCollapse, onCreateClick, projects, user }) {
  const isSuperAdmin = canManageOrg(user?.role);

  return (
    <div className="flex-1 overflow-y-auto px-2.5 py-3 select-none">
      {/* Header */}
      <div className="mb-3 flex items-center justify-between px-1">
        <h2 className="text-[15px] font-semibold text-[var(--color-text-primary)] tracking-[-0.01em]">Dashboards</h2>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={onCollapse}
            className="flex h-6 w-6 items-center justify-center rounded text-gray-400 hover:bg-gray-100 hover:text-gray-700"
            title="Collapse sidebar"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={onCreateClick}
            className="flex h-6 w-6 items-center justify-center rounded border border-gray-200 text-gray-600 hover:bg-gray-100"
            title="New dashboard / project"
          >
            <Plus className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* Main Dashboard Menu */}
      <div className="space-y-0.5">
        <ClickUpNavItem to="/boards" end label="All Boards" icon={BarChart2} />
        <ClickUpNavItem
          to="/projects"
          label="My Projects"
          iconNode={
            <span className="flex h-4.5 w-4.5 items-center justify-center rounded-full bg-purple-600 text-[10px] font-bold text-white">
              {user?.name?.[0]?.toUpperCase() || 'P'}
            </span>
          }
          badge={projects.length > 0 ? projects.length : undefined}
        />
        <ClickUpNavItem to="/reports" label="Analytics &amp; Velocity" icon={BarChart2} />
      </div>

      {/* Active Project Boards */}
      <SectionTitle title="Active Spaces &amp; Boards" />
      {projects.length > 0 ? (
        <SidebarProjectsList projects={projects} canManageProjects={isSuperAdmin} />
      ) : (
        <div className="rounded-xl border border-gray-200 bg-white p-5 text-center shadow-2xs">
          <div className="mx-auto mb-2 flex h-6 w-6 items-center justify-center text-amber-400">
            <Star className="h-4 w-4 fill-amber-400" />
          </div>
          <p className="text-[12px] text-gray-500 leading-relaxed">
            Create a Space or Board to see it here
          </p>
        </div>
      )}
    </div>
  );
}

/* ────────────────────────────────────────────────────────────
   5. PLANNER VIEW (Real Meetings & Tasks)
   ──────────────────────────────────────────────────────────── */
function PlannerView({ home }) {
  const assignedCount = home?.cards?.assigned_to_me?.length || 0;
  const meetingsCount = home?.cards?.meetings?.length || 0;

  return (
    <div className="flex-1 overflow-y-auto px-2.5 py-3 select-none">
      <div className="mb-3 px-1">
        <h2 className="text-[15px] font-semibold text-[var(--color-text-primary)] tracking-[-0.01em]">Planner</h2>
      </div>
      <div className="space-y-0.5">
        <ClickUpNavItem to="/home/agenda" end label="Calendar &amp; Agenda" icon={Calendar} />
        <ClickUpNavItem
          to="/home/my-tasks?view=today"
          label="Today &amp; Overdue"
          icon={Clock}
          badge={assignedCount > 0 ? assignedCount : undefined}
        />
        <ClickUpNavItem
          to="/home/meetings"
          label="Meetings Schedule"
          icon={Phone}
          badge={meetingsCount > 0 ? meetingsCount : undefined}
        />
        <ClickUpNavItem to="/home/my-tasks?view=assigned" label="Assigned Tasks" icon={UserCheck} />
      </div>
    </div>
  );
}

/* ────────────────────────────────────────────────────────────
   6. MORE VIEW (Real Approvals, Audit & Settings)
   ──────────────────────────────────────────────────────────── */
function MoreView() {
  const showApprovals = usePendingApprovals(true);
  const pendingCount = showApprovals?.data?.length || 0;

  return (
    <div className="flex-1 overflow-y-auto px-2.5 py-3 select-none">
      <div className="mb-3 px-1">
        <h2 className="text-[15px] font-semibold text-[var(--color-text-primary)] tracking-[-0.01em]">More Apps</h2>
      </div>
      <div className="space-y-0.5">
        <ClickUpNavItem to="/approvals" label="Approvals" icon={Shield} badge={pendingCount > 0 ? pendingCount : undefined} />
        <ClickUpNavItem to="/reports" label="Reports &amp; Velocity" icon={BarChart2} />
        <ClickUpNavItem to="/audit" label="System Audit Logs" icon={Layers} />
        <ClickUpNavItem to="/settings" label="Workspace Settings" icon={Settings} />
      </div>
    </div>
  );
}

/* ────────────────────────────────────────────────────────────
   MAIN EXPORT: SidebarPanel
   ──────────────────────────────────────────────────────────── */
export function SidebarPanel({ activeSection, onInvite, onToggleCollapse, onCreateClick }) {
  const user = useAuthStore((s) => s.user);
  const { data: unreadCount = 0 } = useUnreadCount();
  const { data: home } = useHomeOverview();
  const { data: projectsData } = useProjects({ limit: 50 });
  const { data: teamsData } = useTeams({ limit: 50 });
  const { data: usersData } = useUsers({ limit: 30 });

  useLiveSpaces();

  const projects = projectsData?.data ?? [];
  const users = usersData?.data ?? [];

  return (
    <div
      className="flex h-full w-[240px] shrink-0 flex-col border-r border-[var(--color-border-subtle)] bg-[var(--color-surface-0)]"
      style={{
        boxShadow: 'inset -1px 0 0 rgba(0, 0, 0, 0.04)',
      }}
    >
      {activeSection === 'home' && (
        <HomeView
          onCreateClick={onCreateClick}
          unreadCount={unreadCount}
          projects={projects}
          home={home}
          users={users}
          user={user}
        />
      )}
      {activeSection === 'ai' && <AIView onCreateClick={onCreateClick} />}
      {activeSection === 'teams' && <TeamsView teamsData={teamsData} usersData={usersData} />}
      {activeSection === 'dashboard' && (
        <DashboardView
          onCollapse={onToggleCollapse}
          onCreateClick={onCreateClick}
          projects={projects}
          user={user}
        />
      )}
      {activeSection === 'planner' && <PlannerView home={home} />}
      {activeSection === 'more' && <MoreView />}
    </div>
  );
}
