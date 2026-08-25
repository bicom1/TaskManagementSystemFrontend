import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  AtSign,
  Bookmark,
  CheckSquare,
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

  return (
    <div className="relative flex min-h-0 flex-1 overflow-hidden bg-[#fafafa]">
      <div className="flex min-w-0 flex-1 flex-col">
        <div className="flex-1 overflow-y-auto px-6 pb-4 pt-5">
          <div className="mx-auto flex max-w-3xl flex-col items-center">
            <div className="mb-6 flex w-full max-w-xl justify-center gap-3">
              <button
                type="button"
                onClick={() => setPeopleOpen(true)}
                className="inline-flex flex-1 items-center justify-center gap-2 rounded-full border border-hairline bg-paper px-5 py-2.5 text-sm font-medium text-ink shadow-sm hover:bg-cloud"
              >
                <Plus className="h-4 w-4" />
                Add People
              </button>
              <button
                type="button"
                onClick={() => toast.info('Slack import is not connected yet')}
                className="inline-flex flex-1 items-center justify-center gap-2 rounded-full border border-hairline bg-paper px-5 py-2.5 text-sm font-medium text-ink shadow-sm hover:bg-cloud"
              >
                <span className="grid h-4 w-4 place-items-center rounded-[3px] bg-[#611f69] text-[9px] font-bold text-white">
                  S
                </span>
                Import from Slack
              </button>
            </div>

            {empty && !channelLoading && (
              <div className="mb-8 w-full max-w-xl space-y-3">
                <button
                  type="button"
                  onClick={onTrackTasks}
                  className="flex w-full items-center gap-4 rounded-2xl bg-[#f3e8ff] px-5 py-4 text-left shadow-sm transition hover:brightness-[0.98]"
                >
                  <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-[#7c3aed] text-white">
                    <CheckSquare className="h-5 w-5" />
                  </span>
                  <span>
                    <span className="block text-[15px] font-semibold text-ink">Track Tasks</span>
                    <span className="block text-sm text-graphite">
                      Manage tasks, bugs, people, and more.
                    </span>
                  </span>
                </button>
                <button
                  type="button"
                  onClick={onAddDoc}
                  className="flex w-full items-center gap-4 rounded-2xl bg-[#e8f1ff] px-5 py-4 text-left shadow-sm transition hover:brightness-[0.98]"
                >
                  <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-[#2563eb] text-white">
                    <FileText className="h-5 w-5" />
                  </span>
                  <span>
                    <span className="block text-[15px] font-semibold text-ink">Add Doc</span>
                    <span className="block text-sm text-graphite">
                      Take notes or create detailed documents.
                    </span>
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => navigate('/home/meetings')}
                  className="flex w-full items-center gap-4 rounded-2xl bg-[#e8f8ef] px-5 py-4 text-left shadow-sm transition hover:brightness-[0.98]"
                >
                  <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-[#16a34a] text-white">
                    <Phone className="h-5 w-5" />
                  </span>
                  <span>
                    <span className="block text-[15px] font-semibold text-ink">Start SyncUp</span>
                    <span className="block text-sm text-graphite">
                      Jump on a voice call or video call.
                    </span>
                  </span>
                </button>
              </div>
            )}

            <div className="mb-6 w-full max-w-xl">
              <button
                type="button"
                onClick={() => toast.success('Bookmark saved on this channel')}
                className="grid h-[72px] w-[72px] place-items-center rounded-xl border border-dashed border-steel bg-paper text-center text-[10px] leading-tight text-graphite hover:border-ink"
              >
                <Bookmark className="mb-1 h-4 w-4" />
                Add bookmarks, notes, and more.
              </button>
            </div>

            {messages.length > 0 && (
              <div className="w-full max-w-2xl space-y-3 pb-8">
                {messages.map((m) => {
                  const mine = String(m.from?._id) === String(userId);
                  return (
                    <div
                      key={m._id}
                      className={cn('flex gap-2', mine ? 'justify-end' : 'justify-start')}
                    >
                      {!mine && <UserAvatar user={m.from} size="sm" />}
                      <div
                        className={cn(
                          'max-w-[78%] rounded-2xl px-3 py-2 text-sm shadow-sm',
                          mine
                            ? 'rounded-tr-md bg-ink text-on-ink'
                            : 'rounded-tl-md border border-hairline bg-paper'
                        )}
                      >
                        {!mine && (
                          <p className="mb-0.5 text-[11px] font-semibold text-graphite">
                            {m.from?.name}
                          </p>
                        )}
                        <p className="whitespace-pre-wrap break-words">{m.body}</p>
                        {(m.attachments || []).map((file) =>
                          isImageFile({ type: file.fileType, name: file.fileName }) ? (
                            <ChatImage
                              key={file.url}
                              src={file.url}
                              previewUrl={file.previewUrl}
                              alt={file.fileName || ''}
                              className="mt-2 max-h-56 max-w-[260px] rounded-lg object-cover"
                            />
                          ) : (
                            <a
                              key={file.url}
                              href={normalizeHref(file.url)}
                              className="mt-2 flex items-center gap-1 text-xs underline"
                              target="_blank"
                              rel="noreferrer"
                            >
                              <Link2 className="h-3 w-3" />
                              {file.fileName}
                            </a>
                          )
                        )}
                        <p className={cn('mt-1 text-[10px]', mine ? 'text-on-ink/60' : 'text-graphite')}>
                          {formatMsgTime(m.createdAt)}
                        </p>
                      </div>
                    </div>
                  );
                })}
                {typingUser ? (
                  <p className="text-xs text-graphite">Someone is typing…</p>
                ) : null}
                <div ref={bottomRef} />
              </div>
            )}
          </div>
        </div>

        <div className="shrink-0 px-4 pb-4 pt-1">
          {bannerOpen && empty && (
            <div className="mx-auto mb-2 flex max-w-3xl items-center justify-between gap-3 rounded-xl bg-[#3d3d3d] px-4 py-2.5 text-sm text-white">
              <span>
                👋 Send a message to #{channelName} to get the conversation started!
              </span>
              <button
                type="button"
                className="shrink-0 text-xs text-white/80 hover:text-white"
                onClick={() => setBannerOpen(false)}
              >
                Dismiss
              </button>
            </div>
          )}

          <div className="mx-auto max-w-3xl rounded-2xl border border-hairline bg-paper shadow-[0_8px_30px_rgba(0,0,0,0.06)]">
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
              className="w-full resize-none rounded-t-2xl border-0 bg-transparent px-4 pt-3 text-sm text-ink outline-none placeholder:text-graphite"
            />
            {pendingFiles.length > 0 && (
              <div className="flex flex-wrap gap-2 px-4 pb-2">
                {pendingFiles.map((file, idx) => (
                  <span
                    key={`${file.name}-${idx}`}
                    className="inline-flex items-center gap-1 rounded-full bg-cloud px-2 py-0.5 text-xs"
                  >
                    {isImageFile(file) ? (
                      <FileThumb file={file} className="h-10 w-10 rounded object-cover" />
                    ) : null}
                    {file.name}
                    <button
                      type="button"
                      onClick={() =>
                        setPendingFiles((prev) => prev.filter((_, i) => i !== idx))
                      }
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            )}
            <div className="flex items-center justify-between gap-2 border-t border-hairline px-2 py-1.5">
              <div className="flex items-center gap-0.5 text-graphite">
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
                  className="rounded-md p-1.5 hover:bg-cloud"
                  onClick={() => fileInputRef.current?.click()}
                  title="Attach"
                >
                  <Plus className="h-4 w-4" />
                </button>
                <span className="hidden rounded-md px-2 py-1 text-xs font-medium text-ink sm:inline">
                  Message
                </span>
                <button type="button" className="rounded-md p-1.5 hover:bg-cloud" title="Mention">
                  <AtSign className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  className="rounded-md p-1.5 hover:bg-cloud"
                  title="Attach file"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Paperclip className="h-4 w-4" />
                </button>
                <button type="button" className="rounded-md p-1.5 hover:bg-cloud" title="Emoji">
                  <Smile className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  className="rounded-md p-1.5 hover:bg-cloud"
                  title="Video"
                  onClick={() => navigate('/home/meetings')}
                >
                  <Video className="h-4 w-4" />
                </button>
                <button type="button" className="rounded-md p-1.5 hover:bg-cloud" title="Voice">
                  <Mic className="h-4 w-4" />
                </button>
              </div>
              <div className="flex items-center gap-1">
                <Button
                  size="sm"
                  onClick={handleSend}
                  disabled={!draft.trim() && !pendingFiles.length}
                >
                  Send
                  <Send className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <aside className="hidden w-14 shrink-0 flex-col items-center gap-3 border-l border-hairline bg-paper py-4 sm:flex">
        <div className="flex flex-col items-center -space-y-1">
          {visibleMembers.map((m) => (
            <UserAvatar key={m._id} user={m} size="sm" className="ring-2 ring-paper" />
          ))}
          {extraCount > 0 && (
            <span className="mt-1 grid h-7 w-7 place-items-center rounded-full bg-cloud text-[10px] font-semibold text-ink">
              +{extraCount}
            </span>
          )}
        </div>
        <button type="button" className="rounded-md p-1.5 text-graphite hover:bg-cloud" title="Search">
          <Search className="h-4 w-4" />
        </button>
        <button type="button" className="rounded-md p-1.5 text-graphite hover:bg-cloud" title="Undo">
          <Undo2 className="h-4 w-4" />
        </button>
        <button
          type="button"
          className="rounded-md p-1.5 text-graphite hover:bg-cloud"
          title="Add people"
          onClick={() => setPeopleOpen(true)}
        >
          <UserPlus className="h-4 w-4" />
        </button>
        <button type="button" className="rounded-md p-1.5 text-graphite hover:bg-cloud" title="Settings">
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
            className="w-full rounded-lg border border-hairline px-3 py-2 text-sm outline-none focus:border-ink"
          />
          <div className="max-h-64 overflow-y-auto">
            {addablePeople.length === 0 ? (
              <p className="px-1 py-6 text-center text-sm text-graphite">No more people to add.</p>
            ) : (
              addablePeople.map((p) => (
                <button
                  key={p._id}
                  type="button"
                  className="flex w-full items-center gap-3 rounded-lg px-2 py-2 text-left hover:bg-cloud"
                  onClick={() =>
                    addMember.mutate(
                      { id: projectId, userId: p._id },
                      { onSuccess: () => setPeopleOpen(false) }
                    )
                  }
                >
                  <UserAvatar user={p} size="sm" />
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-medium">{p.name}</span>
                    <span className="block truncate text-xs text-graphite">{p.email}</span>
                  </span>
                </button>
              ))
            )}
          </div>
          <Button type="button" variant="outline" className="w-full" onClick={() => setInviteOpen(true)}>
            Invite someone new
          </Button>
        </div>
      </Modal>
    </div>
  );
}
