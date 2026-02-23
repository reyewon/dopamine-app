'use client';
import React, { useMemo } from 'react';
import {
  Camera, CheckCircle2, ArrowRight, Clock, AlertCircle, CalendarDays, Banknote,
} from 'lucide-react';
import {
  isToday, isTomorrow, format, startOfDay, addDays, isBefore, isAfter,
} from 'date-fns';

/* ─── Types ─────────────────────────────────────────────────────────────── */

interface ShootProgress {
  shoot?: boolean; tickoff?: boolean; cull?: boolean; edit?: boolean; exportUpload?: boolean;
}
interface Shoot {
  id: string; title: string; clientName?: string; location?: string;
  shootDate?: Date | null; editDueDate?: Date | null; price?: number;
  progress?: ShootProgress;
}
interface Task {
  id: string; name: string; isDone: boolean; dueDate?: Date | null;
}
interface Project {
  id: string; name: string; tasks: Task[]; smartProject?: boolean;
}
interface TimelineItem {
  type: 'shoot' | 'task';
  id: string; title: string; subtitle: string; date: Date;
  projectId?: string; price?: number; shootId?: string;
}
interface HomeViewProps {
  shoots: Shoot[];
  projects: Project[];
  onNavigateToShoots: () => void;
  onSelectProject: (id: string) => void;
}

/* ─── Helpers ───────────────────────────────────────────────────────────── */

function getGroupLabel(date: Date, todayStart: Date): string {
  if (isToday(date)) return 'Today';
  if (isTomorrow(date)) return 'Tomorrow';
  if (isBefore(date, addDays(todayStart, 7))) return 'This Week';
  if (isBefore(date, addDays(todayStart, 14))) return 'Next Week';
  return 'Later';
}

const GROUP_ORDER = ['Today', 'Tomorrow', 'This Week', 'Next Week', 'Later'];

/* ─── Sub-components ────────────────────────────────────────────────────── */

function SectionHeading({ label, overdue }: { label: string; overdue?: boolean }) {
  return (
    <div className="flex items-center gap-3 mb-3">
      <span className={`text-xs font-bold uppercase tracking-widest ${overdue ? 'text-red-400/80' : 'text-muted-foreground/60'}`}>
        {label}
      </span>
      <div className={`flex-1 h-px ${overdue ? 'bg-red-500/20' : 'bg-border/50'}`} />
    </div>
  );
}

function ShootCard({ item, onClick }: { item: TimelineItem; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="w-full text-left flex items-center gap-4 p-4 rounded-2xl bg-card border border-border hover:border-primary/50 hover:shadow-lg hover:shadow-primary/5 transition-all duration-150 group"
    >
      <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
        <Camera size={17} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-sm text-foreground truncate">{item.title}</p>
        {item.subtitle && (
          <p className="text-xs text-muted-foreground truncate mt-0.5">{item.subtitle}</p>
        )}
      </div>
      <div className="flex items-center gap-3 flex-shrink-0">
        {item.price ? (
          <span className="text-xs font-semibold text-primary/80 bg-primary/10 px-2 py-0.5 rounded-full">
            £{item.price.toLocaleString()}
          </span>
        ) : null}
        <span className="text-xs text-muted-foreground font-medium w-12 text-right">
          {isToday(item.date) ? 'Today' : format(item.date, 'd MMM')}
        </span>
        <ArrowRight size={14} className="text-muted-foreground/30 group-hover:text-primary/50 transition-colors" />
      </div>
    </button>
  );
}

function TaskCard({ item, onClick }: { item: TimelineItem; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="w-full text-left flex items-center gap-4 p-4 rounded-2xl bg-card border border-border hover:border-muted-foreground/30 transition-all duration-150 group"
    >
      <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-muted/60 flex items-center justify-center text-muted-foreground">
        <CheckCircle2 size={17} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-sm text-foreground truncate">{item.title}</p>
        {item.subtitle && (
          <p className="text-xs text-muted-foreground truncate mt-0.5">{item.subtitle}</p>
        )}
      </div>
      <div className="flex items-center gap-3 flex-shrink-0">
        <span className="text-xs text-muted-foreground font-medium w-12 text-right">
          {isToday(item.date) ? 'Today' : format(item.date, 'd MMM')}
        </span>
        <ArrowRight size={14} className="text-muted-foreground/30 group-hover:text-muted-foreground/60 transition-colors" />
      </div>
    </button>
  );
}

function OverdueCard({ item, onClick }: { item: TimelineItem; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="w-full text-left flex items-center gap-4 p-4 rounded-2xl bg-card border border-red-500/20 hover:border-red-500/40 transition-all duration-150 group"
    >
      <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-red-500/10 flex items-center justify-center text-red-400">
        {item.type === 'shoot' ? <Camera size={17} /> : <Clock size={17} />}
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-sm text-foreground truncate">{item.title}</p>
        {item.subtitle && (
          <p className="text-xs text-muted-foreground truncate mt-0.5">{item.subtitle}</p>
        )}
      </div>
      <div className="flex items-center gap-3 flex-shrink-0">
        <span className="text-xs text-red-400 font-medium">
          {format(item.date, 'd MMM')}
        </span>
        <ArrowRight size={14} className="text-muted-foreground/30 group-hover:text-red-400/60 transition-colors" />
      </div>
    </button>
  );
}

/* ─── Main Component ────────────────────────────────────────────────────── */

export default function HomeView({ shoots, projects, onNavigateToShoots, onSelectProject }: HomeViewProps) {
  const now = new Date();
  const todayStart = startOfDay(now);

  const { grouped, overdue, statsUpcomingShoots, statsOverdue } = useMemo(() => {
    const upcoming: TimelineItem[] = [];
    const overdueItems: TimelineItem[] = [];

    // Upcoming / past shoots (exclude fully exported/completed)
    shoots.forEach(shoot => {
      if (shoot.progress?.exportUpload) return;
      if (!shoot.shootDate) return;
      const date = new Date(shoot.shootDate);
      const item: TimelineItem = {
        type: 'shoot',
        id: shoot.id,
        title: shoot.title,
        subtitle: [shoot.clientName, shoot.location].filter(Boolean).join(' · '),
        date,
        price: shoot.price,
      };
      if (isBefore(date, todayStart)) {
        overdueItems.push(item);
      } else {
        upcoming.push(item);
      }
    });

    // Incomplete tasks with due dates (exclude smart project auto-tasks)
    projects.forEach(project => {
      if (project.smartProject) return;
      project.tasks.forEach(task => {
        if (task.isDone) return;
        if (!task.dueDate) return;
        const date = new Date(task.dueDate);
        const item: TimelineItem = {
          type: 'task',
          id: task.id,
          title: task.name,
          subtitle: project.name,
          date,
          projectId: project.id,
        };
        if (isBefore(date, todayStart)) {
          overdueItems.push(item);
        } else {
          upcoming.push(item);
        }
      });
    });

    upcoming.sort((a, b) => a.date.getTime() - b.date.getTime());
    overdueItems.sort((a, b) => b.date.getTime() - a.date.getTime());

    // Group upcoming by time window
    const groupMap = new Map<string, TimelineItem[]>();
    upcoming.forEach(item => {
      const label = getGroupLabel(item.date, todayStart);
      if (!groupMap.has(label)) groupMap.set(label, []);
      groupMap.get(label)!.push(item);
    });

    const grouped = GROUP_ORDER
      .filter(label => groupMap.has(label))
      .map(label => ({ label, items: groupMap.get(label)! }));

    const statsUpcomingShoots = shoots.filter(
      s => !s.progress?.exportUpload && s.shootDate && !isBefore(new Date(s.shootDate), todayStart)
    ).length;
    const statsOverdue = overdueItems.length;

    return { grouped, overdue: overdueItems, statsUpcomingShoots, statsOverdue };
  }, [shoots, projects, todayStart]);

  const hour = now.getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';

  const handleClick = (item: TimelineItem) => {
    if (item.type === 'shoot') {
      onNavigateToShoots();
    } else if (item.projectId) {
      onSelectProject(item.projectId);
    }
  };

  const isEmpty = grouped.length === 0 && overdue.length === 0;

  return (
    <div className="flex-1 px-6 lg:px-10 pb-20 overflow-y-auto scroll-slim">
      <div className="max-w-3xl mx-auto pt-2 space-y-8">

        {/* ── Header ───────────────────────────────────────── */}
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
          <div>
            <h1 className="text-3xl font-bold text-foreground tracking-tight">
              {greeting}, Ryan.
            </h1>
            <p className="text-muted-foreground mt-1 text-sm">
              {format(now, 'EEEE, d MMMM yyyy')}
            </p>
          </div>

          {/* Quick stats */}
          {(statsUpcomingShoots > 0 || statsOverdue > 0) && (
            <div className="flex items-center gap-3">
              {statsUpcomingShoots > 0 && (
                <div className="flex items-center gap-1.5 text-xs text-primary bg-primary/10 px-3 py-1.5 rounded-full font-medium">
                  <Camera size={12} />
                  {statsUpcomingShoots} upcoming {statsUpcomingShoots === 1 ? 'shoot' : 'shoots'}
                </div>
              )}
              {statsOverdue > 0 && (
                <div className="flex items-center gap-1.5 text-xs text-red-400 bg-red-500/10 px-3 py-1.5 rounded-full font-medium">
                  <AlertCircle size={12} />
                  {statsOverdue} overdue
                </div>
              )}
            </div>
          )}
        </div>

        {/* ── Empty state ───────────────────────────────────── */}
        {isEmpty && (
          <div className="text-center py-20 border border-dashed border-border rounded-2xl">
            <CalendarDays size={36} className="mx-auto text-muted-foreground/30 mb-4" />
            <p className="text-foreground font-semibold">All clear!</p>
            <p className="text-muted-foreground text-sm mt-1">
              No upcoming shoots or task deadlines. Use the bar above to add one.
            </p>
          </div>
        )}

        {/* ── Timeline groups ───────────────────────────────── */}
        {grouped.map(group => (
          <div key={group.label}>
            <SectionHeading label={group.label} />
            <div className="space-y-2">
              {group.items.map(item =>
                item.type === 'shoot'
                  ? <ShootCard key={item.id} item={item} onClick={() => handleClick(item)} />
                  : <TaskCard key={item.id} item={item} onClick={() => handleClick(item)} />
              )}
            </div>
          </div>
        ))}

        {/* ── Overdue ───────────────────────────────────────── */}
        {overdue.length > 0 && (
          <div>
            <SectionHeading label="Overdue" overdue />
            <div className="space-y-2">
              {overdue.map(item => (
                <OverdueCard key={`overdue-${item.id}`} item={item} onClick={() => handleClick(item)} />
              ))}
            </div>
          </div>
        )}

        {/* ── Footer hint ───────────────────────────────────── */}
        {!isEmpty && (
          <p className="text-center text-xs text-muted-foreground/40 pb-4">
            Select a project from the sidebar to view tasks, or use the bar above to create something new.
          </p>
        )}

      </div>
    </div>
  );
}
