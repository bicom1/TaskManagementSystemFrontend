import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowDownWideNarrow,
  Check,
  ChevronRight,
  Command,
  Eye,
  Layers,
  Settings2,
  SlidersHorizontal,
  X,
} from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { cn } from '@/lib/utils';
import { useInboxPreferencesStore } from '../inboxPreferencesStore';
import {
  countImportantTypes,
  INBOX_NOTIFICATION_TYPES,
} from '../inboxNotificationTypes';

function Toggle({ checked, onChange, label }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={() => onChange(!checked)}
      className={cn(
        'relative h-6 w-11 shrink-0 rounded-full transition-colors',
        checked ? 'bg-brand-600' : 'bg-gray-200'
      )}
    >
      <span
        className={cn(
          'absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform',
          checked && 'translate-x-5'
        )}
      />
    </button>
  );
}

function SettingRow({ icon: Icon, label, checked, onChange }) {
  return (
    <div className="flex items-center justify-between gap-3 px-4 py-3">
      <div className="flex items-center gap-3">
        <Icon className="h-4 w-4 text-gray-500" />
        <span className="text-[14px] font-medium text-gray-900">{label}</span>
      </div>
      <Toggle checked={checked} onChange={onChange} label={label} />
    </div>
  );
}

function DisplayModeCard({ mode, label, selected, onSelect, children }) {
  return (
    <button
      type="button"
      onClick={() => onSelect(mode)}
      className={cn(
        'relative flex flex-1 flex-col overflow-hidden rounded-xl border-2 p-3 text-left transition',
        selected ? 'border-gray-900 bg-gray-50' : 'border-gray-200 hover:border-gray-300'
      )}
    >
      <div className="mb-2 flex h-20 items-center justify-center rounded-lg bg-gray-100">
        {children}
      </div>
      <span className="text-[13px] font-semibold text-gray-900">{label}</span>
      <span
        className={cn(
          'absolute right-2 top-2 flex h-5 w-5 items-center justify-center rounded-full border-2',
          selected ? 'border-gray-900 bg-gray-900 text-white' : 'border-gray-300 bg-white'
        )}
      >
        {selected && <Check className="h-3 w-3" />}
      </span>
    </button>
  );
}

function ImportanceModal({ open, onClose }) {
  const importantTypes = useInboxPreferencesStore((s) => s.importantTypes);
  const toggleImportantType = useInboxPreferencesStore((s) => s.toggleImportantType);
  const setAllImportant = useInboxPreferencesStore((s) => s.setAllImportant);
  const resetImportantTypes = useInboxPreferencesStore((s) => s.resetImportantTypes);

  const groups = INBOX_NOTIFICATION_TYPES.reduce((acc, t) => {
    if (!acc[t.group]) acc[t.group] = [];
    acc[t.group].push(t);
    return acc;
  }, {});

  const { enabled, total } = countImportantTypes(importantTypes);

  return (
    <Modal open={open} onClose={onClose} title="Customize importance" size="md">
      <div className="space-y-4">
        <div className="flex items-center justify-between rounded-lg bg-gray-50 px-3 py-2 text-[13px]">
          <span className="text-gray-600">
            <strong className="text-gray-900">{enabled}</strong> of {total} marked important
          </span>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setAllImportant(true)}
              className="text-brand-600 hover:underline"
            >
              All
            </button>
            <button
              type="button"
              onClick={() => setAllImportant(false)}
              className="text-gray-500 hover:underline"
            >
              None
            </button>
            <button
              type="button"
              onClick={resetImportantTypes}
              className="text-gray-500 hover:underline"
            >
              Reset
            </button>
          </div>
        </div>

        <div className="max-h-[50vh] space-y-4 overflow-y-auto pr-1">
          {Object.entries(groups).map(([group, types]) => (
            <div key={group}>
              <p className="mb-1 px-1 text-[11px] font-semibold uppercase tracking-wide text-gray-400">
                {group}
              </p>
              <div className="divide-y divide-gray-100 rounded-lg border border-gray-200">
                {types.map((t) => (
                  <div key={t.id} className="flex items-center justify-between px-3 py-2.5">
                    <span className="text-[13px] text-gray-800">{t.label}</span>
                    <Toggle
                      checked={Boolean(importantTypes[t.id])}
                      onChange={() => toggleImportantType(t.id)}
                      label={t.label}
                    />
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </Modal>
  );
}

function KeyboardShortcutsModal({ open, onClose }) {
  const shortcuts = [
    { keys: ['J', 'K'], desc: 'Navigate up / down in inbox' },
    { keys: ['E'], desc: 'Clear selected notification' },
    { keys: ['O'], desc: 'Open selected task' },
    { keys: ['1–4'], desc: 'Switch Primary / Other / Later / Cleared' },
    { keys: ['?'], desc: 'Show keyboard shortcuts' },
    { keys: ['Esc'], desc: 'Close panels' },
  ];

  return (
    <Modal open={open} onClose={onClose} title="Keyboard shortcuts" size="sm">
      <ul className="space-y-3">
        {shortcuts.map((s) => (
          <li key={s.desc} className="flex items-center justify-between gap-4 text-[13px]">
            <span className="text-gray-600">{s.desc}</span>
            <span className="flex gap-1">
              {s.keys.map((k) => (
                <kbd
                  key={k}
                  className="rounded border border-gray-200 bg-gray-50 px-2 py-0.5 font-mono text-[11px] text-gray-700"
                >
                  {k}
                </kbd>
              ))}
            </span>
          </li>
        ))}
      </ul>
    </Modal>
  );
}

export function CustomizeInboxModal({ open, onClose }) {
  const showAllTab = useInboxPreferencesStore((s) => s.showAllTab);
  const groupByDate = useInboxPreferencesStore((s) => s.groupByDate);
  const sortNewestFirst = useInboxPreferencesStore((s) => s.sortNewestFirst);
  const displayMode = useInboxPreferencesStore((s) => s.displayMode);
  const importantTypes = useInboxPreferencesStore((s) => s.importantTypes);
  const setShowAllTab = useInboxPreferencesStore((s) => s.setShowAllTab);
  const setGroupByDate = useInboxPreferencesStore((s) => s.setGroupByDate);
  const setSortNewestFirst = useInboxPreferencesStore((s) => s.setSortNewestFirst);
  const setDisplayMode = useInboxPreferencesStore((s) => s.setDisplayMode);

  const [importanceOpen, setImportanceOpen] = useState(false);
  const [shortcutsOpen, setShortcutsOpen] = useState(false);

  const { enabled, total } = countImportantTypes(importantTypes);

  return (
    <>
      <Modal open={open} onClose={onClose} title="Customize Inbox" size="md" className="max-w-[420px]">
        <div className="-mx-1 divide-y divide-gray-100">
          <div className="pb-1">
            <SettingRow
              icon={Eye}
              label="Show All tab"
              checked={showAllTab}
              onChange={setShowAllTab}
            />
            <SettingRow
              icon={Layers}
              label="Group by date"
              checked={groupByDate}
              onChange={setGroupByDate}
            />
            <SettingRow
              icon={ArrowDownWideNarrow}
              label="Sort by newest first"
              checked={sortNewestFirst}
              onChange={setSortNewestFirst}
            />
          </div>

          <div className="py-1">
            <p className="px-4 py-2 text-[11px] font-semibold uppercase tracking-wide text-gray-400">
              Important notifications
            </p>
            <button
              type="button"
              onClick={() => setImportanceOpen(true)}
              className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left hover:bg-gray-50"
            >
              <div className="flex items-center gap-3">
                <SlidersHorizontal className="h-4 w-4 text-gray-500" />
                <span className="text-[14px] font-medium text-gray-900">Customize importance</span>
              </div>
              <span className="flex items-center gap-1 text-[13px] text-gray-500">
                {enabled}/{total}
                <ChevronRight className="h-4 w-4" />
              </span>
            </button>
          </div>

          <div className="py-1">
            <p className="px-4 py-2 text-[11px] font-semibold uppercase tracking-wide text-gray-400">
              Display mode
            </p>
            <div className="flex gap-3 px-4 pb-3 pt-1">
              <DisplayModeCard
                mode="fullscreen"
                label="Fullscreen"
                selected={displayMode === 'fullscreen'}
                onSelect={setDisplayMode}
              >
                <div className="h-14 w-20 rounded border border-gray-300 bg-white shadow-sm" />
              </DisplayModeCard>
              <DisplayModeCard
                mode="inline"
                label="Inline"
                selected={displayMode === 'inline'}
                onSelect={setDisplayMode}
              >
                <div className="flex h-14 w-20 gap-1 rounded border border-gray-300 bg-white p-1 shadow-sm">
                  <div className="w-1/3 rounded-sm bg-gray-200" />
                  <div className="flex-1 rounded-sm bg-gray-100" />
                </div>
              </DisplayModeCard>
            </div>
          </div>

          <div className="py-1">
            <Link
              to="/settings"
              onClick={onClose}
              className="flex items-center gap-3 px-4 py-3 text-[14px] font-medium text-gray-900 hover:bg-gray-50"
            >
              <Settings2 className="h-4 w-4 text-gray-500" />
              Notification settings
            </Link>
            <button
              type="button"
              onClick={() => setShortcutsOpen(true)}
              className="flex w-full items-center gap-3 px-4 py-3 text-left text-[14px] font-medium text-gray-900 hover:bg-gray-50"
            >
              <Command className="h-4 w-4 text-gray-500" />
              Keyboard shortcuts
            </button>
          </div>
        </div>
      </Modal>

      <ImportanceModal open={importanceOpen} onClose={() => setImportanceOpen(false)} />
      <KeyboardShortcutsModal open={shortcutsOpen} onClose={() => setShortcutsOpen(false)} />
    </>
  );
}
