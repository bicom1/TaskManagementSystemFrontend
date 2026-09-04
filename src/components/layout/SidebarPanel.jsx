import { useState, useMemo } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import {
  Inbox,
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
  ChevronUp,
  ChevronDown,
  Settings,
  Clock,
  Calendar,
  FolderKanban,
  Building2,
  GitBranch,
  SquarePen,
  Zap,
  Link2,
  Glasses,
} from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { useHomeOverview } from '@/features/home/hooks/useHome';
import { useProjects } from '@/features/projects/hooks/useProjects';
import { useTeams } from '@/features/teams/hooks/useTeams';
import { useUsers } from '@/features/users/hooks/useUsers';
import { useUnreadCount } from '@/features/notifications/hooks/useNotifications';
import { projectPath } from '@/features/spaces/spaceKinds';
import { ProjectSidebarItem } from '@/features/projects/components/ProjectSidebarItem';
import { EditProjectModal } from '@/features/projects/components/EditProjectModal';
import { RenameProjectModal } from '@/features/projects/components/RenameProjectModal';
import { DeleteProjectModal } from '@/features/projects/components/DeleteProjectModal';
import {
  sortProjectsByFavorite,
  useProjectFavoritesStore,
} from '@/features/projects/projectFavoritesStore';
import { UserAvatar } from '@/components/UserAvatar';
import {
  PresenceAvatarDot,
  PresenceIndicator,
} from '@/features/presence/PresenceIndicator';
import { usePresenceQuery } from '@/features/presence/usePresence';
import { cn } from '@/lib/utils';
import { BrainLogo } from '@/features/ai/components/BrainLogo';
import { AiUsageRing } from '@/features/ai/components/AiUsageRing';
import { useAiStore } from '@/features/ai/aiStore';

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

function CollapsibleSection({ title, defaultOpen = true, children }) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div>
      <div className="mb-1 mt-5 flex items-center justify-between px-2.5">
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="flex min-w-0 flex-1 items-center gap-1.5 text-left"
        >
          <span
            className="text-[10.5px] font-semibold uppercase tracking-[0.09em]"
            style={{ color: 'var(--color-text-muted)' }}
          >
            {title}
          </span>
        </button>
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="flex h-5 w-5 shrink-0 items-center justify-center rounded text-gray-400 hover:bg-gray-100 hover:text-gray-700"
          aria-label={open ? `Collapse ${title}` : `Expand ${title}`}
        >
          {open ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
        </button>
      </div>
      {open && children}
    </div>
  );
}

function SidebarProjectsList({ projects, limit }) {
  const location = useLocation();
  const favoriteIds = useProjectFavoritesStore((s) => s.favoriteIds);
  const [renameProject, setRenameProject] = useState(null);
  const [editProject, setEditProject] = useState(null);
  const [updateProject, setUpdateProject] = useState(null);
  const [deleteProject, setDeleteProject] = useState(null);

  const activeProjects = sortProjectsByFavorite(
    (limit ? projects.slice(0, limit) : projects).filter((p) => p.status !== 'archived'),
    favoriteIds
  );

  return (
    <>
      <div className="space-y-0.5">
        {activeProjects.length > 0 ? (
          activeProjects.map((project) => (
            <ProjectSidebarItem
              key={project._id}
              project={project}
              canManage={Boolean(project.canManage)}
              isActive={location.pathname.startsWith(projectPath(project._id))}
              onRename={setRenameProject}
              onEdit={setEditProject}
              onUpdate={setUpdateProject}
              onDelete={setDeleteProject}
            />
          ))
        ) : (
          <p className="px-2.5 py-1.5 text-[12px] text-gray-400">No projects yet</p>
        )}
      </div>

      <RenameProjectModal
        project={renameProject}
        open={Boolean(renameProject)}
        onClose={() => setRenameProject(null)}
      />
      <EditProjectModal
        project={editProject}
        open={Boolean(editProject)}
        onClose={() => setEditProject(null)}
        title="Edit project"
      />
      <EditProjectModal
        project={updateProject}
        open={Boolean(updateProject)}
        onClose={() => setUpdateProject(null)}
        title="Update project"
        description="Update project details, status, and appearance."
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
function HomeView({ onCreateClick, onAddProject, unreadCount, projects, home, users, user }) {
  const navigate = useNavigate();
  const handleAddProject = onAddProject || onCreateClick;
  const aiChats = useAiStore((s) => s.chats);

  // Dynamic counts from live backend overview
  const assignedCount = home?.cards?.assigned_to_me?.length || 0;
  const meetingsCount = home?.cards?.meetings?.length || 0;
  const commentsCount = home?.cards?.commentNotifs?.length || 0;

  // Real teams from workspace overview
  const workspaceTeams = home?.workspace?.teams || [];

  // Real workspace colleagues (excluding current user)
  const colleagues = useMemo(
    () => users.filter((u) => String(u._id) !== String(user?._id)).slice(0, 6),
    [users, user?._id]
  );
  usePresenceQuery(colleagues.map((m) => m._id));

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
        <ClickUpNavItem to="/ai/skills" label="Skills" icon={Zap} />
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

      {/* AI Chats */}
      <SectionTitle title="AI Chats" />
      <div className="space-y-0.5">
        {aiChats.slice(0, 4).map((chat) => (
          <ClickUpNavItem
            key={chat.id}
            to={`/ai/chat/${chat.id}`}
            label={chat.title}
            iconNode={<BrainLogo size={16} />}
          />
        ))}
        <ClickUpNavItem
          to="/ai"
          label="Ask, Build, Create"
          icon={Sparkles}
        />
      </div>

      {/* All Projects — top slot (was Channels) */}
      <CollapsibleSection title="All Projects">
        <div className="space-y-0.5">
          <ClickUpNavItem
            to="/projects"
            end
            label="All Projects"
            icon={FolderKanban}
            badge={projects.length > 0 ? projects.length : undefined}
          />
          <SidebarProjectsList projects={projects} />
          <button
            type="button"
            onClick={handleAddProject}
            className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-1.5 text-[13px] font-medium text-gray-500 hover:bg-[#f4f5f7] hover:text-gray-900 transition-colors"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>Add Project</span>
          </button>
        </div>
      </CollapsibleSection>

      {/* Real Direct Messages Section */}
      <SectionTitle title="Direct Messages" />
      <div className="space-y-0.5">
        {colleagues.length > 0 ? (
          colleagues.map((member) => (
            <NavLink
              key={member._id}
              to={`/inbox?view=chat&dm=${member._id}`}
              className="group flex items-center gap-2.5 rounded-lg px-2.5 py-1.5 text-[13px] font-medium text-gray-700 hover:bg-[#f4f5f7] hover:text-gray-950 transition-colors"
            >
              <div className="relative flex shrink-0">
                <UserAvatar user={member} size="xs" rounded="full" className="h-4.5 w-4.5 text-[9px]" />
                <PresenceAvatarDot userId={member._id} person={member} />
              </div>
              <span className="min-w-0 flex-1">
                <span className="block truncate">{member.name}</span>
                <PresenceIndicator
                  userId={member._id}
                  person={member}
                  className="mt-0.5 text-[10px] font-normal text-gray-500"
                />
              </span>
            </NavLink>
          ))
        ) : (
          <p className="px-2.5 py-1.5 text-[12px] text-gray-400">No teammates yet</p>
        )}
        <NavLink
          to="/inbox?view=chat"
          className="flex items-center gap-2.5 rounded-lg px-2.5 py-1.5 text-[13px] font-medium text-gray-500 hover:bg-[#f4f5f7] hover:text-gray-900 transition-colors"
        >
          <Plus className="h-3.5 w-3.5" />
          <span>New message</span>
        </NavLink>
        <NavLink
          to="/inbox?view=chat"
          className="flex items-center gap-2.5 rounded-lg px-2.5 py-1.5 text-[13px] font-medium text-gray-700 hover:bg-[#f4f5f7] hover:text-gray-950 transition-colors"
        >
          <div className="relative flex shrink-0">
            <UserAvatar user={user} size="xs" rounded="full" className="h-4.5 w-4.5 text-[9px]" />
            <PresenceAvatarDot userId={user?._id} person={user} />
          </div>
          <span className="min-w-0 flex-1">
            <span className="block truncate">{user?.name || 'You'} — You</span>
            <PresenceIndicator
              userId={user?._id}
              person={user}
              className="mt-0.5 text-[10px] font-normal text-gray-500"
            />
          </span>
        </NavLink>
      </div>

      {/* Teams */}
      <SectionTitle title="Teams" />
      <div className="space-y-0.5 pb-4">
        <ClickUpNavItem to="/all-tasks" label="All Workspace Tasks" icon={Layers} />
        <ClickUpNavItem to="/teams/all" label="All Teams" icon={Users} />
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
   2. AI VIEW (ClickUp Brain-style dynamic panel)
   ──────────────────────────────────────────────────────────── */
function AIView() {
  const user = useAuthStore((s) => s.user);
  const navigate = useNavigate();
  const chats = useAiStore((s) => s.chats);
  const brainUses = useAiStore((s) => s.brainUses);
  const creditsUsed = useAiStore((s) => s.creditsUsed);
  const creditsTotal = useAiStore((s) => s.creditsTotal);
  const creditsLeft = Math.max(0, creditsTotal - creditsUsed);
  const myAgents = useAiStore((s) => s.myAgents);

  const handleNewChat = () => navigate('/ai');

  return (
    <div className="flex flex-1 flex-col h-full overflow-hidden select-none">
      <div className="flex-1 overflow-y-auto px-2.5 py-3">
        {/* Header */}
        <div className="mb-3 flex items-center justify-between px-1">
          <h2 className="text-[15px] font-semibold text-[var(--color-text-primary)] tracking-[-0.01em]">AI</h2>
          <button
            type="button"
            onClick={handleNewChat}
            className="flex h-7 w-7 items-center justify-center rounded-lg text-gray-500 hover:bg-gray-100 hover:text-gray-900"
            title="New chat"
          >
            <SquarePen className="h-4 w-4" />
          </button>
        </div>

        {/* Main AI Links */}
        <div className="space-y-0.5">
          <ClickUpNavItem
            to="/ai"
            end
            label="Ask or Create"
            iconNode={<BrainLogo size={18} />}
          />
          <ClickUpNavItem
            to="/ai/skills"
            label="Skills"
            icon={Zap}
            badge="Beta"
            badgeColor="bg-amber-50 text-amber-700"
          />
          <ClickUpNavItem to="/ai/analytics" label="Analytics" icon={BarChart2} />
          <ClickUpNavItem to="/ai/connections" label="Connections" icon={Link2} />
        </div>

        {/* Super Agents */}
        <SectionTitle title="Super Agents" />
        <div className="space-y-0.5">
          <ClickUpNavItem
            to="/ai/agents/new"
            label="Create Agent"
            iconNode={<Glasses className="h-4 w-4 text-violet-600" />}
          />
          <ClickUpNavItem
            to="/ai/agents"
            end
            label="All Agents"
            iconNode={<span className="flex h-4 w-4 items-center justify-center rounded-full bg-rose-500 text-[9px] text-white">👤</span>}
          />
          <ClickUpNavItem
            to="/ai/agents/mine"
            label="My Agents"
            iconNode={
              <span className="flex h-4 w-4 items-center justify-center rounded-full bg-fuchsia-600 text-[9px] font-bold text-white">
                {user?.name?.[0]?.toUpperCase() || 'M'}
              </span>
            }
            badge={myAgents.length > 0 ? myAgents.length : undefined}
          />
        </div>

        {/* Recent chats */}
        {chats.length > 0 && (
          <>
            <SectionTitle title="Recent" />
            <div className="space-y-0.5">
              {chats.slice(0, 8).map((chat) => (
                <ClickUpNavItem
                  key={chat.id}
                  to={`/ai/chat/${chat.id}`}
                  label={chat.title}
                  icon={MessageSquareText}
                />
              ))}
            </div>
          </>
        )}
      </div>

      {/* Usage footer */}
      <div className="shrink-0 space-y-2 border-t border-gray-200 bg-gray-50/70 px-4 py-3">
        <AiUsageRing
          value={brainUses}
          max={Math.max(brainUses, 20)}
          color="#22c55e"
          label={`${brainUses} Brain AI uses`}
        />
        <AiUsageRing
          value={creditsLeft}
          max={creditsTotal}
          color="#f97316"
          label={`${creditsLeft} Credits left`}
        />
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
function DashboardView({ onCollapse, onCreateClick, onAddProject, projects, user }) {
  const handleAddProject = onAddProject || onCreateClick;

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
            onClick={handleAddProject}
            className="flex h-6 w-6 items-center justify-center rounded border border-gray-200 text-gray-600 hover:bg-gray-100"
            title="Add project"
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

      {/* Project list */}
      <SectionTitle title="All Projects" />
      {projects.length > 0 ? (
        <SidebarProjectsList projects={projects} />
      ) : (
        <div className="rounded-xl border border-gray-200 bg-white p-5 text-center shadow-2xs">
          <div className="mx-auto mb-2 flex h-6 w-6 items-center justify-center text-amber-400">
            <Star className="h-4 w-4 fill-amber-400" />
          </div>
          <p className="text-[12px] text-gray-500 leading-relaxed">
            Create a project to see it here
          </p>
          <button
            type="button"
            onClick={handleAddProject}
            className="mt-3 inline-flex items-center gap-1.5 rounded-lg bg-[var(--color-text-primary)] px-3 py-1.5 text-[12px] font-semibold text-white hover:bg-black"
          >
            <Plus className="h-3.5 w-3.5" />
            Add Project
          </button>
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
   6. MORE VIEW (Reports, Audit & Settings)
   ──────────────────────────────────────────────────────────── */
function MoreView() {
  return (
    <div className="flex-1 overflow-y-auto px-2.5 py-3 select-none">
      <div className="mb-3 px-1">
        <h2 className="text-[15px] font-semibold text-[var(--color-text-primary)] tracking-[-0.01em]">More Apps</h2>
      </div>
      <div className="space-y-0.5">
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
export function SidebarPanel({ activeSection, onInvite, onToggleCollapse, onCreateClick, onAddProject }) {
  const user = useAuthStore((s) => s.user);
  const { data: unreadCount = 0 } = useUnreadCount();
  const { data: home } = useHomeOverview();
  const { data: projectsData } = useProjects({ limit: 500 });
  const { data: teamsData } = useTeams({ limit: 50 });
  const { data: usersData } = useUsers({ limit: 30 });

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
          onAddProject={onAddProject}
          unreadCount={unreadCount}
          projects={projects}
          home={home}
          users={users}
          user={user}
        />
      )}
      {activeSection === 'ai' && <AIView />}
      {activeSection === 'teams' && <TeamsView teamsData={teamsData} usersData={usersData} />}
      {activeSection === 'dashboard' && (
        <DashboardView
          onCollapse={onToggleCollapse}
          onCreateClick={onCreateClick}
          onAddProject={onAddProject}
          projects={projects}
          user={user}
        />
      )}
      {activeSection === 'planner' && <PlannerView home={home} />}
      {activeSection === 'more' && <MoreView />}
    </div>
  );
}
