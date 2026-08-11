import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import {
  CheckSquare,
  Folder,
  RefreshCw,
  FileText,
  BarChart3,
  Pencil,
  ClipboardList,
  Download,
  Wand2,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const PRIMARY = [
  {
    id: 'list',
    label: 'List',
    description: 'Track tasks, projects, people & more',
    icon: CheckSquare,
  },
  {
    id: 'folder',
    label: 'Folder',
    description: 'Group Lists, Docs & more',
    icon: Folder,
  },
  {
    id: 'sprint',
    label: 'Sprint Folder',
    description: 'Organize your Sprints',
    icon: RefreshCw,
  },
];

const SECONDARY = [
  { id: 'doc', label: 'Doc', icon: FileText, color: '#3b82f6' },
  { id: 'dashboard', label: 'Dashboard', icon: BarChart3, color: '#8b5cf6' },
  { id: 'whiteboard', label: 'Whiteboard', icon: Pencil, color: '#f97316' },
  { id: 'form', label: 'Form', icon: ClipboardList, color: '#3b82f6' },
];

const FOOTER = [
  { id: 'imports', label: 'Imports', icon: Download },
  { id: 'templates', label: 'Templates', icon: Wand2 },
];

/**
 * ClickUp-style Create popover — fixed next to the + button (not a page navigation).
 */
export function CreateMenuPopover({ open, onClose, onSelect, anchorRef }) {
  const panelRef = useRef(null);
  const [pos, setPos] = useState({ top: 0, left: 0 });

  useLayoutEffect(() => {
    if (!open || !anchorRef?.current) return;

    const place = () => {
      const rect = anchorRef.current.getBoundingClientRect();
      const panel = panelRef.current;
      const width = 280;
      const height = panel?.offsetHeight || 440;
      const gap = 8;

      // To the right of the +
      let left = rect.right + gap;
      if (left + width > window.innerWidth - 12) {
        left = Math.max(12, rect.left - width - gap);
      }

      // A little above the + button (not stuck at the bottom of the screen)
      let top = rect.top - 12;
      if (top + height > window.innerHeight - 12) {
        top = Math.max(12, window.innerHeight - height - 12);
      }
      if (top < 12) top = 12;

      setPos({ top, left: Math.max(12, left) });
    };

    place();
    requestAnimationFrame(place);
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

  const pick = (id) => {
    onSelect?.(id);
    onClose?.();
  };

  return (
    <div
      ref={panelRef}
      role="menu"
      aria-label="Create"
      style={{ top: pos.top, left: pos.left }}
      className="fixed z-[80] w-[280px] overflow-hidden rounded-xl border border-hairline bg-paper/95 shadow-[0_12px_40px_rgba(0,0,0,0.14)] backdrop-blur-md"
    >
      <div className="border-b border-hairline px-4 py-3">
        <p className="text-sm font-semibold text-ink">Create</p>
      </div>

      <div className="p-2">
        {PRIMARY.map((item) => {
          const Icon = item.icon;
          return (
            <button
              key={item.id}
              type="button"
              role="menuitem"
              onClick={() => pick(item.id)}
              className="flex w-full items-start gap-3 rounded-lg px-3 py-2.5 text-left hover:bg-cloud"
            >
              <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-hairline bg-cloud">
                <Icon className="h-4 w-4 text-ink" />
              </span>
              <span className="min-w-0">
                <span className="block text-sm font-semibold text-ink">{item.label}</span>
                <span className="block text-xs text-graphite">{item.description}</span>
              </span>
            </button>
          );
        })}
      </div>

      <div className="border-t border-hairline p-2">
        {SECONDARY.map((item) => {
          const Icon = item.icon;
          return (
            <button
              key={item.id}
              type="button"
              role="menuitem"
              onClick={() => pick(item.id)}
              className={cn(
                'flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left hover:bg-cloud'
              )}
            >
              <span
                className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md"
                style={{ backgroundColor: `${item.color}18`, color: item.color }}
              >
                <Icon className="h-3.5 w-3.5" />
              </span>
              <span className="text-sm font-medium text-ink">{item.label}</span>
            </button>
          );
        })}
      </div>

      <div className="border-t border-hairline p-2">
        {FOOTER.map((item) => {
          const Icon = item.icon;
          return (
            <button
              key={item.id}
              type="button"
              role="menuitem"
              onClick={() => pick(item.id)}
              className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left hover:bg-cloud"
            >
              <Icon className="h-4 w-4 text-graphite" />
              <span className="text-sm font-medium text-ink">{item.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
