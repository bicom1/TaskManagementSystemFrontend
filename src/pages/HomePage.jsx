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
  HomeCard,
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
import { cn } from '@/lib/utils';

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
  const counts = cards?.ai_standup?.counts;

  const visibleCards = useMemo(() => {
    const configured = prefs?.homeCards?.length
      ? [...prefs.homeCards].sort((a, b) => a.order - b.order)
      : Object.keys(HOME_CARD_LABELS).map((id, order) => ({ id, enabled: true, order }));
    return configured.filter((c) => c.enabled !== false);
  }, [prefs]);

  const featuredIds = useMemo(() => {
    const preferred = ['assigned_to_me', 'my_work', 'ai_standup'];
    return preferred.filter((id) => visibleCards.some((c) => c.id === id));
  }, [visibleCards]);

  const secondaryCards = useMemo(
    () => visibleCards.filter((c) => !featuredIds.includes(c.id)),
    [visibleCards, featuredIds]
  );

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
              <div className="px-3 py-6 text-center">
                <p className="mb-4 text-sm leading-relaxed text-graphite">
                  Prefer due dates from your calendar, or stick with task deadlines only.
                </p>
                <div className="flex flex-wrap justify-center gap-2">
                  <Button variant="outline" size="sm" onClick={() => setCalendar('google')}>
                    Google Calendar
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
          </HomeCard>
        );
      case 'my_work':
        return (
          <HomeCard title="In progress">
            {(cards?.my_work || []).length === 0 ? (
              <EmptyCardLine>No in-progress tasks right now.</EmptyCardLine>
            ) : (
              cards.my_work.map((t) => <TaskRow key={t._id} task={t} onOpen={openTask} />)
            )}
          </HomeCard>
        );
      case 'assigned_to_me':
        return (
          <HomeCard
            accent={assignedCount > 0}
            title={`Assigned to me${assignedCount ? ` · ${assignedCount}` : ''}`}
            action={
              <button
                type="button"
                className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:text-primary-deep"
                onClick={() => navigate('/home/my-tasks?view=assigned')}
              >
                View all
                <ArrowRight className="h-3.5 w-3.5" />
              </button>
            }
          >
            {(cards?.assigned_to_me || []).length === 0 ? (
              <EmptyCardLine>
                When someone assigns you a task, it shows up here instantly.
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
            title="Personal list"
            action={
              <button
                type="button"
                className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:text-primary-deep"
                onClick={() => navigate('/home/my-tasks?view=personal')}
              >
                Open
                <ArrowRight className="h-3.5 w-3.5" />
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
          <HomeCard title="Comments & mentions">
            {(cards?.assigned_comments || []).length === 0 ? (
              <EmptyCardLine>No comments or mentions yet.</EmptyCardLine>
            ) : (
              <ul className="space-y-1">
                {cards.assigned_comments.map((n) => (
                  <li key={n._id} className="rounded-xl px-2.5 py-2.5 hover:bg-cloud">
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
              <EmptyCardLine>No high or urgent tasks.</EmptyCardLine>
            ) : (
              cards.priorities.map((t) => <TaskRow key={t._id} task={t} onOpen={openTask} />)
            )}
          </HomeCard>
        );
      case 'ai_standup':
        return (
          <HomeCard title="Today’s briefing">
            <div className="rounded-xl bg-gradient-to-br from-primary-soft/40 via-cloud to-paper px-4 py-4">
              <p className="text-sm font-semibold text-ink">
                {cards?.ai_standup?.greeting || timeGreeting()}, {greetingName(user?.name)}
              </p>
              <p className="mt-2 text-sm leading-relaxed text-charcoal">
                {cards?.ai_standup?.summary || 'Your workspace summary will appear here.'}
              </p>
              {counts ? (
                <div className="mt-4 flex flex-wrap gap-2">
                  {[
                    ['Assigned', counts.assigned],
                    ['In progress', counts.inProgress],
                    ['Due today', counts.dueToday],
                    ['Overdue', counts.overdue],
                  ].map(([label, value]) => (
                    <span
                      key={label}
                      className="rounded-lg border border-hairline bg-paper/90 px-2.5 py-1 text-xs font-medium text-charcoal"
                    >
                      {value} {label.toLowerCase()}
                    </span>
                  ))}
                </div>
              ) : null}
            </div>
          </HomeCard>
        );
      default:
        return null;
    }
  };

  return (
    <div className="relative min-h-full">
      {/* Soft brand atmosphere — not flat white */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-[280px] bg-[radial-gradient(120%_80%_at_0%_0%,rgba(201,224,252,0.55)_0%,transparent_55%),radial-gradient(90%_60%_at_100%_0%,rgba(2,74,216,0.08)_0%,transparent_50%)]"
      />

      <div className="relative mx-auto max-w-[1180px] px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
        {/* Hero */}
        <header className="mb-6 overflow-hidden rounded-3xl border border-hairline bg-paper/90 shadow-[var(--shadow-soft-lift)] backdrop-blur-sm sm:mb-8">
          <div className="flex flex-col gap-5 border-b border-hairline bg-gradient-to-r from-primary-soft/35 via-paper to-paper px-5 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-7 sm:py-6">
            <div className="flex min-w-0 items-start gap-4">
              <UserAvatar user={user} size="xl" rounded="xl" className="shadow-sm ring-2 ring-paper" />
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded-md bg-ink px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.08em] text-on-ink">
                    {dashMeta.badge || getRoleLabel(user?.role)}
                  </span>
                  {isFetching && data ? (
                    <span className="text-[11px] text-graphite">Updating…</span>
                  ) : null}
                </div>
                <h1 className="mt-2 text-[1.75rem] font-semibold tracking-tight text-ink sm:text-[2rem]">
                  {timeGreeting()}, {greetingName(user?.name)}
                </h1>
                <p className="mt-1 max-w-xl text-sm leading-relaxed text-graphite">
                  {dashMeta.subtitle}
                </p>
                {assignedCount > 0 ? (
                  <button
                    type="button"
                    onClick={() => navigate('/home/my-tasks?view=assigned')}
                    className={cn(
                      'mt-4 inline-flex items-center gap-2 rounded-xl bg-primary px-3.5 py-2 text-sm font-semibold text-on-ink',
                      'transition hover:bg-primary-bright'
                    )}
                  >
                    {assignedCount} assigned to you
                    <ArrowRight className="h-4 w-4" />
                  </button>
                ) : null}
              </div>
            </div>

            <div className="flex shrink-0 items-center gap-2 self-start sm:self-center">
              <Button
                variant="outline"
                className="border-hairline bg-paper"
                onClick={openManage}
              >
                <Settings2 className="h-4 w-4" />
                Customize
              </Button>
            </div>
          </div>

          {/* Snapshot strip */}
          <div className="grid grid-cols-2 gap-3 p-4 sm:grid-cols-4 sm:gap-4 sm:px-6 sm:py-5">
            <HomeStat
              label="Assigned"
              value={counts?.assigned ?? assignedCount}
              tone="primary"
              onClick={() => navigate('/home/my-tasks?view=assigned')}
            />
            <HomeStat
              label="In progress"
              value={counts?.inProgress ?? cards?.my_work?.length ?? 0}
              tone="muted"
            />
            <HomeStat
              label="Due today"
              value={counts?.dueToday ?? 0}
              tone="default"
              onClick={() => navigate('/home/my-tasks?view=today')}
            />
            <HomeStat
              label="Overdue"
              value={counts?.overdue ?? 0}
              tone={(counts?.overdue ?? 0) > 0 ? 'warn' : 'muted'}
              onClick={() => navigate('/home/my-tasks?view=today')}
            />
          </div>
        </header>

        {isLoading && !data ? (
          <CardGridSkeleton cards={4} />
        ) : (
          <div className="space-y-5">
            {featuredIds.length > 0 ? (
              <div className="grid gap-4 lg:grid-cols-2 xl:grid-cols-3">
                {featuredIds.map((id) => (
                  <div
                    key={id}
                    className={cn(id === 'assigned_to_me' && 'lg:col-span-1 xl:col-span-1')}
                  >
                    {renderCard(id)}
                  </div>
                ))}
              </div>
            ) : null}

            {secondaryCards.length > 0 ? (
              <div>
                <div className="mb-3 flex items-center justify-between">
                  <h2 className="text-xs font-semibold uppercase tracking-[0.08em] text-graphite">
                    More from your workspace
                  </h2>
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  {secondaryCards.map((card) => (
                    <div key={card.id}>{renderCard(card.id)}</div>
                  ))}
                </div>
              </div>
            ) : null}
          </div>
        )}
      </div>

      <Modal open={manageOpen} onClose={() => setManageOpen(false)} title="Customize home">
        <p className="mb-4 text-sm text-graphite">
          Choose which panels appear on Home. Reorder to control what you see first.
        </p>
        <ul className="space-y-2">
          {draftCards.map((card, index) => (
            <li
              key={card.id}
              className="flex items-center justify-between rounded-xl border border-hairline px-3 py-2.5"
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
