import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Bell, CheckCheck, Mail, Plus, Send, ListTodo, MessageSquare } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { useNotifications, useMarkAllRead, useMarkOneRead, useUnreadCount } from '@/features/notifications/hooks/useNotifications';
import { taskApi } from '@/features/tasks/api/taskApi';
import {
  useMessageInbox,
  useSendMessage,
  useMarkMessageRead,
  useMarkAllMessagesRead,
  useCreateTaskFromMessage,
} from '@/features/messages/hooks/useMessages';
import { useConversations } from '@/features/chat/hooks/useChat';
import { InboxChat } from '@/features/chat/components/InboxChat';
import { useDepartments } from '@/features/departments/hooks/useDepartments';
import { useTeams } from '@/features/teams/hooks/useTeams';
import { useUsers } from '@/features/users/hooks/useUsers';
import { useProjects } from '@/features/projects/hooks/useProjects';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import { Textarea } from '@/components/ui/Textarea';
import { Select } from '@/components/ui/Select';
import { LoadingScreen, EmptyState } from '@/components/ui/Spinner';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/store/authStore';

function ComposeQueryModal({ open, onClose }) {
  const sendMessage = useSendMessage();
  const { data: departmentsData } = useDepartments({ limit: 100 });
  const { data: teamsData } = useTeams({ limit: 100 });
  const { data: usersData } = useUsers({ limit: 100 });

  const departments = departmentsData?.data ?? [];
  const teams = teamsData?.data ?? [];
  const users = usersData?.data ?? [];

  const { register, handleSubmit, reset, watch } = useForm({
    defaultValues: {
      recipientType: 'department',
      to: '',
      department: '',
      team: '',
      subject: '',
      body: '',
    },
  });

  const recipientType = watch('recipientType');

  const onSubmit = (values) => {
    const payload = {
      subject: values.subject,
      body: values.body,
      type: 'query',
    };
    if (values.recipientType === 'person' && values.to) {
      payload.to = values.to;
    } else if (values.recipientType === 'department' && values.department) {
      payload.department = values.department;
    } else if (values.recipientType === 'team' && values.team) {
      payload.team = values.team;
    }

    sendMessage.mutate(payload, {
      onSuccess: () => {
        reset();
        onClose();
      },
    });
  };

  return (
    <Modal open={open} onClose={onClose} title="Compose query">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="recipientType">Send to</Label>
          <Select id="recipientType" {...register('recipientType')}>
            <option value="department">Department</option>
            <option value="team">Team</option>
            <option value="person">Person</option>
          </Select>
        </div>

        {recipientType === 'department' && (
          <div className="space-y-2">
            <Label htmlFor="department">Department</Label>
            <Select id="department" {...register('department', { required: true })}>
              <option value="">Select department</option>
              {departments.map((dept) => (
                <option key={dept._id} value={dept._id}>
                  {dept.name}
                </option>
              ))}
            </Select>
          </div>
        )}

        {recipientType === 'team' && (
          <div className="space-y-2">
            <Label htmlFor="team">Team</Label>
            <Select id="team" {...register('team', { required: true })}>
              <option value="">Select team</option>
              {teams.map((team) => (
                <option key={team._id} value={team._id}>
                  {team.name}
                  {team.department?.name ? ` (${team.department.name})` : ''}
                </option>
              ))}
            </Select>
          </div>
        )}

        {recipientType === 'person' && (
          <div className="space-y-2">
            <Label htmlFor="to">Person</Label>
            <Select id="to" {...register('to', { required: true })}>
              <option value="">Select person</option>
              {users.map((u) => (
                <option key={u._id} value={u._id}>
                  {u.name}
                </option>
              ))}
            </Select>
          </div>
        )}

        <div className="space-y-2">
          <Label htmlFor="subject">Subject</Label>
          <Input id="subject" {...register('subject', { required: true })} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="body">Message</Label>
          <Textarea id="body" rows={4} {...register('body', { required: true })} />
        </div>
        <div className="flex justify-end gap-3 pt-2">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" disabled={sendMessage.isPending}>
            {sendMessage.isPending ? 'Sending…' : 'Send query'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}

function MessageDetail({ message, onClose, isIncoming, startCreateTask = false }) {
  const navigate = useNavigate();
  const createTask = useCreateTaskFromMessage();
  const { data: projectsData } = useProjects({ limit: 100 });
  const projects = projectsData?.data ?? [];
  const [projectId, setProjectId] = useState('');
  const [showCreateTask, setShowCreateTask] = useState(startCreateTask);

  const handleCreateTask = () => {
    if (!projectId) return;
    createTask.mutate(
      { id: message._id, projectId, title: message.subject },
      {
        onSuccess: (task) => {
          onClose();
          if (task?.project) {
            navigate(`/projects/${task.project}`);
          }
        },
      }
    );
  };

  return (
    <Modal open onClose={onClose} title={message.subject}>
      <div className="space-y-4">
        <div className="text-sm text-graphite">
          <p>
            {isIncoming ? 'From' : 'To'}:{' '}
            <span className="font-medium text-ink">
              {isIncoming ? message.from?.name : message.to?.name}
            </span>
          </p>
          <p className="mt-1">
            {formatDistanceToNow(new Date(message.createdAt), { addSuffix: true })}
          </p>
          {message.department?.name && (
            <p className="mt-1">Department: {message.department.name}</p>
          )}
          {message.team?.name && <p className="mt-1">Team: {message.team.name}</p>}
        </div>
        <p className="whitespace-pre-wrap text-sm text-charcoal">{message.body}</p>

        {showCreateTask ? (
          <div className="space-y-3 rounded-lg border border-hairline bg-cloud p-3">
            <Label htmlFor="create-task-project">Project</Label>
            <Select
              id="create-task-project"
              value={projectId}
              onChange={(e) => setProjectId(e.target.value)}
            >
              <option value="">Select project</option>
              {projects.map((p) => (
                <option key={p._id} value={p._id}>
                  {p.name} ({p.key})
                </option>
              ))}
            </Select>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" size="sm" onClick={() => setShowCreateTask(false)}>
                Cancel
              </Button>
              <Button
                type="button"
                size="sm"
                disabled={!projectId || createTask.isPending}
                onClick={handleCreateTask}
              >
                {createTask.isPending ? 'Creating…' : 'Create task'}
              </Button>
            </div>
          </div>
        ) : null}

        <div className="flex flex-wrap justify-end gap-3">
          {!showCreateTask && (
            <Button type="button" variant="outline" onClick={() => setShowCreateTask(true)}>
              <ListTodo className="h-4 w-4" />
              Create task
            </Button>
          )}
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
        </div>
      </div>
    </Modal>
  );
}

export default function NotificationsPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const tabParam = searchParams.get('tab');
  const defaultTab =
    tabParam === 'notifications' || tabParam === 'messages' || tabParam === 'chat'
      ? tabParam
      : searchParams.get('chat')
        ? 'chat'
        : 'chat';
  const [tab, setTab] = useState(defaultTab);

  useEffect(() => {
    if (tabParam === 'notifications' || tabParam === 'messages' || tabParam === 'chat') {
      setTab(tabParam);
    }
  }, [tabParam]);
  const [composeOpen, setComposeOpen] = useState(false);
  const [selectedMessage, setSelectedMessage] = useState(null);
  const [openCreateTask, setOpenCreateTask] = useState(false);
  const userId = useAuthStore((s) => s.user?._id);

  const isMessageRecipient = (m) => {
    const toId = m.to?._id ?? m.to;
    return toId && String(toId) === String(userId);
  };

  const { data: notifData, isLoading: notifLoading } = useNotifications({ limit: 50 });
  const { data: unreadCount = 0 } = useUnreadCount();
  const markAllNotifRead = useMarkAllRead();
  const markOneNotifRead = useMarkOneRead();

  const { data: inboxData, isLoading: inboxLoading } = useMessageInbox({ limit: 50 });
  const markMessageRead = useMarkMessageRead();
  const markAllMessagesRead = useMarkAllMessagesRead();
  const { data: chatData } = useConversations();

  const notifications = notifData?.data ?? [];
  // Prefer live unread API count (TopBar / sidebar badges use the same source)
  const notifUnread = unreadCount;

  // Seeing the Notifications tab counts as reading them — clear the badge
  useEffect(() => {
    if (tab !== 'notifications') return;
    if (notifLoading) return;
    if (markAllNotifRead.isPending) return;
    const hasUnread = unreadCount > 0 || notifications.some((n) => !n.isRead);
    if (!hasUnread) return;
    markAllNotifRead.mutate();
  }, [tab, notifLoading, unreadCount]); // eslint-disable-line react-hooks/exhaustive-deps

  const openNotification = async (n) => {
    if (!n.isRead) markOneNotifRead.mutate(n._id);

    if (n.entityType === 'Project' && n.entityId) {
      navigate(`/projects/${n.entityId}`);
      return;
    }

    if (n.entityType === 'Task' && n.entityId) {
      try {
        const task = await taskApi.getById(n.entityId);
        const projectId = task?.project?._id || task?.project;
        if (projectId) {
          navigate(`/projects/${projectId}?task=${n.entityId}`);
          return;
        }
      } catch {
        // Fall through to all-tasks
      }
      navigate('/all-tasks');
    }
  };

  const messages = inboxData?.data ?? [];
  const messageUnread = inboxData?.unread ?? 0;
  const chatUnread = chatData?.unread ?? 0;

  const isLoading =
    tab === 'notifications' ? notifLoading : tab === 'messages' ? inboxLoading : false;

  const openMessage = (message, { createTask = false } = {}) => {
    setSelectedMessage(message);
    setOpenCreateTask(createTask);
    if (isMessageRecipient(message) && !message.isRead) {
      markMessageRead.mutate(message._id);
    }
  };

  const tabs = [
    { id: 'chat', label: 'Chat', unread: chatUnread, icon: MessageSquare },
    { id: 'notifications', label: 'Notifications', unread: notifUnread, icon: Bell },
    { id: 'messages', label: 'Queries', unread: messageUnread, icon: Mail },
  ];

  return (
    <div
      className={cn(
        'mx-auto px-4 py-6 lg:px-8',
        tab === 'chat' ? 'max-w-6xl' : 'max-w-3xl'
      )}
    >
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-[0.08em] text-graphite">
            Activity
          </p>
          <h1 className="page-title">Inbox</h1>
          <p className="page-subtitle">
            Real-time chat, notifications, and workplace queries
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {tab === 'messages' && (
            <>
              <Button variant="outline" onClick={() => setComposeOpen(true)}>
                <Plus className="h-4 w-4" />
                Compose query
              </Button>
              {messageUnread > 0 && (
                <Button
                  variant="outline"
                  onClick={() => markAllMessagesRead.mutate()}
                  disabled={markAllMessagesRead.isPending}
                >
                  <CheckCheck className="h-4 w-4" />
                  Mark all read
                </Button>
              )}
            </>
          )}
          {tab === 'notifications' && notifUnread > 0 && (
            <Button
              variant="outline"
              onClick={() => markAllNotifRead.mutate()}
              disabled={markAllNotifRead.isPending}
            >
              <CheckCheck className="h-4 w-4" />
              Mark all read
            </Button>
          )}
        </div>
      </div>

      <div className="mb-6 flex gap-1 rounded-lg border border-hairline bg-cloud p-1">
        {tabs.map((t) => {
          const Icon = t.icon;
          return (
            <button
              key={t.id}
              type="button"
              onClick={() => setTab(t.id)}
              className={cn(
                'flex flex-1 items-center justify-center gap-2 rounded-md px-4 py-2 text-sm font-medium transition-colors',
                tab === t.id
                  ? 'bg-paper text-ink shadow-[var(--shadow-soft-lift)]'
                  : 'text-charcoal hover:text-ink'
              )}
            >
              <Icon className="h-4 w-4" />
              {t.label}
              {t.unread > 0 && (
                <span className="rounded-sm bg-primary px-1.5 py-0.5 text-[10px] font-bold text-on-ink">
                  {t.unread > 99 ? '99+' : t.unread}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {tab === 'chat' ? (
        <InboxChat />
      ) : isLoading ? (
        <LoadingScreen />
      ) : tab === 'notifications' ? (
        notifications.length === 0 ? (
          <EmptyState
            icon={Bell}
            title="No notifications"
            description="Assignments, comments, due dates, and invites will show up here."
          />
        ) : (
          <ul className="space-y-3">
            {notifications.map((n) => (
              <li key={n._id}>
                <button
                  type="button"
                  className="w-full text-left"
                  onClick={() => openNotification(n)}
                >
                  <Card
                    className={cn(
                      'transition hover:border-steel',
                      !n.isRead && 'border-primary-soft bg-primary-soft/30'
                    )}
                  >
                    <CardContent className="flex items-start justify-between gap-4 py-4">
                      <div>
                        <p className="text-sm text-ink">{n.message}</p>
                        <p className="mt-1 text-xs text-graphite">
                          {formatDistanceToNow(new Date(n.createdAt), { addSuffix: true })}
                          {n.sender && ` · ${n.sender.name}`}
                        </p>
                      </div>
                      {!n.isRead && <Badge variant="default">New</Badge>}
                    </CardContent>
                  </Card>
                </button>
              </li>
            ))}
          </ul>
        )
      ) : messages.length === 0 ? (
        <EmptyState
          icon={Send}
          title="No messages yet"
          description="Send a query to a department, team, or colleague."
          action={
            <Button onClick={() => setComposeOpen(true)}>
              <Plus className="h-4 w-4" />
              Compose query
            </Button>
          }
        />
      ) : (
        <ul className="space-y-3">
          {messages.map((m) => {
            const isUnread = isMessageRecipient(m) && !m.isRead;
            return (
              <li key={m._id}>
                <Card
                  className={cn(
                    'transition-shadow hover:shadow-md',
                    isUnread && 'border-primary-soft bg-primary-soft/30'
                  )}
                >
                  <CardContent className="flex items-start justify-between gap-4 py-4">
                    <button
                      type="button"
                      onClick={() => openMessage(m)}
                      className="min-w-0 flex-1 text-left"
                    >
                      <p className="truncate font-medium text-ink">{m.subject}</p>
                      <p className="mt-1 line-clamp-2 text-sm text-graphite">{m.body}</p>
                      <p className="mt-2 text-xs text-graphite">
                        {m.from?.name && `From ${m.from.name}`}
                        {m.department?.name && ` · ${m.department.name}`}
                        {m.team?.name && ` · ${m.team.name}`}
                        {m.createdAt &&
                          ` · ${formatDistanceToNow(new Date(m.createdAt), { addSuffix: true })}`}
                      </p>
                    </button>
                    <div className="flex shrink-0 flex-col items-end gap-2">
                      {isUnread && <Badge variant="default">New</Badge>}
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={(e) => {
                          e.stopPropagation();
                          openMessage(m, { createTask: true });
                        }}
                      >
                        <ListTodo className="h-3.5 w-3.5" />
                        Create task
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </li>
            );
          })}
        </ul>
      )}

      <ComposeQueryModal open={composeOpen} onClose={() => setComposeOpen(false)} />

      {selectedMessage && (
        <MessageDetail
          message={selectedMessage}
          onClose={() => {
            setSelectedMessage(null);
            setOpenCreateTask(false);
          }}
          isIncoming={isMessageRecipient(selectedMessage)}
          startCreateTask={openCreateTask}
        />
      )}
    </div>
  );
}
