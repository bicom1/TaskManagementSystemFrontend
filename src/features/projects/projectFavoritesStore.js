import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export const useProjectFavoritesStore = create(
  persist(
    (set, get) => ({
      favoriteIds: [],

      isFavorite: (projectId) => get().favoriteIds.includes(String(projectId)),

      toggleFavorite: (projectId) => {
        const id = String(projectId);
        set((s) => ({
          favoriteIds: s.favoriteIds.includes(id)
            ? s.favoriteIds.filter((x) => x !== id)
            : [...s.favoriteIds, id],
        }));
      },
    }),
    { name: 'tms-project-favorites' }
  )
);

export function sortProjectsByFavorite(projects, favoriteIds = []) {
  const favSet = new Set(favoriteIds.map(String));
  return [...projects].sort((a, b) => {
    const aFav = favSet.has(String(a._id));
    const bFav = favSet.has(String(b._id));
    if (aFav !== bFav) return aFav ? -1 : 1;
    return (a.name || '').localeCompare(b.name || '', undefined, { sensitivity: 'base' });
  });
}
