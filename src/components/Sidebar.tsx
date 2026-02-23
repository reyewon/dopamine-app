'use client';
import React from 'react';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { cn } from '@/lib/utils';
import { Layout, Settings, Zap, Plus, Camera } from 'lucide-react';

export const Sidebar = ({ projects, user, selectedProjectId, onSelectProject, onAddProject, onNavigate, activeView }) => {
  return (
    <aside className="hidden md:flex w-72 flex-col bg-card border-r border-border z-20">
      <div className="h-24 flex items-center px-8 border-b border-border">
        <div className="size-10 bg-primary rounded-xl flex items-center justify-center text-primary-foreground mr-3 shadow-sm">
          <Zap size={20} strokeWidth={3} fill="currentColor" />
        </div>
        <h2 className="text-xl font-extrabold tracking-tight text-foreground">Dopamine</h2>
      </div>
      
      <div className="flex-1 overflow-y-auto py-8 px-6 space-y-8">
        {/* User Snippet */}
        <div className="flex items-center gap-3 p-3 rounded-2xl bg-background border border-border">
          <div className="size-10 rounded-full bg-gray-200 overflow-hidden border border-white shadow-sm">
              <img src={user.avatarUrl} alt={user.name} className="w-full h-full" />
          </div>
          <div>
            <p className="text-sm font-bold">{user.name}</p>
            <p className="text-[11px] font-medium opacity-50 uppercase tracking-wide">{user.title}</p>
          </div>
        </div>

        <nav className="space-y-2">
           <button 
              onClick={() => onNavigate('projects')}
              className={cn("flex items-center gap-3 px-4 py-3 w-full rounded-xl text-sm font-bold transition-colors",
                activeView === 'projects' ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:bg-background'
              )}>
            <Layout size={18} /> Projects
          </button>
           <button 
              onClick={() => onNavigate('shoots')}
              className={cn("flex items-center gap-3 px-4 py-3 w-full rounded-xl text-sm font-semibold transition-colors",
                activeView === 'shoots' ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:bg-background'
              )}>
            <Camera size={18} /> Shoots
          </button>
           <button
              onClick={() => onNavigate('settings')}
              className={cn("flex items-center gap-3 px-4 py-3 w-full rounded-xl text-sm font-semibold transition-colors",
                activeView === 'settings' ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:bg-background'
              )}>
            <Settings size={18} /> Settings
          </button>
        </nav>

        <div className="pt-6 border-t border-border">
          <div className="flex justify-between items-center px-2 mb-3">
            <p className="text-[11px] font-bold opacity-40 uppercase tracking-wider">Your Projects</p>
            <button 
              onClick={onAddProject}
              className="p-1 text-muted-foreground hover:text-primary transition-colors">
              <Plus size={16} />
            </button>
          </div>
          <Accordion type="multiple" defaultValue={projects.map(p => `item-${p.id}`)} className="w-full">
            {projects.map(p => (
              <AccordionItem value={`item-${p.id}`} key={p.id} className="border-b-0">
                <AccordionTrigger 
                  onClick={() => onSelectProject(p.id)}
                  className={cn("flex items-center gap-3 px-2 py-2 w-full rounded-xl text-sm font-medium hover:bg-background transition-colors hover:no-underline",
                    selectedProjectId === p.id && activeView === 'projects' ? "bg-background" : ""
                  )}
                >
                    <div className='flex items-center gap-3'>
                      {p.smartProject ? (
                        <Camera size={14} className="text-primary" />
                      ) : (
                        <span className={cn('size-2.5 rounded-full', p.id.includes('proj-1') ? 'bg-primary' : 'bg-gray-400')}></span> 
                      )}
                      {p.name}
                    </div>
                </AccordionTrigger>
                <AccordionContent className="pl-7 pt-2 pb-2 space-y-1">
                  {p.tasks.map(task => (
                     <p key={task.id} className="text-xs text-muted-foreground hover:text-foreground cursor-pointer truncate">{task.name}</p>
                  ))}
                   {p.tasks.length === 0 && <p className="text-xs text-muted-foreground">No tasks yet.</p>}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </div>
    </aside>
  );
};
