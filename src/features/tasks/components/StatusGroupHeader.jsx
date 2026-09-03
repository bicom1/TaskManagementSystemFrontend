import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import {
  ArrowLeftToLine,
  Bot,
  Check,
  ChevronLeft,
  CircleDot,
  MoreHorizontal,
  Pencil,
  Plus,
} from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import { Modal } from '@/components/ui/Modal';
import { useUpdateProject } from '@/features/projects/hooks/useProjects';
import { STATUS_LABELS, TASK_STATUSES } from '@/features/tasks/api/taskApi';

const TEMPLATE_COLORS = new Set([
  '#9ca3af',
  '#7c3aed',
  '#22c55e',
  '#3b82f6',
  '#f59e0b',
  '#6b7280',
  '#8b5cf6',
]);

export const STATUS_TONES = {
  backlog: { bg: '#d1d5db', fg: '#374151', icon: 'dashed' },
  todo: { bg: '#e5e7eb', fg: '#4b5563', icon: 'dashed' },
  in_progress: { bg: '#3b82f6', fg: '#ffffff', icon: 'ring' },
  in_review: { bg: '#8b5cf6', fg: '#ffffff', icon: 'ring' },
  done: { bg: '#22c55e', fg: '#ffffff', icon: 'check' },
};

export const GROUP_LABELS = {
  backlog: 'BACKLOG',
  todo: 'TO DO',
  in_progress: 'IN PROGRESS',
  in_review: 'IN REVIEW',
  done: 'COMPLETE',
};

function contrastFg(hex) {
  const raw = String(hex || '').replace('#', '');
  if (raw.length < 6) return '#ffffff';
  const r = parseInt(raw.slice(0, 2), 16);
  const g = parseInt(raw.slice(2, 4), 16);
  const b = parseInt(raw.slice(4, 6), 16);
  const luma = (r * 299 + g * 587 + b * 114) / 1000;
  return luma > 165 ? '#374151' : '#ffffff';
}

export function resolveStatusTone(status, color) {
  const base = STATUS_TONES[status] || STATUS_TONES.todo;
  if (!color) return base;
  const lower = String(color).toLowerCase();
  if (TEMPLATE_COLORS.has(lower) || Object.values(STATUS_TONES).some((t) => t.bg.toLowerCase() === lower)) {
    return base;
  }
  return { ...base, bg: color, fg: contrastFg(color) };
}

function StatusGlyph({ icon, fg, className }) {
  if (icon === 'check') {
    return (
      <span
        className={cn(
          'inline-flex h-3.5 w-3.5 items-center justify-center rounded-full',
          className
        )}
        style={{ backgroundColor: fg === '#ffffff' ? 'rgba(255,255,255,0.25)' : 'currentColor' }}
      >
        <Check className="h-2.5 w-2.5" strokeWidth={3} style={{ color: fg }} />
      </span>
    );
  }
  if (icon === 'ring') {
    return (
      <span
        className={cn('inline-flex h-3.5 w-3.5 items-center justify-center rounded-full', className)}
        style={{ backgroundColor: fg }}
      >
        <span className="h-1.5 w-1.5 rounded-full bg-white/90" />
      </span>
    );
  }
  return (
    <span
      className={cn('inline-block h-3.5 w-3.5 rounded-full', className)}
      style={{ border: `1.5px dashed ${fg}` }}
    />
  );
}

export function StatusPill({ status, label, color, className }) {
  const tone = resolveStatusTone(status, color);
  const text = (label || GROUP_LABELS[status] || STATUS_LABELS[status] || status).toUpperCase();
  return (
    <span
      className={cn(
        'inline-flex shrink-0 items-center gap-1.5 rounded-md px-2 py-0.5 text-[11px] font-bold tracking-wide whitespace-nowrap',
        className
      )}
      style={{ backgroundColor: tone.bg, color: tone.fg }}
    >
      <StatusGlyph icon={tone.icon} fg={tone.fg} />
      {text}
    </span>
  );
}

function GroupOptionsMenu({
  open,
  onClose,
  anchorRef,
  collapsed,
  onCollapse,
  onRename,
  onEditStatuses,
  onAutomate,
}) {
  const panelRef = useRef(null);
  const [pos, setPos] = useState({ top: 0, left: 0 });

  useLayoutEffect(() => {
    if (!open || !anchorRef?.current) return undefined;
    const place = () => {
      const rect = anchorRef.current.getBoundingClientRect();
      const width = 220;
      const left = Math.min(rect.left, window.innerWidth - width - 8);
      const top = rect.bottom + 6;
      setPos({ top, left: Math.max(8, left) });
    };
    place();
    window.addEventListener('resize', place);
    window.addEventListener('scroll', place, true);
    return () => {
      window.removeEventListener('resize', place);
      window.removeEventListener('scroll', place, true);
    };
  }, [open, anchorRef]);

  useEffect(() => {
    if (!open) return undefined;
    const onDoc = (e) => {
      if (panelRef.current?.contains(e.target)) return;
      if (anchorRef?.current?.contains(e.target)) return;
      onClose?.();
    };
    const onKey = (e) => {
      if (e.key === 'Escape') onClose?.();
    };
    document.addEventListener('mousedown', onDoc);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDoc);
      document.removeEventListener('keydown', onKey);
    };
  }, [open, onClose, anchorRef]);

  if (!open) return null;

  const items = [
    {
      id: 'collapse',
      label: collapsed ? 'Expand group' : 'Collapse group',
      icon: ArrowLeftToLine,
      onClick: onCollapse,
    },
    {
      id: 'automate',
      label: 'Automate status',
      icon: Bot,
      onClick: onAutomate,
    },
    { id: 'sep' },
    {
      id: 'rename',
      label: 'Rename',
      icon: Pencil,
      onClick: onRename,
    },
    {
      id: 'edit',
      label: 'Edit statuses',
      icon: CircleDot,
      onClick: onEditStatuses,
    },
  ];

  return createPortal(
    <div
      ref={panelRef}
      role="menu"
      style={{ top: pos.top, left: pos.left }}
      className="fixed z-[80] w-[220px] overflow-hidden rounded-xl border border-hairline bg-cloud py-1.5 shadow-[0_12px_32px_rgba(15,15,20,0.16)]"
    >
      <p className="px-3 pb-1 pt-0.5 text-[11px] font-medium text-graphite">Group options</p>
      {items.map((item) => {
        if (item.id === 'sep') {
          return <div key="sep" className="my-1 border-t border-hairline/80" />;
        }
        const Icon = item.icon;
        return (
          <button
            key={item.id}
            type="button"
            role="menuitem"
            onClick={() => {
              item.onClick?.();
              onClose?.();
            }}
            className="flex w-full items-center gap-2.5 px-3 py-2 text-left text-[13px] text-ink hover:bg-paper"
          >
            <Icon className="h-4 w-4 shrink-0 text-graphite" strokeWidth={1.75} />
            {item.label}
          </button>
        );
      })}
    </div>,
    document.body
  );
}

function needProject() {
  toast.message('Open a project space to edit status groups.');
}

export function StatusGroupHeader({
  status,
  label,
  color,
  count = 0,
  collapsed = false,
  onToggleCollapse,
  onAdd,
  projectId,
  projectStatuses,
  variant = 'board',
  className,
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [renameOpen, setRenameOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [renameValue, setRenameValue] = useState('');
  const moreRef = useRef(null);
  const updateProject = useUpdateProject();

  const currentLabel = label || GROUP_LABELS[status] || STATUS_LABELS[status] || status;

  const persistStatuses = (statuses, successMessage) => {
    if (!projectId) {
      needProject();
      return;
    }
    updateProject.mutate({
      id: projectId,
      payload: { statuses },
      successMessage,
    });
  };

  const currentStatuses = () => {
    if (projectStatuses?.length) {
      return projectStatuses.map((s) => ({
        key: s.key,
        label: s.label,
        color: s.color || resolveStatusTone(s.key).bg,
      }));
    }
    return TASK_STATUSES.map((key) => ({
      key,
      label: GROUP_LABELS[key] || STATUS_LABELS[key] || key,
      color: resolveStatusTone(key).bg,
    }));
  };

  const handleRename = (e) => {
    e?.preventDefault?.();
    const nextLabel = renameValue.trim();
    if (!nextLabel) return;
    const statuses = currentStatuses().map((s) =>
      s.key === status ? { ...s, label: nextLabel } : s
    );
    if (!statuses.some((s) => s.key === status)) {
      statuses.push({
        key: status,
        label: nextLabel,
        color: resolveStatusTone(status, color).bg,
      });
    }
    persistStatuses(statuses, 'Status renamed');
    setRenameOpen(false);
  };

  const handleSaveStatuses = (statuses) => {
    persistStatuses(statuses, 'Statuses updated');
    setEditOpen(false);
  };

  return (
    <div className={cn('flex min-w-0 flex-nowrap items-center gap-1.5', className)}>
      {variant === 'list' ? (
        <button
          type="button"
          onClick={onToggleCollapse}
          className="inline-flex h-6 w-6 items-center justify-center rounded-md text-graphite hover:bg-cloud hover:text-ink"
          title={collapsed ? 'Expand group' : 'Collapse group'}
        >
          <ChevronLeft
            className={cn('h-3.5 w-3.5 transition-transform', !collapsed && '-rotate-90')}
          />
        </button>
      ) : null}

      <StatusPill status={status} label={currentLabel} color={color} />
      <span className="text-[12px] font-semibold tabular-nums text-graphite">{count}</span>

      <div className="ml-auto flex shrink-0 items-center gap-0.5">
        <button
          ref={moreRef}
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            setMenuOpen((v) => !v);
          }}
          onMouseDown={(e) => e.stopPropagation()}
          className="inline-flex h-6 w-6 items-center justify-center rounded-md text-graphite hover:bg-paper hover:text-ink"
          title="Group options"
          aria-haspopup="menu"
          aria-expanded={menuOpen}
        >
          <MoreHorizontal className="h-3.5 w-3.5" />
        </button>
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onAdd?.();
          }}
          className="inline-flex h-6 w-6 items-center justify-center rounded-md text-graphite hover:bg-paper hover:text-ink"
          title="Add task"
        >
          <Plus className="h-3.5 w-3.5" strokeWidth={2.25} />
        </button>
      </div>

      <GroupOptionsMenu
        open={menuOpen}
        onClose={() => setMenuOpen(false)}
        anchorRef={moreRef}
        collapsed={collapsed}
        onCollapse={onToggleCollapse}
        onRename={() => {
          setRenameValue(currentLabel);
          setRenameOpen(true);
        }}
        onEditStatuses={() => {
          if (!projectId) {
            needProject();
            return;
          }
          setEditOpen(true);
        }}
        onAutomate={() => toast.message('Status automations are coming soon.')}
      />

      <Modal
        open={renameOpen}
        onClose={() => setRenameOpen(false)}
        title="Rename group"
        size="sm"
      >
        <form onSubmit={handleRename} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor={`rename-status-${status}`}>Name</Label>
            <Input
              id={`rename-status-${status}`}
              value={renameValue}
              onChange={(e) => setRenameValue(e.target.value)}
              autoFocus
              maxLength={40}
            />
          </div>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setRenameOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={!renameValue.trim() || updateProject.isPending}>
              Save
            </Button>
          </div>
        </form>
      </Modal>

      <EditStatusesModal
        open={editOpen}
        onClose={() => setEditOpen(false)}
        statuses={currentStatuses()}
        saving={updateProject.isPending}
        onSave={handleSaveStatuses}
      />
    </div>
  );
}

export function EditStatusesModal({ open, onClose, statuses = [], saving, onSave }) {
  const [drafts, setDrafts] = useState(statuses);

  useEffect(() => {
    if (!open) return;
    setDrafts(statuses);
  }, [open]);

  return (
    <Modal open={open} onClose={onClose} title="Edit statuses" size="md">
      <form
        className="space-y-4"
        onSubmit={(e) => {
          e.preventDefault();
          onSave?.(
            drafts.map((s) => ({
              key: s.key,
              label: String(s.label || '').trim() || s.key,
              color: s.color,
            }))
          );
        }}
      >
        <p className="text-sm text-graphite">Rename the groups that appear on List and Board.</p>
        <div className="space-y-2">
          {drafts.map((row, index) => (
            <div key={row.key} className="flex items-center gap-2">
              <input
                type="color"
                value={row.color || resolveStatusTone(row.key).bg}
                onChange={(e) =>
                  setDrafts((prev) =>
                    prev.map((s, i) => (i === index ? { ...s, color: e.target.value } : s))
                  )
                }
                className="h-8 w-8 cursor-pointer rounded border border-hairline bg-paper p-0.5"
                title="Color"
              />
              <Input
                value={row.label}
                onChange={(e) =>
                  setDrafts((prev) =>
                    prev.map((s, i) => (i === index ? { ...s, label: e.target.value } : s))
                  )
                }
                maxLength={40}
              />
            </div>
          ))}
        </div>
        <div className="flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" disabled={saving}>
            Save
          </Button>
        </div>
      </form>
    </Modal>
  );
}

export function nextUnusedStatus(existing = []) {
  const used = new Set((existing || []).map((s) => s.key || s));
  return TASK_STATUSES.find((key) => !used.has(key)) || null;
}

export function ClickUpBoardColumn({
  status,
  label,
  color,
  count,
  collapsed,
  onToggleCollapse,
  onAdd,
  projectId,
  projectStatuses,
  children,
}) {
  if (collapsed) {
    return (
      <div className="flex w-11 shrink-0 flex-col items-center gap-3 rounded-2xl bg-cloud px-1.5 py-3">
        <button
          type="button"
          onClick={onToggleCollapse}
          className="inline-flex h-6 w-6 items-center justify-center rounded-md text-graphite hover:bg-paper"
          title="Expand group"
        >
          <ChevronLeft className="h-3.5 w-3.5 rotate-180" />
        </button>
        <div className="flex flex-1 items-start pt-2">
          <span
            className="origin-center text-[11px] font-bold tracking-wide text-graphite"
            style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)' }}
          >
            {(label || GROUP_LABELS[status] || status).toUpperCase()}
          </span>
        </div>
        <span className="text-[11px] font-semibold tabular-nums text-graphite">{count}</span>
      </div>
    );
  }

  return (
    <div className="flex w-[280px] shrink-0 flex-col rounded-2xl bg-cloud p-2.5">
      <StatusGroupHeader
        status={status}
        label={label}
        color={color}
        count={count}
        collapsed={collapsed}
        onToggleCollapse={onToggleCollapse}
        onAdd={onAdd}
        projectId={projectId}
        projectStatuses={projectStatuses}
        variant="board"
        className="mb-2 px-0.5"
      />
      {children}
    </div>
  );
}
