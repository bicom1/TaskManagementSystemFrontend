import { create } from 'zustand';

/** Global create-project UI — menu + templates wizard (mounted in AppShell). */
export const useCreateProjectUiStore = create((set) => ({
  menuOpen: false,
  menuCentered: true,
  wizardOpen: false,

  openCreateMenu: ({ centered = true } = {}) =>
    set({ menuOpen: true, menuCentered: centered }),

  closeCreateMenu: () => set({ menuOpen: false }),

  openCreateWizard: () => set({ menuOpen: false, wizardOpen: true }),

  closeCreateWizard: () => set({ wizardOpen: false }),
}));
