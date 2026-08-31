import { useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  CalendarDays,
  MapPin,
  Mic,
  MoreHorizontal,
  Plus,
  Search,
  Trash2,
  X,
  ExternalLink,
  Video,
} from 'lucide-react';
import { format, differenceInMinutes, isSameDay, setHours, setMinutes, startOfDay } from 'date-fns';
import { toast } from 'sonner';
import { useAuthStore } from '@/store/authStore';
import { useHomeOverview, useUpdateHomePreferences } from '@/features/home/hooks/useHome';
import {
  useAskMeetingAi,
  useCreateMeeting,
  useCreateLocation,
} from '@/features/meetings/hooks/useMeetings';
import { MentionAtButton, MentionPicker } from '@/features/meetings/components/MentionPicker';
import { useUsers } from '@/features/users/hooks/useUsers';
import { useTeams } from '@/features/teams/hooks/useTeams';
import { LoadingScreen } from '@/components/ui/Spinner';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import { Textarea } from '@/components/ui/Textarea';
import { Select } from '@/components/ui/Select';
import { cn } from '@/lib/utils';

const PROMPT_PILLS = [
  'Summarize my most recent meeting notes',
  'Create tasks from recent meeting action items',
  'What were the key decisions made in my last meeting?',
];

function firstName(fullName = '') {
  const part = String(fullName).trim().split(/\s+/)[0];
  return part || 'there';
}

function minutesLabel(startsAt) {
  const mins = differenceInMinutes(new Date(startsAt), new Date());
  if (mins <= 0) return 'now';
  if (mins < 60) return `in ${mins}m`;
  if (mins < 24 * 60) return `in ${Math.round(mins / 60)}h`;
  return format(new Date(startsAt), 'MMM d');
}

/** Find trailing @query at cursor for mention filtering */
function getMentionContext(text, cursor) {
  const before = String(text || '').slice(0, cursor ?? text?.length ?? 0);
  const match = before.match(/@([^\s@]*)$/);
  if (!match) return null;
  return {
    query: match[1] || '',
    start: match.index,
    end: cursor ?? before.length,
  };
}

export default function AgendaPage() {
  const user = useAuthStore((s) => s.user);
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = searchParams.get('tab') === 'locations' ? 'locations' : 'meetings';
  const { data, isLoading } = useHomeOverview();
  const { data: peopleRes } = useUsers({ limit: 100 });
  const { data: teamsData } = useTeams({ limit: 50 });
  const updatePrefs = useUpdateHomePreferences();
  const askAi = useAskMeetingAi();
  const createMeeting = useCreateMeeting();
  const createLocation = useCreateLocation();

  const [prompt, setPrompt] = useState('');
  const [answer, setAnswer] = useState(null);
  const [connectOpen, setConnectOpen] = useState(false);
  const [selected, setSelected] = useState(null);
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [mentionOpen, setMentionOpen] = useState(false);
  const [mentionQuery, setMentionQuery] = useState('');
  const [cursor, setCursor] = useState(0);
  const [scheduleOpen, setScheduleOpen] = useState(false);
  const [locationOpen, setLocationOpen] = useState(false);
  const [meetingForm, setMeetingForm] = useState({
    title: '',
    description: '',
    startsAt: '',
    endsAt: '',
    team: '',
    meetingUrl: '',
    attendees: [],
  });
  const [locationForm, setLocationForm] = useState({
    name: '',
    address: '',
    city: '',
    type: 'office',
  });
  const textareaRef = useRef(null);

  const meetings = data?.cards?.meetings ?? [];
  const people = useMemo(() => {
    const list = [...(peopleRes?.data ?? [])];
    if (user?._id && !list.some((p) => String(p._id) === String(user._id))) {
      list.unshift(user);
    }
    return list;
  }, [peopleRes, user]);
  const tasks = useMemo(() => {
    const list = [
      ...(data?.cards?.assigned_to_me || []),
      ...(data?.cards?.my_work || []),
      ...(data?.cards?.personal_list || []),
    ];
    const seen = new Set();
    return list.filter((t) => {
      const id = String(t._id);
      if (seen.has(id)) return false;
      seen.add(id);
      return true;
    });
  }, [data]);
  const docs = useMemo(() => {
    const fromRecents = (data?.cards?.recents || []).filter(
      (r) => r.type === 'project' || r.type === 'doc' || r.type === 'document'
    );
    const fromProjects = (data?.workspace?.projects || []).map((p) => ({
      _id: p._id,
      title: p.name,
      subtitle: p.team?.name ? `in ${p.team.name}` : 'Project',
      team: p.team,
    }));
    return fromRecents.length ? fromRecents : fromProjects;
  }, [data]);
  const locations = data?.cards?.locations ?? [];
  const channels = data?.workspace?.teams ?? [];

  const provider = data?.preferences?.calendarProvider || 'none';
  const connected = provider !== 'none';
  const name = firstName(user?.name);
  const nextMeeting = meetings[0] || null;
  const today = useMemo(() => startOfDay(new Date()), []);
  const todayMeetings = useMemo(
    () => meetings.filter((m) => isSameDay(new Date(m.startsAt), today)),
    [meetings, today]
  );
  const previewMeeting = nextMeeting || todayMeetings[0] || null;

  const hours = useMemo(() => {
    const list = [];
    for (let h = 8; h <= 18; h += 1) list.push(h);
    return list;
  }, []);

  const syncMentionFromText = (text, nextCursor) => {
    const ctx = getMentionContext(text, nextCursor);
    if (ctx) {
      setMentionOpen(true);
      setMentionQuery(ctx.query);
    } else if (mentionOpen) {
      // keep open if opened via button with empty query, unless text has no @
      if (!String(text).includes('@')) {
        setMentionOpen(false);
        setMentionQuery('');
      } else {
        setMentionQuery('');
      }
    }
  };

  const handlePromptChange = (e) => {
    const value = e.target.value;
    const nextCursor = e.target.selectionStart ?? value.length;
    setPrompt(value);
    setCursor(nextCursor);
    syncMentionFromText(value, nextCursor);
  };

  const toggleMention = () => {
    if (mentionOpen) {
      setMentionOpen(false);
      setMentionQuery('');
      textareaRef.current?.focus();
      return;
    }
    const el = textareaRef.current;
    const pos = el?.selectionStart ?? prompt.length;
    const before = prompt.slice(0, pos);
    const after = prompt.slice(pos);
    const needsAt = !/@([^\s@]*)$/.test(before);
    const next = needsAt ? `${before}@${after}` : prompt;
    const nextCursor = needsAt ? pos + 1 : pos;
    setPrompt(next);
    setMentionOpen(true);
    setMentionQuery('');
    setCursor(nextCursor);
    requestAnimationFrame(() => {
      if (el) {
        el.focus();
        el.setSelectionRange(nextCursor, nextCursor);
      }
    });
  };

  const applyMention = (item) => {
    const el = textareaRef.current;
    const pos = el?.selectionStart ?? cursor ?? prompt.length;
    const ctx = getMentionContext(prompt, pos);
    let next;
    let nextCursor;
    if (ctx) {
      next = `${prompt.slice(0, ctx.start)}${item.insert} ${prompt.slice(ctx.end)}`;
      nextCursor = ctx.start + item.insert.length + 1;
    } else {
      const pad = prompt && !prompt.endsWith(' ') ? ' ' : '';
      next = `${prompt}${pad}${item.insert} `;
      nextCursor = next.length;
    }
    setPrompt(next);
    setMentionOpen(false);
    setMentionQuery('');
    setCursor(nextCursor);
    requestAnimationFrame(() => {
      if (el) {
        el.focus();
        el.setSelectionRange(nextCursor, nextCursor);
      }
    });
  };

  const runPrompt = async (text) => {
    const q = String(text || '').trim();
    if (!q) return;
    setPrompt(q);
    setAnswer(null);
    setMentionOpen(false);
    try {
      const res = await askAi.mutateAsync(q);
      setAnswer(res);
    } catch {
      /* toasted in hook */
    }
  };


  const onMic = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      toast.message('Voice input is not supported in this browser');
      return;
    }
    const recognition = new SpeechRecognition();
    recognition.lang = 'en-US';
    recognition.onresult = (event) => {
      const transcript = event.results?.[0]?.[0]?.transcript;
      if (transcript) setPrompt((p) => (p ? `${p} ${transcript}` : transcript));
    };
    recognition.onerror = () => toast.error('Could not capture voice');
    recognition.start();
    toast.message('Listening…');
  };

  const connectCalendar = (value) => {
    updatePrefs.mutate(
      { calendarProvider: value },
      {
        onSuccess: () => setConnectOpen(false),
      }
    );
  };

  const sendNotetaker = () => {
    if (!nextMeeting) {
      toast.message('No upcoming meeting to send AI Notetaker to');
      return;
    }
    toast.success(`AI Notetaker queued for “${nextMeeting.title}”`);
  };

  if (isLoading) {
    return (
      <div className="p-8">
        <LoadingScreen />
      </div>
    );
  }

  return (
    <div className="min-h-full bg-[var(--color-surface-1)] px-4 py-6 sm:px-8 lg:px-12">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.09em] text-graphite">
            Workspace
          </p>
          <div className="mt-2 flex gap-1">
            <button
              type="button"
              onClick={() => setSearchParams({}, { replace: true })}
              className={cn(
                'rounded-lg px-3 py-1.5 text-sm font-medium',
                activeTab === 'meetings'
                  ? 'bg-ink text-on-ink'
                  : 'text-graphite hover:bg-cloud hover:text-ink'
              )}
            >
              Meetings
            </button>
            <button
              type="button"
              onClick={() => setSearchParams({ tab: 'locations' }, { replace: true })}
              className={cn(
                'rounded-lg px-3 py-1.5 text-sm font-medium',
                activeTab === 'locations'
                  ? 'bg-ink text-on-ink'
                  : 'text-graphite hover:bg-cloud hover:text-ink'
              )}
            >
              Locations
            </button>
          </div>
        </div>
        {activeTab === 'meetings' ? (
          <Button size="sm" onClick={() => setScheduleOpen(true)}>
            <Plus className="h-4 w-4" />
            Schedule meeting
          </Button>
        ) : (
          <Button size="sm" onClick={() => setLocationOpen(true)}>
            <Plus className="h-4 w-4" />
            Add location
          </Button>
        )}
      </div>

      {activeTab === 'locations' ? (
        <section className="mx-auto max-w-3xl">
          <h1 className="voice-line text-[1.5rem] text-ink">Locations</h1>
          <p className="mt-1 text-sm text-graphite">
            Offices and places your team meets — shown in the sidebar.
          </p>
          <div className="mt-6 space-y-2">
            {locations.length === 0 ? (
              <p className="rounded-xl border border-dashed border-hairline bg-paper px-4 py-8 text-center text-sm text-graphite">
                No locations yet. Add your first office or client site.
              </p>
            ) : (
              locations.map((loc) => (
                <div
                  key={loc._id}
                  className="flex items-start gap-3 rounded-xl border border-hairline bg-paper px-4 py-3"
                >
                  <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-brand-600" />
                  <div className="min-w-0">
                    <p className="font-medium text-ink">{loc.name}</p>
                    <p className="text-sm text-graphite">
                      {[loc.address, loc.city].filter(Boolean).join(' · ') || loc.type}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </section>
      ) : (
        <>
      <div className="mx-auto mt-4 max-w-3xl text-center">
        <h1 className="voice-line text-[1.75rem] text-ink sm:text-[2rem]">
          Hey {name} — ready to dive into your meetings?
        </h1>

        <div className="relative mx-auto mt-8 max-w-2xl">
          <div className="rounded-2xl bg-gradient-to-r from-brand-300 via-brand-200 to-brand-300 p-px shadow-xs">
            <div className="rounded-[15px] bg-white px-4 pb-3 pt-4 text-left">
              <textarea
                ref={textareaRef}
                rows={3}
                value={prompt}
                onChange={handlePromptChange}
                onClick={(e) => {
                  const pos = e.target.selectionStart ?? prompt.length;
                  setCursor(pos);
                  syncMentionFromText(prompt, pos);
                }}
                onKeyUp={(e) => {
                  const pos = e.target.selectionStart ?? prompt.length;
                  setCursor(pos);
                }}
                onKeyDown={(e) => {
                  if (mentionOpen && ['ArrowDown', 'ArrowUp', 'Escape'].includes(e.key)) {
                    return;
                  }
                  if (mentionOpen && e.key === 'Enter' && !e.shiftKey) {
                    return;
                  }
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    runPrompt(prompt);
                  }
                }}
                placeholder="Show me the highlights from my last meeting"
                className="w-full resize-none border-0 bg-transparent text-[15px] text-ink placeholder:text-graphite/70 focus:outline-none"
              />
              <div className="mt-1 flex items-center justify-between">
                <MentionAtButton active={mentionOpen} onClick={toggleMention} />
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={onMic}
                    className="rounded-md p-1.5 text-graphite transition hover:bg-cloud hover:text-ink"
                    aria-label="Voice input"
                  >
                    <Mic className="h-4 w-4" />
                  </button>
                  <Button
                    size="sm"
                    variant="ink"
                    className="normal-case tracking-normal"
                    disabled={askAi.isPending || !prompt.trim()}
                    onClick={() => runPrompt(prompt)}
                  >
                    {askAi.isPending ? 'Thinking…' : 'Ask'}
                  </Button>
                </div>
              </div>
            </div>
          </div>

          <MentionPicker
            open={mentionOpen}
            onClose={() => {
              setMentionOpen(false);
              setMentionQuery('');
            }}
            query={mentionQuery}
            currentUser={user}
            people={people}
            tasks={tasks}
            docs={docs}
            locations={locations}
            channels={channels}
            onSelect={applyMention}
          />
        </div>

        <div className="mt-4 flex flex-wrap justify-center gap-2">
          {PROMPT_PILLS.map((pill) => (
            <button
              key={pill}
              type="button"
              onClick={() => runPrompt(pill)}
              className="max-w-full truncate rounded-full border border-[var(--color-border-subtle)] bg-white px-3.5 py-2 text-left text-[13px] text-[var(--color-text-secondary)] shadow-xs transition hover:border-[var(--color-border-base)] hover:bg-[var(--color-surface-1)]"
            >
              {pill}
            </button>
          ))}
        </div>

        {answer && (
          <div className="mx-auto mt-5 max-w-2xl rounded-2xl border border-hairline bg-white p-4 text-left shadow-xs">
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-graphite">
              AI answer
            </p>
            <pre className="whitespace-pre-wrap font-sans text-sm leading-relaxed text-ink">
              {answer.answer}
            </pre>
          </div>
        )}
      </div>

      <section className="mx-auto mt-14 max-w-5xl">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-[15px] font-semibold text-ink">
            <CalendarDays className="h-4 w-4 text-graphite" />
            Upcoming Meetings
          </div>
          <div className="flex items-center gap-4 text-sm font-medium text-[var(--color-text-secondary)]">
            <button type="button" onClick={() => setScheduleOpen(true)} className="hover:text-ink hover:underline">
              Schedule meeting
            </button>
            <button type="button" onClick={sendNotetaker} className="hover:text-ink hover:underline">
              Send AI Notetaker
            </button>
            <button
              type="button"
              onClick={() => setCalendarOpen(true)}
              className="hover:text-ink hover:underline"
            >
              Open Calendar
            </button>
          </div>
        </div>

        <div className="overflow-hidden rounded-2xl border border-[var(--color-border-subtle)] bg-white shadow-xs">
          <div className="grid lg:grid-cols-2">
            <div className="flex flex-col justify-center border-b border-[var(--color-border-subtle)] px-8 py-10 lg:border-b-0 lg:border-r">
              {!connected ? (
                <>
                  <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-lg border border-[var(--color-border-base)] bg-[var(--color-surface-1)] text-sm font-semibold text-ink">
                    <span className="relative">
                      <CalendarDays className="h-6 w-6 text-[var(--color-text-muted)]" />
                      <span className="absolute -bottom-0.5 left-1/2 -translate-x-1/2 text-[10px] font-bold leading-none">
                        {format(new Date(), 'd')}
                      </span>
                    </span>
                  </div>
                  <h2 className="text-lg font-semibold text-ink">
                    AI Notetaker works best with Calendar
                  </h2>
                  <p className="mt-2 max-w-sm text-sm leading-relaxed text-graphite">
                    Connect your calendar to manage your events and get the most out of AI Notetaker
                  </p>
                  <Button
                    variant="ink"
                    className="mt-6 w-fit normal-case tracking-normal"
                    onClick={() => setConnectOpen(true)}
                  >
                    Connect Calendar
                  </Button>
                </>
              ) : (
                <>
                  <p className="text-xs font-semibold uppercase tracking-wide text-graphite">
                    Connected · {provider === 'google' ? 'Google' : 'Outlook'}
                  </p>
                  <h2 className="mt-2 text-lg font-semibold text-ink">
                    {meetings.length
                      ? `${meetings.length} upcoming meeting${meetings.length === 1 ? '' : 's'}`
                      : 'No upcoming meetings'}
                  </h2>
                  <p className="mt-2 text-sm text-graphite">
                    Events are loaded from your teams in MongoDB
                    {meetings.length ? ' — click one in the preview to open details.' : '.'}
                  </p>
                  <ul className="mt-5 space-y-2">
                    {meetings.slice(0, 4).map((m) => (
                      <li key={m._id}>
                        <button
                          type="button"
                          onClick={() => setSelected(m)}
                          className="flex w-full items-start justify-between rounded-xl border border-hairline px-3 py-2.5 text-left transition hover:bg-cloud"
                        >
                          <div>
                            <p className="text-sm font-medium text-ink">{m.title}</p>
                            <p className="text-xs text-graphite">
                              {format(new Date(m.startsAt), 'EEE, MMM d · h:mm a')}
                              {m.team?.name ? ` · ${m.team.name}` : ''}
                            </p>
                          </div>
                          <span className="shrink-0 text-xs font-medium text-teal-700">
                            {minutesLabel(m.startsAt)}
                          </span>
                        </button>
                      </li>
                    ))}
                  </ul>
                  <button
                    type="button"
                    className="mt-4 text-sm font-medium text-graphite underline-offset-2 hover:text-ink hover:underline"
                    onClick={() =>
                      updatePrefs.mutate({ calendarProvider: 'none' }, {
                        onSuccess: () => toast.message('Calendar disconnected'),
                      })
                    }
                  >
                    Disconnect calendar
                  </button>
                </>
              )}
            </div>

            <div className="relative min-h-[320px] bg-[var(--color-surface-1)] p-4">
              <div className="overflow-hidden rounded-xl border border-[var(--color-border-subtle)] bg-white shadow-xs">
                <div className="flex items-center gap-2 border-b border-[var(--color-border-subtle)] px-3 py-2.5">
                  {previewMeeting ? (
                    <>
                      <a
                        href={previewMeeting.meetingUrl || '#'}
                        target={previewMeeting.meetingUrl ? '_blank' : undefined}
                        rel="noreferrer"
                        onClick={(e) => {
                          if (!previewMeeting.meetingUrl) {
                            e.preventDefault();
                            toast.message('No meeting link saved yet');
                          }
                        }}
                        className="inline-flex items-center rounded-md bg-teal-600 px-2.5 py-1 text-xs font-semibold text-white hover:bg-teal-700"
                      >
                        Join
                      </a>
                      <button
                        type="button"
                        onClick={() => setSelected(previewMeeting)}
                        className="min-w-0 flex-1 truncate text-left text-sm font-medium text-ink hover:underline"
                      >
                        {previewMeeting.title}
                      </button>
                      <span className="shrink-0 text-xs font-semibold text-red-500">
                        {minutesLabel(previewMeeting.startsAt)}
                      </span>
                    </>
                  ) : (
                    <span className="text-sm text-graphite">No meetings scheduled</span>
                  )}
                  <div className="ml-auto hidden items-center gap-1 rounded-md border border-[var(--color-border-subtle)] px-2 py-1 text-xs text-graphite sm:flex">
                    <Search className="h-3.5 w-3.5" />
                    Search
                  </div>
                </div>

                <div className="relative h-[260px] overflow-hidden">
                  <div className="absolute inset-0 grid grid-cols-[48px_1fr]">
                    <div className="border-r border-[var(--color-border-subtle)] text-[10px] text-graphite">
                      {hours.map((h) => (
                        <div
                          key={h}
                          className="relative h-[36px] border-b border-[var(--color-border-subtle)] pr-1 text-right"
                        >
                          <span className="-mt-2 inline-block">
                            {format(setMinutes(setHours(today, h), 0), 'h a')}
                          </span>
                        </div>
                      ))}
                    </div>
                    <div className="relative">
                      {hours.map((h) => (
                        <div key={h} className="h-[36px] border-b border-[var(--color-border-subtle)]" />
                      ))}

                      {(todayMeetings.length ? todayMeetings : meetings.slice(0, 2)).map((m) => {
                        const start = new Date(m.startsAt);
                        const end = new Date(m.endsAt);
                        const dayStart = setHours(today, 8);
                        const dayEnd = setHours(today, 19);
                        const clampedStart = Math.max(start.getTime(), dayStart.getTime());
                        const clampedEnd = Math.min(end.getTime(), dayEnd.getTime());
                        if (clampedEnd <= dayStart.getTime() || clampedStart >= dayEnd.getTime()) {
                          // show near top if meeting is not today / outside visible hours
                          if (!isSameDay(start, today)) {
                            return (
                              <button
                                key={m._id}
                                type="button"
                                onClick={() => setSelected(m)}
                                className="absolute left-2 right-3 top-10 rounded-md border border-teal-200 bg-teal-50 px-2 py-1.5 text-left shadow-xs transition hover:bg-teal-100"
                              >
                                <p className="truncate text-xs font-semibold text-teal-900">
                                  {m.title}
                                </p>
                                <p className="text-[10px] text-teal-800">
                                  {format(start, 'MMM d · h:mm a')} – {format(end, 'h:mm a')}
                                </p>
                              </button>
                            );
                          }
                          return null;
                        }
                        const total = dayEnd.getTime() - dayStart.getTime();
                        const top = ((clampedStart - dayStart.getTime()) / total) * 100;
                        const height = Math.max(
                          8,
                          ((clampedEnd - clampedStart) / total) * 100
                        );
                        return (
                          <button
                            key={m._id}
                            type="button"
                            onClick={() => setSelected(m)}
                            style={{ top: `${top}%`, height: `${height}%` }}
                            className="absolute left-2 right-3 overflow-hidden rounded-md border border-teal-200 bg-teal-50 px-2 py-1 text-left shadow-xs transition hover:bg-teal-100"
                          >
                            <p className="truncate text-xs font-semibold text-teal-900">{m.title}</p>
                            <p className="text-[10px] text-teal-800">
                              {format(start, 'h:mm a')} – {format(end, 'h:mm a')}
                            </p>
                          </button>
                        );
                      })}

                      {(() => {
                        const nowH = new Date().getHours() + new Date().getMinutes() / 60;
                        if (nowH < 8 || nowH > 19) return null;
                        const top = ((nowH - 8) / 11) * 100;
                        return (
                          <div
                            className="pointer-events-none absolute left-0 right-0 z-10 border-t-2 border-red-500"
                            style={{ top: `${top}%` }}
                          >
                            <span className="absolute -left-1 -top-1.5 h-3 w-3 rounded-full bg-red-500" />
                          </div>
                        );
                      })()}
                    </div>
                  </div>
                </div>

                {previewMeeting && (
                  <div className="m-3 flex items-center gap-2 rounded-lg border border-[var(--color-border-subtle)] bg-white px-3 py-2 shadow-xs">
                    <div
                      className={cn(
                        'flex h-7 w-7 items-center justify-center rounded text-[10px] font-bold text-white',
                        provider === 'outlook' ? 'bg-sky-600' : 'bg-[#4285F4]'
                      )}
                    >
                      {provider === 'outlook' ? 'O' : 'G'}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-[10px] uppercase tracking-wide text-graphite">Event</p>
                      <p className="truncate text-sm font-medium text-ink">{previewMeeting.title}</p>
                    </div>
                    <button
                      type="button"
                      className="rounded p-1 text-graphite hover:bg-cloud"
                      onClick={() => setSelected(previewMeeting)}
                      aria-label="More"
                    >
                      <MoreHorizontal className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      className="rounded p-1 text-graphite hover:bg-cloud"
                      onClick={() => toast.message('Meeting cancel is available to organizers')}
                      aria-label="Delete"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      className="rounded p-1 text-graphite hover:bg-cloud"
                      onClick={() => setSelected(null)}
                      aria-label="Close"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      <Modal
        open={connectOpen}
        onClose={() => setConnectOpen(false)}
        title="Connect Calendar"
        description="Save a calendar preference on your profile so AI Notetaker can work with your events."
      >
        <div className="flex flex-col gap-3">
          <Button
            variant="ink"
            className="normal-case tracking-normal"
            onClick={() => connectCalendar('google')}
            disabled={updatePrefs.isPending}
          >
            Connect Google Calendar
          </Button>
          <Button
            variant="outline"
            className="normal-case tracking-normal"
            onClick={() => connectCalendar('outlook')}
            disabled={updatePrefs.isPending}
          >
            Connect Microsoft Outlook
          </Button>
        </div>
      </Modal>

      <Modal
        open={calendarOpen}
        onClose={() => setCalendarOpen(false)}
        title="Calendar"
        description={`${meetings.length} upcoming meeting${meetings.length === 1 ? '' : 's'} from your teams`}
        size="lg"
      >
        {meetings.length === 0 ? (
          <p className="text-sm text-graphite">No upcoming meetings yet.</p>
        ) : (
          <ul className="max-h-[60vh] space-y-2 overflow-y-auto">
            {meetings.map((m) => (
              <li key={m._id}>
                <button
                  type="button"
                  onClick={() => {
                    setCalendarOpen(false);
                    setSelected(m);
                  }}
                  className="flex w-full items-start gap-3 rounded-xl border border-hairline px-3 py-3 text-left hover:bg-cloud"
                >
                  <Video className="mt-0.5 h-4 w-4 shrink-0 text-teal-700" />
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-ink">{m.title}</p>
                    <p className="text-sm text-graphite">
                      {format(new Date(m.startsAt), 'EEE, MMM d · h:mm a')} –{' '}
                      {format(new Date(m.endsAt), 'h:mm a')}
                    </p>
                    <p className="mt-1 text-xs text-graphite">
                      {[m.team?.name, m.location?.name || m.locationLabel]
                        .filter(Boolean)
                        .join(' · ')}
                    </p>
                  </div>
                  <span className="text-xs font-medium text-teal-700">{minutesLabel(m.startsAt)}</span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </Modal>

      <Modal
        open={Boolean(selected)}
        onClose={() => setSelected(null)}
        title={selected?.title || 'Meeting'}
        description={
          selected
            ? `${format(new Date(selected.startsAt), 'EEEE, MMM d · h:mm a')} – ${format(
                new Date(selected.endsAt),
                'h:mm a'
              )}`
            : undefined
        }
        size="lg"
      >
        {selected && (
          <div className="space-y-4 text-sm">
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <p className="text-xs font-semibold uppercase text-graphite">Team</p>
                <p className="text-ink">{selected.team?.name || '—'}</p>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase text-graphite">Location</p>
                <p className="text-ink">{selected.location?.name || selected.locationLabel || '—'}</p>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase text-graphite">Organizer</p>
                <p className="text-ink">{selected.organizer?.name || '—'}</p>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase text-graphite">Attendees</p>
                <p className="text-ink">
                  {(selected.attendees || []).map((a) => a.name).filter(Boolean).join(', ') || '—'}
                </p>
              </div>
            </div>
            {selected.description ? (
              <div>
                <p className="text-xs font-semibold uppercase text-graphite">Notes</p>
                <p className="mt-1 whitespace-pre-wrap text-ink">{selected.description}</p>
              </div>
            ) : null}
            <div className="flex flex-wrap gap-2">
              {selected.meetingUrl ? (
                <a
                  href={selected.meetingUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-2 rounded-md bg-teal-600 px-4 py-2 text-sm font-semibold text-white hover:bg-teal-700"
                >
                  Join meeting <ExternalLink className="h-3.5 w-3.5" />
                </a>
              ) : null}
              <Button
                variant="outline"
                className="normal-case tracking-normal"
                onClick={() => {
                  setSelected(null);
                  runPrompt(`Summarize notes for ${selected.title}`);
                }}
              >
                Ask AI about this meeting
              </Button>
            </div>
          </div>
        )}
      </Modal>

        </>
      )}

      <Modal
        open={scheduleOpen}
        onClose={() => setScheduleOpen(false)}
        title="Schedule meeting"
        description="Anyone can schedule a meeting. Attendees and Super Admin are notified."
        size="md"
      >
        <form
          className="space-y-3"
          onSubmit={(e) => {
            e.preventDefault();
            if (!meetingForm.title.trim() || !meetingForm.startsAt || !meetingForm.endsAt) {
              toast.error('Title, start, and end time are required');
              return;
            }
            createMeeting.mutate(
              {
                title: meetingForm.title.trim(),
                description: meetingForm.description,
                startsAt: new Date(meetingForm.startsAt).toISOString(),
                endsAt: new Date(meetingForm.endsAt).toISOString(),
                team: meetingForm.team || null,
                meetingUrl: meetingForm.meetingUrl,
                attendees: meetingForm.attendees,
              },
              {
                onSuccess: () => {
                  setScheduleOpen(false);
                  setMeetingForm({
                    title: '',
                    description: '',
                    startsAt: '',
                    endsAt: '',
                    team: '',
                    meetingUrl: '',
                    attendees: [],
                  });
                },
              }
            );
          }}
        >
          <div className="space-y-1.5">
            <Label htmlFor="mtg-title">Title</Label>
            <Input
              id="mtg-title"
              value={meetingForm.title}
              onChange={(e) => setMeetingForm((f) => ({ ...f, title: e.target.value }))}
              required
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="mtg-desc">Description</Label>
            <Textarea
              id="mtg-desc"
              rows={2}
              value={meetingForm.description}
              onChange={(e) => setMeetingForm((f) => ({ ...f, description: e.target.value }))}
            />
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="mtg-start">Starts</Label>
              <Input
                id="mtg-start"
                type="datetime-local"
                value={meetingForm.startsAt}
                onChange={(e) => setMeetingForm((f) => ({ ...f, startsAt: e.target.value }))}
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="mtg-end">Ends</Label>
              <Input
                id="mtg-end"
                type="datetime-local"
                value={meetingForm.endsAt}
                onChange={(e) => setMeetingForm((f) => ({ ...f, endsAt: e.target.value }))}
                required
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="mtg-team">Team (optional)</Label>
            <Select
              id="mtg-team"
              value={meetingForm.team}
              onChange={(e) => setMeetingForm((f) => ({ ...f, team: e.target.value }))}
            >
              <option value="">Just selected people</option>
              {(teamsData?.data || []).map((t) => (
                <option key={t._id} value={t._id}>
                  {t.name}
                </option>
              ))}
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="mtg-url">Meeting link</Label>
            <Input
              id="mtg-url"
              placeholder="https://meet.google.com/..."
              value={meetingForm.meetingUrl}
              onChange={(e) => setMeetingForm((f) => ({ ...f, meetingUrl: e.target.value }))}
            />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => setScheduleOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={createMeeting.isPending}>
              {createMeeting.isPending ? 'Scheduling…' : 'Schedule'}
            </Button>
          </div>
        </form>
      </Modal>

      <Modal
        open={locationOpen}
        onClose={() => setLocationOpen(false)}
        title="Add location"
        description="Locations appear in the sidebar for your workspace."
        size="sm"
      >
        <form
          className="space-y-3"
          onSubmit={(e) => {
            e.preventDefault();
            if (!locationForm.name.trim()) return;
            createLocation.mutate(locationForm, {
              onSuccess: () => {
                setLocationOpen(false);
                setLocationForm({ name: '', address: '', city: '', type: 'office' });
                setSearchParams({ tab: 'locations' }, { replace: true });
              },
            });
          }}
        >
          <div className="space-y-1.5">
            <Label htmlFor="loc-name">Name</Label>
            <Input
              id="loc-name"
              value={locationForm.name}
              onChange={(e) => setLocationForm((f) => ({ ...f, name: e.target.value }))}
              required
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="loc-address">Address</Label>
            <Input
              id="loc-address"
              value={locationForm.address}
              onChange={(e) => setLocationForm((f) => ({ ...f, address: e.target.value }))}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="loc-city">City</Label>
            <Input
              id="loc-city"
              value={locationForm.city}
              onChange={(e) => setLocationForm((f) => ({ ...f, city: e.target.value }))}
            />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => setLocationOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={createLocation.isPending}>
              {createLocation.isPending ? 'Saving…' : 'Save location'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
