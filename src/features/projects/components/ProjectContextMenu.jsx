import {
  ChevronRight,
  Link2,
  Pencil,
  RefreshCw,
  SquarePen,
  Star,
  Trash2,
} from 'lucide-react';
import { cn } from '@/lib/utils';

function MenuItem({ icon: Icon, label, onClick, danger, hint, showChevron, iconClassName }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'flex w-full items-center gap-2.5 px-3 py-2 text-left text-[13px] transition',
        danger
          ? 'text-red-600 hover:bg-red-50'
          : 'text-gray-800 hover:bg-gray-50'
      )}
    >
      <Icon className={cn('h-4 w-4 shrink-0', danger ? 'text-red-500' : 'text-gray-500', iconClassName)} />
      <span className="min-w-0 flex-1">
        <span className="block font-medium">{label}</span>
        {hint && <span className="mt-0.5 block text-[11px] font-normal text-gray-400">{hint}</span>}
      </span>
      {showChevron && <ChevronRight className="h-4 w-4 shrink-0 text-gray-300" />}
    </button>
  );
}

function MenuDivider() {
  return <div className="my-1 border-t border-gray-100" />;
}

export function ProjectContextMenu({
  isFavorite,
  onFavorite,
  onRename,
  onCopyLink,
  onEdit,
  onUpdate,
  onDelete,
}) {
  return (
    <div className="absolute right-0 z-50 mt-1 w-56 overflow-hidden rounded-xl border border-gray-200 bg-white py-1 shadow-lg">
      <MenuItem
        icon={Star}
        label={isFavorite ? 'Remove favorite' : 'Favorite'}
        onClick={onFavorite}
        showChevron={!isFavorite}
        iconClassName={isFavorite ? 'fill-amber-400 text-amber-400' : undefined}
        hint={isFavorite ? 'Pinned to top of sidebar' : undefined}
      />
      <MenuItem icon={Pencil} label="Rename" onClick={onRename} />
      <MenuItem icon={Link2} label="Copy link" onClick={onCopyLink} />

      <MenuDivider />

      <MenuItem icon={SquarePen} label="Edit" onClick={onEdit} />
      <MenuItem icon={RefreshCw} label="Update" onClick={onUpdate} />

      <MenuDivider />

      <MenuItem icon={Trash2} label="Delete" onClick={onDelete} danger />
    </div>
  );
}
