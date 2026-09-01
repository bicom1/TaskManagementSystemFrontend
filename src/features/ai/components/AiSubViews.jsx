import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AI_SKILLS } from '../aiConstants';
import { useAiStore } from '../aiStore';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';

export function AiSkillsView() {
  const [active, setActive] = useState(AI_SKILLS[0]?.id);

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <h1 className="text-2xl font-bold text-gray-900">Skills</h1>
      <p className="mt-1 text-sm text-gray-500">
        Specialized capabilities for Brain — pick a skill to get started.
      </p>

      <div className="mt-6 grid gap-3 sm:grid-cols-2">
        {AI_SKILLS.map((skill) => (
          <button
            key={skill.id}
            type="button"
            onClick={() => setActive(skill.id)}
            className={`rounded-2xl border p-4 text-left transition ${
              active === skill.id
                ? 'border-brand-400 bg-brand-50 shadow-sm'
                : 'border-gray-200 bg-white hover:border-gray-300'
            }`}
          >
            <span className="text-2xl">{skill.icon}</span>
            <p className="mt-2 font-semibold text-gray-900">{skill.name}</p>
            <p className="text-[12px] text-gray-500">{skill.desc}</p>
          </button>
        ))}
      </div>
    </div>
  );
}

export function AiAnalyticsView() {
  const brainUses = useAiStore((s) => s.brainUses);

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <h1 className="text-2xl font-bold text-gray-900">AI Analytics</h1>
      <p className="mt-1 text-sm text-gray-500">Usage and productivity insights for your workspace.</p>

      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        {[
          { label: 'Brain AI uses', value: brainUses },
          { label: 'Chats this week', value: 12 },
          { label: 'Time saved (est.)', value: '4.2h' },
        ].map((stat) => (
          <div key={stat.label} className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
            <p className="text-[12px] font-medium text-gray-500">{stat.label}</p>
            <p className="mt-1 text-3xl font-bold text-gray-900">{stat.value}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

export function AiConnectionsView() {
  const [connections, setConnections] = useState(
    () => [
      { id: 'slack', name: 'Slack', connected: false },
      { id: 'google', name: 'Google Workspace', connected: true },
      { id: 'github', name: 'GitHub', connected: false },
      { id: 'notion', name: 'Notion', connected: false },
    ]
  );

  const toggle = (id) =>
    setConnections((list) =>
      list.map((c) => (c.id === id ? { ...c, connected: !c.connected } : c))
    );

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <h1 className="text-2xl font-bold text-gray-900">Connections</h1>
      <p className="mt-1 text-sm text-gray-500">Connect Brain to your favorite tools.</p>

      <div className="mt-6 space-y-2">
        {connections.map((conn) => (
          <div
            key={conn.id}
            className="flex items-center justify-between rounded-xl border border-gray-200 bg-white px-4 py-3"
          >
            <span className="font-medium text-gray-900">{conn.name}</span>
            <Button
              variant={conn.connected ? 'outline' : 'default'}
              size="sm"
              onClick={() => toggle(conn.id)}
            >
              {conn.connected ? 'Connected' : 'Connect'}
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
}

export function AiCreateAgentView() {
  const navigate = useNavigate();
  const addAgent = useAiStore((s) => s.addAgent);
  const [name, setName] = useState('');
  const [instructions, setInstructions] = useState('');

  const handleCreate = (e) => {
    e.preventDefault();
    if (!name.trim()) return;
    addAgent({
      name: name.trim(),
      emoji: '🤖',
      owner: 'user',
      instructions: instructions.trim(),
    });
    navigate('/ai/agents/mine');
  };

  return (
    <div className="mx-auto max-w-lg px-4 py-8">
      <h1 className="text-2xl font-bold text-gray-900">Create Agent</h1>
      <p className="mt-1 text-sm text-gray-500">Build a custom agent for your workflows.</p>

      <form onSubmit={handleCreate} className="mt-6 space-y-4">
        <div>
          <label className="mb-1.5 block text-sm font-medium text-gray-700">Agent name</label>
          <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Sprint Reporter" />
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-medium text-gray-700">Instructions</label>
          <Textarea
            value={instructions}
            onChange={(e) => setInstructions(e.target.value)}
            placeholder="What should this agent do?"
            rows={5}
          />
        </div>
        <Button type="submit" disabled={!name.trim()}>
          Create Agent
        </Button>
      </form>
    </div>
  );
}
