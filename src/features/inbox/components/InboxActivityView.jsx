import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Bell,
  CheckCheck,
  Clock,
  Filter,
  Inbox,
  Layers,
  List,
  Settings,
} from 'lucide-react';
import {
  useMarkAllRead,
  useMarkOneRead,
  useNotifications,
} from '@/features/notifications/hooks/useNotifications';
import { LoadingScreen, EmptyState } from '@/components/ui/Spinner';
import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/utils';
import { getSocket } from '@/api/socketClient';
import { groupFeedByTime } from '../inboxUtils';
import { inboxItemKey, useInboxTriageStore } from '../inboxTriageStore';
import { useInboxPreferencesStore } from '../inboxPreferencesStore';
import { getTaskHref, useInboxFeed } from '../hooks/useInboxFeed';
import { InboxActivityRow } from './InboxActivityRow';
import { CustomizeInboxModal } from './CustomizeInboxModal';

const BASE_TABS = [
  { id: 'primary', label: 'Primary', icon: Inbox },
  { id: 'other', label: 'Other', icon: Layers },
  { id: 'later', label: 'Later', icon: Clock },
  { id: 'cleared', label: 'Cleared', icon: CheckCheck },
];

function FlatList({ items, onOpen, onClear, clearTitle }) {
  return items.map((item) => (
    <InboxActivityRow
      key={item.id}
      item={item}
      onOpen={onOpen}
      onClear={onClear}
      clearTitle={clearTitle}
    />
  ));
}

function TimeGroup({ label, items, onOpen, onClear, clearTitle }) {
  if (!items.length) return null;
  return (
    <div>
      <p className="px-4 py-2 text-[11px] font-semibold uppercase tracking-wide text-gray-400">
        {label}
      </p>
      {items.map((item) => (
        <InboxActivityRow
          key={item.id}
          item={item}
          onOpen={onOpen}
          onClear={onClear}
          clearTitle={clearTitle}
        />
      ))}
    </div>
  );
}

export function InboxActivityView({ bucket: bucketProp, repliesOnly = false }) {
  const navigate = useNavigate();
  const [activeBucket, setActiveBucket] = useState(bucketProp || 'primary');
  const [filterOpen, setFilterOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [taskFilter, setTaskFilter] = useState('all');
  const [selectedIndex, setSelectedIndex] = useState(0);

  const overrides = useInboxTriageStore((s) => s.overrides);
  const setBucket = useInboxTriageStore((s) => s.setBucket);
  const setManyBuckets = useInboxTriageStore((s) => s.setManyBuckets);

  const showAllTab = useInboxPreferencesStore((s) => s.showAllTab);
  const groupByDate = useInboxPreferencesStore((s) => s.groupByDate);
  const sortNewestFirst = useInboxPreferencesStore((s) => s.sortNewestFirst);
  const importantTypes = useInboxPreferencesStore((s) => s.importantTypes);

  const { data, isLoading, refetch } = useNotifications({ limit: 150 });
  const markOneRead = useMarkOneRead();
  const markAllRead = useMarkAllRead();

  const notifications = data?.data ?? [];
  const { byBucket, tabStats, tasksLoading } = useInboxFeed(notifications, overrides, {
    repliesOnly,
    tasksOnly: taskFilter === 'tasks',
    importantTypes,
    sortNewestFirst,
  });

  const tabs = useMemo(() => {
    const list = [...BASE_TABS];
    if (showAllTab) list.unshift({ id: 'all', label: 'All', icon: List });
    return list;
  }, [showAllTab]);

  const visible = byBucket[activeBucket] || [];
  const groups = groupFeedByTime(visible);

  useEffect(() => {
    setSelectedIndex(0);
  }, [activeBucket, visible.length]);

  const openItem = (item) => {
    if (!item.isSynthetic && !item.isRead && item.notification?._id) {
      markOneRead.mutate(item.notification._id);
    }
    // Primary → Other once opened (ClickUp-style)
    if (activeBucket === 'primary') {
      setBucket(inboxItemKey(item), 'other');
    }
    const href = getTaskHref(item);
    if (href) navigate(href);
  };

  const dismissTargetForTab = (tab) => {
    if (tab === 'primary') return 'other';
    if (tab === 'other') return 'cleared';
    if (tab === 'later') return 'cleared';
    return 'cleared';
  };

  const clearActionTitle =
    activeBucket === 'primary'
      ? 'Move to Other'
      : activeBucket === 'other' || activeBucket === 'later'
        ? 'Clear notification'
        : 'Clear notification';

  const clearOne = (item) => {
    setBucket(inboxItemKey(item), dismissTargetForTab(activeBucket));
    if (!item.isSynthetic && !item.isRead && item.notification?._id) {
      markOneRead.mutate(item.notification._id);
    }
  };

  const clearAllVisible = () => {
    const keys = visible.map((item) => inboxItemKey(item));
    if (!keys.length) return;
    const target = dismissTargetForTab(activeBucket);
    setManyBuckets(keys, target);
    if (visible.some((i) => !i.isSynthetic && !i.isRead && i.notification?._id)) {
      markAllRead.mutate();
    }
  };

  const moveAllToLater = () => {
    const keys = visible.map((item) => inboxItemKey(item));
    setManyBuckets(keys, 'later');
  };

  useEffect(() => {
    const socket = getSocket();
    if (!socket) return undefined;
    const refresh = () => refetch();
    socket.on('task:created', refresh);
    socket.on('task:updated', refresh);
    return () => {
      socket.off('task:created', refresh);
      socket.off('task:updated', refresh);
    };
  }, [refetch]);

  useEffect(() => {
    const onKeyDown = (e) => {
      if (e.target?.tagName === 'INPUT' || e.target?.tagName === 'TEXTAREA') return;

      if (e.key === '?' && !e.metaKey && !e.ctrlKey) {
        e.preventDefault();
        setSettingsOpen(true);
        return;
      }

      const tabIndex = tabs.findIndex((t) => t.id === activeBucket);
      if (e.key >= '1' && e.key <= String(Math.min(9, tabs.length))) {
        const idx = Number(e.key) - 1;
        if (tabs[idx]) {
          e.preventDefault();
          setActiveBucket(tabs[idx].id);
        }
        return;
      }

      if (!visible.length) return;
      const item = visible[selectedIndex];

      if (e.key === 'j' || e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex((i) => Math.min(i + 1, visible.length - 1));
      } else if (e.key === 'k' || e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex((i) => Math.max(i - 1, 0));
      } else if (e.key === 'e' && item) {
        e.preventDefault();
        clearOne(item);
      } else if (e.key === 'o' && item) {
        e.preventDefault();
        openItem(item);
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [tabs, activeBucket, visible, selectedIndex]); // eslint-disable-line react-hooks/exhaustive-deps

  if (isLoading) return <LoadingScreen />;

  const activeStats = tabStats[activeBucket] || { total: 0, unread: 0, tasks: 0 };

  return (
    <>
      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
        <div className="flex items-center gap-0 overflow-x-auto border-b border-gray-200 px-1 pt-1">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const stats = tabStats[tab.id] || { total: 0, unread: 0 };
            const isActive = activeBucket === tab.id;

            let badge = null;
            if (tab.id === 'all' && stats.total > 0) badge = String(stats.total);
            else if (tab.id === 'primary' && stats.unread > 0) badge = `${stats.unread} new`;
            else if (tab.id === 'other' && stats.total > 0) {
              badge = stats.unread > 0 ? `${stats.unread} unread` : `${stats.total}`;
            } else if (tab.id === 'later' && stats.total > 0) badge = String(stats.total);

            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveBucket(tab.id)}
                className={cn(
                  'relative flex shrink-0 items-center gap-2 border-b-2 px-4 py-2.5 text-[13px] font-semibold transition',
                  isActive
                    ? 'border-gray-900 text-gray-900'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                )}
              >
                <Icon className="h-4 w-4" />
                {tab.label}
                {badge && (
                  <span
                    className={cn(
                      'rounded-md px-1.5 py-0.5 text-[10px] font-bold tabular-nums',
                      tab.id === 'primary'
                        ? 'bg-brand-100 text-brand-700'
                        : 'bg-gray-100 text-gray-600'
                    )}
                  >
                    {badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        <div className="flex items-center justify-between border-b border-gray-100 px-3 py-2">
          <div className="flex items-center gap-2">
            <div className="relative">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setFilterOpen((o) => !o)}
                className="h-8 gap-1.5 text-[12px]"
              >
                <Filter className="h-3.5 w-3.5" />
                Filter
              </Button>
              {filterOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setFilterOpen(false)} />
                  <div className="absolute left-0 top-full z-50 mt-1 w-44 rounded-lg border border-gray-200 bg-white py-1 shadow-lg">
                    {[
                      { id: 'tasks', label: 'Tasks only' },
                      { id: 'all', label: 'All activity' },
                    ].map((opt) => (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => {
                          setTaskFilter(opt.id);
                          setFilterOpen(false);
                        }}
                        className={cn(
                          'block w-full px-3 py-2 text-left text-[13px] hover:bg-gray-50',
                          taskFilter === opt.id && 'font-semibold text-brand-600'
                        )}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>
            {tasksLoading && <span className="text-[11px] text-gray-400">Loading tasks…</span>}
            {activeStats.tasks > 0 && (
              <span className="text-[11px] text-gray-500">
                {activeStats.tasks} task{activeStats.tasks === 1 ? '' : 's'}
              </span>
            )}
          </div>

          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => setSettingsOpen(true)}
              className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-600"
              title="Customize Inbox"
            >
              <Settings className="h-4 w-4" />
            </button>
          {activeBucket !== 'cleared' && visible.length > 0 && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={clearAllVisible}
              className="h-8 gap-1.5 text-[12px]"
            >
              <CheckCheck className="h-3.5 w-3.5" />
              {activeBucket === 'primary' ? 'Move all to Other' : 'Clear all'}
            </Button>
          )}
          </div>
        </div>

        {visible.length === 0 ? (
          <EmptyState
            icon={Bell}
            title={
              activeBucket === 'cleared'
                ? 'Nothing cleared yet'
                : activeBucket === 'later'
                  ? 'Nothing saved for later'
                  : activeBucket === 'all'
                    ? 'No activity'
                    : activeBucket === 'other'
                      ? 'No other activity'
                      : 'All caught up'
            }
            description={
              activeBucket === 'primary'
                ? 'Open or dismiss items to move them to Other. Customize importance in settings.'
                : 'Activity from your workspace will show in this tab.'
            }
          />
        ) : (
          <div className="max-h-[min(70vh,720px)] overflow-y-auto">
            {groupByDate ? (
              <>
                <TimeGroup
                  label="Today"
                  items={groups.today}
                  onOpen={openItem}
                  onClear={clearOne}
                  clearTitle={clearActionTitle}
                />
                <TimeGroup
                  label="Yesterday"
                  items={groups.yesterday}
                  onOpen={openItem}
                  onClear={clearOne}
                  clearTitle={clearActionTitle}
                />
                <TimeGroup
                  label="Last 7 days"
                  items={groups.last7}
                  onOpen={openItem}
                  onClear={clearOne}
                  clearTitle={clearActionTitle}
                />
                <TimeGroup
                  label="Older"
                  items={groups.older}
                  onOpen={openItem}
                  onClear={clearOne}
                  clearTitle={clearActionTitle}
                />
              </>
            ) : (
              <FlatList
                items={visible}
                onOpen={openItem}
                onClear={clearOne}
                clearTitle={clearActionTitle}
              />
            )}
          </div>
        )}

        {activeBucket === 'other' && visible.length > 0 && (
          <div className="border-t border-gray-100 px-4 py-2 text-[11px] text-gray-400">
            {visible.length} items in Other ·{' '}
            <button
              type="button"
              className="font-medium text-brand-600 hover:underline"
              onClick={moveAllToLater}
            >
              Move all to Later
            </button>
          </div>
        )}
      </div>

      <CustomizeInboxModal open={settingsOpen} onClose={() => setSettingsOpen(false)} />
    </>
  );
}
