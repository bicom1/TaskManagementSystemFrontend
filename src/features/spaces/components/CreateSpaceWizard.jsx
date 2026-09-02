import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ChevronRight,
  HelpCircle,
  Info,
  Layers,
  LayoutList,
  Target,
  ArrowLeftRight,
} from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import { Textarea } from '@/components/ui/Textarea';
import { cn } from '@/lib/utils';
import { useCreateProject } from '@/features/projects/hooks/useProjects';
import { useTeams } from '@/features/teams/hooks/useTeams';
import {
  SPACE_PERMISSION_OPTIONS,
  WORKFLOW_TEMPLATE_LIST,
  getWorkflowTemplate,
  VIEW_LABELS,
  CLICK_APP_LABELS,
} from '../spaceTemplates';

const EMPTY = {
  name: '',
  description: '',
  icon: '',
  isPrivate: false,
  defaultPermission: 'full_edit',
  team: '',
  workflowTemplate: 'starter',
};

function StatusPills({ statuses }) {
  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {statuses.map((s, i) => (
        <span key={s.key} className="flex items-center gap-1.5">
          <span
            className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-white"
            style={{ backgroundColor: s.color }}
          >
            {s.label}
          </span>
          {i < statuses.length - 1 ? (
            <span className="text-graphite">→</span>
          ) : null}
        </span>
      ))}
    </div>
  );
}

export function CreateSpaceWizard({ open, onClose, initialStep = 1, defaultTeamId = '' }) {
  const navigate = useNavigate();
  const createProject = useCreateProject();
  const { data: teamsData } = useTeams({ limit: 50 });
  const teams = teamsData?.data ?? [];

  const [step, setStep] = useState(1);
  const [form, setForm] = useState(EMPTY);
  const [viewsOpen, setViewsOpen] = useState(false);
  const [statusesOpen, setStatusesOpen] = useState(false);
  const [appsOpen, setAppsOpen] = useState(false);
  const [customViews, setCustomViews] = useState(null);
  const [customStatuses, setCustomStatuses] = useState(null);
  const [customApps, setCustomApps] = useState(null);

  useEffect(() => {
    if (!open) return;
    setStep(initialStep === 2 ? 2 : 1);
    setForm({
      ...EMPTY,
      team: defaultTeamId || '',
      icon: '',
    });
    setViewsOpen(false);
    setStatusesOpen(false);
    setAppsOpen(false);
    setCustomViews(null);
    setCustomStatuses(null);
    setCustomApps(null);
  }, [open, initialStep, defaultTeamId]);

  useEffect(() => {
    if (!open || defaultTeamId) return;
    if (form.team || !teams[0]?._id) return;
    setForm((f) => ({ ...f, team: teams[0]._id }));
  }, [open, defaultTeamId, teams, form.team]);

  const template = useMemo(
    () => getWorkflowTemplate(form.workflowTemplate),
    [form.workflowTemplate]
  );

  const views = customViews || template.defaultViews;
  const statuses = customStatuses || template.statuses;
  const clickApps = customApps || template.clickApps;

  const iconLetter = (form.icon || form.name?.[0] || 'P').toString().slice(0, 1).toUpperCase();

  const setField = (key, value) => setForm((f) => ({ ...f, [key]: value }));

  const canContinueStep1 = form.name.trim().length >= 2 && Boolean(form.team);

  const handleCreate = async () => {
    if (!form.team) return;
    const payload = {
      name: form.name.trim(),
      description: form.description.trim(),
      icon: iconLetter,
      isPrivate: form.isPrivate,
      defaultPermission: form.defaultPermission,
      kind: 'project',
      workflowTemplate: form.workflowTemplate,
      defaultViews: views,
      statuses,
      clickApps,
      activeView: views.includes('list') ? 'list' : views[0],
      team: form.team,
    };

    createProject.mutate(payload, {
      onSuccess: (project) => {
        onClose?.();
        navigate(`/projects/${project._id}?view=list`);
      },
    });
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      size="lg"
      variant="premium"
      badge="Templates"
      tone="brand"
      title={step === 1 ? 'Create a Project' : 'Define your workflow'}
      description={
        step === 1
          ? 'A project groups tasks, workflows, and views for a team or initiative.'
          : 'Choose a pre-configured solution or customize apps, views, and task statuses.'
      }
      bodyClassName="pb-2"
    >
      {step === 1 ? (
        <div className="space-y-5">
          <div className="flex gap-3">
            <button
              type="button"
              className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg border border-hairline bg-cloud text-lg font-bold text-ink"
              title="Project icon"
              onClick={() => {
                const next = window.prompt('Icon letter (1 character)', iconLetter);
                if (next != null && next.trim()) setField('icon', next.trim().slice(0, 1));
              }}
            >
              {iconLetter}
            </button>
            <div className="min-w-0 flex-1 space-y-1.5">
              <Label htmlFor="project-name" className="sr-only">
                Name
              </Label>
              <Input
                id="project-name"
                autoFocus
                placeholder="e.g. Website Redesign, Q4 Launch"
                value={form.name}
                onChange={(e) => setField('name', e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="project-desc">Description (optional)</Label>
            <Textarea
              id="project-desc"
              rows={2}
              placeholder="What is this project for?"
              value={form.description}
              onChange={(e) => setField('description', e.target.value)}
            />
          </div>

          {teams.length > 0 ? (
            <div className="space-y-1.5">
              <Label htmlFor="project-team">Team (required)</Label>
              <select
                id="project-team"
                className="flex h-10 w-full rounded-md border border-hairline bg-paper px-3 text-sm text-ink disabled:opacity-70"
                value={form.team}
                disabled={Boolean(defaultTeamId)}
                onChange={(e) => setField('team', e.target.value)}
              >
                <option value="">Select team</option>
                {teams.map((t) => (
                  <option key={t._id} value={t._id}>
                    {t.name}
                  </option>
                ))}
              </select>
              <p className="text-xs text-graphite">
                Everyone on this team will see this project in their sidebar automatically.
              </p>
            </div>
          ) : (
            <p className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-ink">
              Create a team first under Teams, then create a project for that team.
            </p>
          )}

          <div className="space-y-3 rounded-lg border border-hairline">
            <div className="flex items-center justify-between gap-3 px-4 py-3">
              <div className="flex items-center gap-1.5 text-sm font-medium text-ink">
                Default permission
                <Info className="h-3.5 w-3.5 text-graphite" />
              </div>
              <select
                className="rounded-md border border-hairline bg-paper px-2 py-1.5 text-sm text-ink"
                value={form.defaultPermission}
                onChange={(e) => setField('defaultPermission', e.target.value)}
              >
                {SPACE_PERMISSION_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex items-center justify-between gap-3 border-t border-hairline px-4 py-3">
              <div>
                <p className="text-sm font-medium text-ink">Make Private</p>
                <p className="text-xs text-graphite">Only you and invited members have access</p>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={form.isPrivate}
                onClick={() => setField('isPrivate', !form.isPrivate)}
                className={cn(
                  'relative h-6 w-11 rounded-full transition-colors',
                  form.isPrivate ? 'bg-ink' : 'bg-cloud'
                )}
              >
                <span
                  className={cn(
                    'absolute top-0.5 h-5 w-5 rounded-full bg-paper shadow transition-transform',
                    form.isPrivate ? 'left-[22px]' : 'left-0.5'
                  )}
                />
              </button>
            </div>
          </div>

          <div className="flex items-center justify-between gap-3 pt-2">
            <Button type="button" variant="ghost" disabled>
              Use Templates
            </Button>
            <Button
              type="button"
              disabled={!canContinueStep1}
              onClick={() => setStep(2)}
            >
              Continue
            </Button>
          </div>
        </div>
      ) : (
        <div className="space-y-5">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {WORKFLOW_TEMPLATE_LIST.map((t) => {
              const selected = form.workflowTemplate === t.id;
              return (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => {
                    setField('workflowTemplate', t.id);
                    setCustomViews(null);
                    setCustomStatuses(null);
                    setCustomApps(null);
                  }}
                  className={cn(
                    'rounded-xl border px-4 py-4 text-left transition-colors',
                    selected
                      ? 'border-ink bg-cloud'
                      : 'border-hairline bg-paper hover:border-charcoal/40'
                  )}
                >
                  <p className="text-sm font-semibold text-ink">{t.name}</p>
                  <p className="mt-1 text-xs text-graphite">{t.description}</p>
                </button>
              );
            })}
          </div>

          <div>
            <p className="mb-2 text-sm font-semibold text-ink">
              Customize defaults for {template.name}
            </p>
            <div className="overflow-hidden rounded-xl border border-hairline">
              {/* Default views */}
              <button
                type="button"
                className="flex w-full items-center gap-3 border-b border-hairline px-4 py-3 text-left hover:bg-cloud/60"
                onClick={() => setViewsOpen((v) => !v)}
              >
                <span className="flex h-9 w-9 items-center justify-center rounded-md border border-hairline bg-cloud">
                  <Layers className="h-4 w-4 text-ink" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="flex items-center gap-1 text-sm font-medium text-ink">
                    Default views
                    <HelpCircle className="h-3.5 w-3.5 text-graphite" />
                  </span>
                  <span className="text-xs text-graphite">
                    {views.map((v) => VIEW_LABELS[v] || v).join(', ')}
                  </span>
                </span>
                <ChevronRight
                  className={cn('h-4 w-4 text-graphite transition-transform', viewsOpen && 'rotate-90')}
                />
              </button>
              {viewsOpen && (
                <div className="flex flex-wrap gap-2 border-b border-hairline bg-cloud/40 px-4 py-3">
                  {Object.entries(VIEW_LABELS).map(([key, label]) => {
                    const on = views.includes(key);
                    return (
                      <button
                        key={key}
                        type="button"
                        onClick={() => {
                          setCustomViews((prev) => {
                            const base = prev || [...template.defaultViews];
                            if (base.includes(key)) {
                              if (base.length === 1) return base;
                              return base.filter((v) => v !== key);
                            }
                            return [...base, key];
                          });
                        }}
                        className={cn(
                          'rounded-md border px-2.5 py-1 text-xs font-medium',
                          on ? 'border-ink bg-ink text-on-ink' : 'border-hairline bg-paper text-charcoal'
                        )}
                      >
                        {label}
                      </button>
                    );
                  })}
                </div>
              )}

              {/* Task statuses */}
              <button
                type="button"
                className="flex w-full items-center gap-3 border-b border-hairline px-4 py-3 text-left hover:bg-cloud/60"
                onClick={() => setStatusesOpen((v) => !v)}
              >
                <span className="flex h-9 w-9 items-center justify-center rounded-md border border-hairline bg-cloud">
                  <Target className="h-4 w-4 text-ink" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="flex items-center gap-1 text-sm font-medium text-ink">
                    Task statuses
                    <HelpCircle className="h-3.5 w-3.5 text-graphite" />
                  </span>
                  <span className="mt-1 block">
                    <StatusPills statuses={statuses} />
                  </span>
                </span>
                <ChevronRight
                  className={cn(
                    'h-4 w-4 shrink-0 text-graphite transition-transform',
                    statusesOpen && 'rotate-90'
                  )}
                />
              </button>
              {statusesOpen && (
                <div className="space-y-2 border-b border-hairline bg-cloud/40 px-4 py-3 text-xs text-graphite">
                  <p>
                    Status workflow comes from the <strong className="text-ink">{template.name}</strong>{' '}
                    template. Switching templates above updates this flow.
                  </p>
                  <LayoutList className="h-4 w-4" />
                </div>
              )}

              {/* ClickApps */}
              <button
                type="button"
                className="flex w-full items-center gap-3 px-4 py-3 text-left hover:bg-cloud/60"
                onClick={() => setAppsOpen((v) => !v)}
              >
                <span className="flex h-9 w-9 items-center justify-center rounded-md border border-hairline bg-cloud">
                  <ArrowLeftRight className="h-4 w-4 text-ink" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="flex items-center gap-1 text-sm font-medium text-ink">
                    Apps
                    <HelpCircle className="h-3.5 w-3.5 text-graphite" />
                  </span>
                  <span className="line-clamp-1 text-xs text-graphite">
                    {clickApps.map((a) => CLICK_APP_LABELS[a] || a).join(', ')}
                  </span>
                </span>
                <ChevronRight
                  className={cn('h-4 w-4 text-graphite transition-transform', appsOpen && 'rotate-90')}
                />
              </button>
              {appsOpen && (
                <div className="flex flex-wrap gap-2 border-t border-hairline bg-cloud/40 px-4 py-3">
                  {Object.entries(CLICK_APP_LABELS).map(([key, label]) => {
                    const on = clickApps.includes(key);
                    return (
                      <button
                        key={key}
                        type="button"
                        onClick={() => {
                          setCustomApps((prev) => {
                            const base = prev || [...template.clickApps];
                            if (base.includes(key)) return base.filter((a) => a !== key);
                            return [...base, key];
                          });
                        }}
                        className={cn(
                          'rounded-md border px-2.5 py-1 text-xs font-medium',
                          on ? 'border-ink bg-ink text-on-ink' : 'border-hairline bg-paper text-charcoal'
                        )}
                      >
                        {label}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center justify-between gap-3 pt-1">
            <Button type="button" variant="outline" onClick={() => setStep(1)}>
              Back
            </Button>
            <Button
              type="button"
              onClick={handleCreate}
              disabled={createProject.isPending}
            >
              {createProject.isPending ? 'Creating…' : 'Create Project'}
            </Button>
          </div>
        </div>
      )}
    </Modal>
  );
}
