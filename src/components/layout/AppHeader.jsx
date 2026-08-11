import { Link } from 'react-router-dom';
import { BrandLogo } from '@/components/BrandLogo';
import { cn } from '@/lib/utils';

/** Legacy top nav — kept for compatibility; AppShell uses TopBar + Sidebar */
export function AppHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-hairline bg-canvas">
      <div className="mx-auto flex h-14 max-w-[1366px] items-center px-4 lg:px-8">
        <BrandLogo />
      </div>
    </header>
  );
}

export function HeaderLink({ to, children, className }) {
  return (
    <Link to={to} className={cn('text-sm font-medium text-ink hover:text-primary', className)}>
      {children}
    </Link>
  );
}
