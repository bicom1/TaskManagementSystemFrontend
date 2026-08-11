import { Link } from 'react-router-dom';
import { cn } from '@/lib/utils';

/**
 * BIWORKSPACE Brand Logo
 * Used in Sidebar, Navbar, Auth Pages, etc.
 */
export function BrandLogo({
  collapsed = false,
  size = 'md',
  className,
  showWordmark = true,
  asLink = true,
}) {
  const markSize =
    size === 'lg'
      ? 'h-10 w-10'
      : size === 'sm'
      ? 'h-7 w-7'
      : 'h-8 w-8';

  const wordSize =
    size === 'lg'
      ? 'text-base'
      : size === 'sm'
      ? 'text-sm'
      : 'text-[15px]';

  const content = (
    <span
      className={cn(
        'inline-flex items-center gap-2.5 overflow-hidden',
        className
      )}
    >
      {/* Logo Icon */}
      <span
        className={cn(
          'inline-flex shrink-0 items-center justify-center rounded-lg bg-primary text-white shadow-md',
          markSize
        )}
        aria-hidden
      >
        <svg
          viewBox="0 0 32 32"
          className="h-[70%] w-[70%]"
          xmlns="http://www.w3.org/2000/svg"
        >
          <text
            x="16"
            y="21"
            textAnchor="middle"
            fontSize="16"
            fontWeight="800"
            fontFamily="Inter, Arial, sans-serif"
            fill="currentColor"
          >
            BI
          </text>
        </svg>
      </span>

      {/* Brand Name */}
      {showWordmark && !collapsed && (
        <span
          className={cn(
            'truncate font-semibold tracking-tight text-ink',
            wordSize
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
      className="outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-md"
      aria-label="BIWORKSPACE Home"
    >
      {content}
    </Link>
  );
}

export default BrandLogo;