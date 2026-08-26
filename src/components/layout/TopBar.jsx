import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Bell, LogOut, Menu, Plus, Search, User, UserPlus } from 'lucide-react';
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

  const showInvite =
    canInvite(user?.role) || hasPermission(user, PERMISSIONS.USER_INVITE);

  return (
    <header className="flex h-14 shrink-0 items-center gap-3 border-b border-hairline bg-paper px-3 lg:px-5">
      <button
        type="button"
        className="flex h-9 w-9 items-center justify-center rounded-lg border border-hairline text-ink transition hover:bg-cloud lg:hidden"
        onClick={onMenuClick}
        aria-label="Open sidebar"
      >
        <Menu className="h-5 w-5" />
      </button>

      <div className="relative hidden flex-1 sm:block sm:max-w-md">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-graphite" />
        <Input
          placeholder="Search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="h-9 rounded-lg border-hairline bg-cloud/50 pl-9 text-sm placeholder:text-graphite focus-visible:bg-paper"
        />
      </div>

      <div className="ml-auto flex items-center gap-1.5 sm:gap-2">
        {onCreate && (
          <Button
            size="sm"
            className="hidden h-8 rounded-lg normal-case tracking-normal sm:inline-flex"
            onClick={onCreate}
          >
            <Plus className="h-4 w-4" />
            Create
          </Button>
        )}
        {showInvite && (
          <Button
            variant="outline"
            size="sm"
            className="hidden h-8 rounded-lg normal-case tracking-normal sm:inline-flex"
            onClick={onInvite}
          >
            <UserPlus className="h-4 w-4" />
            Invite
          </Button>
        )}
        {showInvite && (
          <button
            type="button"
            onClick={onInvite}
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-hairline text-ink transition hover:bg-cloud sm:hidden"
            aria-label="Invite"
          >
            <UserPlus className="h-5 w-5" />
          </button>
        )}

        <Link
          to="/inbox?tab=notifications"
          className="relative flex h-9 w-9 items-center justify-center rounded-lg border border-hairline text-ink transition hover:bg-cloud"
          aria-label="Notifications"
        >
          <Bell className="h-4 w-4" />
          {unreadCount > 0 && (
            <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-md border border-paper bg-primary px-1 text-[10px] font-bold text-on-ink">
              {unreadCount > 99 ? '99+' : unreadCount}
            </span>
          )}
        </Link>

        <div className="relative">
          <button
            type="button"
            onClick={() => setMenuOpen(!menuOpen)}
            className="flex h-9 items-center gap-2 rounded-lg border border-hairline px-1.5 pr-2.5 transition hover:bg-cloud"
          >
            <div className="flex h-7 w-7 items-center justify-center rounded-md bg-primary-soft text-primary-deep">
              <User className="h-3.5 w-3.5" />
            </div>
            <span className="hidden max-w-[120px] truncate text-sm font-medium text-ink md:inline">
              {user?.name}
            </span>
          </button>
          {menuOpen && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setMenuOpen(false)} />
              <div className="absolute right-0 z-50 mt-1.5 w-56 overflow-hidden rounded-2xl border border-hairline bg-paper py-1 shadow-[0_12px_40px_rgba(26,26,26,0.12)]">
                <div className="border-b border-hairline bg-cloud/40 px-4 py-3">
                  <p className="text-sm font-semibold text-ink">{user?.name}</p>
                  <p className="text-xs text-graphite">{user?.email}</p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setMenuOpen(false);
                    navigate('/settings');
                  }}
                  className="flex w-full px-4 py-2.5 text-left text-sm text-charcoal transition hover:bg-cloud"
                >
                  Settings
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setMenuOpen(false);
                    logout.mutate();
                  }}
                  className="flex w-full items-center gap-2 px-4 py-2.5 text-sm text-charcoal transition hover:bg-cloud"
                >
                  <LogOut className="h-4 w-4" />
                  Sign out
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
