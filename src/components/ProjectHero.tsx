'use client';
import React from 'react';
import { Clock, Edit3, Share2, Camera } from 'lucide-react';

export const ProjectHero = ({ project, onEditProject }) => {
    if (!project) return null;
    
    const taskCount = project.tasks.length;
    const completedTasks = project.tasks.filter(t => t.isDone).length;
    const progress = taskCount > 0 ? Math.round((completedTasks / taskCount) * 100) : 0;

    return (
        <section className="bg-card p-8 rounded-[2rem] shadow-sm border border-border relative overflow-hidden">
            {/* Subtle Warm Gradient - "Claude Glow" */}
            <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary/5 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/2 pointer-events-none"></div>
            
            <div className="relative z-10 flex flex-col md:flex-row justify-between gap-8 md:items-start">
                <div className="flex-1">
                <div className="flex items-center gap-3 mb-4">
                    {!project.smartProject && (
                        <span className="bg-primary/10 text-primary px-3 py-1.5 rounded-full text-[11px] font-bold uppercase tracking-wider">
                        {project.priority}
                        </span>
                    )}
                    {project.smartProject && (
                         <span className="bg-accent/50 text-accent-foreground px-3 py-1.5 rounded-full text-[11px] font-bold uppercase tracking-wider flex items-center gap-2">
                            <Camera size={14} /> Smart Project
                        </span>
                    )}
                    <span className="text-muted-foreground text-sm font-medium flex items-center gap-1.5">
                    <Clock size={16} /> {project.dueDate}
                    </span>
                </div>
                <h1 className="text-4xl font-extrabold tracking-tight mb-4 text-foreground leading-tight">{project.name}</h1>
                <p className="text-muted-foreground max-w-xl leading-relaxed text-lg">
                    {project.description}
                </p>
                </div>
                <div className="flex gap-3 shrink-0">
                {!project.smartProject && (
                    <button 
                        onClick={onEditProject}
                        className="flex items-center gap-2 px-5 py-3 rounded-xl border border-border text-foreground font-bold hover:bg-gray-50 transition-colors bg-white shadow-sm"
                    >
                        <Edit3 size={16} /> <span className="hidden sm:inline">Edit</span>
                    </button>
                )}
                <button className="flex items-center gap-2 px-5 py-3 rounded-xl border border-border text-foreground font-bold hover:bg-gray-50 transition-colors bg-white shadow-sm">
                    <Share2 size={16} /> <span className="hidden sm:inline">Share</span>
                </button>
                </div>
            </div>

            {/* Elegant Progress Bar */}
            <div className="mt-10 pt-8 border-t border-border">
                <div className="bg-primary text-primary-foreground p-6 rounded-2xl">
                    <div className="flex justify-between items-end mb-3">
                        <span className="text-xs font-bold opacity-70 uppercase tracking-widest">Overall Progress</span>
                        <span className="text-3xl font-bold">{progress}%</span>
                    </div>
                    <div className="h-2 w-full bg-white/20 rounded-full overflow-hidden">
                    <div className="h-full bg-white rounded-full" style={{ width: `${progress}%` }}></div>
                    </div>
                </div>
            </div>
        </section>
    );
};
