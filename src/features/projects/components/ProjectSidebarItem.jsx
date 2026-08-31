import { useEffect, useRef, useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { Archive, ExternalLink, MoreHorizontal, Pencil, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { projectPath } from '@/features/spaces/spaceKinds';

export function ProjectSidebarItem({
  project,
  isActive,
  activeClassName = 'bg-cloud font-medium text-ink',
  idleClassName = 'text-charcoal hover:bg-cloud/80',
  onEdit,
  onDelete,
  onArchive,
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);
  const navigate = useNavigate();
  const canManage = Boolean(project?.canManage);

  useEffect(() => {
    if (!menuOpen) return undefined;

    const close = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, [menuOpen]);

  const isArchived = project?.status === 'archived';

  return (
    <div className="group relative flex items-center gap-0.5">
      <NavLink
        to={projectPath(project._id)}
        className={cn(
          'flex min-w-0 flex-1 items-center gap-2 rounded-md px-2 py-1.5 text-sm',
          isActive ? activeClassName : idleClassName
        )}
      >
        <span
          className="flex h-5 w-5 shrink-0 items-center justify-center rounded text-[10px] font-bold text-white"
          style={{ backgroundColor: project.color || '#292524' }}
        >
          {(project.icon || project.name?.[0] || 'P').toString().slice(0, 1)}
        </span>
        <span className="min-w-0 flex-1 truncate">{project.name}</span>
        {project.openTaskCount > 0 && (
          <span className="shrink-0 tabular-nums text-[10px] font-semibold text-graphite">
            {project.openTaskCount}
          </span>
        )}
      </NavLink>

      {canManage && (
        <div className="relative shrink-0" ref={menuRef}>
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setMenuOpen((v) => !v);
            }}
            className={cn(
              'flex h-7 w-7 items-center justify-center rounded-md text-graphite transition hover:bg-cloud hover:text-ink',
              menuOpen ? 'opacity-100' : 'opacity-0 group-hover:opacity-100 focus:opacity-100'
            )}
            aria-label={`Project options for ${project.name}`}
          >
            <MoreHorizontal className="h-4 w-4" />
          </button>

          {menuOpen && (
            <div className="absolute right-0 z-50 mt-1 w-44 overflow-hidden rounded-lg border border-hairline bg-paper shadow-[var(--shadow-soft-lift)]">
              <button
                type="button"
                className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-charcoal hover:bg-cloud"
                onClick={() => {
                  setMenuOpen(false);
                  navigate(projectPath(project._id));
                }}
              >
                <ExternalLink className="h-4 w-4 shrink-0" />
                Open project
              </button>
              <button
                type="button"
                className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-charcoal hover:bg-cloud"
                onClick={() => {
                  setMenuOpen(false);
                  onEdit?.(project);
                }}
              >
                <Pencil className="h-4 w-4 shrink-0" />
                Edit project
              </button>
              {!isArchived && (
                <button
                  type="button"
                  className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-charcoal hover:bg-cloud"
                  onClick={() => {
                    setMenuOpen(false);
                    onArchive?.(project);
                  }}
                >
                  <Archive className="h-4 w-4 shrink-0" />
                  Archive
                </button>
              )}
              <button
                type="button"
                className="flex w-full items-center gap-2 border-t border-hairline px-3 py-2 text-left text-sm text-red-600 hover:bg-red-50"
                onClick={() => {
                  setMenuOpen(false);
                  onDelete?.(project);
                }}
              >
                <Trash2 className="h-4 w-4 shrink-0" />
                Delete project
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
