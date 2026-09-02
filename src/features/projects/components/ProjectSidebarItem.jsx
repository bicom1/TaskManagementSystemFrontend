import { useEffect, useRef, useState } from 'react';
import { NavLink } from 'react-router-dom';
import { MoreHorizontal, Star } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { projectPath } from '@/features/spaces/spaceKinds';
import { useProjectFavoritesStore } from '../projectFavoritesStore';
import { ProjectContextMenu } from './ProjectContextMenu';

export function ProjectSidebarItem({
  project,
  canManage: canManageProp,
  isActive,
  activeClassName = 'bg-[var(--color-surface-2)] font-semibold text-[var(--color-text-primary)]',
  idleClassName = 'text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-1)] hover:text-[var(--color-text-primary)]',
  onRename,
  onEdit,
  onUpdate,
  onDelete,
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);
  const canManage = canManageProp ?? Boolean(project?.canManage);
  const isFavorite = useProjectFavoritesStore((s) => s.isFavorite(project._id));
  const toggleFavorite = useProjectFavoritesStore((s) => s.toggleFavorite);

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

  const closeMenu = () => setMenuOpen(false);

  const copyProjectLink = async () => {
    const url = `${window.location.origin}${projectPath(project._id)}`;
    try {
      await navigator.clipboard.writeText(url);
      toast.success('Project link copied');
    } catch {
      toast.error('Could not copy link');
    }
    closeMenu();
  };

  return (
    <div className="group relative flex items-center gap-0.5">
      <NavLink
        to={projectPath(project._id)}
        className={cn(
          'flex min-w-0 flex-1 items-center gap-2.5 rounded-lg px-2.5 py-[7px] text-[13px] font-medium transition-colors',
          isActive ? activeClassName : idleClassName
        )}
      >
        <span
          className="flex h-4 w-4 shrink-0 items-center justify-center rounded text-[10px] font-bold text-white shadow-2xs"
          style={{ backgroundColor: project.color || '#4f46e5' }}
        >
          {(project.icon || project.name?.[0] || 'P').toString().slice(0, 1)}
        </span>
        <span className="min-w-0 flex-1 truncate">{project.name}</span>
        {isFavorite && (
          <Star className="h-3 w-3 shrink-0 fill-amber-400 text-amber-400" aria-label="Favorite" />
        )}
        {project.openTaskCount > 0 && (
          <span className="flex shrink-0 items-center justify-center rounded-md bg-[var(--color-surface-2)] px-1.5 py-0.5 text-[10.5px] font-semibold tabular-nums text-[var(--color-text-secondary)]">
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
              'flex h-7 w-7 items-center justify-center rounded-md text-[var(--color-text-muted)] transition hover:bg-[var(--color-surface-1)] hover:text-[var(--color-text-primary)]',
              menuOpen ? 'opacity-100' : 'opacity-0 group-hover:opacity-100 focus:opacity-100'
            )}
            aria-label={`Project options for ${project.name}`}
          >
            <MoreHorizontal className="h-4 w-4" />
          </button>

          {menuOpen && (
            <ProjectContextMenu
              isFavorite={isFavorite}
              onFavorite={() => {
                toggleFavorite(project._id);
                toast.success(isFavorite ? 'Removed from favorites' : 'Added to favorites');
                closeMenu();
              }}
              onRename={() => {
                closeMenu();
                onRename?.(project);
              }}
              onCopyLink={copyProjectLink}
              onEdit={() => {
                closeMenu();
                onEdit?.(project);
              }}
              onUpdate={() => {
                closeMenu();
                onUpdate?.(project);
              }}
              onDelete={() => {
                closeMenu();
                onDelete?.(project);
              }}
            />
          )}
        </div>
      )}
    </div>
  );
}
