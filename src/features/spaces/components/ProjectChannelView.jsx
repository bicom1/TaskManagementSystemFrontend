import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  AtSign,
  Bookmark,
  CheckSquare,
  ChevronDown,
  FileText,
  Link2,
  Mic,
  Paperclip,
  Phone,
  Plus,
  Search,
  Send,
  Settings,
  Smile,
  Undo2,
  UserPlus,
  Video,
  X,
} from 'lucide-react';
import { format, isToday, isYesterday } from 'date-fns';
import { toast } from 'sonner';
import { useAuthStore } from '@/store/authStore';
import { UserAvatar } from '@/components/UserAvatar';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { InviteModal } from '@/components/InviteModal';
import { cn } from '@/lib/utils';
import { ChatImage, FileThumb } from '@/features/chat/components/ChatImage';
import {
  CHAT_LIMITS,
  isImageFile,
  validateChatFile,
} from '@/features/chat/chatLimits';
import {
  emitChatTyping,
  useConversationMessages,
  useLiveChat,
  useMarkConversationRead,
  useProjectChannel,
  useSendChatMessage,
} from '@/features/chat/hooks/useChat';
import { useAddProjectMember } from '@/features/projects/hooks/useProjects';
import { getProjectAssignablePeople } from '@/features/tasks/components/TaskFormFields';

function formatMsgTime(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  if (isToday(d)) return format(d, 'h:mm a');
  if (isYesterday(d)) return `Yesterday ${format(d, 'h:mm a')}`;
  return format(d, 'MMM d, h:mm a');
}

function normalizeHref(raw) {
  const url = String(raw || '').trim();
  if (!url) return '#';
  if (/^https?:\/\//i.test(url)) return url;
  if (/^www\./i.test(url)) return `https://${url}`;
  return url;
}

const TOOL_BTN =
  'inline-flex h-8 w-8 items-center justify-center rounded-lg text-graphite transition-colors hover:bg-cloud hover:text-ink';

export function ProjectChannelView({
  project,
  projectId,
  people = [],
  onTrackTasks,
  onAddDoc,
}) {
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const userId = user?._id;
  const channelName = project?.name || 'Channel';

  const { data: conversation, isLoading: channelLoading } = useProjectChannel(projectId);
  const conversationId = conversation?._id;
  const { data: messagesRes } = useConversationMessages(conversationId);
  const messages = messagesRes?.data || [];
  const sendMessage = useSendChatMessage(conversationId);
  const markRead = useMarkConversationRead();
  const addMember = useAddProjectMember();

  const [draft, setDraft] = useState('');
  const [pendingFiles, setPendingFiles] = useState([]);
  const [bannerOpen, setBannerOpen] = useState(true);
  const [peopleOpen, setPeopleOpen] = useState(false);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [peopleQuery, setPeopleQuery] = useState('');
  const [typingUser, setTypingUser] = useState(null);
  const bottomRef = useRef(null);
  const fileInputRef = useRef(null);
  const typingTimer = useRef(null);

  const onTyping = useCallback(
    (payload) => {
      if (String(payload.conversationId) !== String(conversationId)) return;
      if (String(payload.from) === String(userId)) return;
      setTypingUser(payload.from);
      clearTimeout(typingTimer.current);
      typingTimer.current = setTimeout(() => setTypingUser(null), 2000);
    },
    [conversationId, userId]
  );

  useLiveChat(conversationId, { onTyping });

  useEffect(() => {
    if (!conversationId) return;
    markRead.mutate(conversationId);
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [conversationId, messages.length]); // eslint-disable-line react-hooks/exhaustive-deps

  const members = useMemo(() => {
    const fromChat = conversation?.participants || [];
    const fromProject = getProjectAssignablePeople(project);
    const map = new Map();
    for (const p of [...fromProject, ...fromChat]) {
      const id = String(p?._id || p);
      if (!id || map.has(id)) continue;
      map.set(id, p._id ? p : { _id: id, name: '?' });
    }
    return [...map.values()];
  }, [conversation, project]);

  const extraCount = Math.max(0, members.length - 3);
  const visibleMembers = members.slice(0, 3);

  const addablePeople = useMemo(() => {
    const memberIds = new Set(members.map((m) => String(m._id)));
    const q = peopleQuery.trim().toLowerCase();
    return (people || [])
      .filter((p) => p?._id && !memberIds.has(String(p._id)))
      .filter(
        (p) =>
          !q ||
          p.name?.toLowerCase().includes(q) ||
          p.email?.toLowerCase().includes(q)
      )
      .slice(0, 20);
  }, [people, members, peopleQuery]);

  const addPendingFile = (file) => {
    const err = validateChatFile(file);
    if (err) {
      toast.error(err);
      return;
    }
    setPendingFiles((prev) => {
      if (prev.length >= CHAT_LIMITS.MAX_FILES) {
        toast.error(`Maximum ${CHAT_LIMITS.MAX_FILES} files per message`);
        return prev;
      }
      return [...prev, file];
    });
  };

  const onPickFiles = (e) => {
    const list = Array.from(e.target.files || []);
    e.target.value = '';
    for (const file of list) {
      addPendingFile(file);
    }
  };

  const handleSend = () => {
    if (!conversationId) return;
    const text = draft.trim();
    if (!text && !pendingFiles.length) return;
    sendMessage.mutate({ body: text, files: pendingFiles, mentions: [], shareLinks: [] });
    setDraft('');
    setPendingFiles([]);
  };

  const empty = messages.length === 0;
  const teamId = project?.team?._id || project?.team || '';
  const canSend = Boolean(draft.trim()) || pendingFiles.length > 0;

  return (
    <div className="relative flex min-h-0 flex-1 overflow-hidden bg-cloud">
      <div className="flex min-w-0 flex-1 flex-col">
        <div className="flex-1 overflow-y-auto px-4 pb-6 pt-6 sm:px-8">
          <div className="mx-auto flex w-full max-w-2xl flex-col items-center">
            {/* Top actions — same as ClickUp channel empty state */}
            <div className="mb-7 flex w-full gap-3">
              <button
                type="button"
                onClick={() => setPeopleOpen(true)}
                className="inline-flex h-11 flex-1 items-center justify-center gap-2 rounded-full border border-hairline bg-paper px-4 text-sm font-medium text-ink shadow-soft-lift transition hover:border-steel hover:bg-cloud"
              >
                <Plus className="h-4 w-4 text-primary" strokeWidth={2.25} />
                Add People
              </button>
              <button
                type="button"
                onClick={() => toast.info('Slack import is not connected yet')}
                className="inline-flex h-11 flex-1 items-center justify-center gap-2 rounded-full border border-hairline bg-paper px-4 text-sm font-medium text-ink shadow-soft-lift transition hover:border-steel hover:bg-cloud"
              >
                <span className="grid h-5 w-5 place-items-center rounded bg-ink text-[10px] font-bold text-on-ink">
                  S
                </span>
                Import from Slack
              </button>
            </div>

            {empty && !channelLoading && (
              <div className="mb-8 w-full space-y-2.5">
                <button
                  type="button"
                  onClick={onTrackTasks}
                  className="group flex w-full items-center gap-4 rounded-2xl border border-primary-soft bg-primary-soft/70 px-4 py-3.5 text-left transition hover:border-primary/30 hover:bg-primary-soft"
                >
                  <span className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-primary text-on-ink shadow-soft-lift transition group-hover:scale-[1.03]">
                    <CheckSquare className="h-5 w-5" />
                  </span>
                  <span className="min-w-0">
                    <span className="block text-[15px] font-semibold tracking-tight text-ink">
                      Track Tasks
                    </span>
                    <span className="mt-0.5 block text-sm text-graphite">
                      Manage tasks, bugs, people, and more.
                    </span>
                  </span>
                </button>

                <button
                  type="button"
                  onClick={onAddDoc}
                  className="group flex w-full items-center gap-4 rounded-2xl border border-hairline bg-paper px-4 py-3.5 text-left shadow-soft-lift transition hover:border-steel hover:bg-cloud"
                >
                  <span className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-ink text-on-ink transition group-hover:scale-[1.03]">
                    <FileText className="h-5 w-5" />
                  </span>
                  <span className="min-w-0">
                    <span className="block text-[15px] font-semibold tracking-tight text-ink">
                      Add Doc
                    </span>
                    <span className="mt-0.5 block text-sm text-graphite">
                      Take notes or create detailed documents.
                    </span>
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => navigate('/home/meetings')}
                  className="group flex w-full items-center gap-4 rounded-2xl border border-hairline bg-fog/80 px-4 py-3.5 text-left transition hover:border-steel hover:bg-fog"
                >
                  <span className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-primary-deep text-on-ink transition group-hover:scale-[1.03]">
                    <Phone className="h-5 w-5" />
                  </span>
                  <span className="min-w-0">
                    <span className="block text-[15px] font-semibold tracking-tight text-ink">
                      Start SyncUp
                    </span>
                    <span className="mt-0.5 block text-sm text-graphite">
                      Jump on a voice call or video call.
                    </span>
                  </span>
                </button>
              </div>
            )}

            <div className="mb-6 w-full">
              <button
                type="button"
                onClick={() => toast.success('Bookmark saved on this channel')}
                className="flex h-[76px] w-[76px] flex-col items-center justify-center gap-1 rounded-xl border border-dashed border-steel bg-paper px-2 text-center text-[10px] leading-tight text-graphite transition hover:border-primary hover:bg-primary-soft/40 hover:text-primary"
              >
                <Bookmark className="h-4 w-4" />
                Add bookmarks, notes, and more.
              </button>
            </div>

            {messages.length > 0 && (
              <div className="w-full space-y-3 pb-4">
                {messages.map((m) => {
                  const mine = String(m.from?._id) === String(userId);
                  return (
                    <div
                      key={m._id}
                      className={cn('flex gap-2.5', mine ? 'justify-end' : 'justify-start')}
                    >
                      {!mine && (
                        <UserAvatar user={m.from} size="sm" className="mt-0.5 shrink-0" />
                      )}
                      <div
                        className={cn(
                          'max-w-[min(78%,28rem)] px-3.5 py-2.5 text-sm shadow-soft-lift',
                          mine
                            ? 'rounded-2xl rounded-tr-md bg-primary text-on-ink'
                            : 'rounded-2xl rounded-tl-md border border-hairline bg-paper text-ink'
                        )}
                      >
                        {!mine && (
                          <p className="mb-1 text-[11px] font-semibold text-charcoal">
                            {m.from?.name}
                          </p>
                        )}
                        {m.body ? (
                          <p className="whitespace-pre-wrap break-words leading-relaxed">
                            {m.body}
                          </p>
                        ) : null}
                        {(m.attachments || []).map((file) =>
                          isImageFile({ type: file.fileType, name: file.fileName }) ? (
                            <ChatImage
                              key={file.url}
                              src={file.url}
                              previewUrl={file.previewUrl}
                              alt={file.fileName || ''}
                              className="mt-2 max-h-56 max-w-full rounded-lg object-cover"
                            />
                          ) : (
                            <a
                              key={file.url}
                              href={normalizeHref(file.url)}
                              className={cn(
                                'mt-2 inline-flex max-w-full items-center gap-1.5 rounded-lg px-2 py-1 text-xs font-medium underline-offset-2 hover:underline',
                                mine ? 'bg-white/15' : 'bg-cloud text-primary'
                              )}
                              target="_blank"
                              rel="noreferrer"
                            >
                              <Link2 className="h-3 w-3 shrink-0" />
                              <span className="truncate">{file.fileName}</span>
                            </a>
                          )
                        )}
                        <p
                          className={cn(
                            'mt-1.5 text-[10px] tabular-nums',
                            mine ? 'text-on-ink/55' : 'text-graphite'
                          )}
                        >
                          {formatMsgTime(m.createdAt)}
                        </p>
                      </div>
                    </div>
                  );
                })}
                {typingUser ? (
                  <p className="pl-1 text-xs text-graphite">Someone is typing…</p>
                ) : null}
                <div ref={bottomRef} />
              </div>
            )}
          </div>
        </div>

        {/* Composer — pinned bottom */}
        <div className="shrink-0 border-t border-hairline/80 bg-cloud/80 px-4 pb-4 pt-3 backdrop-blur-sm sm:px-6">
          {bannerOpen && empty && (
            <div className="mx-auto mb-3 flex max-w-2xl items-center justify-between gap-3 rounded-xl bg-charcoal px-4 py-2.5 text-sm text-on-ink shadow-soft-lift">
              <span className="min-w-0 leading-snug">
                👋 Send a message to{' '}
                <span className="font-semibold">#{channelName}</span> to get the conversation
                started!
              </span>
              <button
                type="button"
                className="shrink-0 rounded-md px-2 py-1 text-xs font-medium text-on-ink/75 transition hover:bg-white/10 hover:text-on-ink"
                onClick={() => setBannerOpen(false)}
              >
                Dismiss
              </button>
            </div>
          )}

          <div className="mx-auto max-w-2xl overflow-hidden rounded-2xl border border-hairline bg-paper shadow-soft-lift focus-within:border-primary/40 focus-within:ring-2 focus-within:ring-primary/15">
            <textarea
              value={draft}
              onChange={(e) => {
                setDraft(e.target.value);
                if (conversationId) emitChatTyping(conversationId);
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
              }}
              rows={2}
              placeholder="+ Mention @Brain to create, find, ask anything."
              className="w-full resize-none border-0 bg-transparent px-4 pt-3.5 text-sm leading-relaxed text-ink outline-none placeholder:text-graphite"
            />

            {pendingFiles.length > 0 && (
              <div className="flex flex-wrap gap-2 px-4 pb-2">
                {pendingFiles.map((file, idx) => (
                  <span
                    key={`${file.name}-${idx}`}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-hairline bg-cloud py-1 pl-1 pr-2 text-xs text-ink"
                  >
                    {isImageFile(file) ? (
                      <FileThumb file={file} className="h-9 w-9 rounded-md object-cover" />
                    ) : (
                      <FileText className="ml-1.5 h-3.5 w-3.5 text-graphite" />
                    )}
                    <span className="max-w-[7rem] truncate">{file.name}</span>
                    <button
                      type="button"
                      className="rounded p-0.5 text-graphite hover:bg-fog hover:text-ink"
                      onClick={() =>
                        setPendingFiles((prev) => prev.filter((_, i) => i !== idx))
                      }
                      aria-label="Remove file"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                ))}
              </div>
            )}

            <div className="flex items-center justify-between gap-2 border-t border-hairline px-2 py-1.5">
              <div className="flex min-w-0 items-center gap-0.5">
                <input
                  ref={fileInputRef}
                  type="file"
                  className="hidden"
                  multiple
                  accept="image/png,image/jpeg,image/webp,image/gif,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.csv,.zip"
                  onChange={onPickFiles}
                />
                <button
                  type="button"
                  className={TOOL_BTN}
                  onClick={() => fileInputRef.current?.click()}
                  title="Attach"
                >
                  <Plus className="h-4 w-4" />
                </button>
                <span className="hidden items-center gap-0.5 rounded-lg px-2 py-1 text-xs font-semibold text-ink sm:inline-flex">
                  Message
                  <ChevronDown className="h-3 w-3 text-graphite" />
                </span>
                <button type="button" className={TOOL_BTN} title="Mention">
                  <AtSign className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  className={TOOL_BTN}
                  title="Attach file"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Paperclip className="h-4 w-4" />
                </button>
                <button type="button" className={cn(TOOL_BTN, 'hidden sm:inline-flex')} title="Emoji">
                  <Smile className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  className={cn(TOOL_BTN, 'hidden sm:inline-flex')}
                  title="Video"
                  onClick={() => navigate('/home/meetings')}
                >
                  <Video className="h-4 w-4" />
                </button>
                <button type="button" className={cn(TOOL_BTN, 'hidden md:inline-flex')} title="Voice">
                  <Mic className="h-4 w-4" />
                </button>
              </div>

              <div className="flex shrink-0 items-center gap-1">
                <button type="button" className={TOOL_BTN} title="Voice note">
                  <Mic className="h-4 w-4 sm:hidden" />
                </button>
                <Button
                  size="sm"
                  onClick={handleSend}
                  disabled={!canSend}
                  className="h-8 gap-1.5 rounded-lg px-3 normal-case tracking-normal"
                >
                  Send
                  <Send className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Right utility rail */}
      <aside className="hidden w-[3.25rem] shrink-0 flex-col items-center gap-2.5 border-l border-hairline bg-paper py-4 sm:flex">
        <div className="mb-1 flex flex-col items-center">
          <div className="flex flex-col items-center -space-y-1.5">
            {visibleMembers.map((m) => (
              <UserAvatar
                key={m._id}
                user={m}
                size="sm"
                className="ring-2 ring-paper"
                title={m.name}
              />
            ))}
          </div>
          {extraCount > 0 && (
            <span className="mt-1.5 grid h-7 w-7 place-items-center rounded-full border border-hairline bg-cloud text-[10px] font-semibold text-charcoal">
              +{extraCount}
            </span>
          )}
        </div>
        <div className="my-1 h-px w-6 bg-hairline" />
        <button type="button" className={TOOL_BTN} title="Search">
          <Search className="h-4 w-4" />
        </button>
        <button type="button" className={TOOL_BTN} title="Undo">
          <Undo2 className="h-4 w-4" />
        </button>
        <button
          type="button"
          className={TOOL_BTN}
          title="Add people"
          onClick={() => setPeopleOpen(true)}
        >
          <UserPlus className="h-4 w-4" />
        </button>
        <button type="button" className={TOOL_BTN} title="Settings">
          <Settings className="h-4 w-4" />
        </button>
      </aside>

      <InviteModal open={inviteOpen} onClose={() => setInviteOpen(false)} defaultTeamId={teamId} />

      <Modal
        open={peopleOpen}
        onClose={() => setPeopleOpen(false)}
        title="Add People"
        description={`Invite teammates into #${channelName}`}
      >
        <div className="space-y-3">
          <input
            value={peopleQuery}
            onChange={(e) => setPeopleQuery(e.target.value)}
            placeholder="Search people"
            className="h-10 w-full rounded-lg border border-hairline bg-paper px-3 text-sm text-ink outline-none placeholder:text-graphite focus:border-primary focus:ring-2 focus:ring-primary/15"
          />
          <div className="max-h-64 overflow-y-auto rounded-lg border border-hairline">
            {addablePeople.length === 0 ? (
              <p className="px-3 py-8 text-center text-sm text-graphite">No more people to add.</p>
            ) : (
              addablePeople.map((p) => (
                <button
                  key={p._id}
                  type="button"
                  className="flex w-full items-center gap-3 border-b border-hairline px-3 py-2.5 text-left last:border-b-0 hover:bg-cloud"
                  onClick={() =>
                    addMember.mutate(
                      { id: projectId, userId: p._id },
                      { onSuccess: () => setPeopleOpen(false) }
                    )
                  }
                >
                  <UserAvatar user={p} size="sm" />
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-medium text-ink">{p.name}</span>
                    <span className="block truncate text-xs text-graphite">{p.email}</span>
                  </span>
                </button>
              ))
            )}
          </div>
          <Button
            type="button"
            variant="outline"
            className="w-full normal-case tracking-normal"
            onClick={() => setInviteOpen(true)}
          >
            Invite someone new
          </Button>
        </div>
      </Modal>
    </div>
  );
}
