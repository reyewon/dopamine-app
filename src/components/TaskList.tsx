'use client';
import React, { useState, useRef, useEffect } from 'react';
import { 
  Check,
  MoreHorizontal,
  Play,
  Pause,
  Sparkles,
  X,
  Mic, 
  Paperclip,
  ImageIcon,
  List,
  Edit,
  Trash2,
  Camera,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { breakdownSteps } from '@/lib/data';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { format } from 'date-fns';


const VoiceNotePlayer = ({ duration, label, audioUrl, onDelete }) => {
  const [playing, setPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (audioUrl) {
      audioRef.current = new Audio(audioUrl);
      audioRef.current.addEventListener('ended', () => {
        setPlaying(false);
        setProgress(0);
        if(intervalRef.current) clearInterval(intervalRef.current);
      });
    }
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
      }
      if(intervalRef.current) clearInterval(intervalRef.current);
    }
  }, [audioUrl]);
  

  const handlePlayPause = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!audioRef.current) return;
    
    if (playing) {
      audioRef.current.pause();
      if(intervalRef.current) clearInterval(intervalRef.current);
    } else {
      audioRef.current.play().catch(e => console.error("Audio play failed", e));
      intervalRef.current = setInterval(() => {
          if (audioRef.current && audioRef.current.duration > 0) {
            setProgress(audioRef.current.currentTime / audioRef.current.duration);
          }
      }, 100);
    }
    setPlaying(!playing);
  };
  
  return (
    <div className="relative group/attachment flex items-center gap-3 bg-card border border-border rounded-xl px-3 py-2 h-16 min-w-[200px] shadow-sm">
      <button 
        onClick={handlePlayPause}
        className={cn('size-10 rounded-full flex items-center justify-center transition-colors shrink-0',
          playing ? 'bg-primary text-primary-foreground' : 'bg-background text-primary hover:bg-primary hover:text-primary-foreground'
        )}
      >
        {playing ? <Pause size={18} /> : <Play size={18} fill="currentColor" />}
      </button>
      <div className="flex-1 overflow-hidden">
        <div className="h-6 w-full relative flex items-center">
            <div className="h-1 w-full bg-gray-200 absolute top-1/2 -translate-y-1/2"></div>
            <div className="h-1 bg-primary absolute top-1/2 -translate-y-1/2" style={{width: `${progress * 100}%`}}></div>
        </div>
        <p className="text-[10px] text-muted-foreground font-bold mt-1 uppercase tracking-wide truncate">
          {duration} • {label}
        </p>
      </div>
       <button onClick={(e) => { e.stopPropagation(); onDelete(); }} className="absolute -top-2 -right-2 size-5 bg-muted-foreground/50 hover:bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover/attachment:opacity-100 transition-opacity">
        <X size={12} />
      </button>
    </div>
  );
};

const Subtask = ({ subtask, onToggle, onDelete, isSmartTask }) => (
  <div className="flex items-center gap-3 group/subtask p-1">
     <label className={cn("flex items-center gap-3 flex-1", !isSmartTask && "cursor-pointer group")}>
        <input type="checkbox" checked={subtask.isDone} onChange={onToggle} className="sr-only" disabled={isSmartTask} />
        <div className={cn('size-5 rounded-md border-2 flex items-center justify-center transition-colors shrink-0',
            subtask.isDone ? 'bg-primary border-transparent' : 'border-gray-300 bg-transparent',
            !isSmartTask && 'group-hover:border-primary'
        )}>
        {subtask.isDone && <Check size={14} className="text-primary-foreground" />}
        </div>
        <span className={cn('text-sm transition-colors',
            subtask.isDone ? 'line-through text-muted-foreground' : 'text-foreground',
            !isSmartTask && 'group-hover:text-primary'
        )}>
        {subtask.label}
        </span>
     </label>
     {!isSmartTask && (
      <button onClick={onDelete} className="text-muted-foreground/50 hover:text-destructive opacity-0 group-hover/subtask:opacity-100 transition-opacity">
          <Trash2 size={14} />
      </button>
     )}
  </div>
);

const BreakdownOverlay = ({ onClose }) => {
  return (
    <div className="absolute inset-0 bg-foreground/95 z-50 rounded-3xl p-6 flex flex-col animate-in fade-in duration-300">
      <div className="flex justify-between items-start mb-6">
        <div>
          <h3 className="text-accent font-bold text-lg flex items-center gap-2">
            <Sparkles size={18} /> Unstuck Mode
          </h3>
          <p className="text-background/80 text-sm mt-1">Overwhelmed? Let's break this monster down.</p>
        </div>
        <button onClick={onClose} className="text-background/50 hover:text-background"><X size={20} /></button>
      </div>

      <div className="space-y-3">
        {breakdownSteps.map((step, i) => (
          <div key={i} className="bg-white/10 p-4 rounded-xl flex items-center gap-3 hover:bg-white/20 cursor-pointer transition-colors border border-white/5">
            <div className="h-6 w-6 rounded-full border-2 border-primary flex items-center justify-center text-primary text-xs font-bold">
              {i + 1}
            </div>
            <p className="text-white text-sm font-medium">{step}</p>
          </div>
        ))}
      </div>

      <div className="mt-auto">
        <button onClick={onClose} className="w-full bg-primary text-primary-foreground py-3 rounded-xl font-bold hover:brightness-110 transition">
          I Can Do Step 1
        </button>
      </div>
    </div>
  );
};


export const TaskCard = ({ task, onEditTask, onDeleteTask, onToggleTask, onToggleSubtask, onDeleteSubtask, onFileUpload, onRecordVoiceNote, onDeleteAttachment, onViewImage, projectId }) => {
  const [showBreakdown, setShowBreakdown] = useState(false);
  const [justChecked, setJustChecked] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const activeSubtasks = task.subtasks?.filter(t => t.isDone).length || 0;
  const totalSubtasks = task.subtasks?.length || 0;

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onFileUpload(task.id, file);
    }
  };

  const handleToggle = () => {
    if (!task.isDone) setJustChecked(true);
    onToggleTask(task.id);
  };

  return (
    <div className={cn("bg-card rounded-[2rem] border border-border relative group task-card animate-slide-up", {
      "opacity-60": task.isDone
    })}>
      {showBreakdown && <BreakdownOverlay onClose={() => setShowBreakdown(false)} />}
      
      <div className="p-8">
        <div className="flex justify-between items-start mb-6">
          <div className="flex gap-5 items-start">
            <div className="pt-1">
              <label className={cn(!task.isSmartTask && "cursor-pointer")}>
                  <input type="checkbox" checked={task.isDone} onChange={handleToggle} className="sr-only" disabled={task.isSmartTask} />
                  <div className={cn(
                    'size-7 rounded-lg border-2 flex items-center justify-center transition-all duration-200',
                    task.isDone
                      ? 'bg-primary border-transparent shadow-sm shadow-primary/30'
                      : 'bg-background border-border hover:border-primary/50'
                  )}>
                    {task.isDone && (
                      <Check
                        size={18}
                        className={cn('text-primary-foreground', justChecked && 'animate-check-pop')}
                      />
                    )}
                  </div>
              </label>
            </div>
            <div>
              <h3 className={cn(
                "text-2xl font-bold leading-tight mb-2 flex items-center gap-2 transition-all",
                task.isDone ? "line-through text-muted-foreground" : ""
              )}>
                {task.isSmartTask && <Camera size={18} className="text-primary/70 shrink-0" />}
                {task.name}
              </h3>
              <p className={cn("transition-colors", task.isDone ? "text-muted-foreground/50" : "text-muted-foreground")}>{task.description}</p>
               {task.dueDate && (
                <p className="text-sm text-primary font-medium mt-2">
                  Due: {format(new Date(task.dueDate), 'PPP')}
                </p>
              )}
            </div>
          </div>
           <DropdownMenu>
              <DropdownMenuTrigger asChild>
                  <button className="opacity-30 hover:opacity-100 transition-opacity p-2 hover:bg-gray-100 rounded-full"><MoreHorizontal /></button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => onEditTask(task)} disabled={task.isSmartTask}>
                      <Edit className="mr-2 h-4 w-4" />
                      <span>Edit Task</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => onDeleteTask(task.id)} className="text-red-500 focus:text-white focus:bg-red-500" disabled={task.isSmartTask}>
                      <Trash2 className="mr-2 h-4 w-4" />
                      <span>Delete Task</span>
                  </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
        </div>

        {task.subtasks && task.subtasks.length > 0 && (
            <div className="bg-background rounded-2xl p-6 mb-6 border border-border">
                <div className="flex justify-between items-center mb-4">
                    <p className="text-[11px] font-bold opacity-40 uppercase flex items-center gap-2 tracking-widest">
                        <List size={14} /> Subtasks ({activeSubtasks}/{totalSubtasks})
                    </p>
                    {!task.isSmartTask && (
                      <button 
                          onClick={() => setShowBreakdown(true)}
                          className="text-xs flex items-center gap-1.5 text-primary font-bold hover:underline bg-white px-3 py-1.5 rounded-full shadow-sm"
                      >
                          <Sparkles size={12} /> I'm Stuck
                      </button>
                    )}
                </div>
                
                <div className="space-y-3">
                    {task.subtasks.map(subtask => (
                        <Subtask 
                            key={subtask.id} 
                            subtask={subtask} 
                            onToggle={() => onToggleSubtask(task.id, subtask.id)}
                            onDelete={() => onDeleteSubtask(task.id, subtask.id)}
                            isSmartTask={task.isSmartTask}
                        />
                    ))}
                </div>
            </div>
        )}

        {task.attachments && task.attachments.length > 0 && (
            <div className="flex flex-wrap gap-4 mb-6">
            {task.attachments.map((att, i) => (
                att.type === 'image' ? (
                    <div key={att.id} className="relative group/attachment">
                        <button onClick={() => onViewImage(att.url)} className="relative size-20 rounded-2xl overflow-hidden shadow-sm cursor-pointer ring-1 ring-gray-100 block">
                            <img src={att.url} className="object-cover w-full h-full" alt={att.alt} />
                            <div className="absolute inset-0 bg-black/20 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                                <ImageIcon size={20} className="text-white" />
                            </div>
                        </button>
                        {!task.isSmartTask && (
                        <button onClick={() => onDeleteAttachment(task.id, att.id)} className="absolute -top-2 -right-2 size-5 bg-muted-foreground/50 hover:bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover/attachment:opacity-100 transition-opacity">
                            <X size={12} />
                        </button>
                        )}
                    </div>
                ) : att.type === 'audio' ? (
                    <VoiceNotePlayer key={att.id} duration={att.duration} label={att.label} audioUrl={att.url} onDelete={() => onDeleteAttachment(task.id, att.id)} />
                ) : null
            ))}
            </div>
        )}


        {!task.isDone && !task.isSmartTask && (
            <div className="flex gap-3 pt-4 border-t border-gray-100">
            <input type="file" ref={fileInputRef} onChange={handleFileSelect} className="hidden" accept="image/*,application/pdf" />
            <button 
                onClick={() => onRecordVoiceNote(task)}
                className="flex items-center gap-2 text-xs font-bold text-muted-foreground hover:text-primary px-4 py-2.5 rounded-xl hover:bg-background transition-all"
            >
                <Mic size={16} /> Record Voice Note
            </button>
            <button 
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center gap-2 text-xs font-bold text-muted-foreground hover:text-primary px-4 py-2.5 rounded-xl hover:bg-background transition-all"
            >
                <Paperclip size={16} /> Upload File
            </button>
            </div>
        )}
      </div>
    </div>
  );
};


export const TaskList = ({ tasks, onEditTask, onDeleteTask, onToggleTask, onToggleSubtask, onDeleteSubtask, onFileUpload, onRecordVoiceNote, onDeleteAttachment, onViewImage, projectId }) => {
    
    const activeTasks = tasks.filter(task => !task.isDone);
    const completedTasks = tasks.filter(task => task.isDone);

    const taskCardProps = {
      onEditTask,
      onDeleteTask,
      onToggleTask,
      onToggleSubtask,
      onDeleteSubtask,
      onFileUpload,
      onRecordVoiceNote,
      onDeleteAttachment,
      onViewImage,
      projectId
    };

    return (
        <div className="space-y-4">
            {activeTasks.map((task) => (
                <TaskCard 
                    key={task.id} 
                    task={task} 
                    {...taskCardProps}
                />
            ))}
            
            {completedTasks.length > 0 && (
                <Accordion type="single" collapsible className="w-full" defaultValue='completed-tasks'>
                    <AccordionItem value="completed-tasks" className="border-none">
                        <AccordionTrigger className="w-full text-muted-foreground font-bold hover:no-underline hover:text-foreground text-lg py-4">
                            <div className="flex items-center gap-2">
                                Completed ({completedTasks.length})
                            </div>
                        </AccordionTrigger>
                        <AccordionContent>
                            <div className="space-y-4 pt-4">
                                {completedTasks.map((task) => (
                                    <TaskCard 
                                        key={task.id} 
                                        task={task} 
                                        {...taskCardProps}
                                    />
                                ))}
                            </div>
                        </AccordionContent>
                    </AccordionItem>
                </Accordion>
            )}
        </div>
    )
}

    