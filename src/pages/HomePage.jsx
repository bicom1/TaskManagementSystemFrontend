import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Settings2 } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import {
  useHomeOverview,
  useUpdateHomePreferences,
  useTrackRecent,
  useLiveMyTasks,
} from '@/features/home/hooks/useHome';
import { HOME_CARD_LABELS } from '@/features/home/api/homeApi';
import {
  HomeCard,
  TaskRow,
  EmptyCardLine,
  RecentRow,
} from '@/features/home/components/HomeCards';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { CardGridSkeleton } from '@/components/ui/Spinner';
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
  const assignedCount = cards?.assigned_to_me?.length ?? 0;

  const visibleCards = useMemo(() => {
    const configured = prefs?.homeCards?.length
      ? [...prefs.homeCards].sort((a, b) => a.order - b.order)
      : Object.keys(HOME_CARD_LABELS).map((id, order) => ({ id, enabled: true, order }));
    return configured.filter((c) => c.enabled !== false);
  }, [prefs]);

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

  const renderCard = (id) => {
    switch (id) {
      case 'recents':
        return (
          <HomeCard title="Recents">
            {(cards?.recents || []).length === 0 ? (
              <EmptyCardLine>No recent items yet — open a project to start.</EmptyCardLine>
            ) : (
              <div className="space-y-0.5">
                {(cards.recents || []).map((item, i) => (
                  <RecentRow key={`${item.refId}-${i}`} item={item} />
                ))}
              </div>
            )}
          </HomeCard>
        );
      case 'agenda':
        return (
          <HomeCard title="Agenda">
            {prefs?.calendarProvider && prefs.calendarProvider !== 'none' ? (
              (cards?.agenda || []).length === 0 ? (
                <EmptyCardLine>No upcoming due dates in the next 2 weeks.</EmptyCardLine>
              ) : (
                <div className="space-y-0.5">
                  {cards.agenda.map((t) => (
                    <TaskRow key={t._id} task={t} onOpen={openTask} />
                  ))}
                </div>
              )
            ) : (
              <div className="px-2 py-4 text-center">
                <p className="mb-4 text-sm text-graphite">
                  Connect your calendar preference — task due dates from MongoDB still show below.
                </p>
                <div className="flex flex-wrap justify-center gap-2">
                  <Button variant="outline" size="sm" onClick={() => setCalendar('google')}>
                    Connect Google Calendar
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => setCalendar('outlook')}>
                    Connect Outlook
                  </Button>
                  <Button size="sm" onClick={() => setCalendar('none')}>
                    Use due dates only
                  </Button>
                </div>
              </div>
            )}
          </HomeCard>
        );
      case 'my_work':
        return (
          <HomeCard title="My Work">
            {(cards?.my_work || []).length === 0 ? (
              <EmptyCardLine>No in-progress tasks.</EmptyCardLine>
            ) : (
              cards.my_work.map((t) => <TaskRow key={t._id} task={t} onOpen={openTask} />)
            )}
          </HomeCard>
        );
      case 'assigned_to_me':
        return (
          <HomeCard
            title={`Assigned to me${assignedCount ? ` (${assignedCount})` : ''}`}
            action={
              <button
                type="button"
                className="text-xs font-medium text-primary hover:underline"
                onClick={() => navigate('/home/my-tasks?view=assigned')}
              >
                View all
              </button>
            }
          >
            {(cards?.assigned_to_me || []).length === 0 ? (
              <EmptyCardLine>
                When someone assigns you a task, it appears here instantly.
              </EmptyCardLine>
            ) : (
              cards.assigned_to_me.slice(0, 6).map((t) => (
                <TaskRow key={t._id} task={t} onOpen={openTask} />
              ))
            )}
          </HomeCard>
        );
      case 'personal_list':
        return (
          <HomeCard
            title="Personal List"
            action={
              <button
                type="button"
                className="text-xs font-medium text-primary hover:underline"
                onClick={() => navigate('/home/my-tasks?view=personal')}
              >
                Open
              </button>
            }
          >
            {(cards?.personal_list || []).length === 0 ? (
              <EmptyCardLine>Star tasks to keep them here.</EmptyCardLine>
            ) : (
              cards.personal_list.map((t) => <TaskRow key={t._id} task={t} onOpen={openTask} />)
            )}
          </HomeCard>
        );
      case 'assigned_comments':
        return (
          <HomeCard title="Assigned Comments">
            {(cards?.assigned_comments || []).length === 0 ? (
              <EmptyCardLine>No comments or mentions yet.</EmptyCardLine>
            ) : (
              <ul className="space-y-2">
                {cards.assigned_comments.map((n) => (
                  <li key={n._id} className="rounded-lg px-2 py-2 hover:bg-cloud">
                    <p className="text-sm text-ink">{n.message}</p>
                    <p className="mt-1 text-xs text-graphite">
                      {n.sender?.name || 'Someone'} ·{' '}
                      {formatDistanceToNow(new Date(n.createdAt), { addSuffix: true })}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </HomeCard>
        );
      case 'priorities':
        return (
          <HomeCard title="Priorities">
            {(cards?.priorities || []).length === 0 ? (
              <EmptyCardLine>No high/urgent tasks.</EmptyCardLine>
            ) : (
              cards.priorities.map((t) => <TaskRow key={t._id} task={t} onOpen={openTask} />)
            )}
          </HomeCard>
        );
      case 'ai_standup':
        return (
          <HomeCard title="AI Standup">
            <div className="rounded-lg bg-cloud px-3 py-4">
              <p className="text-sm font-medium text-ink">
                {cards?.ai_standup?.greeting || timeGreeting()}, {greetingName(user?.name)}
              </p>
              <p className="mt-2 text-sm leading-relaxed text-charcoal">
                {cards?.ai_standup?.summary}
              </p>
              {cards?.ai_standup?.counts && (
                <div className="mt-3 flex flex-wrap gap-2 text-xs text-graphite">
                  <span className="rounded bg-paper px-2 py-1">
                    {cards.ai_standup.counts.assigned} assigned
                  </span>
                  <span className="rounded bg-paper px-2 py-1">
                    {cards.ai_standup.counts.inProgress} in progress
                  </span>
                  <span className="rounded bg-paper px-2 py-1">
                    {cards.ai_standup.counts.dueToday} due today
                  </span>
                  <span className="rounded bg-paper px-2 py-1">
                    {cards.ai_standup.counts.overdue} overdue
                  </span>
                </div>
              )}
            </div>
          </HomeCard>
        );
      default:
        return null;
    }
  };

  return (
    <div className="mx-auto max-w-[1200px] px-4 py-6 lg:px-8">
      <div className="mb-4 rounded-xl border border-hairline bg-cloud/80 px-4 py-3">
        <div className="flex flex-wrap items-center gap-2">
          <span className="rounded-md bg-paper px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-primary">
            {dashMeta.badge || getRoleLabel(user?.role)}
          </span>
          <p className="text-sm font-medium text-ink">{dashMeta.title}</p>
          {isFetching && data ? <span className="text-xs text-graphite">Updating…</span> : null}
        </div>
        <p className="mt-1 text-sm text-graphite">{dashMeta.subtitle}</p>
      </div>

      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-sm font-medium text-graphite">My Tasks</p>
          <h1 className="mt-1 text-3xl font-semibold tracking-tight text-ink">
            {timeGreeting()}, {greetingName(user?.name)}
          </h1>
          {assignedCount > 0 && (
            <button
              type="button"
              onClick={() => navigate('/home/my-tasks?view=assigned')}
              className="mt-3 inline-flex items-center gap-2 rounded-lg border border-primary/30 bg-primary-soft/40 px-3 py-1.5 text-sm font-medium text-primary-deep hover:bg-primary-soft"
            >
              {assignedCount} task{assignedCount === 1 ? '' : 's'} assigned to you
              <span className="text-xs opacity-70">→ Open list</span>
            </button>
          )}
        </div>
        <div className="flex gap-2">
          <Button className="bg-ink text-on-ink hover:bg-ink/90" onClick={openManage}>
            Manage cards
          </Button>
          <Button variant="outline" size="icon" onClick={openManage} aria-label="Home settings">
            <Settings2 className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {isLoading && !data ? (
        <CardGridSkeleton cards={4} />
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {visibleCards.map((card) => (
            <div key={card.id}>{renderCard(card.id)}</div>
          ))}
        </div>
      )}

      <Modal open={manageOpen} onClose={() => setManageOpen(false)} title="Manage home cards">
        <p className="mb-4 text-sm text-graphite">
          Toggle which cards appear on Home. Order is top-to-bottom in this list (left-right on the
          grid).
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
