import { FileText, PenLine, Search, Sparkles } from 'lucide-react';
import { AI_QUICK_ACTIONS } from '../aiConstants';
import { cn } from '@/lib/utils';

const ICONS = {
  report: FileText,
  sparkle: Sparkles,
  pen: PenLine,
  search: Search,
};

export function AiQuickActionCards({ onSelect, className }) {
  return (
    <div className={cn('mx-auto grid w-full max-w-3xl grid-cols-2 gap-3 sm:grid-cols-4', className)}>
      {AI_QUICK_ACTIONS.map((action) => {
        const Icon = ICONS[action.icon] || Sparkles;
        return (
          <button
            key={action.id}
            type="button"
            onClick={() => onSelect(action.prompt)}
            className="group rounded-2xl border border-gray-200 bg-white px-4 py-3.5 text-left shadow-sm transition hover:border-brand-300 hover:shadow-md"
          >
            <Icon className="mb-2 h-4 w-4 text-gray-500 group-hover:text-brand-600" />
            <p className="text-[13px] font-semibold text-gray-900">{action.title}</p>
            <p className="mt-0.5 line-clamp-2 text-[11.5px] leading-snug text-gray-500">
              {action.prompt.slice(0, 48)}…
            </p>
          </button>
        );
      })}
    </div>
  );
}
