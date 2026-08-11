import { LayoutGrid, List, Search } from 'lucide-react';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { PERSON_STATUS_LABELS } from '@/lib/avatar';
import { getRoleLabel, ROLE_LABELS } from '@/lib/roles';
import { cn } from '@/lib/utils';

export function PeopleToolbar({
  filters,
  onChange,
  teams = [],
  managers = [],
  view,
  onViewChange,
}) {
  const set = (key, value) => onChange({ ...filters, [key]: value });

  return (
    <div className="flex flex-col gap-3 border-b border-hairline pb-4 lg:flex-row lg:items-center lg:justify-between">
      <div className="flex flex-wrap items-center gap-2">
        <Select
          value={filters.status}
          onChange={(e) => set('status', e.target.value)}
          className="h-9 w-auto min-w-[110px] border-hairline bg-paper text-sm"
        >
          <option value="">Status</option>
          {Object.entries(PERSON_STATUS_LABELS).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </Select>

        <Select
          value={filters.team}
          onChange={(e) => set('team', e.target.value)}
          className="h-9 w-auto min-w-[110px] border-hairline bg-paper text-sm"
        >
          <option value="">Team</option>
          {teams.map((team) => (
            <option key={team._id} value={team._id}>
              {team.name}
            </option>
          ))}
        </Select>

        <Select
          value={filters.role}
          onChange={(e) => set('role', e.target.value)}
          className="h-9 w-auto min-w-[130px] border-hairline bg-paper text-sm"
        >
          <option value="">Account type</option>
          {Object.entries(ROLE_LABELS).map(([value]) => (
            <option key={value} value={value}>
              {getRoleLabel(value)}
            </option>
          ))}
        </Select>

        <Select
          value={filters.manager}
          onChange={(e) => set('manager', e.target.value)}
          className="h-9 w-auto min-w-[120px] border-hairline bg-paper text-sm"
        >
          <option value="">Manager</option>
          {managers.map((m) => (
            <option key={m._id} value={m._id}>
              {m.name}
            </option>
          ))}
        </Select>

        <Select
          value={filters.sort}
          onChange={(e) => set('sort', e.target.value)}
          className="h-9 w-auto min-w-[100px] border-hairline bg-paper text-sm"
        >
          <option value="name-asc">Sort: A–Z</option>
          <option value="name-desc">Sort: Z–A</option>
          <option value="recent">Recently active</option>
          <option value="role">Account type</option>
        </Select>
      </div>

      <div className="flex items-center gap-2">
        <div className="relative min-w-[180px] flex-1 lg:w-56 lg:flex-none">
          <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-graphite" />
          <Input
            value={filters.q}
            onChange={(e) => set('q', e.target.value)}
            placeholder="Search people…"
            className="h-9 border-hairline pl-8 text-sm"
          />
        </div>
        <div className="flex rounded-md border border-hairline bg-paper p-0.5">
          <button
            type="button"
            onClick={() => onViewChange('list')}
            className={cn(
              'rounded p-1.5 text-graphite',
              view === 'list' && 'bg-cloud text-ink'
            )}
            title="List view"
          >
            <List className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => onViewChange('grid')}
            className={cn(
              'rounded p-1.5 text-graphite',
              view === 'grid' && 'bg-cloud text-ink'
            )}
            title="Grid view"
          >
            <LayoutGrid className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
