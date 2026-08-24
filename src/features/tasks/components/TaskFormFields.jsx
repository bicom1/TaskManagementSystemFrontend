import { useEffect, useMemo, useRef, useState } from 'react';
import { Check, ChevronsUpDown, Plus, Search, X } from 'lucide-react';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import { Textarea } from '@/components/ui/Textarea';
import { Select } from '@/components/ui/Select';
import {
  TASK_STATUSES,
  STATUS_LABELS,
  PRIORITY_LABELS,
} from '@/features/tasks/api/taskApi';
import { cn } from '@/lib/utils';
import { getAvatarColor, getInitials } from '@/lib/avatar';

export function toDatetimeLocalValue(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function fromDatetimeLocalValue(value) {
  if (!value) return null;
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return null;
  return d.toISOString();
}

/** Merge people from org, project, and current user — unique by id. */
export function mergeAssignablePeople(...lists) {
  const map = new Map();
  const add = (person) => {
    if (!person) return;
    const id = String(person._id || person);
    if (!id || id === 'undefined') return;
    if (typeof person === 'string') {
      if (!map.has(person)) map.set(person, { _id: person, name: 'User' });
      return;
    }
    map.set(id, person);
  };
  for (const list of lists) {
    if (Array.isArray(list)) list.forEach(add);
    else add(list);
  }
  return [...map.values()].sort((a, b) =>
    String(a.name || '').localeCompare(String(b.name || ''))
  );
}

/** Build unique assignable people from project owner, members, and team. */
export function getProjectAssignablePeople(project) {
  return mergeAssignablePeople(
    project?.owner,
    project?.members,
    project?.team?.lead,
    project?.team?.members
  );
}

function matchesPerson(person, query) {
  if (!query) return true;
  const q = query.toLowerCase();
  const hay = [
    person.name,
    person.email,
    person.jobTitle,
    person.department?.name,
    person.department?.code,
    person.role,
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();
  return hay.includes(q);
}

/** Searchable project picker with optional create-from-type. */
export function ProjectSearchSelect({
  projects = [],
  teams = [],
  value,
  onChange,
  onCreateProject,
  creating = false,
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [teamId, setTeamId] = useState(teams[0]?._id || '');
  const rootRef = useRef(null);

  const selected = projects.find((p) => String(p._id) === String(value));

  useEffect(() => {
    if (!teamId && teams[0]?._id) setTeamId(teams[0]._id);
  }, [teams, teamId]);

  useEffect(() => {
    const onDoc = (e) => {
      if (!rootRef.current?.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return projects;
    return projects.filter(
      (p) =>
        String(p.name || '')
          .toLowerCase()
          .includes(q) ||
        String(p.key || '')
          .toLowerCase()
          .includes(q) ||
        String(p.team?.name || '')
          .toLowerCase()
          .includes(q)
    );
  }, [projects, query]);

  const canCreate =
    Boolean(onCreateProject) &&
    query.trim().length >= 2 &&
    !projects.some((p) => String(p.name).toLowerCase() === query.trim().toLowerCase());

  return (
    <div ref={rootRef} className="relative space-y-2">
      <Label>Project</Label>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex h-11 w-full items-center justify-between rounded-md border border-hairline bg-paper px-3 text-left text-sm text-ink hover:bg-cloud"
      >
        <span className={cn('truncate', !selected && 'text-graphite')}>
          {selected ? `${selected.name}${selected.key ? ` (${selected.key})` : ''}` : 'Search or create a project…'}
        </span>
        <ChevronsUpDown className="h-4 w-4 shrink-0 text-graphite" />
      </button>

      {open && (
        <div className="absolute z-30 mt-1 w-full overflow-hidden rounded-xl border border-hairline bg-paper shadow-lg">
          <div className="border-b border-hairline p-2">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-graphite" />
              <Input
                autoFocus
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Type project name…"
                className="h-9 border-hairline pl-8 text-sm"
              />
            </div>
          </div>
          <div className="max-h-48 overflow-y-auto p-1">
            {filtered.length === 0 ? (
              <p className="px-3 py-3 text-sm text-graphite">No matching projects</p>
            ) : (
              filtered.map((p) => (
                <button
                  key={p._id}
                  type="button"
                  onClick={() => {
                    onChange(p._id);
                    setQuery('');
                    setOpen(false);
                  }}
                  className={cn(
                    'flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-sm hover:bg-cloud',
                    String(p._id) === String(value) && 'bg-cloud font-medium'
                  )}
                >
                  <span className="truncate text-ink">
                    {p.name}
                    {p.key ? <span className="text-graphite"> · {p.key}</span> : null}
                  </span>
                  {String(p._id) === String(value) ? <Check className="h-4 w-4 text-primary" /> : null}
                </button>
              ))
            )}
          </div>
          {canCreate && (
            <div className="space-y-2 border-t border-hairline p-2">
              {teams.length > 0 && (
                <Select
                  value={teamId}
                  onChange={(e) => setTeamId(e.target.value)}
                  className="h-9 text-sm"
                >
                  {teams.map((t) => (
                    <option key={t._id} value={t._id}>
                      Team: {t.name}
                    </option>
                  ))}
                </Select>
              )}
              <button
                type="button"
                disabled={creating || !teamId}
                onClick={async () => {
                  const name = query.trim();
                  const created = await onCreateProject?.({ name, teamId });
                  if (created?._id) {
                    onChange(created._id);
                    setQuery('');
                    setOpen(false);
                  }
                }}
                className="flex w-full items-center gap-2 rounded-lg border border-primary/30 bg-primary-soft/30 px-3 py-2 text-sm font-medium text-primary hover:bg-primary-soft/50 disabled:opacity-50"
              >
                <Plus className="h-4 w-4" />
                Create project “{query.trim()}”
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/**
 * Shared fields for create + edit task forms.
 */
export function TaskFormFields({
  value,
  onChange,
  people = [],
  showStatus = true,
  compact = false,
  idPrefix = 'task',
}) {
  const [labelDraft, setLabelDraft] = useState('');
  const [assigneeQuery, setAssigneeQuery] = useState('');

  const patch = (partial) => onChange({ ...value, ...partial });

  const toggleAssignee = (userId) => {
    const id = String(userId);
    const current = (value.assignees || []).map(String);
    const next = current.includes(id) ? current.filter((x) => x !== id) : [...current, id];
    patch({ assignees: next });
  };

  const addLabel = () => {
    const text = labelDraft.trim();
    if (!text) return;
    const labels = [...(value.labels || [])];
    if (!labels.some((l) => l.toLowerCase() === text.toLowerCase())) {
      labels.push(text);
      patch({ labels });
    }
    setLabelDraft('');
  };

  const removeLabel = (label) => {
    patch({ labels: (value.labels || []).filter((l) => l !== label) });
  };

  const selected = useMemo(
    () => new Set((value.assignees || []).map(String)),
    [value.assignees]
  );

  const filteredPeople = useMemo(
    () => people.filter((p) => matchesPerson(p, assigneeQuery.trim())),
    [people, assigneeQuery]
  );

  const selectedPeople = useMemo(
    () => people.filter((p) => selected.has(String(p._id))),
    [people, selected]
  );

  return (
    <div className={cn('space-y-4', compact && 'space-y-3')}>
      <div className="space-y-2">
        <Label htmlFor={`${idPrefix}-title`}>Title</Label>
        <Input
          id={`${idPrefix}-title`}
          value={value.title || ''}
          onChange={(e) => patch({ title: e.target.value })}
          placeholder="What needs to be done?"
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor={`${idPrefix}-description`}>Description</Label>
        <Textarea
          id={`${idPrefix}-description`}
          value={value.description || ''}
          onChange={(e) => patch({ description: e.target.value })}
          placeholder="Add details, acceptance criteria…"
          rows={compact ? 2 : 3}
        />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {showStatus && (
          <div className="space-y-2">
            <Label htmlFor={`${idPrefix}-status`}>Status</Label>
            <Select
              id={`${idPrefix}-status`}
              value={value.status || 'backlog'}
              onChange={(e) => patch({ status: e.target.value })}
            >
              {TASK_STATUSES.map((s) => (
                <option key={s} value={s}>
                  {STATUS_LABELS[s]}
                </option>
              ))}
            </Select>
          </div>
        )}
        <div className="space-y-2">
          <Label htmlFor={`${idPrefix}-priority`}>Priority</Label>
          <Select
            id={`${idPrefix}-priority`}
            value={value.priority || 'medium'}
            onChange={(e) => patch({ priority: e.target.value })}
          >
            {Object.entries(PRIORITY_LABELS).map(([k, v]) => (
              <option key={k} value={k}>
                {v}
              </option>
            ))}
          </Select>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor={`${idPrefix}-due`}>Due date & time</Label>
        <Input
          id={`${idPrefix}-due`}
          type="datetime-local"
          value={value.dueDateLocal || ''}
          onChange={(e) => patch({ dueDateLocal: e.target.value })}
        />
        {value.dueDateLocal ? (
          <button
            type="button"
            className="text-xs font-medium text-graphite hover:text-ink hover:underline"
            onClick={() => patch({ dueDateLocal: '' })}
          >
            Clear due date
          </button>
        ) : null}
      </div>

      <div className="space-y-2">
        <Label>Assignees</Label>
        {selectedPeople.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {selectedPeople.map((person) => (
              <button
                key={person._id}
                type="button"
                onClick={() => toggleAssignee(person._id)}
                className="inline-flex items-center gap-1.5 rounded-full border border-primary/30 bg-primary-soft/40 px-2.5 py-1 text-xs font-medium text-ink"
                title="Remove"
              >
                <span
                  className="flex h-5 w-5 items-center justify-center rounded-full text-[9px] font-bold text-white"
                  style={{
                    backgroundColor: getAvatarColor(person._id || person.email || person.name),
                  }}
                >
                  {getInitials(person.name)}
                </span>
                {person.name}
                <X className="h-3 w-3 text-graphite" />
              </button>
            ))}
          </div>
        )}
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-graphite" />
          <Input
            value={assigneeQuery}
            onChange={(e) => setAssigneeQuery(e.target.value)}
            placeholder="Search by name, SEO, Development, UI/UX…"
            className="h-9 border-hairline pl-8 text-sm"
          />
        </div>
        {people.length === 0 ? (
          <p className="text-sm text-graphite">No people available to assign.</p>
        ) : (
          <div className="max-h-40 space-y-1 overflow-y-auto rounded-lg border border-hairline p-2">
            {filteredPeople.length === 0 ? (
              <p className="px-2 py-3 text-center text-sm text-graphite">No matches</p>
            ) : (
              filteredPeople.map((person) => {
                const id = String(person._id);
                const checked = selected.has(id);
                const color = getAvatarColor(person._id || person.email || person.name);
                return (
                  <label
                    key={id}
                    className={cn(
                      'flex cursor-pointer items-center gap-2.5 rounded-md px-2 py-1.5 text-sm transition',
                      checked ? 'bg-cloud' : 'hover:bg-cloud/70'
                    )}
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => toggleAssignee(id)}
                      className="accent-[var(--color-primary,#024ad8)]"
                    />
                    <span
                      className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[10px] font-bold text-white"
                      style={{ backgroundColor: color }}
                    >
                      {getInitials(person.name)}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate font-medium text-ink">{person.name}</span>
                      <span className="block truncate text-xs text-graphite">
                        {[person.jobTitle, person.department?.name, person.email]
                          .filter(Boolean)
                          .join(' · ')}
                      </span>
                    </span>
                  </label>
                );
              })
            )}
          </div>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor={`${idPrefix}-labels`}>Labels</Label>
        <div className="flex flex-wrap gap-1.5">
          {(value.labels || []).map((label) => (
            <button
              key={label}
              type="button"
              onClick={() => removeLabel(label)}
              className="rounded-full border border-hairline bg-cloud px-2.5 py-0.5 text-xs font-medium text-ink hover:border-bloom-coral hover:text-bloom-deep"
              title="Remove label"
            >
              {label} ×
            </button>
          ))}
        </div>
        <div className="flex gap-2">
          <Input
            id={`${idPrefix}-labels`}
            value={labelDraft}
            onChange={(e) => setLabelDraft(e.target.value)}
            placeholder="Add label…"
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                addLabel();
              }
            }}
          />
          <button
            type="button"
            onClick={addLabel}
            className="shrink-0 rounded-md border border-hairline px-3 text-sm font-medium text-charcoal hover:bg-cloud"
          >
            Add
          </button>
        </div>
      </div>
    </div>
  );
}

export function buildTaskPayload(formValue) {
  const title = String(formValue.title || '').trim();
  return {
    title,
    description: String(formValue.description || '').trim() || '',
    status: formValue.status || 'backlog',
    priority: formValue.priority || 'medium',
    assignees: (formValue.assignees || []).map(String),
    labels: formValue.labels || [],
    dueDate: fromDatetimeLocalValue(formValue.dueDateLocal),
  };
}

export const EMPTY_TASK_FORM = {
  title: '',
  description: '',
  status: 'backlog',
  priority: 'medium',
  assignees: [],
  labels: [],
  dueDateLocal: '',
};

export const NEXT_STATUS = {
  backlog: 'todo',
  todo: 'in_progress',
  in_progress: 'in_review',
  in_review: 'done',
  done: 'done',
};
