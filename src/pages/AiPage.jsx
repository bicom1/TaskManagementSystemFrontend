import { useCallback, useMemo, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { Glasses, HardDrive, X } from 'lucide-react';
import { BrainLogo, BrainWordmark } from '@/features/ai/components/BrainLogo';
import { AiInputBar } from '@/features/ai/components/AiInputBar';
import { AiQuickActionCards } from '@/features/ai/components/AiQuickActionCards';
import { AiChatThread } from '@/features/ai/components/AiChatThread';
import { AiAgentsPanel } from '@/features/ai/components/AiAgentsPanel';
import {
  AiAnalyticsView,
  AiConnectionsView,
  AiCreateAgentView,
  AiSkillsView,
} from '@/features/ai/components/AiSubViews';
import { useAiStore } from '@/features/ai/aiStore';
import { buildAiResponse, useAiContext } from '@/features/ai/hooks/useAiContext';
import { cn } from '@/lib/utils';

function CreditsBanner({ creditsUsed, creditsTotal, onDismiss }) {
  const pct = creditsTotal > 0 ? Math.round((creditsUsed / creditsTotal) * 100) : 0;
  if (pct < 100) return null;

  return (
    <div className="flex items-center justify-between gap-3 bg-gray-900 px-4 py-2.5 text-[13px] text-white">
      <span>
        <strong>{pct}%</strong> of AI Super Credits used.{' '}
        <button type="button" className="underline hover:no-underline">
          Upgrade for more
        </button>
      </span>
      <button type="button" onClick={onDismiss} className="text-gray-400 hover:text-white">
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}

function AskAgentsTabs({ mode, onChange }) {
  return (
    <div className="mb-6 inline-flex rounded-full border border-gray-200 bg-white p-1 shadow-sm">
      <button
        type="button"
        onClick={() => onChange('ask')}
        className={cn(
          'inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-[13px] font-semibold transition',
          mode === 'ask' ? 'bg-gray-100 text-gray-900' : 'text-gray-500 hover:text-gray-700'
        )}
      >
        <BrainLogo size={16} />
        Ask
      </button>
      <button
        type="button"
        onClick={() => onChange('agents')}
        className={cn(
          'inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-[13px] font-semibold transition',
          mode === 'agents' ? 'bg-gray-100 text-gray-900' : 'text-gray-500 hover:text-gray-700'
        )}
      >
        <Glasses className="h-4 w-4" />
        Agents
      </button>
    </div>
  );
}

function AiAskWorkspace() {
  const { chatId } = useParams();
  const navigate = useNavigate();
  const [prompt, setPrompt] = useState('');
  const [tab, setTab] = useState('ask');
  const [isThinking, setIsThinking] = useState(false);
  const [bannerDismissed, setBannerDismissed] = useState(false);

  const creditsUsed = useAiStore((s) => s.creditsUsed);
  const creditsTotal = useAiStore((s) => s.creditsTotal);
  const chats = useAiStore((s) => s.chats);
  const createChat = useAiStore((s) => s.createChat);
  const addMessage = useAiStore((s) => s.addMessage);
  const incrementUsage = useAiStore((s) => s.incrementUsage);

  const aiContext = useAiContext();
  const activeChat = useMemo(
    () => (chatId ? chats.find((c) => c.id === chatId) : null),
    [chatId, chats]
  );
  const hasMessages = (activeChat?.messages?.length ?? 0) > 0;

  const sendPrompt = useCallback(
    async (text) => {
      const trimmed = String(text || '').trim();
      if (!trimmed || isThinking) return;

      let id = chatId;
      if (!id) {
        id = createChat(trimmed);
        navigate(`/ai/chat/${id}`, { replace: true });
      }

      addMessage(id, 'user', trimmed);
      setPrompt('');
      setIsThinking(true);
      incrementUsage();

      await new Promise((r) => setTimeout(r, 900));

      const reply = buildAiResponse(trimmed, aiContext);
      addMessage(id, 'assistant', reply);
      setIsThinking(false);
    },
    [chatId, isThinking, createChat, navigate, addMessage, incrementUsage, aiContext]
  );

  return (
    <div className="relative flex min-h-[calc(100vh-52px)] flex-col">
      {!bannerDismissed && (
        <CreditsBanner
          creditsUsed={creditsUsed}
          creditsTotal={creditsTotal}
          onDismiss={() => setBannerDismissed(true)}
        />
      )}

      {/* Top gradient */}
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-48 bg-gradient-to-b from-violet-100/80 via-pink-50/40 to-transparent"
        aria-hidden
      />

      <div className="absolute right-4 top-4 z-10">
        <button
          type="button"
          className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white/80 px-3 py-1.5 text-[12px] font-medium text-gray-600 backdrop-blur-sm hover:bg-white"
        >
          <HardDrive className="h-3.5 w-3.5" />
          Memory
        </button>
      </div>

      {hasMessages ? (
        <>
          <AiChatThread messages={activeChat.messages} isThinking={isThinking} />
          <div className="shrink-0 border-t border-gray-100 bg-white/80 px-4 py-4 backdrop-blur-sm">
            <AiInputBar
              value={prompt}
              onChange={setPrompt}
              onSubmit={() => sendPrompt(prompt)}
              placeholder="Ask a follow-up…"
              disabled={isThinking}
            />
          </div>
        </>
      ) : (
        <div className="relative flex flex-1 flex-col items-center justify-center px-4 pb-12 pt-16">
          <BrainWordmark className="mb-8" />
          <AskAgentsTabs mode={tab} onChange={setTab} />

          {tab === 'ask' ? (
            <>
              <AiInputBar
                value={prompt}
                onChange={setPrompt}
                onSubmit={() => sendPrompt(prompt)}
                placeholder=""
                disabled={isThinking}
                className="mb-8"
              />
              <AiQuickActionCards onSelect={(p) => setPrompt(p)} />
            </>
          ) : (
            <AiAgentsPanel variant="inline" />
          )}
        </div>
      )}
    </div>
  );
}

export default function AiPage() {
  const { pathname } = useLocation();

  if (pathname.startsWith('/ai/skills')) return <AiSkillsView />;
  if (pathname.startsWith('/ai/analytics')) return <AiAnalyticsView />;
  if (pathname.startsWith('/ai/connections')) return <AiConnectionsView />;
  if (pathname.startsWith('/ai/agents/new')) return <AiCreateAgentView />;
  if (pathname.startsWith('/ai/agents/mine')) return <AiAgentsPanel variant="page" filter="mine" />;
  if (pathname.startsWith('/ai/agents')) return <AiAgentsPanel variant="page" filter="all" />;

  return <AiAskWorkspace />;
}
