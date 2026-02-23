'use client';
import React, { useEffect, useRef, useState } from 'react';
import { Clock, Edit3, Share2, Camera, CheckCircle2, Trash2 } from 'lucide-react';

export const ProjectHero = ({ project, onEditProject, onDeleteProject }) => {
  if (!project) return null;

  const taskCount = project.tasks.length;
  const completedCount = project.tasks.filter(t => t.isDone).length;
  const progress = taskCount > 0 ? Math.round((completedCount / taskCount) * 100) : 0;

  // Animate the bar into view
  const [displayProgress, setDisplayProgress] = useState(0);
  const initialised = useRef(false);
  useEffect(() => {
    const delay = initialised.current ? 0 : 120;
    initialised.current = true;
    const t = setTimeout(() => setDisplayProgress(progress), delay);
    return () => clearTimeout(t);
  }, [progress]);

  const allDone = taskCount > 0 && completedCount === taskCount;

  const priorityStyle =
    project.priority === 'High'
      ? 'bg-red-50 text-red-500 border border-red-200'
      : project.priority === 'Medium'
      ? 'bg-amber-50 text-amber-600 border border-amber-200'
      : 'bg-green-50 text-green-600 border border-green-200';

  return (
    <section className="bg-card rounded-[2rem] shadow-sm border border-border relative overflow-hidden animate-slide-up">
      {/* Warm glow orb */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary/5 rounded-full blur-[90px] -translate-y-1/2 translate-x-1/3 pointer-events-none" />

      <div className="relative z-10 p-8 flex flex-col md:flex-row justify-between gap-8 md:items-start">
        <div className="flex-1 min-w-0">
          {/* Badges row */}
          <div className="flex flex-wrap items-center gap-2 mb-4">
            {!project.smartProject && (
              <span className={`px-3 py-1.5 rounded-full text-[11px] font-bold uppercase tracking-wider ${priorityStyle}`}>
                {project.priority}
              </span>
            )}
            {project.smartProject && (
              <span className="bg-accent/50 text-accent-foreground px-3 py-1.5 rounded-full text-[11px] font-bold uppercase tracking-wider flex items-center gap-1.5 border border-accent/60">
                <Camera size={13} /> Smart Project
              </span>
            )}
            {allDone && (
              <span className="bg-emerald-50 text-emerald-600 border border-emerald-200 px-3 py-1.5 rounded-full text-[11px] font-bold uppercase tracking-wider flex items-center gap-1.5">
                <CheckCircle2 size={13} /> Complete
              </span>
            )}
            <span className="text-muted-foreground text-sm font-medium flex items-center gap-1.5">
              <Clock size={15} /> {project.dueDate}
            </span>
          </div>

          <h1 className="text-4xl font-extrabold tracking-tight mb-3 text-foreground leading-tight">{project.name}</h1>
          <p className="text-muted-foreground max-w-xl leading-relaxed">{project.description}</p>

          {taskCount > 0 && (
            <div className="mt-4">
              <span className="text-xs font-semibold text-muted-foreground bg-background border border-border px-2.5 py-1 rounded-full inline-block">
                {completedCount} / {taskCount} tasks done
              </span>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex gap-2.5 shrink-0">
          {!project.smartProject && (
            <button
              onClick={onEditProject}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-border bg-white text-foreground text-sm font-bold hover:border-primary/30 hover:shadow-sm transition-all duration-200 shadow-sm"
            >
              <Edit3 size={15} /> <span className="hidden sm:inline">Edit</span>
            </button>
          )}
          <button className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-border bg-white text-foreground text-sm font-bold hover:border-primary/30 hover:shadow-sm transition-all duration-200 shadow-sm">
            <Share2 size={15} /> <span className="hidden sm:inline">Share</span>
          </button>
          {!project.smartProject && onDeleteProject && (
            <button
              onClick={() => {
                if (window.confirm(`Delete project "${project.name}"? This cannot be undone.`)) {
                  onDeleteProject(project.id);
                }
              }}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-red-200 bg-white text-red-500 text-sm font-bold hover:bg-red-50 hover:border-red-300 transition-all duration-200 shadow-sm"
              title="Delete project"
            >
              <Trash2 size={15} /> <span className="hidden sm:inline">Delete</span>
            </button>
          )}
        </div>
      </div>

      {/* Progress bar */}
      {taskCount > 0 && (
        <div className="px-8 pb-8 relative z-10">
          <div className="bg-primary rounded-2xl p-6">
            <div className="flex justify-between items-end mb-3">
              <span className="text-xs font-bold text-primary-foreground/60 uppercase tracking-widest">Overall Progress</span>
              <span className="text-3xl font-extrabold text-primary-foreground tabular-nums">{displayProgress}%</span>
            </div>
            <div className="h-2 w-full bg-white/20 rounded-full overflow-hidden">
              <div
                className="h-full bg-white rounded-full progress-bar-fill"
                style={{ width: `${displayProgress}%` }}
              />
            </div>
          </div>
        </div>
      )}
    </section>
  );
};
