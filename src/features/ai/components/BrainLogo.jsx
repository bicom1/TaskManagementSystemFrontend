import { cn } from '@/lib/utils';

/** Colorful flower mark inspired by ClickUp Brain */
export function BrainLogo({ className, size = 40 }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 40 40"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn('shrink-0', className)}
      aria-hidden
    >
      <circle cx="20" cy="20" r="6" fill="#7B61FF" />
      <ellipse cx="20" cy="9" rx="5" ry="7" fill="#FF6B9D" />
      <ellipse cx="31" cy="15" rx="5" ry="7" transform="rotate(60 31 15)" fill="#FFB347" />
      <ellipse cx="31" cy="25" rx="5" ry="7" transform="rotate(120 31 25)" fill="#4ECDC4" />
      <ellipse cx="20" cy="31" rx="5" ry="7" fill="#A78BFA" />
      <ellipse cx="9" cy="25" rx="5" ry="7" transform="rotate(60 9 25)" fill="#F472B6" />
      <ellipse cx="9" cy="15" rx="5" ry="7" transform="rotate(120 9 15)" fill="#60A5FA" />
    </svg>
  );
}

export function BrainWordmark({ className }) {
  return (
    <span className={cn('inline-flex items-center gap-2', className)}>
      <BrainLogo size={36} />
      <span className="text-[28px] font-bold tracking-[-0.03em] text-gray-900">
        Brain<span className="text-[0.65em] align-super text-gray-500">²</span>
      </span>
    </span>
  );
}
