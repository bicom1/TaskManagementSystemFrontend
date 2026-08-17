import { useState } from 'react';
import { getAvatarColor, getInitials } from '@/lib/avatar';
import { cn } from '@/lib/utils';

const SIZE_CLASS = {
  xs: 'h-5 w-5 text-[9px]',
  sm: 'h-7 w-7 text-[10px]',
  md: 'h-9 w-9 text-xs',
  lg: 'h-10 w-10 text-sm',
  xl: 'h-16 w-16 text-xl',
  '2xl': 'h-20 w-20 text-2xl',
};

const RADIUS_CLASS = {
  full: 'rounded-full',
  md: 'rounded-md',
  lg: 'rounded-lg',
  xl: 'rounded-xl',
  none: 'rounded-none',
};

/**
 * Shows Google/profile photo when avatarUrl is set; otherwise colored initials.
 */
export function UserAvatar({
  user,
  name,
  avatarUrl,
  seed,
  size = 'md',
  className,
  rounded = 'full',
  title,
}) {
  const displayName = name || user?.name || '?';
  const photo = avatarUrl ?? user?.avatarUrl ?? null;
  const colorSeed = seed || user?._id || user?.email || displayName;
  const [imgFailed, setImgFailed] = useState(false);

  const sizeClass = SIZE_CLASS[size] || SIZE_CLASS.md;
  const radiusClass = RADIUS_CLASS[rounded] || RADIUS_CLASS.full;
  const label = title || displayName;

  if (photo && !imgFailed) {
    return (
      <img
        src={photo}
        alt={displayName}
        title={label}
        referrerPolicy="no-referrer"
        className={cn(sizeClass, radiusClass, 'shrink-0 object-cover bg-cloud', className)}
        onError={() => setImgFailed(true)}
      />
    );
  }

  return (
    <div
      className={cn(
        sizeClass,
        radiusClass,
        'inline-flex shrink-0 items-center justify-center font-bold text-white',
        className
      )}
      style={{ backgroundColor: getAvatarColor(colorSeed) }}
      title={label}
    >
      {getInitials(displayName)}
    </div>
  );
}
