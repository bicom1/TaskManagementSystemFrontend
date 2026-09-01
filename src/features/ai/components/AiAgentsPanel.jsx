import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Glasses, Plus } from 'lucide-react';
import { useAiStore } from '../aiStore';
import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/utils';

export function AiAgentsPanel({ variant = 'page', filter = 'all', className }) {
  const agents = useAiStore((s) => s.agents);
  const myAgents = useAiStore((s) => s.myAgents);
  const all = useMemo(() => {
    if (filter === 'mine') return myAgents;
    return [...myAgents, ...agents];
  }, [myAgents, agents, filter]);

  if (variant === 'inline') {
    return (
      <div className={cn('mx-auto w-full max-w-3xl', className)}>
        <div className="grid gap-3 sm:grid-cols-2">
          {all.map((agent) => (
            <button
              key={agent.id}
              type="button"
              className="flex items-start gap-3 rounded-2xl border border-gray-200 bg-white p-4 text-left shadow-sm transition hover:border-brand-300 hover:shadow-md"
            >
              <span className="text-2xl">{agent.emoji || '🤖'}</span>
              <div>
                <p className="text-[14px] font-semibold text-gray-900">{agent.name}</p>
                <p className="text-[12px] text-gray-500">
                  {agent.owner === 'workspace' ? 'Workspace agent' : 'My agent'}
                </p>
              </div>
            </button>
          ))}
        </div>
        <Link
          to="/ai/agents/new"
          className="mt-4 inline-flex items-center gap-2 text-[13px] font-semibold text-brand-600 hover:text-brand-700"
        >
          <Plus className="h-4 w-4" />
          Create new agent
        </Link>
      </div>
    );
  }

  return (
    <div className={cn('mx-auto max-w-3xl px-4 py-8', className)}>
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Super Agents</h1>
          <p className="mt-1 text-sm text-gray-500">Automate workflows with custom AI agents.</p>
        </div>
        <Link to="/ai/agents/new">
          <Button>
            <Plus className="h-4 w-4" />
            Create Agent
          </Button>
        </Link>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {all.map((agent) => (
          <div
            key={agent.id}
            className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm"
          >
            <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-violet-50 text-xl">
              {agent.emoji || <Glasses className="h-5 w-5 text-violet-600" />}
            </div>
            <h3 className="font-semibold text-gray-900">{agent.name}</h3>
            <p className="mt-1 text-[12px] text-gray-500">
              {agent.owner === 'workspace' ? 'Workspace' : 'Personal'}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
