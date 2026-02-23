'use client';
import React from 'react';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { cn } from '@/lib/utils';
import { Layout, Settings, Zap, Plus, Camera, X } from 'lucide-react';

const PROJECT_COLOURS = [
  'bg-primary',
  'bg-sky-400',
  'bg-violet-400',
  'bg-emerald-400',
  'bg-amber-400',
  'bg-rose-400',
];

export const Sidebar = ({ projects, user, selectedProjectId, onSelectProject, onAddProject, onNavigate, activeView, isOpen, onClose }) => {
  return (
    <>
      {/* Mobile overlay backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-30 md:hidden"
          onClick={onClose}
        />
      )}

      <aside className={cn(
        "fixed inset-y-0 left-0 w-72 flex flex-col bg-card border-r border-border z-40 transition-transform duration-300 md:translate-x-0 md:static md:z-20",
        isOpen ? "translate-x-0" : "-translate-x-full"
      )}>
      {/* Colour accent bar along top */}
      <div className="absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-primary/40 via-primary to-primary/40" />

      {/* Logo */}
      <div className="h-24 flex items-center px-8 border-b border-border">
        <div className="size-10 bg-primary rounded-xl flex items-center justify-center text-primary-foreground mr-3 shadow-md shadow-primary/25 shrink-0">
          <Zap size={20} strokeWidth={3} fill="currentColor" />
        </div>
        <div className="flex-1 min-w-0">
          <h2 className="text-xl font-extrabold tracking-tight text-foreground leading-none">Dopamine</h2>
          <p className="text-[10px] text-muted-foreground/50 font-semibold mt-0.5 tracking-widest uppercase">Command Centre</p>
        </div>
        <button
          onClick={onClose}
          className="md:hidden p-2 text-muted-foreground hover:text-foreground rounded-lg transition-colors"
          aria-label="Close menu"
        >
          <X size={20} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto py-7 px-5 space-y-7">

        {/* User card */}
        <div className="flex items-center gap-3 p-3 rounded-2xl bg-background border border-border/80 shadow-sm">
          <div className="size-10 rounded-full overflow-hidden border-2 border-primary/20 shrink-0">
            <img src={user.avatarUrl} alt={user.name} className="w-full h-full object-cover" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-bold truncate">{user.name}</p>
            <p className="text-[10px] font-semibold text-muted-foreground/50 uppercase tracking-wider truncate">{user.title}</p>
          </div>
          {/* Live sync indicator */}
          <div
            className="size-2 rounded-full bg-emerald-400 shrink-0 shadow-[0_0_6px_2px] shadow-emerald-400/40"
            title="Synced across devices"
          />
        </div>

        {/* Navigation */}
        <nav className="space-y-0.5">
          {[
            { id: 'projects', label: 'Projects', icon: Layout },
            { id: 'shoots',   label: 'Shoots',   icon: Camera },
            { id: 'settings', label: 'Settings', icon: Settings },
          ].map(({ id, label, icon: Icon }) => {
            const active = activeView === id;
            return (
              <button
                key={id}
                onClick={() => onNavigate(id)}
                className={cn(
                  'relative flex items-center gap-3 px-4 py-3 w-full rounded-xl text-sm transition-all duration-200',
                  active
                    ? 'bg-primary/10 text-primary font-bold'
                    : 'text-muted-foreground font-semibold hover:bg-background hover:text-foreground'
                )}
              >
                {/* Active left indicator */}
                <span className={cn(
                  'absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-6 rounded-r-full transition-all duration-300',
                  active ? 'bg-primary opacity-100' : 'opacity-0'
                )} />
                <Icon size={17} />
                {label}
              </button>
            );
          })}
        </nav>

        {/* Project list */}
        <div className="border-t border-border pt-6">
          <div className="flex justify-between items-center px-2 mb-3">
            <p className="text-[10px] font-bold text-muted-foreground/40 uppercase tracking-widest">Your Projects</p>
            <button
              onClick={onAddProject}
              className="p-1.5 text-muted-foreground hover:text-primary hover:bg-primary/10 rounded-lg transition-all duration-150"
              title="New project"
            >
              <Plus size={15} />
            </button>
          </div>

          <Accordion type="multiple" defaultValue={projects.map(p => `item-${p.id}`)} className="w-full">
            {projects.map((p, idx) => {
              const isSelected = selectedProjectId === p.id && activeView === 'projects';
              const dotColour = PROJECT_COLOURS[idx % PROJECT_COLOURS.length];
              return (
                <AccordionItem value={`item-${p.id}`} key={p.id} className="border-b-0 mb-0.5">
                  <AccordionTrigger
                    onClick={() => onSelectProject(p.id)}
                    className={cn(
                      'flex items-center gap-3 px-3 py-2.5 w-full rounded-xl text-sm font-medium hover:bg-background transition-all duration-150 hover:no-underline group',
                      isSelected ? 'bg-background shadow-sm font-semibold text-foreground' : 'text-muted-foreground'
                    )}
                  >
                    <div className="flex items-center gap-2.5 flex-1 min-w-0">
                      {p.smartProject ? (
                        <Camera size={13} className="text-primary shrink-0" />
                      ) : (
                        <span className={cn('size-2 rounded-full shrink-0 transition-transform group-hover:scale-125', dotColour)} />
                      )}
                      <span className="truncate text-left">{p.name}</span>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="pl-8 pb-2 pt-1 space-y-0.5">
                    {p.tasks.filter(t => !t.isDone).slice(0, 4).map(task => (
                      <p
                        key={task.id}
                        className="text-xs text-muted-foreground hover:text-foreground cursor-pointer truncate py-0.5 transition-colors"
                      >
                        {task.name}
                      </p>
                    ))}
                    {p.tasks.filter(t => !t.isDone).length === 0 && (
                      <p className="text-xs text-muted-foreground/40 italic">All done!</p>
                    )}
                  </AccordionContent>
                </AccordionItem>
              );
            })}
          </Accordion>
        </div>
      </div>
    </aside>
    </>
  );
};
