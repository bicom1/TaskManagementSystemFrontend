import { useEffect, useRef } from 'react';
import { BrainLogo } from './BrainLogo';
import { UserAvatar } from '@/components/UserAvatar';
import { useAuthStore } from '@/store/authStore';
import { cn } from '@/lib/utils';

function MessageBubble({ role, content, user }) {
  const isUser = role === 'user';

  return (
    <div className={cn('flex gap-3', isUser ? 'flex-row-reverse' : 'flex-row')}>
      {isUser ? (
        <UserAvatar user={user} className="h-8 w-8 shrink-0" />
      ) : (
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand-50">
          <BrainLogo size={20} />
        </div>
      )}
      <div
        className={cn(
          'max-w-[min(640px,85%)] rounded-2xl px-4 py-3 text-[14px] leading-relaxed',
          isUser
            ? 'bg-brand-600 text-white'
            : 'border border-gray-200 bg-white text-gray-800 shadow-sm'
        )}
      >
        <p className="whitespace-pre-wrap">{content}</p>
      </div>
    </div>
  );
}

export function AiChatThread({ messages, isThinking, className }) {
  const user = useAuthStore((s) => s.user);
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isThinking]);

  return (
    <div className={cn('flex flex-1 flex-col overflow-y-auto px-4 py-6', className)}>
      <div className="mx-auto flex w-full max-w-3xl flex-col gap-5">
        {messages.map((msg) => (
          <MessageBubble key={msg.id} role={msg.role} content={msg.content} user={user} />
        ))}
        {isThinking && (
          <div className="flex gap-3">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand-50">
              <BrainLogo size={20} />
            </div>
            <div className="rounded-2xl border border-gray-200 bg-white px-4 py-3 shadow-sm">
              <span className="inline-flex gap-1">
                <span className="h-2 w-2 animate-bounce rounded-full bg-gray-400 [animation-delay:0ms]" />
                <span className="h-2 w-2 animate-bounce rounded-full bg-gray-400 [animation-delay:150ms]" />
                <span className="h-2 w-2 animate-bounce rounded-full bg-gray-400 [animation-delay:300ms]" />
              </span>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>
    </div>
  );
}
