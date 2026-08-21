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
  Paperclip,
  X,
  Image as ImageIcon,
  FileText,
  ExternalLink,
} from 'lucide-react';
import { format, isToday, isYesterday } from 'date-fns';
import { toast } from 'sonner';
import { useAuthStore } from '@/store/authStore';
import { getRoleLabel } from '@/lib/roles';
import { cn } from '@/lib/utils';
import { UserAvatar } from '@/components/UserAvatar';
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
import { ImageCropModal } from './ImageCropModal';
import {
  CHAT_LIMITS,
  formatBytes,
  isImageFile,
  validateChatFile,
} from '../chatLimits';

const URL_REGEX =
  /((https?:\/\/|www\.)[^\s<]+[^\s<.,;:!?"')\]])/gi;

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
    return [getRoleLabel(other.role), other.jobTitle, other.department?.name]
      .filter(Boolean)
      .join(' · ');
  }
  if (conversation?.type === 'team') {
    const n = conversation.participants?.length || 0;
    return `Team channel · ${n} member${n === 1 ? '' : 's'}`;
  }
  if (conversation?.type === 'department') return 'Department channel';
  if (conversation?.type === 'task') return 'Task discussion';
  return '';
}

function normalizeHref(raw) {
  const url = String(raw || '').trim();
  if (!url) return '#';
  if (/^https?:\/\//i.test(url)) return url;
  if (/^www\./i.test(url)) return `https://${url}`;
  return url;
}

function renderBodyWithMentions(body, mentions = [], mine = false) {
  if (!body) return null;
  const names = (mentions || [])
    .map((m) => m.name)
    .filter(Boolean)
    .sort((a, b) => b.length - a.length);

  const linkClass = mine
    ? 'underline underline-offset-2 opacity-90'
    : 'font-medium text-primary underline-offset-2 hover:underline';

  const renderSegment = (segment, keyPrefix) => {
    const parts = [];
    let last = 0;
    let match;
    const re = new RegExp(URL_REGEX);
    while ((match = re.exec(segment)) !== null) {
      if (match.index > last) {
        parts.push(
          <span key={`${keyPrefix}-t-${last}`}>{segment.slice(last, match.index)}</span>
        );
      }
      parts.push(
        <a
          key={`${keyPrefix}-l-${match.index}`}
          href={normalizeHref(match[0])}
          target="_blank"
          rel="noopener noreferrer"
          className={cn('break-all', linkClass)}
        >
          {match[0]}
        </a>
      );
      last = match.index + match[0].length;
    }
    if (last < segment.length) {
      parts.push(<span key={`${keyPrefix}-t-end`}>{segment.slice(last)}</span>);
    }
    return parts.length ? parts : segment;
  };

  if (!names.length) {
    return renderSegment(String(body), 'b');
  }

  const pattern = new RegExp(
    `@(${names.map((n) => n.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|')})`,
    'gi'
  );
  const chunks = String(body).split(pattern);

  return chunks.map((part, i) => {
    const isMention = names.some((n) => n.toLowerCase() === String(part).toLowerCase());
    if (isMention) {
      return (
        <span
          key={i}
          className={cn(
            'rounded px-1 font-medium',
            mine ? 'bg-white/15' : 'bg-primary/10 text-primary'
          )}
        >
          @{part}
        </span>
      );
    }
    return <span key={i}>{renderSegment(part, `p${i}`)}</span>;
  });
}

function MessageAttachments({ attachments = [], mine = false }) {
  if (!attachments.length) return null;
  return (
    <div className="mt-2 flex flex-wrap gap-2">
      {attachments.map((file) => {
        const key = `${file.url}-${file.fileName}`;
        const image = isImageFile({ type: file.fileType, name: file.fileName });
        if (image) {
          return (
            <a
              key={key}
              href={file.url}
              target="_blank"
              rel="noopener noreferrer"
              className="block overflow-hidden rounded-lg border border-white/20"
            >
              <img
                src={file.url}
                alt={file.fileName || 'Image'}
                className="max-h-48 max-w-[220px] object-cover"
              />
            </a>
          );
        }
        return (
          <a
            key={key}
            href={file.url}
            target="_blank"
            rel="noopener noreferrer"
            className={cn(
              'inline-flex max-w-full items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-[11px] font-medium',
              mine ? 'bg-white/10' : 'bg-paper'
            )}
          >
            <FileText className="h-3.5 w-3.5 shrink-0" />
            <span className="truncate">{file.fileName || 'Document'}</span>
            {file.size ? (
              <span className="shrink-0 opacity-70">{formatBytes(file.size)}</span>
            ) : null}
          </a>
        );
      })}
    </div>
  );
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
  const [sidebarMode, setSidebarMode] = useState('chats'); // chats | teams | people
  const [pendingFiles, setPendingFiles] = useState([]);
  const [pendingLinks, setPendingLinks] = useState([]);
  const [linkDraft, setLinkDraft] = useState('');
  const [linkLabel, setLinkLabel] = useState('');
  const [linkOpen, setLinkOpen] = useState(false);
  const [cropSrc, setCropSrc] = useState(null);
  const [cropName, setCropName] = useState('image.jpg');

  const bottomRef = useRef(null);
  const typingTimer = useRef(null);
  const fileInputRef = useRef(null);

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

  const { data: directory } = useChatDirectory(true);
  const myTeams = directory?.myTeams ?? directory?.teams ?? [];
  const departments = directory?.departments ?? [];
  const limits = directory?.limits || {
    maxFiles: CHAT_LIMITS.MAX_FILES,
    maxLinks: CHAT_LIMITS.MAX_LINKS,
    imageMaxBytes: CHAT_LIMITS.IMAGE_MAX_BYTES,
    documentMaxBytes: CHAT_LIMITS.DOCUMENT_MAX_BYTES,
  };

  const startDm = useStartDm();
  const startTeam = useStartTeamChat();
  const startDept = useStartDepartmentChat();
  const sendMessage = useSendChatMessage(activeId);
  const markRead = useMarkConversationRead();

  const teamChats = useMemo(
    () => conversations.filter((c) => c.type === 'team'),
    [conversations]
  );
  const dmChats = useMemo(
    () => conversations.filter((c) => c.type === 'dm'),
    [conversations]
  );

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
    setPendingFiles([]);
    setPendingLinks([]);
    setLinkOpen(false);
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

  const addPendingFile = (file) => {
    const err = validateChatFile(file);
    if (err) {
      toast.error(err);
      return;
    }
    setPendingFiles((prev) => {
      if (prev.length >= limits.maxFiles) {
        toast.error(`Maximum ${limits.maxFiles} files per message`);
        return prev;
      }
      return [...prev, file];
    });
  };

  const onPickFiles = (e) => {
    const list = Array.from(e.target.files || []);
    e.target.value = '';
    for (const file of list) {
      if (isImageFile(file)) {
        const url = URL.createObjectURL(file);
        setCropSrc(url);
        setCropName(file.name || 'image.jpg');
        return;
      }
      addPendingFile(file);
    }
  };

  const onCropped = (file) => {
    if (cropSrc) URL.revokeObjectURL(cropSrc);
    setCropSrc(null);
    addPendingFile(file);
  };

  const addPendingLink = () => {
    const url = linkDraft.trim();
    if (!url) return;
    if (pendingLinks.length >= limits.maxLinks) {
      toast.error(`Maximum ${limits.maxLinks} links per message`);
      return;
    }
    setPendingLinks((prev) => [
      ...prev,
      {
        url: normalizeHref(url),
        label: linkLabel.trim() || url,
        kind: 'external',
      },
    ]);
    setLinkDraft('');
    setLinkLabel('');
    setLinkOpen(false);
  };

  const handleSend = () => {
    if (!activeId) return;
    const text = draft.trim();
    if (!text && !pendingFiles.length && !pendingLinks.length) return;

    const mentionIds = pendingMentions.filter((id) =>
      text.toLowerCase().includes(
        `@${(activeConversation?.participants || []).find((p) => p._id === id)?.name || ''}`.toLowerCase()
      )
    );

    for (const p of activeConversation?.participants || []) {
      if (String(p._id) === String(userId)) continue;
      if (text.includes(`@${p.name}`) && !mentionIds.includes(p._id)) {
        mentionIds.push(p._id);
      }
    }

    sendMessage.mutate(
      {
        body: text,
        mentions: mentionIds,
        shareLinks: pendingLinks,
        files: pendingFiles,
      },
      {
        onSuccess: () => {
          setDraft('');
          setPendingMentions([]);
          setPendingFiles([]);
          setPendingLinks([]);
        },
      }
    );
  };

  const shareLink =
    activeConversation?.shareUrl ||
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

  const canSend =
    Boolean(draft.trim()) || pendingFiles.length > 0 || pendingLinks.length > 0;

  const listForSidebar =
    sidebarMode === 'chats'
      ? conversations
      : sidebarMode === 'teams'
        ? teamChats
        : [];

  return (
    <div className="flex h-[calc(100vh-11rem)] min-h-[520px] overflow-hidden rounded-xl border border-hairline bg-paper shadow-sm">
      <aside className="flex w-full max-w-[340px] flex-col border-r border-hairline bg-gradient-to-b from-cloud/80 to-paper">
        <div className="space-y-2.5 border-b border-hairline p-3">
          <div>
            <h2 className="text-sm font-semibold text-ink">Inbox chat</h2>
            <p className="text-[11px] text-graphite">
              Direct messages · team channels · media &amp; links
            </p>
          </div>
          <div className="flex gap-1 rounded-lg bg-cloud p-1">
            {[
              { id: 'chats', label: 'Chats', icon: MessageSquare },
              { id: 'teams', label: 'Teams', icon: Hash },
              { id: 'people', label: 'People', icon: Users },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setSidebarMode(tab.id)}
                className={cn(
                  'flex flex-1 items-center justify-center gap-1 rounded-md px-2 py-1.5 text-[11px] font-semibold',
                  sidebarMode === tab.id
                    ? 'bg-paper text-ink shadow-sm'
                    : 'text-graphite hover:text-ink'
                )}
              >
                <tab.icon className="h-3.5 w-3.5" />
                {tab.label}
                {tab.id === 'chats' && chatUnread > 0 ? (
                  <span className="rounded bg-primary px-1 text-[10px] text-on-ink">
                    {chatUnread}
                  </span>
                ) : null}
              </button>
            ))}
          </div>
          <div className="relative">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-graphite" />
            <Input
              value={peopleQuery}
              onChange={(e) => {
                setPeopleQuery(e.target.value);
                if (e.target.value.trim()) setSidebarMode('people');
              }}
              placeholder="Search people…"
              className="h-9 pl-8 text-sm"
            />
          </div>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto">
          {sidebarMode === 'people' || peopleQuery.trim() ? (
            <div className="p-2">
              <p className="px-2 py-1 text-[11px] font-semibold uppercase tracking-wide text-graphite">
                Message anyone
              </p>
              {peopleLoading && (
                <p className="px-2 py-3 text-xs text-graphite">Searching…</p>
              )}
              {!peopleLoading && people.length === 0 && (
                <p className="px-2 py-3 text-xs text-graphite">No people matched.</p>
              )}
              <ul className="space-y-0.5">
                {people.map((person) => (
                  <li key={person._id}>
                    <button
                      type="button"
                      onClick={() => handleStartDm(person)}
                      className="flex w-full items-center gap-2.5 rounded-lg px-2 py-2 text-left hover:bg-paper"
                    >
                      <UserAvatar user={person} size="md" className="h-8 w-8 text-[11px]" />
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-medium text-ink">
                          {person.name}
                        </span>
                        <span className="block truncate text-[11px] text-graphite">
                          {[getRoleLabel(person.role), person.jobTitle, person.department?.name]
                            .filter(Boolean)
                            .join(' · ')}
                        </span>
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          ) : sidebarMode === 'teams' ? (
            <div className="space-y-3 p-2">
              <div>
                <p className="px-2 py-1 text-[11px] font-semibold uppercase tracking-wide text-graphite">
                  Your teams
                </p>
                {myTeams.length === 0 ? (
                  <p className="px-2 py-3 text-xs text-graphite">
                    Join a team to get a shared team channel for leads and employees.
                  </p>
                ) : (
                  <ul className="space-y-0.5">
                    {myTeams.map((team) => (
                      <li key={team._id}>
                        <button
                          type="button"
                          onClick={() =>
                            startTeam.mutate(team._id, {
                              onSuccess: (c) => openConversation(c._id),
                            })
                          }
                          className="flex w-full items-center gap-2 rounded-lg px-2 py-2 text-left hover:bg-paper"
                        >
                          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-ink text-on-ink">
                            <Hash className="h-4 w-4" />
                          </span>
                          <span className="min-w-0">
                            <span className="block truncate text-sm font-medium text-ink">
                              {team.name}
                            </span>
                            <span className="block truncate text-[11px] text-graphite">
                              {team.department?.name || 'Team channel'} · lead &amp; members
                            </span>
                          </span>
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
              {departments.length > 0 && (
                <div>
                  <p className="px-2 py-1 text-[11px] font-semibold uppercase tracking-wide text-graphite">
                    Departments
                  </p>
                  <ul className="space-y-0.5">
                    {departments.slice(0, 8).map((dept) => (
                      <li key={dept._id}>
                        <button
                          type="button"
                          onClick={() =>
                            startDept.mutate(dept._id, {
                              onSuccess: (c) => openConversation(c._id),
                              onError: (err) =>
                                toast.error(
                                  err?.response?.data?.message || 'Could not open channel'
                                ),
                            })
                          }
                          className="flex w-full items-center gap-2 rounded-lg px-2 py-2 text-left text-sm hover:bg-paper"
                        >
                          <Building2 className="h-4 w-4 text-graphite" />
                          <span className="truncate">{dept.name}</span>
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          ) : convLoading ? (
            <div className="p-6">
              <LoadingScreen />
            </div>
          ) : listForSidebar.length === 0 ? (
            <div className="space-y-3 p-6 text-center text-sm text-graphite">
              <p>No chats yet.</p>
              <Button type="button" variant="outline" size="sm" onClick={() => setSidebarMode('people')}>
                Message a person
              </Button>
              <Button type="button" variant="outline" size="sm" onClick={() => setSidebarMode('teams')}>
                Open team chat
              </Button>
            </div>
          ) : (
            <ul className="p-1.5">
              {(sidebarMode === 'chats' ? conversations : listForSidebar).map((c) => {
                const title = conversationTitle(c, userId);
                const other =
                  c.type === 'dm'
                    ? (c.participants || []).find((p) => String(p._id) !== String(userId))
                    : null;
                const active = String(c._id) === String(activeId);
                return (
                  <li key={c._id}>
                    <button
                      type="button"
                      onClick={() => openConversation(c._id)}
                      className={cn(
                        'flex w-full items-start gap-2.5 rounded-lg px-2.5 py-2.5 text-left transition',
                        active ? 'bg-paper shadow-sm ring-1 ring-hairline' : 'hover:bg-paper/70',
                        c.unread && !active && 'bg-primary-soft/20'
                      )}
                    >
                      {c.type === 'dm' ? (
                        <UserAvatar
                          user={other}
                          name={title}
                          size="md"
                          className="mt-0.5 h-9 w-9"
                        />
                      ) : (
                        <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-ink/90 text-on-ink">
                          <Hash className="h-4 w-4" />
                        </span>
                      )}
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
                        {c.type === 'team' || c.type === 'department' ? (
                          <span className="mt-0.5 inline-block text-[10px] font-medium uppercase tracking-wide text-graphite/80">
                            {c.type}
                          </span>
                        ) : null}
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

        <div className="border-t border-hairline px-3 py-2 text-[10px] text-graphite">
          Images ≤ {Math.round((limits.imageMaxBytes || CHAT_LIMITS.IMAGE_MAX_BYTES) / 1e6)} MB ·
          Docs ≤ {Math.round((limits.documentMaxBytes || CHAT_LIMITS.DOCUMENT_MAX_BYTES) / 1e6)} MB ·
          Max {limits.maxFiles || CHAT_LIMITS.MAX_FILES} files
        </div>
      </aside>

      <section className="flex min-w-0 flex-1 flex-col bg-paper">
        {!activeId ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-4 px-6 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-cloud">
              <MessageSquare className="h-7 w-7 text-graphite" />
            </div>
            <div>
              <p className="text-base font-semibold text-ink">Professional workplace chat</p>
              <p className="mt-1 max-w-md text-sm text-graphite">
                Message colleagues one-to-one, or open a team channel where the lead and all
                employees on that team can talk, share media, documents, and links.
              </p>
            </div>
            <div className="flex flex-wrap justify-center gap-2">
              <Button type="button" variant="outline" onClick={() => setSidebarMode('people')}>
                <Users className="h-4 w-4" />
                Direct message
              </Button>
              <Button type="button" onClick={() => setSidebarMode('teams')}>
                <Hash className="h-4 w-4" />
                Team chat
              </Button>
            </div>
            <p className="max-w-sm text-[11px] text-graphite">
              Recent DMs: {dmChats.length} · Team channels open: {teamChats.length}
            </p>
          </div>
        ) : (
          <>
            <header className="flex items-center justify-between gap-3 border-b border-hairline bg-cloud/30 px-4 py-3">
              <div className="min-w-0">
                <h2 className="truncate text-sm font-semibold text-ink">
                  {conversationTitle(activeConversation, userId)}
                </h2>
                <p className="truncate text-xs text-graphite">
                  {conversationSubtitle(activeConversation, userId)}
                  {typingUser ? ' · typing…' : ''}
                </p>
              </div>
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={copyShareLink}
                title="Copy chat link"
              >
                {copied ? <Check className="h-3.5 w-3.5" /> : <Link2 className="h-3.5 w-3.5" />}
                Share
              </Button>
            </header>

            <div className="min-h-0 flex-1 space-y-3 overflow-y-auto bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-cloud/40 via-paper to-paper px-4 py-4">
              {messagesLoading ? (
                <LoadingScreen />
              ) : messages.length === 0 ? (
                <p className="py-10 text-center text-sm text-graphite">
                  No messages yet — say hello, attach a file, or share a link.
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
                    return (
                      <div
                        key={m._id}
                        className={cn('flex gap-2', mine ? 'flex-row-reverse' : 'flex-row')}
                      >
                        <UserAvatar
                          user={m.from}
                          size="md"
                          className="mt-1 h-8 w-8 text-[10px]"
                        />
                        <div
                          className={cn(
                            'max-w-[78%] rounded-2xl px-3 py-2 text-sm shadow-sm',
                            mine
                              ? 'rounded-tr-md bg-ink text-on-ink'
                              : 'rounded-tl-md border border-hairline bg-paper text-ink'
                          )}
                        >
                          {!mine && (
                            <p className="mb-0.5 text-[11px] font-semibold opacity-80">
                              {m.from?.name}
                              {m.from?.jobTitle ? ` · ${m.from.jobTitle}` : ''}
                            </p>
                          )}
                          <p className="whitespace-pre-wrap break-words">
                            {renderBodyWithMentions(m.body, m.mentions, mine)}
                          </p>
                          <MessageAttachments attachments={m.attachments || []} mine={mine} />
                          {(m.shareLinks || []).map((link, idx) => (
                            <a
                              key={idx}
                              href={normalizeHref(link.url)}
                              target="_blank"
                              rel="noreferrer"
                              className={cn(
                                'mt-2 flex items-center gap-1.5 rounded-md px-2 py-1.5 text-xs underline-offset-2 hover:underline',
                                mine ? 'bg-white/10' : 'bg-cloud'
                              )}
                            >
                              <ExternalLink className="h-3 w-3" />
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

            <footer className="relative border-t border-hairline bg-paper p-3">
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

              {(pendingFiles.length > 0 || pendingLinks.length > 0) && (
                <div className="mb-2 flex flex-wrap gap-2">
                  {pendingFiles.map((file, idx) => (
                    <span
                      key={`${file.name}-${idx}`}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-hairline bg-cloud px-2 py-1 text-[11px]"
                    >
                      {isImageFile(file) ? (
                        <ImageIcon className="h-3 w-3" />
                      ) : (
                        <FileText className="h-3 w-3" />
                      )}
                      <span className="max-w-[120px] truncate">{file.name}</span>
                      <span className="text-graphite">{formatBytes(file.size)}</span>
                      <button
                        type="button"
                        onClick={() =>
                          setPendingFiles((prev) => prev.filter((_, i) => i !== idx))
                        }
                        className="text-graphite hover:text-ink"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </span>
                  ))}
                  {pendingLinks.map((link, idx) => (
                    <span
                      key={`${link.url}-${idx}`}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-hairline bg-cloud px-2 py-1 text-[11px]"
                    >
                      <Link2 className="h-3 w-3" />
                      <span className="max-w-[140px] truncate">{link.label}</span>
                      <button
                        type="button"
                        onClick={() =>
                          setPendingLinks((prev) => prev.filter((_, i) => i !== idx))
                        }
                        className="text-graphite hover:text-ink"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </span>
                  ))}
                </div>
              )}

              {linkOpen && (
                <div className="mb-2 flex flex-wrap gap-2 rounded-lg border border-hairline bg-cloud/50 p-2">
                  <Input
                    value={linkDraft}
                    onChange={(e) => setLinkDraft(e.target.value)}
                    placeholder="https://…"
                    className="h-8 min-w-[180px] flex-1 text-sm"
                  />
                  <Input
                    value={linkLabel}
                    onChange={(e) => setLinkLabel(e.target.value)}
                    placeholder="Label (optional)"
                    className="h-8 w-40 text-sm"
                  />
                  <Button type="button" size="sm" onClick={addPendingLink}>
                    Add link
                  </Button>
                </div>
              )}

              <div className="flex items-end gap-2">
                <input
                  ref={fileInputRef}
                  type="file"
                  className="hidden"
                  multiple
                  accept="image/png,image/jpeg,image/webp,image/gif,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.csv,.zip"
                  onChange={onPickFiles}
                />
                <Button
                  type="button"
                  size="icon"
                  variant="outline"
                  title="Attach image or document"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={sendMessage.isPending}
                >
                  <Paperclip className="h-4 w-4" />
                </Button>
                <Button
                  type="button"
                  size="icon"
                  variant="outline"
                  title="Add link"
                  onClick={() => setLinkOpen((v) => !v)}
                >
                  <Link2 className="h-4 w-4" />
                </Button>
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
                    placeholder="Write a message… @mention · attach files · share links"
                    className="w-full resize-none rounded-xl border border-hairline bg-cloud px-3 py-2 text-sm text-ink outline-none focus:border-ink/30"
                  />
                </div>
                <Button
                  type="button"
                  size="icon"
                  variant="outline"
                  title="Copy chat URL into thread"
                  onClick={() => {
                    if (!activeId) return;
                    sendMessage.mutate({
                      body: 'Shared a chat link',
                      shareLinks: [
                        {
                          url: shareLink,
                          label: 'Open this chat',
                          kind: 'conversation',
                          refId: activeId,
                        },
                      ],
                    });
                  }}
                  disabled={sendMessage.isPending}
                >
                  <Copy className="h-4 w-4" />
                </Button>
                <Button
                  type="button"
                  onClick={handleSend}
                  disabled={!canSend || sendMessage.isPending}
                >
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </footer>
          </>
        )}
      </section>

      <ImageCropModal
        open={Boolean(cropSrc)}
        imageSrc={cropSrc}
        fileName={cropName}
        onClose={() => {
          if (cropSrc) URL.revokeObjectURL(cropSrc);
          setCropSrc(null);
        }}
        onCropped={onCropped}
      />
    </div>
  );
}
