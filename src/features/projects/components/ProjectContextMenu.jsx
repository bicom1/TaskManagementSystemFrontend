import { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import {
  Link2,
  MoreHorizontal,
  Pencil,
  RefreshCw,
  SquarePen,
  Star,
  Trash2,
  X,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const PRIMARY_ACTIONS = [
  {
    id: 'favorite',
    label: 'Favorite',
    labelActive: 'Remove favorite',
    description: 'Pin to the top of your sidebar',
    descriptionActive: 'Unpin from favorites',
    icon: Star,
    iconBg: 'bg-amber-50 text-amber-600',
    ring: 'hover:ring-amber-200',
  },
  {
    id: 'rename',
    label: 'Rename',
    description: 'Change the project display name',
    icon: Pencil,
    iconBg: 'bg-brand-50 text-brand-600',
    ring: 'hover:ring-brand-200',
  },
  {
    id: 'copy',
    label: 'Copy link',
    description: 'Share a direct link to this project',
    icon: Link2,
    iconBg: 'bg-sky-50 text-sky-600',
    ring: 'hover:ring-sky-200',
  },
];

const MANAGE_ACTIONS = [
  {
    id: 'edit',
    label: 'Edit',
    description: 'Update color, status, and details',
    icon: SquarePen,
    iconBg: 'bg-violet-50 text-violet-600',
    ring: 'hover:ring-violet-200',
  },
  {
    id: 'update',
    label: 'Update',
    description: 'Refresh project settings and metadata',
    icon: RefreshCw,
    iconBg: 'bg-emerald-50 text-emerald-600',
    ring: 'hover:ring-emerald-200',
  },
];

function MenuAction({ item, onClick, isFavorite }) {
  const Icon = item.icon;
  const isFavAction = item.id === 'favorite';
  const label = isFavAction && isFavorite ? item.labelActive : item.label;
  const description = isFavAction && isFavorite ? item.descriptionActive : item.description;

  return (
    <button
      type="button"
      role="menuitem"
      onClick={onClick}
      className={cn(
        'group flex w-full items-center gap-3 rounded-xl border border-hairline/80 bg-gradient-to-br from-white to-surface-1/80 p-3 text-left shadow-sm ring-1 ring-transparent transition-all hover:-translate-y-0.5 hover:border-hairline hover:shadow-md',
        item.ring
      )}
    >
      <span
        className={cn(
          'flex h-9 w-9 shrink-0 items-center justify-center rounded-lg',
          item.iconBg
        )}
      >
        <Icon
          className={cn(
            'h-4 w-4',
            isFavAction && isFavorite && 'fill-amber-400 text-amber-500'
          )}
        />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-sm font-semibold text-ink transition-colors group-hover:text-brand-700">
          {label}
        </span>
        <span className="mt-0.5 block text-xs leading-relaxed text-graphite">{description}</span>
      </span>
      <span className="text-lg font-light text-steel/50 transition group-hover:translate-x-0.5 group-hover:text-brand-400">
        →
      </span>
    </button>
  );
}

export function ProjectContextMenu({
  open,
  onClose,
  project,
  isFavorite,
  onFavorite,
  onRename,
  onCopyLink,
  onEdit,
  onUpdate,
  onDelete,
}) {
  const panelRef = useRef(null);

  useEffect(() => {
    if (!open) return undefined;

    const onDoc = (e) => {
      if (panelRef.current?.contains(e.target)) return;
      onClose?.();
    };
    const onKey = (e) => {
      if (e.key === 'Escape') onClose?.();
    };

    document.addEventListener('mousedown', onDoc);
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';

    return () => {
      document.removeEventListener('mousedown', onDoc);
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [open, onClose]);

  if (!open || !project) return null;

  const handlers = {
    favorite: onFavorite,
    rename: onRename,
    copy: onCopyLink,
    edit: onEdit,
    update: onUpdate,
  };

  const projectInitial = (project.icon || project.name?.[0] || 'P').toString().slice(0, 1);

  return createPortal(
    <div className="fixed inset-0 z-[85] flex items-center justify-center px-4 py-6">
      <div
        className="absolute inset-0 bg-[rgba(8,8,12,0.55)] backdrop-blur-[6px]"
        onClick={onClose}
        aria-hidden
      />
      <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
        <div
          className="absolute left-1/2 top-1/3 h-72 w-72 -translate-x-1/2 rounded-full opacity-25 blur-[100px]"
          style={{ background: 'var(--color-brand-400)' }}
        />
      </div>

      <div
        ref={panelRef}
        role="menu"
        aria-label={`Project options for ${project.name}`}
        className="relative z-[86] flex w-full max-w-[420px] flex-col overflow-hidden rounded-[22px] border border-white/60 bg-paper shadow-[0_24px_80px_rgba(15,15,19,0.22)] animate-scale-in"
      >
        <div className="relative overflow-hidden border-b border-hairline/80 px-5 pb-4 pt-5">
          <div
            className="pointer-events-none absolute -right-10 -top-10 h-36 w-36 rounded-full opacity-40 blur-3xl"
            style={{ background: 'radial-gradient(circle, var(--color-brand-300), transparent 70%)' }}
          />
          <div className="relative flex items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-brand-200/60 bg-brand-50/80 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.08em] text-brand-700">
                <MoreHorizontal className="h-3 w-3" />
                Project options
              </div>
              <div className="flex items-center gap-3">
                <span
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-sm font-bold text-white shadow-sm"
                  style={{ backgroundColor: project.color || '#4f46e5' }}
                >
                  {projectInitial}
                </span>
                <div className="min-w-0">
                  <h2 className="truncate text-lg font-semibold tracking-tight text-ink">{project.name}</h2>
                  <p className="mt-0.5 text-xs text-graphite">Manage this project</p>
                </div>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-hairline bg-white/80 text-graphite shadow-sm transition hover:bg-cloud hover:text-ink"
              aria-label="Close"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        <div className="space-y-2 p-4">
          {PRIMARY_ACTIONS.map((item) => (
            <MenuAction
              key={item.id}
              item={item}
              isFavorite={isFavorite}
              onClick={() => handlers[item.id]?.()}
            />
          ))}
        </div>

        <div className="space-y-2 border-t border-hairline/80 px-4 py-3">
          <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-graphite">
            Manage
          </p>
          {MANAGE_ACTIONS.map((item) => (
            <MenuAction
              key={item.id}
              item={item}
              onClick={() => handlers[item.id]?.()}
            />
          ))}
        </div>

        <div className="border-t border-hairline/80 bg-red-50/30 px-4 py-3">
          <button
            type="button"
            role="menuitem"
            onClick={onDelete}
            className="group flex w-full items-center gap-3 rounded-xl border border-red-200/80 bg-gradient-to-br from-red-50/90 to-white p-3 text-left shadow-sm transition-all hover:-translate-y-0.5 hover:border-red-300 hover:shadow-md"
          >
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-red-100 text-red-600">
              <Trash2 className="h-4 w-4" />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-sm font-semibold text-red-700">Delete project</span>
              <span className="mt-0.5 block text-xs leading-relaxed text-red-600/80">
                Permanently remove this project and archive its tasks
              </span>
            </span>
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
