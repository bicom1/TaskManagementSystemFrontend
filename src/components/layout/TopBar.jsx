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
        className="flex h-10 w-10 items-center justify-center rounded-md border border-hairline text-ink hover:bg-cloud lg:hidden"
        onClick={onMenuClick}
        aria-label="Open sidebar"
      >
        <Menu className="h-5 w-5" />
      </button>

      <div className="relative hidden flex-1 sm:block sm:max-w-md">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-graphite" />
        <Input
          placeholder="Search Ctrl K"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="h-10 border-hairline pl-9"
        />
      </div>

      <div className="ml-auto flex items-center gap-1.5 sm:gap-2">
        {onCreate && (
          <Button
            size="sm"
            className="hidden normal-case tracking-normal sm:inline-flex"
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
            className="hidden normal-case tracking-normal sm:inline-flex"
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
            className="flex h-10 w-10 items-center justify-center rounded-md border border-hairline text-ink hover:bg-cloud sm:hidden"
            aria-label="Invite"
          >
            <UserPlus className="h-5 w-5" />
          </button>
        )}

        <Link
          to="/inbox"
          className="relative flex h-10 w-10 items-center justify-center rounded-md border border-hairline text-ink hover:bg-cloud"
          aria-label="Inbox"
        >
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <span className="absolute right-1.5 top-1.5 flex h-4 min-w-4 items-center justify-center rounded-sm border border-primary bg-primary px-1 text-[10px] font-bold text-on-ink">
              {unreadCount > 99 ? '99+' : unreadCount}
            </span>
          )}
        </Link>

        <div className="relative">
          <button
            type="button"
            onClick={() => setMenuOpen(!menuOpen)}
            className="flex h-10 items-center gap-2 rounded-md border border-hairline px-2 hover:bg-cloud"
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-[4px] border border-hairline bg-fog text-ink">
              <User className="h-4 w-4" />
            </div>
            <span className="hidden max-w-[120px] truncate text-sm font-medium text-ink md:inline">
              {user?.name}
            </span>
          </button>
          {menuOpen && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setMenuOpen(false)} />
              <div className="absolute right-0 z-50 mt-1 w-56 rounded-xl border border-hairline bg-paper py-1 shadow-[var(--shadow-soft-lift)]">
                <div className="border-b border-hairline px-4 py-3">
                  <p className="text-sm font-medium text-ink">{user?.name}</p>
                  <p className="text-xs text-graphite">{user?.email}</p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setMenuOpen(false);
                    navigate('/settings');
                  }}
                  className="flex w-full px-4 py-2.5 text-left text-sm text-charcoal hover:bg-cloud"
                >
                  Settings
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setMenuOpen(false);
                    logout.mutate();
                  }}
                  className="flex w-full items-center gap-2 px-4 py-2.5 text-sm text-charcoal hover:bg-cloud"
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
