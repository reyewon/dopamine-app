'use client';
import React from 'react';
import { Plus, Menu, Bell, Search, ArrowRight, Camera } from 'lucide-react';
import { TaskList } from '@/components/TaskList';
import { ProjectHero } from '@/components/ProjectHero';
import { useSearch } from '@/hooks/useSearch';
import SearchResults from './SearchResults';


export const MainContent = ({ 
  project, 
  allProjects,
  onSelectProject,
  onAddTask, 
  onEditProject, 
  onEditTask,
  onDeleteTask,
  onToggleTask, 
  onToggleSubtask, 
  onFileUpload,
  onRecordVoiceNote,
  onDeleteAttachment,
  onDeleteSubtask,
  onViewImage,
}) => {
  const { searchTerm } = useSearch();

  const renderContent = () => {
     if (searchTerm.trim()) {
        return <SearchResults 
          allProjects={allProjects} 
          onSelectProject={onSelectProject}
          onEditTask={onEditTask}
          onDeleteTask={onDeleteTask}
          onToggleTask={onToggleTask}
          onToggleSubtask={onToggleSubtask}
          onFileUpload={onFileUpload}
          onRecordVoiceNote={onRecordVoiceNote}
          onDeleteAttachment={onDeleteAttachment}
          onDeleteSubtask={onDeleteSubtask}
          onViewImage={onViewImage}
        />;
    }
    
    if (!project) {
        return (
            <div className="flex-1 flex items-center justify-center text-center p-8">
                <div>
                <h2 className="text-2xl font-bold">Welcome to Dopamine!</h2>
                <p className="text-muted-foreground mt-2">Select a project from the sidebar to get started, or create a new one.</p>
                </div>
            </div>
        )
    }

    return (
        <div className="flex-1 overflow-y-auto px-6 lg:px-10 pb-20">
        <div className="max-w-4xl mx-auto space-y-8 pt-2">
            <ProjectHero project={project} onEditProject={onEditProject} />
            
            <div className="flex items-center justify-between py-2">
            <h2 className="text-xl font-bold text-foreground">
              {project.smartProject ? 'Shoot-generated Tasks' : 'Current Tasks'}
            </h2>
            {!project.smartProject && (
              <button 
                  onClick={onAddTask}
                  className="bg-primary hover:brightness-110 text-primary-foreground px-6 py-3 rounded-2xl font-bold shadow-lg shadow-primary/20 transition-all flex items-center gap-2 transform active:scale-95">
                  <Plus size={20} /> Add New Task
              </button>
            )}
            </div>

            <TaskList 
                tasks={project.tasks} 
                onEditTask={onEditTask}
                onDeleteTask={onDeleteTask}
                onToggleTask={onToggleTask}
                onToggleSubtask={onToggleSubtask}
                onFileUpload={onFileUpload}
                onRecordVoiceNote={onRecordVoiceNote}
                onDeleteAttachment={onDeleteAttachment}
                onDeleteSubtask={onDeleteSubtask}
                onViewImage={onViewImage}
                projectId={project.id}
            />
            {project.tasks.length === 0 && (
            <div className="text-center py-10 border border-dashed rounded-2xl">
                <p className="text-muted-foreground">{project.smartProject ? 'Tasks from your shoots will appear here automatically.' : 'No tasks here yet. Click "Add New Task" to get started!'}</p>
            </div>
            )}
        </div>
        </div>
    )
  }

  return renderContent();
};
