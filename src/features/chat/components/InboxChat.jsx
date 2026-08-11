import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Search,
  Send,
  Link2,
  AtSign,
  MessageSquare,
  Users,
  Building2,
  Copy,
  Check,
  Hash,
} from 'lucide-react';
import { format, isToday, isYesterday } from 'date-fns';
import { toast } from 'sonner';
import { useAuthStore } from '@/store/authStore';
import { getAvatarColor, getInitials } from '@/lib/avatar';
import { getRoleLabel } from '@/lib/roles';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { LoadingScreen } from '@/components/ui/Spinner';
import {
  useChatPeople,
  useChatDirectory,
  useConversations,
  useConversationMessages,
  useLoadOlderMessages,
  useStartDm,
  useStartTeamChat,
  useStartDepartmentChat,
  useSendChatMessage,
  useMarkConversationRead,
  useLiveChat,
  emitChatTyping,
} from '../hooks/useChat';

function formatMsgTime(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  if (isToday(d)) return format(d, 'h:mm a');
  if (isYesterday(d)) return `Yesterday ${format(d, 'h:mm a')}`;
  return format(d, 'MMM d, h:mm a');
}

function conversationTitle(conversation, currentUserId) {
  if (!conversation) return 'Chat';
  if (conversation.title) return conversation.title;
  if (conversation.type === 'dm') {
    const other = (conversation.participants || []).find(
      (p) => String(p._id) !== String(currentUserId)
    );
    return other?.name || 'Direct message';
  }
  if (conversation.type === 'team') return conversation.team?.name || 'Team chat';
  if (conversation.type === 'department') {
    return conversation.department?.name || 'Department chat';
  }
  if (conversation.type === 'task') {
    return conversation.relatedTask
      ? `${conversation.relatedTask.key} · ${conversation.relatedTask.title}`
      : 'Task chat';
  }
  return 'Conversation';
}

function conversationSubtitle(conversation, currentUserId) {
  if (conversation?.type === 'dm') {
    const other = (conversation.participants || []).find(
      (p) => String(p._id) !== String(currentUserId)
    );
    if (!other) return '';
    const bits = [
      getRoleLabel(other.role),
      other.jobTitle,
      other.department?.name,
      other.email,
    ].filter(Boolean);
    return bits.join(' · ');
  }
  if (conversation?.type === 'team') return 'Team channel';
  if (conversation?.type === 'department') return 'Department channel';
  if (conversation?.type === 'task') return 'Task discussion';
  return '';
}

function renderBodyWithMentions(body, mentions = []) {
  if (!body) return null;
  const names = (mentions || [])
    .map((m) => m.name)
    .filter(Boolean)
    .sort((a, b) => b.length - a.length);

  if (!names.length) return body;

  const pattern = new RegExp(`@(${names.map((n) => n.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|')})`, 'gi');
  const parts = String(body).split(pattern);

  return parts.map((part, i) => {
    const isMention = names.some((n) => n.toLowerCase() === String(part).toLowerCase());
    if (isMention) {
      return (
        <span key={i} className="rounded bg-primary/10 px-1 font-medium text-primary">
          @{part}
        </span>
      );
    }
    return <span key={i}>{part}</span>;
  });
}

export function InboxChat() {
  const user = useAuthStore((s) => s.user);
  const userId = user?._id;
  const [searchParams, setSearchParams] = useSearchParams();
  const initialChat = searchParams.get('chat') || '';

  const [activeId, setActiveId] = useState(initialChat);
  const [peopleQuery, setPeopleQuery] = useState('');
  const [draft, setDraft] = useState('');
  const [mentionOpen, setMentionOpen] = useState(false);
  const [mentionQuery, setMentionQuery] = useState('');
  const [pendingMentions, setPendingMentions] = useState([]);
  const [typingUser, setTypingUser] = useState(null);
  const [copied, setCopied] = useState(false);
  const [sidebarMode, setSidebarMode] = useState('chats'); // chats | people

  const bottomRef = useRef(null);
  const typingTimer = useRef(null);

  const { data: conversationsData, isLoading: convLoading } = useConversations();
  const conversations = conversationsData?.data ?? [];
  const chatUnread = conversationsData?.unread ?? 0;

  const { data: messagesData, isLoading: messagesLoading } = useConversationMessages(activeId);
  const loadOlder = useLoadOlderMessages(activeId);
  const messages = messagesData?.data ?? [];
  const hasMoreMessages = Boolean(messagesData?.pagination?.hasMore);
  const oldestMessageId = messages[0]?._id;

  const { data: people = [], isFetching: peopleLoading } = useChatPeople(
    peopleQuery,
    sidebarMode === 'people' || Boolean(peopleQuery.trim())
  );

  // Open directory (no role gates) — any logged-in user sees everyone
  const { data: directory } = useChatDirectory(true);
  const teams = directory?.teams ?? [];
  const departments = directory?.departments ?? [];

  const startDm = useStartDm();
  const startTeam = useStartTeamChat();
  const startDept = useStartDepartmentChat();
  const sendMessage = useSendChatMessage(activeId);
  const markRead = useMarkConversationRead();

  const onTyping = useCallback(
    (payload) => {
      if (String(payload.conversationId) !== String(activeId)) return;
      if (String(payload.from) === String(userId)) return;
      setTypingUser(payload.from);
      clearTimeout(typingTimer.current);
      typingTimer.current = setTimeout(() => setTypingUser(null), 2000);
    },
    [activeId, userId]
  );

  useLiveChat(activeId, { onTyping });

  const activeConversation = useMemo(
    () => conversations.find((c) => String(c._id) === String(activeId)),
    [conversations, activeId]
  );

  const mentionCandidates = useMemo(() => {
    const participants = activeConversation?.participants || [];
    const q = mentionQuery.toLowerCase();
    return participants
      .filter((p) => String(p._id) !== String(userId))
      .filter(
        (p) =>
          !q ||
          p.name?.toLowerCase().includes(q) ||
          p.email?.toLowerCase().includes(q) ||
          p.jobTitle?.toLowerCase().includes(q)
      )
      .slice(0, 8);
  }, [activeConversation, mentionQuery, userId]);

  useEffect(() => {
    if (initialChat) setActiveId(initialChat);
  }, [initialChat]);

  useEffect(() => {
    if (!activeId) return;
    markRead.mutate(activeId);
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [activeId, messages.length]); // eslint-disable-line react-hooks/exhaustive-deps

  const openConversation = (id) => {
    setActiveId(id);
    setSearchParams(id ? { chat: id } : {});
    setSidebarMode('chats');
    setPeopleQuery('');
  };

  const handleStartDm = (person) => {
    startDm.mutate(person._id, {
      onSuccess: (conv) => openConversation(conv._id),
    });
  };

  const handleDraftChange = (value) => {
    setDraft(value);
    if (activeId) emitChatTyping(activeId);

    const at = value.lastIndexOf('@');
    if (at >= 0) {
      const after = value.slice(at + 1);
      if (!after.includes(' ') && after.length <= 40) {
        setMentionOpen(true);
        setMentionQuery(after);
        return;
      }
    }
    setMentionOpen(false);
    setMentionQuery('');
  };

  const insertMention = (person) => {
    const at = draft.lastIndexOf('@');
    const prefix = at >= 0 ? draft.slice(0, at) : draft;
    setDraft(`${prefix}@${person.name} `);
    setPendingMentions((prev) =>
      prev.some((id) => id === person._id) ? prev : [...prev, person._id]
    );
    setMentionOpen(false);
    setMentionQuery('');
  };

  const handleSend = () => {
    if (!activeId) return;
    const text = draft.trim();
    if (!text) return;

    const mentionIds = pendingMentions.filter((id) =>
      text.toLowerCase().includes(
        `@${(activeConversation?.participants || []).find((p) => p._id === id)?.name || ''}`.toLowerCase()
      )
    );

    // Also detect mentions by name in body
    for (const p of activeConversation?.participants || []) {
      if (String(p._id) === String(userId)) continue;
      if (text.includes(`@${p.name}`) && !mentionIds.includes(p._id)) {
        mentionIds.push(p._id);
      }
    }

    sendMessage.mutate(
      { body: text, mentions: mentionIds },
      {
        onSuccess: () => {
          setDraft('');
          setPendingMentions([]);
        },
      }
    );
  };

  const shareLink = activeConversation?.shareUrl ||
    (activeId ? `${window.location.origin}/inbox?chat=${activeId}` : '');

  const copyShareLink = async () => {
    if (!shareLink) return;
    try {
      await navigator.clipboard.writeText(shareLink);
      setCopied(true);
      toast.success('Chat link copied');
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error('Could not copy link');
    }
  };

  const shareCurrentPageAsLink = () => {
    if (!activeId) return;
    const url = window.location.href;
    sendMessage.mutate({
      body: `Shared a link`,
      shareLinks: [{ url, label: 'Open this chat', kind: 'conversation', refId: activeId }],
    });
  };

  return (
    <div className="flex h-[calc(100vh-11rem)] min-h-[480px] overflow-hidden rounded-xl border border-hairline bg-paper">
      {/* Left rail */}
      <aside className="flex w-full max-w-[320px] flex-col border-r border-hairline bg-cloud/40">
        <div className="space-y-2 border-b border-hairline p-3">
          <div className="flex gap-1 rounded-lg bg-cloud p-1">
            <button
              type="button"
              onClick={() => setSidebarMode('chats')}
              className={cn(
                'flex flex-1 items-center justify-center gap-1.5 rounded-md px-2 py-1.5 text-xs font-medium',
                sidebarMode === 'chats' ? 'bg-paper text-ink shadow-sm' : 'text-graphite'
              )}
            >
              <MessageSquare className="h-3.5 w-3.5" />
              Chats
              {chatUnread > 0 && (
                <span className="rounded bg-primary px-1 text-[10px] text-on-ink">{chatUnread}</span>
              )}
            </button>
            <button
              type="button"
              onClick={() => setSidebarMode('people')}
              className={cn(
                'flex flex-1 items-center justify-center gap-1.5 rounded-md px-2 py-1.5 text-xs font-medium',
                sidebarMode === 'people' ? 'bg-paper text-ink shadow-sm' : 'text-graphite'
              )}
            >
              <Users className="h-3.5 w-3.5" />
              People
            </button>
          </div>
          <div className="relative">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-graphite" />
            <Input
              value={peopleQuery}
              onChange={(e) => {
                setPeopleQuery(e.target.value);
                if (e.target.value.trim()) setSidebarMode('people');
              }}
              placeholder="Search name, email, dept, role…"
              className="h-9 pl-8 text-sm"
            />
          </div>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto">
          {sidebarMode === 'people' || peopleQuery.trim() ? (
            <div className="p-2">
              <p className="px-2 py-1 text-[11px] font-semibold uppercase tracking-wide text-graphite">
                Start a chat
              </p>
              {peopleLoading && (
                <p className="px-2 py-3 text-xs text-graphite">Searching…</p>
              )}
              {!peopleLoading && people.length === 0 && (
                <p className="px-2 py-3 text-xs text-graphite">No people matched.</p>
              )}
              {!peopleQuery.trim() && people.length > 0 && (
                <p className="px-2 py-2 text-xs text-graphite">
                  All employees — filter by name, email, job title, or department.
                </p>
              )}
              <ul className="space-y-0.5">
                {people.map((person) => {
                  const color = getAvatarColor(person._id || person.email);
                  return (
                    <li key={person._id}>
                      <button
                        type="button"
                        onClick={() => handleStartDm(person)}
                        className="flex w-full items-center gap-2.5 rounded-lg px-2 py-2 text-left hover:bg-paper"
                      >
                        <span
                          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[11px] font-bold text-white"
                          style={{ backgroundColor: color }}
                        >
                          {getInitials(person.name)}
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-sm font-medium text-ink">
                            {person.name}
                          </span>
                          <span className="block truncate text-[11px] text-graphite">
                            {[
                              getRoleLabel(person.role),
                              person.jobTitle,
                              person.department?.name,
                            ]
                              .filter(Boolean)
                              .join(' · ')}
                          </span>
                        </span>
                      </button>
                    </li>
                  );
                })}
              </ul>

              <div className="mt-4 space-y-2 px-1">
                <p className="px-1 text-[11px] font-semibold uppercase tracking-wide text-graphite">
                  Channels
                </p>
                {departments.slice(0, 6).map((dept) => (
                  <button
                    key={dept._id}
                    type="button"
                    onClick={() =>
                      startDept.mutate(dept._id, {
                        onSuccess: (c) => openConversation(c._id),
                      })
                    }
                    className="flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left text-sm hover:bg-paper"
                  >
                    <Building2 className="h-4 w-4 text-graphite" />
                    <span className="truncate">{dept.name}</span>
                  </button>
                ))}
                {teams.slice(0, 8).map((team) => (
                  <button
                    key={team._id}
                    type="button"
                    onClick={() =>
                      startTeam.mutate(team._id, {
                        onSuccess: (c) => openConversation(c._id),
                      })
                    }
                    className="flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left text-sm hover:bg-paper"
                  >
                    <Hash className="h-4 w-4 text-graphite" />
                    <span className="truncate">{team.name}</span>
                  </button>
                ))}
              </div>
            </div>
          ) : convLoading ? (
            <div className="p-6">
              <LoadingScreen />
            </div>
          ) : conversations.length === 0 ? (
            <div className="p-6 text-center text-sm text-graphite">
              No chats yet. Search a person to start messaging.
            </div>
          ) : (
            <ul className="p-1.5">
              {conversations.map((c) => {
                const title = conversationTitle(c, userId);
                const other =
                  c.type === 'dm'
                    ? (c.participants || []).find((p) => String(p._id) !== String(userId))
                    : null;
                const color = getAvatarColor(other?._id || c._id);
                const active = String(c._id) === String(activeId);
                return (
                  <li key={c._id}>
                    <button
                      type="button"
                      onClick={() => openConversation(c._id)}
                      className={cn(
                        'flex w-full items-start gap-2.5 rounded-lg px-2.5 py-2.5 text-left',
                        active ? 'bg-paper shadow-sm' : 'hover:bg-paper/70',
                        c.unread && !active && 'bg-primary-soft/20'
                      )}
                    >
                      <span
                        className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white"
                        style={{ backgroundColor: color }}
                      >
                        {c.type === 'dm' ? getInitials(title) : <Hash className="h-4 w-4" />}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="flex items-center justify-between gap-2">
                          <span className="truncate text-sm font-medium text-ink">{title}</span>
                          {c.lastMessageAt && (
                            <span className="shrink-0 text-[10px] text-graphite">
                              {formatMsgTime(c.lastMessageAt)}
                            </span>
                          )}
                        </span>
                        <span className="mt-0.5 line-clamp-1 text-xs text-graphite">
                          {c.lastMessagePreview || conversationSubtitle(c, userId)}
                        </span>
                      </span>
                      {c.unread && (
                        <span className="mt-2 h-2 w-2 shrink-0 rounded-full bg-primary" />
                      )}
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </aside>

      {/* Thread */}
      <section className="flex min-w-0 flex-1 flex-col">
        {!activeId ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-3 px-6 text-center">
            <MessageSquare className="h-10 w-10 text-graphite/50" />
            <div>
              <p className="text-base font-medium text-ink">Workplace chat</p>
              <p className="mt-1 max-w-sm text-sm text-graphite">
                Always-on workplace chat — message anytime, reopen old threads, and keep talking
                through the day. Search anyone by name, email, department, or position.
              </p>
            </div>
            <Button type="button" variant="outline" onClick={() => setSidebarMode('people')}>
              <Search className="h-4 w-4" />
              Find people
            </Button>
          </div>
        ) : (
          <>
            <header className="flex items-center justify-between gap-3 border-b border-hairline px-4 py-3">
              <div className="min-w-0">
                <h2 className="truncate text-sm font-semibold text-ink">
                  {conversationTitle(activeConversation, userId)}
                </h2>
                <p className="truncate text-xs text-graphite">
                  {conversationSubtitle(activeConversation, userId)}
                  {typingUser ? ' · typing…' : ''}
                </p>
              </div>
              <div className="flex shrink-0 gap-1">
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={copyShareLink}
                  title="Copy direct chat link"
                >
                  {copied ? <Check className="h-3.5 w-3.5" /> : <Link2 className="h-3.5 w-3.5" />}
                  Share
                </Button>
              </div>
            </header>

            <div className="min-h-0 flex-1 space-y-3 overflow-y-auto px-4 py-4">
              {messagesLoading ? (
                <LoadingScreen />
              ) : messages.length === 0 ? (
                <p className="py-10 text-center text-sm text-graphite">
                  No messages yet — say hello or share a task link. This chat stays open forever.
                </p>
              ) : (
                <>
                {hasMoreMessages && oldestMessageId ? (
                  <div className="flex justify-center pb-1">
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      disabled={loadOlder.isPending}
                      onClick={() => loadOlder.mutate(oldestMessageId)}
                    >
                      {loadOlder.isPending ? 'Loading…' : 'Load earlier messages'}
                    </Button>
                  </div>
                ) : null}
                {messages.map((m) => {
                  const mine = String(m.from?._id || m.from) === String(userId);
                  const color = getAvatarColor(m.from?._id || m.from?.email || 'x');
                  return (
                    <div
                      key={m._id}
                      className={cn('flex gap-2', mine ? 'flex-row-reverse' : 'flex-row')}
                    >
                      <span
                        className="mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[10px] font-bold text-white"
                        style={{ backgroundColor: color }}
                      >
                        {getInitials(m.from?.name || '?')}
                      </span>
                      <div
                        className={cn(
                          'max-w-[75%] rounded-2xl px-3 py-2 text-sm',
                          mine
                            ? 'rounded-tr-md bg-ink text-on-ink'
                            : 'rounded-tl-md bg-cloud text-ink'
                        )}
                      >
                        {!mine && (
                          <p className="mb-0.5 text-[11px] font-semibold opacity-80">
                            {m.from?.name}
                            {m.from?.jobTitle ? ` · ${m.from.jobTitle}` : ''}
                          </p>
                        )}
                        <p className="whitespace-pre-wrap break-words">
                          {renderBodyWithMentions(m.body, m.mentions)}
                        </p>
                        {(m.shareLinks || []).map((link, idx) => (
                          <a
                            key={idx}
                            href={link.url}
                            target="_blank"
                            rel="noreferrer"
                            className={cn(
                              'mt-2 flex items-center gap-1.5 rounded-md px-2 py-1.5 text-xs underline-offset-2 hover:underline',
                              mine ? 'bg-white/10' : 'bg-paper'
                            )}
                          >
                            <Link2 className="h-3 w-3" />
                            {link.label || link.url}
                          </a>
                        ))}
                        <p
                          className={cn(
                            'mt-1 text-[10px]',
                            mine ? 'text-on-ink/60' : 'text-graphite'
                          )}
                        >
                          {formatMsgTime(m.createdAt)}
                        </p>
                      </div>
                    </div>
                  );
                })}
                </>
              )}
              <div ref={bottomRef} />
            </div>

            <footer className="relative border-t border-hairline p-3">
              {mentionOpen && mentionCandidates.length > 0 && (
                <div className="absolute bottom-full left-3 right-3 mb-1 max-h-48 overflow-y-auto rounded-lg border border-hairline bg-paper shadow-lg">
                  {mentionCandidates.map((p) => (
                    <button
                      key={p._id}
                      type="button"
                      onClick={() => insertMention(p)}
                      className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-cloud"
                    >
                      <AtSign className="h-3.5 w-3.5 text-primary" />
                      <span className="font-medium">{p.name}</span>
                      <span className="text-xs text-graphite">
                        {p.jobTitle || getRoleLabel(p.role)}
                      </span>
                    </button>
                  ))}
                </div>
              )}
              <div className="flex items-end gap-2">
                <div className="min-w-0 flex-1">
                  <textarea
                    value={draft}
                    onChange={(e) => handleDraftChange(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleSend();
                      }
                    }}
                    rows={2}
                    placeholder="Message… use @ to mention · Enter to send"
                    className="w-full resize-none rounded-xl border border-hairline bg-cloud px-3 py-2 text-sm text-ink outline-none focus:border-primary"
                  />
                </div>
                <Button
                  type="button"
                  size="icon"
                  variant="outline"
                  title="Share chat link in thread"
                  onClick={shareCurrentPageAsLink}
                  disabled={sendMessage.isPending}
                >
                  <Copy className="h-4 w-4" />
                </Button>
                <Button
                  type="button"
                  onClick={handleSend}
                  disabled={!draft.trim() || sendMessage.isPending}
                >
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </footer>
          </>
        )}
      </section>
    </div>
  );
}
