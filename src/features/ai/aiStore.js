import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { DEFAULT_AGENTS } from './aiConstants';

function makeId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

function titleFromPrompt(text) {
  const trimmed = String(text || '').trim();
  if (!trimmed) return 'New chat';
  return trimmed.length > 42 ? `${trimmed.slice(0, 42)}…` : trimmed;
}

export const useAiStore = create(
  persist(
    (set, get) => ({
      model: 'max',
      brainUses: 0,
      creditsTotal: 100,
      creditsUsed: 100,
      chats: [],
      agents: DEFAULT_AGENTS,
      myAgents: [],

      setModel: (model) => set({ model }),

      incrementUsage: () =>
        set((s) => ({
          brainUses: s.brainUses + 1,
          creditsUsed: Math.min(s.creditsTotal, s.creditsUsed + 1),
        })),

      createChat: (initialPrompt) => {
        const id = makeId();
        const chat = {
          id,
          title: titleFromPrompt(initialPrompt),
          messages: [],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        set((s) => ({ chats: [chat, ...s.chats] }));
        return id;
      },

      addMessage: (chatId, role, content) => {
        const msg = {
          id: makeId(),
          role,
          content,
          createdAt: new Date().toISOString(),
        };
        set((s) => ({
          chats: s.chats.map((c) => {
            if (c.id !== chatId) return c;
            const next = {
              ...c,
              messages: [...c.messages, msg],
              updatedAt: new Date().toISOString(),
            };
            if (role === 'user' && c.messages.length === 0) {
              next.title = titleFromPrompt(content);
            }
            return next;
          }),
        }));
        return msg;
      },

      deleteChat: (chatId) =>
        set((s) => ({ chats: s.chats.filter((c) => c.id !== chatId) })),

      addAgent: (agent) =>
        set((s) => ({
          myAgents: [
            {
              id: makeId(),
              createdAt: new Date().toISOString(),
              ...agent,
            },
            ...s.myAgents,
          ],
        })),

      getChat: (chatId) => get().chats.find((c) => c.id === chatId),
    }),
    {
      name: 'biworkspace-ai',
      partialize: (s) => ({
        model: s.model,
        brainUses: s.brainUses,
        creditsUsed: s.creditsUsed,
        chats: s.chats,
        myAgents: s.myAgents,
      }),
    }
  )
);
