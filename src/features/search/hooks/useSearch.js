import { useQuery } from '@tanstack/react-query';
import { searchApi } from '../api/searchApi';

export function useWorkspaceSearch(q) {
  const query = String(q || '').trim();
  return useQuery({
    queryKey: ['workspace-search', query],
    queryFn: () => searchApi.search(query),
    enabled: query.length >= 1,
    staleTime: 15_000,
  });
}
