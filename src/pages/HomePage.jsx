import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, Settings2 } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import {
  useHomeOverview,
  useUpdateHomePreferences,
  useTrackRecent,
  useLiveMyTasks,
} from '@/features/home/hooks/useHome';
import { HOME_CARD_LABELS } from '@/features/home/api/homeApi';
import {
  HomePanel,
  HomeStat,
  TaskRow,
  EmptyCardLine,
  RecentRow,
} from '@/features/home/components/HomeCards';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { CardGridSkeleton } from '@/components/ui/Spinner';
import { UserAvatar } from '@/components/UserAvatar';
import { formatDistanceToNow } from 'date-fns';
import { getDashboardMeta } from '@/lib/permissions';
import { getRoleLabel } from '@/lib/roles';

function greetingName(name) {
  return name?.split(' ')[0] || 'there';
}

function timeGreeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 18) return 'Good afternoon';
  return 'Good evening';
}

function PanelLink({ children, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:text-primary-deep"
    >
      {children}
      <ArrowRight className="h-3.5 w-3.5" />
    </button>
  );
}

export default function HomePage() {
  const user = useAuthStore((s) => s.user);
  const navigate = useNavigate();
  const { data, isLoading, isFetching } = useHomeOverview();
  useLiveMyTasks();
  const updatePrefs = useUpdateHomePreferences();
  const trackRecent = useTrackRecent();
  const [manageOpen, setManageOpen] = useState(false);
  const [draftCards, setDraftCards] = useState([]);

  const cards = data?.cards;
  const prefs = data?.preferences;
  const dashMeta = getDashboardMeta(user?.role);
  const counts = cards?.ai_standup?.counts;

  const enabled = useMemo(() => {
    const configured = prefs?.homeCards?.length
      ? [...prefs.homeCards].sort((a, b) => a.order - b.order)
      : Object.keys(HOME_CARD_LABELS).map((id, order) => ({ id, enabled: true, order }));
    return new Set(configured.filter((c) => c.enabled !== false).map((c) => c.id));
  }, [prefs]);

  const show = (id) => enabled.has(id);

  const openTask = (task) => {
    if (task?.project?._id || task?.project) {
      const projectId = task.project._id || task.project;
      trackRecent.mutate({
        type: 'task',
        refId: task._id,
        title: task.title,
        subtitle: `in ${task.project?.name || 'Project'}`,
        projectId,
      });
      navigate(`/projects/${projectId}`);
    }
  };

  const openManage = () => {
    const list = prefs?.homeCards?.length
      ? [...prefs.homeCards].sort((a, b) => a.order - b.order)
      : Object.keys(HOME_CARD_LABELS).map((id, order) => ({ id, enabled: true, order }));
    const ids = new Set(list.map((c) => c.id));
    Object.keys(HOME_CARD_LABELS).forEach((id, i) => {
      if (!ids.has(id)) list.push({ id, enabled: false, order: list.length + i });
    });
    setDraftCards(list);
    setManageOpen(true);
  };

  const saveManage = () => {
    updatePrefs.mutate(
      { homeCards: draftCards.map((c, order) => ({ ...c, order })) },
      { onSuccess: () => setManageOpen(false) }
    );
  };

  const setCalendar = (provider) => {
    updatePrefs.mutate({ calendarProvider: provider });
  };

  const assigned = cards?.assigned_to_me || [];
  const myWork = cards?.my_work || [];
  const agenda = cards?.agenda || [];
  const priorities = cards?.priorities || [];
  const recents = cards?.recents || [];
  const personal = cards?.personal_list || [];
  const comments = cards?.assigned_comments || [];

  return (
    <div className="mx-auto max-w-[1280px] px-4 py-6 sm:px-6 lg:px-8">
      {/* Header — clear, calm */}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <UserAvatar user={user} size="lg" rounded="lg" />
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-2xl font-semibold tracking-tight text-ink">
                {timeGreeting()}, {greetingName(user?.name)}
              </h1>
              <span className="rounded bg-cloud px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-graphite">
                {dashMeta.badge || getRoleLabel(user?.role)}
              </span>
              {isFetching && data ? (
                <span className="text-xs text-graphite">Updating…</span>
              ) : null}
            </div>
            <p className="mt-0.5 text-sm text-graphite">{dashMeta.subtitle}</p>
          </div>
        </div>
        <Button variant="outline" size="sm" onClick={openManage}>
          <Settings2 className="h-4 w-4" />
          Customize
        </Button>
      </div>

      {/* Stats — one clear row */}
      <div className="mb-6 overflow-hidden rounded-xl border border-hairline bg-paper">
        <div className="flex flex-col sm:flex-row">
          <HomeStat
            label="Assigned to me"
            value={counts?.assigned ?? assigned.length}
            onClick={() => navigate('/home/my-tasks?view=assigned')}
          />
          <HomeStat label="In progress" value={counts?.inProgress ?? myWork.length} />
          <HomeStat
            label="Due today"
            value={counts?.dueToday ?? 0}
            onClick={() => navigate('/home/my-tasks?view=today')}
          />
          <HomeStat
            label="Overdue"
            value={counts?.overdue ?? 0}
            alert={(counts?.overdue ?? 0) > 0}
            onClick={() => navigate('/home/my-tasks?view=today')}
          />
        </div>
      </div>

      {isLoading && !data ? (
        <CardGridSkeleton cards={4} />
      ) : (
        <div className="space-y-4">
          {/* Row 1 — your work */}
          <div className="grid gap-4 lg:grid-cols-2">
            {show('assigned_to_me') ? (
              <HomePanel
                title="Assigned to me"
                count={assigned.length}
                action={
                  <PanelLink onClick={() => navigate('/home/my-tasks?view=assigned')}>
                    View all
                  </PanelLink>
                }
              >
                {assigned.length === 0 ? (
                  <EmptyCardLine>
                    Tasks assigned to you appear here as soon as someone assigns you.
                  </EmptyCardLine>
                ) : (
                  assigned.slice(0, 8).map((t) => (
                    <TaskRow key={t._id} task={t} onOpen={openTask} />
                  ))
                )}
              </HomePanel>
            ) : null}

            {show('my_work') ? (
              <HomePanel title="In progress" count={myWork.length}>
                {myWork.length === 0 ? (
                  <EmptyCardLine>Nothing in progress right now.</EmptyCardLine>
                ) : (
                  myWork.slice(0, 8).map((t) => (
                    <TaskRow key={t._id} task={t} onOpen={openTask} />
                  ))
                )}
              </HomePanel>
            ) : null}
          </div>

          {/* Row 2 — schedule & focus */}
          <div className="grid gap-4 lg:grid-cols-2">
            {show('agenda') ? (
              <HomePanel
                title="Agenda"
                count={agenda.length}
                action={
                  <PanelLink onClick={() => navigate('/home/my-tasks?view=today')}>
                    Today
                  </PanelLink>
                }
              >
                {prefs?.calendarProvider && prefs.calendarProvider !== 'none' ? (
                  agenda.length === 0 ? (
                    <EmptyCardLine>No upcoming due dates in the next 2 weeks.</EmptyCardLine>
                  ) : (
                    agenda.slice(0, 8).map((t) => (
                      <TaskRow key={t._id} task={t} onOpen={openTask} />
                    ))
                  )
                ) : (
                  <div className="flex min-h-[160px] flex-col items-center justify-center gap-3 px-4 text-center">
                    <p className="text-sm text-graphite">Show deadlines from your calendar preference.</p>
                    <div className="flex flex-wrap justify-center gap-2">
                      <Button variant="outline" size="sm" onClick={() => setCalendar('google')}>
                        Google
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => setCalendar('outlook')}>
                        Outlook
                      </Button>
                      <Button size="sm" onClick={() => setCalendar('none')}>
                        Due dates only
                      </Button>
                    </div>
                  </div>
                )}
              </HomePanel>
            ) : null}

            {show('priorities') ? (
              <HomePanel title="Priorities" count={priorities.length}>
                {priorities.length === 0 ? (
                  <EmptyCardLine>No high or urgent tasks.</EmptyCardLine>
                ) : (
                  priorities.slice(0, 8).map((t) => (
                    <TaskRow key={t._id} task={t} onOpen={openTask} />
                  ))
                )}
              </HomePanel>
            ) : null}
          </div>

          {/* Row 3 — context */}
          <div className="grid gap-4 lg:grid-cols-2">
            {show('recents') ? (
              <HomePanel title="Recents" count={recents.length}>
                {recents.length === 0 ? (
                  <EmptyCardLine>Open a project or task to build your recents.</EmptyCardLine>
                ) : (
                  recents.slice(0, 8).map((item, i) => (
                    <RecentRow key={`${item.refId}-${i}`} item={item} />
                  ))
                )}
              </HomePanel>
            ) : null}

            {show('personal_list') ? (
              <HomePanel
                title="Personal list"
                count={personal.length}
                action={
                  <PanelLink onClick={() => navigate('/home/my-tasks?view=personal')}>
                    Open
                  </PanelLink>
                }
              >
                {personal.length === 0 ? (
                  <EmptyCardLine>Star tasks to keep them on your personal list.</EmptyCardLine>
                ) : (
                  personal.slice(0, 8).map((t) => (
                    <TaskRow key={t._id} task={t} onOpen={openTask} />
                  ))
                )}
              </HomePanel>
            ) : null}
          </div>

          {/* Row 4 — comments & briefing */}
          <div className="grid gap-4 lg:grid-cols-2">
            {show('assigned_comments') ? (
              <HomePanel title="Comments & mentions" count={comments.length}>
                {comments.length === 0 ? (
                  <EmptyCardLine>No comments or mentions yet.</EmptyCardLine>
                ) : (
                  <ul>
                    {comments.slice(0, 8).map((n) => (
                      <li key={n._id} className="rounded-lg px-3 py-2.5 hover:bg-cloud">
                        <p className="text-sm text-ink">{n.message}</p>
                        <p className="mt-1 text-xs text-graphite">
                          {n.sender?.name || 'Someone'} ·{' '}
                          {formatDistanceToNow(new Date(n.createdAt), { addSuffix: true })}
                        </p>
                      </li>
                    ))}
                  </ul>
                )}
              </HomePanel>
            ) : null}

            {show('ai_standup') ? (
              <HomePanel title="Today’s briefing">
                <div className="px-3 py-4">
                  <p className="text-sm font-medium text-ink">
                    {cards?.ai_standup?.greeting || timeGreeting()}, {greetingName(user?.name)}
                  </p>
                  <p className="mt-2 text-sm leading-relaxed text-charcoal">
                    {cards?.ai_standup?.summary || 'Your daily summary will appear here.'}
                  </p>
                </div>
              </HomePanel>
            ) : null}
          </div>
        </div>
      )}

      <Modal open={manageOpen} onClose={() => setManageOpen(false)} title="Customize home">
        <p className="mb-4 text-sm text-graphite">
          Choose which panels appear on Home.
        </p>
        <ul className="space-y-2">
          {draftCards.map((card, index) => (
            <li
              key={card.id}
              className="flex items-center justify-between rounded-lg border border-hairline px-3 py-2"
            >
              <label className="flex items-center gap-3 text-sm text-ink">
                <input
                  type="checkbox"
                  checked={card.enabled !== false}
                  onChange={(e) => {
                    const next = [...draftCards];
                    next[index] = { ...card, enabled: e.target.checked };
                    setDraftCards(next);
                  }}
                />
                {HOME_CARD_LABELS[card.id] || card.id}
              </label>
              <div className="flex gap-1">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={index === 0}
                  onClick={() => {
                    const next = [...draftCards];
                    [next[index - 1], next[index]] = [next[index], next[index - 1]];
                    setDraftCards(next);
                  }}
                >
                  ↑
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={index === draftCards.length - 1}
                  onClick={() => {
                    const next = [...draftCards];
                    [next[index + 1], next[index]] = [next[index], next[index + 1]];
                    setDraftCards(next);
                  }}
                >
                  ↓
                </Button>
              </div>
            </li>
          ))}
        </ul>
        <div className="mt-4 flex justify-end gap-2">
          <Button variant="outline" onClick={() => setManageOpen(false)}>
            Cancel
          </Button>
          <Button onClick={saveManage} disabled={updatePrefs.isPending}>
            {updatePrefs.isPending ? 'Saving…' : 'Save'}
          </Button>
        </div>
      </Modal>
    </div>
  );
}
