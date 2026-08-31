import { Link } from 'react-router-dom';
import { cn } from '@/lib/utils';

/**
 * BrandLogo — BIWORKSPACE Design System
 *
 * Props:
 *   collapsed    — boolean — hide wordmark when sidebar is narrow
 *   size         — 'sm' | 'md' | 'lg'
 *   className    — wrapper className
 *   showWordmark — boolean (default true)
 *   asLink       — boolean (default true) — wraps in <Link to="/">
 *   dark         — boolean — use light text for dark backgrounds (sidebar)
 */
export function BrandLogo({
  collapsed = false,
  size = 'md',
  className,
  showWordmark = true,
  asLink = true,
  dark = false,
}) {
  const markSize =
    size === 'lg' ? 'h-9 w-9'
    : size === 'sm' ? 'h-6 w-6'
    : 'h-7 w-7';

  const wordSize =
    size === 'lg' ? 'text-base'
    : size === 'sm' ? 'text-[13px]'
    : 'text-[14px]';

  const content = (
    <span className={cn('inline-flex items-center gap-2.5 overflow-hidden', className)}>
      {/* Gradient logo mark */}
      <span
        className={cn(
          'inline-flex shrink-0 items-center justify-center rounded-lg shadow-md',
          'bg-gradient-to-br from-brand-500 to-brand-700',
          markSize
        )}
        aria-hidden
      >
        <svg viewBox="0 0 32 32" className="h-[68%] w-[68%]" xmlns="http://www.w3.org/2000/svg">
          <text
            x="16" y="21"
            textAnchor="middle"
            fontSize="15"
            fontWeight="800"
            fontFamily="Inter, Arial, sans-serif"
            fill="white"
            letterSpacing="-0.5"
          >
            BI
          </text>
        </svg>
      </span>

      {/* Wordmark */}
      {showWordmark && !collapsed && (
        <span
          className={cn(
            'truncate font-bold tracking-tight',
            wordSize,
            dark ? 'text-[var(--color-sidebar-text-active)]' : 'text-text-primary'
          )}
        >
          BIWORKSPACE
        </span>
      )}
    </span>
  );

  if (!asLink) return content;

  return (
    <Link
      to="/"
      className="rounded-md outline-none focus-visible:ring-2 focus-visible:ring-brand-400"
      aria-label="BIWORKSPACE Home"
    >
      {content}
    </Link>
  );
}

export default BrandLogo;