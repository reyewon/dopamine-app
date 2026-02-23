'use client';
import React from 'react';
import { useSearch } from '@/hooks/useSearch';
import { TaskCard } from './TaskList';
import { Button } from './ui/button';
import { ArrowRight } from 'lucide-react';

const SearchResults = ({ 
    allProjects, 
    onSelectProject,
    onEditTask,
    onDeleteTask,
    onToggleTask,
    onToggleSubtask,
    onDeleteSubtask,
    onFileUpload,
    onRecordVoiceNote,
    onDeleteAttachment,
    onViewImage,
}) => {
    const { searchTerm, setSearchTerm } = useSearch();

    const searchResults = React.useMemo(() => {
        if (!searchTerm.trim()) {
            return [];
        }

        const lowercasedTerm = searchTerm.toLowerCase();
        const results: { project: any, task: any }[] = [];

        for (const project of allProjects) {
            for (const task of project.tasks) {
                if (
                    task.name.toLowerCase().includes(lowercasedTerm) ||
                    (task.description && task.description.toLowerCase().includes(lowercasedTerm)) ||
                    task.subtasks?.some(st => st.label.toLowerCase().includes(lowercasedTerm))
                ) {
                    results.push({ project, task });
                }
            }
        }
        return results;
    }, [searchTerm, allProjects]);

    const handleGoToProject = (projectId) => {
        onSelectProject(projectId);
        setSearchTerm(''); 
    };

    return (
        <div className="flex-1 overflow-y-auto p-6 lg:p-10">
             <div className="max-w-4xl mx-auto">
                {searchTerm.trim() && (
                    <p className="text-muted-foreground mb-6">
                        Found {searchResults.length} results for <span className="font-bold text-foreground">"{searchTerm}"</span>
                    </p>
                )}
            
                {searchResults.length > 0 ? (
                    <div className="space-y-4">
                        {searchResults.map(({ project, task }) => (
                           <div key={task.id} className="relative group/search-result">
                                <TaskCard
                                    task={task}
                                    projectId={project.id}
                                    onEditTask={onEditTask}
                                    onDeleteTask={onDeleteTask}
                                    onToggleTask={onToggleTask}
                                    onToggleSubtask={onToggleSubtask}
                                    onDeleteSubtask={onDeleteSubtask}
                                    onFileUpload={onFileUpload}
                                    onRecordVoiceNote={onRecordVoiceNote}
                                    onDeleteAttachment={onDeleteAttachment}
                                    onViewImage={onViewImage}
                                />
                                <Button
                                    onClick={() => handleGoToProject(project.id)}
                                    variant="outline"
                                    className="absolute top-8 right-8 z-20 opacity-0 group-hover/search-result:opacity-100 transition-opacity bg-white hover:bg-gray-100"
                                >
                                    Go to Project <ArrowRight size={16} className="ml-2" />
                                </Button>
                           </div>
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-20">
                        <p className="text-muted-foreground">
                            {searchTerm.trim() ? "No tasks found matching your search." : "Start typing in the search bar to find tasks across all projects."}
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default SearchResults;
