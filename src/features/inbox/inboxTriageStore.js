import { create } from 'zustand';
import { persist } from 'zustand/middleware';

/** @typedef {'primary' | 'other' | 'later' | 'cleared'} InboxBucket */

export const INBOX_BUCKETS = ['primary', 'other', 'later', 'cleared'];

export function notificationKey(id) {
  return `notification:${id}`;
}

export function taskFeedKey(taskId) {
  return `task-feed:${taskId}`;
}

export function inboxItemKey(item) {
  if (item?.notification?._id) return notificationKey(item.notification._id);
  if (item?.taskId) return taskFeedKey(item.taskId);
  return `item:${item?.id}`;
}

export const useInboxTriageStore = create(
  persist(
    (set, get) => ({
      /** @type {Record<string, InboxBucket>} */
      overrides: {},

      setBucket: (key, bucket) =>
        set((s) => ({
          overrides: { ...s.overrides, [key]: bucket },
        })),

      setManyBuckets: (keys, bucket) =>
        set((s) => {
          const next = { ...s.overrides };
          keys.forEach((k) => {
            next[k] = bucket;
          });
          return { overrides: next };
        }),

      clearOverride: (key) =>
        set((s) => {
          const next = { ...s.overrides };
          delete next[key];
          return { overrides: next };
        }),
    }),
    { name: 'biworkspace-inbox-triage' }
  )
);
