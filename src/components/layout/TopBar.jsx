import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Bell, LogOut, Menu, Plus, Search, Settings, User, UserPlus } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { useLogout } from '@/features/auth/hooks/useAuth';
import { useUnreadCount, useLiveNotifications } from '@/features/notifications/hooks/useNotifications';
import { useLiveMessages } from '@/features/messages/hooks/useMessages';
import { useLiveChatNotifications } from '@/features/chat/hooks/useChat';
import { unlockNotifySound } from '@/lib/notifySound';
import { hasPermission, PERMISSIONS } from '@/lib/permissions';
import { canInvite } from '@/lib/roles';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { cn } from '@/lib/utils';

/**
 * TopBar — BIWORKSPACE Design System
 *
 * Premium frosted-glass header with:
 * - Search bar with ⌘K keyboard shortcut hint
 * - Animated notification bell with unread dot
 * - User avatar dropdown with profile info
 */
export function TopBar({ onMenuClick, onInvite, onCreate }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [search, setSearch] = useState('');
  const user = useAuthStore((s) => s.user);
  const logout = useLogout();
  const navigate = useNavigate();
  const { data: unreadCount = 0 } = useUnreadCount();

  useLiveNotifications();
  useLiveMessages();
  useLiveChatNotifications();

  useEffect(() => {
    unlockNotifySound();
  }, []);

  const showInvite = canInvite(user?.role) || hasPermission(user, PERMISSIONS.USER_INVITE);

  // User initials for avatar
  const initials = user?.name
    ? user.name.split(' ').map((n) => n[0]).slice(0, 2).join('').toUpperCase()
    : 'U';

  return (
    <header className="flex h-12 shrink-0 items-center gap-2.5 border-b border-border-subtle bg-surface-0/90 backdrop-blur-md px-3 lg:px-5">
      {/* Mobile menu toggle */}
      <button
        type="button"
        className="flex h-8 w-8 items-center justify-center rounded-lg border border-border-subtle text-text-secondary transition-all duration-[120ms] hover:bg-surface-2 hover:text-text-primary lg:hidden"
        onClick={onMenuClick}
        aria-label="Open sidebar"
      >
        <Menu className="h-4 w-4" />
      </button>

      {/* Search */}
      <div className="relative hidden flex-1 sm:block sm:max-w-xs">
        <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-text-muted pointer-events-none" />
        <Input
          placeholder="Search…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="h-8 rounded-lg border-border-subtle bg-surface-1 pl-8 pr-14 text-[13px] placeholder:text-text-muted hover:border-border-base focus-visible:bg-surface-0"
        />
        <kbd className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 hidden h-5 select-none items-center gap-0.5 rounded-md border border-border-subtle bg-surface-2 px-1.5 text-[10px] font-semibold text-text-muted sm:flex">
          ⌘K
        </kbd>
      </div>

      {/* Right actions */}
      <div className="ml-auto flex items-center gap-1.5">
        {/* Create button */}
        {onCreate && (
          <Button
            size="sm"
            className="hidden h-7 rounded-lg text-[12px] gap-1.5 sm:inline-flex"
            onClick={onCreate}
          >
            <Plus className="h-3.5 w-3.5" />
            Create
          </Button>
        )}

        {/* Invite button (desktop) */}
        {showInvite && (
          <Button
            variant="outline"
            size="sm"
            className="hidden h-7 rounded-lg text-[12px] gap-1.5 sm:inline-flex"
            onClick={onInvite}
          >
            <UserPlus className="h-3.5 w-3.5" />
            Invite
          </Button>
        )}

        {/* Invite icon (mobile) */}
        {showInvite && (
          <button
            type="button"
            onClick={onInvite}
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-border-subtle text-text-secondary transition-all duration-[120ms] hover:bg-surface-2 hover:text-text-primary sm:hidden"
            aria-label="Invite"
          >
            <UserPlus className="h-4 w-4" />
          </button>
        )}

        {/* Notifications bell */}
        <Link
          to="/inbox?tab=notifications"
          className="relative flex h-8 w-8 items-center justify-center rounded-lg border border-border-subtle text-text-secondary transition-all duration-[120ms] hover:bg-surface-2 hover:text-text-primary"
          aria-label={`Notifications${unreadCount > 0 ? `, ${unreadCount} unread` : ''}`}
        >
          <Bell className="h-4 w-4" />
          {unreadCount > 0 && (
            <span
              aria-hidden
              className={cn(
                'absolute -right-0.5 -top-0.5',
                'flex h-4 min-w-[16px] items-center justify-center rounded-full px-1',
                'bg-brand-500 text-[9px] font-bold text-white',
                'border-2 border-surface-0',
                'shadow-[0_2px_8px_rgba(99,102,241,0.5)]',
              )}
            >
              {unreadCount > 99 ? '99+' : unreadCount}
            </span>
          )}
        </Link>

        {/* User menu */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setMenuOpen(!menuOpen)}
            className={cn(
              'flex h-8 items-center gap-2 rounded-lg border border-border-subtle px-1.5 pr-2',
              'transition-all duration-[120ms]',
              'hover:bg-surface-2 hover:border-border-base',
              menuOpen && 'bg-surface-2 border-border-base'
            )}
          >
            {/* Gradient avatar */}
            <div
              className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-[10px] font-bold text-white shadow-sm"
              style={{
                background: 'linear-gradient(135deg, var(--color-brand-500), var(--color-brand-700))',
              }}
            >
              {initials}
            </div>
            <span className="hidden max-w-[100px] truncate text-[13px] font-medium text-text-primary md:inline">
              {user?.name}
            </span>
          </button>

          {menuOpen && (
            <>
              {/* Backdrop */}
              <div className="fixed inset-0 z-40" onClick={() => setMenuOpen(false)} />

              {/* Dropdown */}
              <div className="absolute right-0 z-50 mt-1.5 w-56 overflow-hidden rounded-xl border border-border-subtle bg-surface-0 shadow-[0_16px_48px_rgba(13,13,20,0.16)] animate-[scaleIn_120ms_cubic-bezier(0.34,1.56,0.64,1)_both] origin-top-right">
                {/* Profile header */}
                <div className="border-b border-border-subtle bg-surface-1 px-4 py-3">
                  <p className="truncate text-[13px] font-semibold text-text-primary">{user?.name}</p>
                  <p className="truncate text-[11px] text-text-muted">{user?.email}</p>
                </div>

                {/* Menu items */}
                <div className="py-1">
                  <button
                    type="button"
                    onClick={() => { setMenuOpen(false); navigate('/settings'); }}
                    className="flex w-full items-center gap-2.5 px-4 py-2 text-[13px] text-text-secondary transition-colors hover:bg-surface-1 hover:text-text-primary"
                  >
                    <Settings className="h-4 w-4 opacity-70" />
                    Settings
                  </button>
                  <button
                    type="button"
                    onClick={() => { setMenuOpen(false); logout.mutate(); }}
                    className="flex w-full items-center gap-2.5 px-4 py-2 text-[13px] text-danger-text transition-colors hover:bg-danger-bg"
                  >
                    <LogOut className="h-4 w-4 opacity-70" />
                    Sign out
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
