import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Settings2 } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import {
  useHomeOverview,
  useUpdateHomePreferences,
  useTrackRecent,
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
import { LoadingScreen } from '@/components/ui/Spinner';
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
  const { data, isLoading } = useHomeOverview();
  const updatePrefs = useUpdateHomePreferences();
  const trackRecent = useTrackRecent();
  const [manageOpen, setManageOpen] = useState(false);
  const [draftCards, setDraftCards] = useState([]);

  const cards = data?.cards;
  const prefs = data?.preferences;

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
    // ensure all known cards present
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

  if (isLoading) {
    return (
      <div className="p-8">
        <LoadingScreen />
      </div>
    );
  }

  const dashMeta = getDashboardMeta(user?.role);

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
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCalendar('google')}
                  >
                    Connect Google Calendar
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCalendar('outlook')}
                  >
                    Connect Microsoft Outlook
                  </Button>
                </div>
                {(cards?.agenda || []).length > 0 && (
                  <div className="mt-4 border-t border-hairline pt-3 text-left">
                    <p className="mb-2 px-2 text-xs font-semibold uppercase text-graphite">
                      From your tasks
                    </p>
                    {cards.agenda.slice(0, 4).map((t) => (
                      <TaskRow key={t._id} task={t} onOpen={openTask} />
                    ))}
                  </div>
                )}
              </div>
            )}
          </HomeCard>
        );
      case 'meetings':
        return (
          <HomeCard
            title="Meetings"
            action={
              <button
                type="button"
                className="text-xs font-medium text-primary hover:underline"
                onClick={() => navigate('/home/meetings')}
              >
                View
              </button>
            }
          >
            {(cards?.meetings || []).length === 0 ? (
              <EmptyCardLine>No upcoming team meetings. Schedule one from a team.</EmptyCardLine>
            ) : (
              <ul className="space-y-2">
                {cards.meetings.slice(0, 6).map((m) => (
                  <li key={m._id} className="rounded-lg px-2 py-2 hover:bg-cloud">
                    <p className="text-sm font-medium text-ink">{m.title}</p>
                    <p className="text-xs text-graphite">
                      {new Date(m.startsAt).toLocaleString()}
                      {m.team?.name ? ` · ${m.team.name}` : ''}
                      {m.location?.name || m.locationLabel
                        ? ` · ${m.location?.name || m.locationLabel}`
                        : ''}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </HomeCard>
        );
      case 'locations':
        return (
          <HomeCard title="Locations">
            {(cards?.locations || []).length === 0 ? (
              <EmptyCardLine>No locations for your teams yet.</EmptyCardLine>
            ) : (
              <ul className="space-y-2">
                {cards.locations.map((loc) => (
                  <li key={loc._id} className="rounded-lg px-2 py-2 hover:bg-cloud">
                    <p className="text-sm font-medium text-ink">{loc.name}</p>
                    <p className="text-xs text-graphite">
                      {[loc.city, loc.address, loc.team?.name].filter(Boolean).join(' · ')}
                    </p>
                  </li>
                ))}
              </ul>
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
            title="Assigned to me"
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
              <EmptyCardLine>Nothing assigned to you.</EmptyCardLine>
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
        </div>
        <p className="mt-1 text-sm text-graphite">{dashMeta.subtitle}</p>
      </div>
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-sm font-medium text-graphite">My Tasks</p>
          <h1 className="mt-1 text-3xl font-semibold tracking-tight text-ink">
            {timeGreeting()}, {greetingName(user?.name)}
          </h1>
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

      <div className="grid gap-4 md:grid-cols-2">
        {visibleCards.map((card) => (
          <div key={card.id}>{renderCard(card.id)}</div>
        ))}
      </div>

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
