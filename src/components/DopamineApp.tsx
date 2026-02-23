'use client';
import React, { useState, useEffect, useMemo, useTransition } from 'react';
import { initialProjects, user as initialUser, initialShoots } from '@/lib/data';
import { produce } from 'immer';
import { useDataSync, reviveDates } from '@/hooks/useDataSync';
import { Sidebar } from '@/components/Sidebar';
import { MainContent } from '@/components/MainContent';
import { AddTaskModal } from '@/components/AddTaskModal';
import { EditProjectModal } from '@/components/EditProjectModal';
import { EditTaskModal } from '@/components/EditTaskModal';
import { RecordVoiceNoteModal } from '@/components/RecordVoiceNoteModal';
import { AddProjectModal } from '@/components/AddProjectModal';
import { fileToDataURL } from '@/lib/utils';
import { useToast } from "@/hooks/use-toast";
import { Plus, Sparkles, Menu, Bell, Search, Camera } from 'lucide-react';
import { SearchProvider, useSearch } from '@/hooks/useSearch';
import SettingsView from './SettingsView';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { ImageLightbox } from './ImageLightbox';
import ShootsView from './ShootsView';
import HomeView from './HomeView';
import { AddShootModal } from './AddShootModal';
import { EditShootModal } from './EditShootModal';
import { MagicAiInput } from './MagicAiInput';
import type { SmartInputParserOutput } from '@/ai/flows/smart-input-parser';
import { add } from 'date-fns';
import { useEmailInquiries } from '@/hooks/useEmailInquiries';


const DopamineAppContent = ({ defaultView }) => {
  const { kvState, syncState, syncStatus } = useDataSync();

  // Initialise from localStorage synchronously (fast), then hydrate from KV
  const [projects, setProjects] = useState(() => {
    if (typeof window === 'undefined') return initialProjects;
    try {
      const raw = localStorage.getItem('dopamine-state-v1');
      if (!raw) return initialProjects;
      const saved = JSON.parse(raw);
      return saved.projects ? reviveDates(saved.projects) : initialProjects;
    } catch {
      return initialProjects;
    }
  });

  const [shoots, setShoots] = useState(() => {
    if (typeof window === 'undefined') return initialShoots;
    try {
      const raw = localStorage.getItem('dopamine-state-v1');
      if (!raw) return initialShoots;
      const saved = JSON.parse(raw);
      return saved.shoots ? reviveDates(saved.shoots) : initialShoots;
    } catch {
      return initialShoots;
    }
  });

  const [user, setUser] = useState(initialUser);

  // When KV data arrives, merge it in (KV is source of truth across devices)
  useEffect(() => {
    if (!kvState) return;
    if (kvState.projects) setProjects(reviveDates(kvState.projects as typeof initialProjects));
    if (kvState.shoots) setShoots(reviveDates(kvState.shoots as typeof initialShoots));
  }, [kvState]);
  
  const searchParams = useSearchParams();
  const projectIdFromQuery = searchParams.get('projectId');
  
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(projectIdFromQuery || null);
  
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const [isAddTaskModalOpen, setAddTaskModalOpen] = useState(false);
  const [isAddProjectModalOpen, setAddProjectModalOpen] = useState(false);
  const [isAddShootModalOpen, setAddShootModalOpen] = useState(false);
  const [isEditProjectModalOpen, setEditProjectModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [editingShoot, setEditingShoot] = useState(null);
  const [recordingTask, setRecordingTask] = useState(null);
  const [lightboxImageUrl, setLightboxImageUrl] = useState(null);

  const { toast } = useToast();
  const router = useRouter();
  const pathname = usePathname();
  const { searchTerm, setSearchTerm } = useSearch();

  const [activeView, setActiveView] = useState(defaultView || 'projects');

  // Email inquiries from Gmail
  const { inquiries, unreadCount, gmailStatus, statusLoaded, markAsRead, markInquiryAsAdded, dismissInquiry, pollNow, refreshStatus } = useEmailInquiries();
  const [showInquiriesPanel, setShowInquiriesPanel] = useState(false);

  // Google Calendar connection status
  const [calendarConnected, setCalendarConnected] = useState(false);
  useEffect(() => {
    fetch('/api/calendar').then(r => r.json()).then((d: { connected?: boolean }) => {
      if (d.connected) setCalendarConnected(true);
    }).catch(() => {});
  }, []);

  // Open Calendar OAuth in a popup window
  const openCalendarAuth = () => {
    const w = 500, h = 700;
    const left = window.screenX + (window.outerWidth - w) / 2;
    const top = window.screenY + (window.outerHeight - h) / 2;
    window.open('/api/calendar/auth', 'calendar-auth', `width=${w},height=${h},left=${left},top=${top},popup=1`);
  };

  // Silently push a new shoot to the Photography Google Calendar
  const addShootToCalendar = async (shoot: { title: string; shootDate: Date | null; location?: string; clientName?: string; price?: number }) => {
    if (!shoot.shootDate) return;
    const dateStr = new Date(shoot.shootDate).toISOString().split('T')[0];
    try {
      await fetch('/api/calendar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: shoot.title,
          shootDate: dateStr,
          location: shoot.location,
          clientName: shoot.clientName,
          price: shoot.price,
        }),
      });
    } catch (err) {
      console.warn('Calendar sync skipped:', err);
    }
  };

  // Open Gmail OAuth in a popup window
  const openGmailAuth = (account: string) => {
    const url = `/api/gmail/auth?account=${account}`;
    const w = 500, h = 700;
    const left = window.screenX + (window.outerWidth - w) / 2;
    const top = window.screenY + (window.outerHeight - h) / 2;
    window.open(url, 'gmail-auth', `width=${w},height=${h},left=${left},top=${top},popup=1`);
  };

  // Listen for OAuth callback postMessages (Gmail + Calendar)
  useEffect(() => {
    const handler = (event: MessageEvent) => {
      if (event.origin !== 'https://dopamine-app.pages.dev') return;
      if (event.data?.type === 'gmail-auth-complete') {
        refreshStatus();
        if (event.data.success) {
          toast({
            title: 'Gmail connected',
            description: `${event.data.account === 'photography' ? 'photography@ryanstanikk.co.uk' : 'rstanikk@gmail.com'} is now linked.`,
          });
        }
      }
      if (event.data?.type === 'calendar-auth-complete') {
        if (event.data.success) {
          setCalendarConnected(true);
          toast({
            title: 'Google Calendar connected',
            description: 'New shoots will be added to your Photography calendar automatically.',
          });
        }
      }
    };
    window.addEventListener('message', handler);
    return () => window.removeEventListener('message', handler);
  }, [refreshStatus, toast]);

  // Sync to localStorage + KV whenever data changes
  useEffect(() => {
    syncState({ projects: projects as unknown[], shoots: shoots as unknown[] });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projects, shoots]);

  const smartProject = projects.find(p => p.smartProject);

  const [isAiProcessing, startAiTransition] = useTransition();

  const handleAiSubmit = (prompt: string) => {
    startAiTransition(async () => {
      try {
        console.log("Sending prompt to Gemini for parsing...");
        const res = await fetch('/api/ai', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ prompt }),
        });
        if (!res.ok) {
          const err = await res.json().catch(() => ({ error: 'Unknown error' }));
          throw new Error(err.error || `API error ${res.status}`);
        }
        const result: SmartInputParserOutput = await res.json();
        
        if (result.type === 'project') {
          const newProject = {
            id: `proj-${Date.now()}`,
            name: result.title,
            description: `AI-generated project for: "${prompt}"`,
            priority: 'Medium',
            dueDate: 'In a week',
            progress: 0,
            tasks: result.tasks.map((taskName, index) => ({
              id: `task-${Date.now()}-${index}`,
              name: taskName,
              description: '',
              isDone: false,
              dueDate: null,
              subtasks: [],
              attachments: [],
            })),
          };

          const newProjects = produce(projects, draft => {
            draft.unshift(newProject);
          });
          setProjects(newProjects);
          setSelectedProjectId(newProject.id);
          toast({
            title: "AI Project Created!",
            description: `${newProject.name} has been added to your workspace.`,
          });

        } else if (result.type === 'shoot') {
            const safeCreateDate = (dateString) => {
              if (!dateString) return null;
              // Handles YYYY-MM-DD format by ensuring it's treated as UTC
              const date = new Date(`${dateString}T12:00:00Z`);
              return isNaN(date.getTime()) ? null : date;
            };

            const shootDate = safeCreateDate(result.shootDate);
            let editDueDate = safeCreateDate(result.editDueDate);

            if (shootDate && !editDueDate) {
                editDueDate = add(shootDate, { days: 14 });
            }

            const newShoot = {
              id: `shoot-${Date.now()}`,
              title: result.title || `Shoot for ${result.clientName}`,
              clientName: result.clientName || '',
              clientEmail: result.clientEmail || '',
              clientContact: result.clientPhone || '',
              shootDate: shootDate,
              editDueDate: editDueDate,
              location: result.location || 'TBD',
              price: result.price || 0,
              frictionLog: result.notes || `Generated from prompt: "${prompt}"`,
              assets: [],
              invoiceStatus: 'Unsent',
              sendSneakPeeks: false,
              progress: { shoot: false, tickoff: false, cull: false, edit: false, exportUpload: false }
            };

            const newShoots = produce(shoots, draft => {
              draft.unshift(newShoot);
            });
            setShoots(newShoots);
            addShootToCalendar(newShoot);

            toast({
              title: "AI Shoot Scheduled!",
              description: `A new shoot, "${newShoot.title}", has been scheduled.`,
            });
        }
      } catch (error) {
        console.error("AI processing failed. Raw error:", error);
        toast({
          variant: "destructive",
          title: "AI Error",
          description: "Could not parse details. The AI may be offline or unable to understand the request.",
        });
      }
    });
  };


  // Sync shoots to smart project
  useEffect(() => {
    if (!smartProject) return;

    const newProjects = produce(projects, draft => {
      const smartProj = draft.find(p => p.id === smartProject.id);
      if (smartProj) {
        // Filter out tasks that no longer have a corresponding shoot or are completed
        smartProj.tasks = smartProj.tasks.filter(task => 
          shoots.some(shoot => `task-shoot-${shoot.id}` === task.id && !shoot.progress.exportUpload)
        );
        
        // Add or update tasks from upcoming shoots
        shoots.forEach(shoot => {
          // Only add if not completed
          if (!shoot.progress.exportUpload) {
            const existingTaskIndex = smartProj.tasks.findIndex(t => t.id === `task-shoot-${shoot.id}`);
            const taskData = {
              id: `task-shoot-${shoot.id}`,
              name: shoot.title,
              description: `Shoot for ${shoot.clientName} at ${shoot.location}`,
              isDone: false, // It's in the upcoming list
              dueDate: shoot.editDueDate ? new Date(shoot.editDueDate) : null,
              subtasks: [],
              attachments: [],
              isSmartTask: true,
            };

            if (existingTaskIndex > -1) {
              smartProj.tasks[existingTaskIndex] = { ...smartProj.tasks[existingTaskIndex], ...taskData };
            } else {
              smartProj.tasks.push(taskData);
            }
          }
        });

        // The progress of the smart project is not meaningful in the same way, so we can leave it
      }
    });

    setProjects(newProjects);
  }, [shoots, smartProject?.id]);
  
  // Sort projects based on the soonest due date of their incomplete tasks
  const sortedProjects = useMemo(() => {
    const getProjectUrgency = (project) => {
      if (project.smartProject) return 1e14; // Push smart project towards the end
      
      const incompleteTasksWithDates = project.tasks
        .filter(task => !task.isDone && task.dueDate)
        .map(task => new Date(task.dueDate).getTime());

      if (incompleteTasksWithDates.length === 0) {
        return Infinity; // Send projects with no actionable due dates to the end
      }
      
      return Math.min(...incompleteTasksWithDates);
    };

    return [...projects].sort((a, b) => getProjectUrgency(a) - getProjectUrgency(b));
  }, [projects]);


  useEffect(() => {
    if (pathname === '/settings') setActiveView('settings');
    else if (pathname === '/shoots') setActiveView('shoots');
    else if (pathname === '/search') {
      setActiveView('projects'); // Keep projects view active conceptually
    }
    else {
      setActiveView('projects');
      if (projectIdFromQuery) {
        setSelectedProjectId(projectIdFromQuery);
      }
    }
  }, [pathname, projectIdFromQuery]);


  const handleSelectProject = (projectId) => {
    setSelectedProjectId(projectId);
    setSearchTerm('');
    const newPath = projectId ? `/?projectId=${projectId}` : '/';
    router.push(newPath);
    setActiveView('projects');
    setIsSidebarOpen(false);
  };

  const handleNavigate = (view) => {
    const path = view === 'projects' ? '/' : `/${view}`;
    router.push(path);
    setActiveView(view);
    setIsSidebarOpen(false);
    // Return to dashboard when going to projects root
    if (view === 'projects') setSelectedProjectId(null);
  };

  const handleAddShootFromInquiry = (inquiry) => {
    // Pre-fill the new shoot form with extracted data
    const safeCreateDate = (dateString) => {
      if (!dateString) return null;
      const date = new Date(`${dateString}T12:00:00Z`);
      return isNaN(date.getTime()) ? null : date;
    };

    const shootDate = safeCreateDate(inquiry.extractedData.shootDate);
    let editDueDate = safeCreateDate(inquiry.extractedData.shootDate);
    if (shootDate && !editDueDate) {
      editDueDate = add(shootDate, { days: 14 });
    }

    const newShoot = {
      title: inquiry.extractedData.shootType ? `${inquiry.extractedData.shootType} shoot` : inquiry.subject,
      clientName: inquiry.extractedData.clientName ?? '',
      clientEmail: inquiry.extractedData.clientEmail ?? '',
      clientContact: inquiry.extractedData.clientPhone ?? '',
      shootDate: shootDate,
      editDueDate: editDueDate,
      location: inquiry.extractedData.location ?? '',
      price: '',
      frictionLog: inquiry.extractedData.notes ?? '',
    };

    const updatedShoot = {
      id: `shoot-${Date.now()}`,
      ...newShoot,
      assets: [],
      invoiceStatus: 'Unsent',
      sendSneakPeeks: false,
      progress: { shoot: false, tickoff: false, cull: false, edit: false, exportUpload: false }
    };

    const newShoots = produce(shoots, draft => {
      draft.unshift(updatedShoot);
    });
    setShoots(newShoots);
    addShootToCalendar(updatedShoot);
    setShowInquiriesPanel(false);
    markInquiryAsAdded(inquiry.id);
    toast({
      title: "Shoot created!",
      description: `"${updatedShoot.title}" has been added from the email inquiry.`,
    });
  };

  const selectedProject = projects.find(p => p.id === selectedProjectId);
  
  const handleToggleSubtask = (taskId, subtaskId) => {
    const newProjects = produce(projects, draft => {
      const project = draft.find(p => p.id === selectedProjectId);
      if (project) {
        const task = project.tasks.find(t => t.id === taskId);
        if (task) {
          const subtask = task.subtasks.find(st => st.id === subtaskId);
          if (subtask) {
            subtask.isDone = !subtask.isDone;
          }
        }
      }
    });
    setProjects(newProjects);
  };

  const handleDeleteSubtask = (taskId, subtaskId) => {
    const newProjects = produce(projects, draft => {
        const project = draft.find(p => p.tasks.some(t => t.id === taskId));
        if (project) {
            const task = project.tasks.find(t => t.id === taskId);
            if (task && task.subtasks) {
                const subtaskIndex = task.subtasks.findIndex(st => st.id === subtaskId);
                if (subtaskIndex !== -1) {
                    task.subtasks.splice(subtaskIndex, 1);
                }
            }
        }
    });
    setProjects(newProjects);
  };

  const handleToggleTask = (taskId) => {
    const newProjects = produce(projects, draft => {
      // Find the project containing the task
      const project = draft.find(p => p.tasks.some(t => t.id === taskId));
      if (project) {
        const task = project.tasks.find(t => t.id === taskId);
        if (task) {
          task.isDone = !task.isDone;
        }
      }
    });
    setProjects(newProjects);
  };

  const handleAddTask = (newTaskData) => {
    const newProjects = produce(projects, draft => {
      const project = draft.find(p => p.id === selectedProjectId);
      if (project) {
        project.tasks.unshift({
          id: `task-${Date.now()}`,
          name: newTaskData.name,
          description: newTaskData.description,
          dueDate: newTaskData.dueDate,
          isDone: false,
          subtasks: newTaskData.subtasks,
          attachments: []
        });
      }
    });
    setProjects(newProjects);
    setAddTaskModalOpen(false);
     toast({
      title: "Task created!",
      description: `${newTaskData.name} has been added.`,
    });
  };
  
  const handleAddProject = (newProjectData) => {
    const newProject = {
      id: `proj-${Date.now()}`,
      name: newProjectData.name,
      description: newProjectData.description,
      priority: 'Medium',
      dueDate: 'In a week',
      progress: 0,
      tasks: [],
    };
    const newProjects = produce(projects, draft => {
      draft.push(newProject);
    });
    setProjects(newProjects);
    setSelectedProjectId(newProject.id);
    setAddProjectModalOpen(false);
    toast({
      title: "Project created!",
      description: `${newProject.name} has been added to your workspace.`,
    });
  };

  const handleEditProject = (updatedProjectData) => {
    const newProjects = produce(projects, draft => {
      const project = draft.find(p => p.id === selectedProjectId);
      if (project) {
        project.name = updatedProjectData.name;
        project.description = updatedProjectData.description;
        project.priority = updatedProjectData.priority;
      }
    });
    setProjects(newProjects);
    setEditProjectModalOpen(false);
  };

  const handleEditTask = (updatedTaskData) => {
    const newProjects = produce(projects, draft => {
       let projectOfTask = draft.find(p => p.tasks.some(t => t.id === editingTask.id));
        if (projectOfTask) {
            if (projectOfTask.smartProject) {
              toast({ variant: "destructive", title: "Cannot edit smart task", description: "This task is linked to a shoot and can only be edited there." });
              setEditingTask(null);
              return;
            }
            const taskIndex = projectOfTask.tasks.findIndex(t => t.id === editingTask.id);
            if (taskIndex !== -1) {
                projectOfTask.tasks[taskIndex] = {
                    ...projectOfTask.tasks[taskIndex],
                    ...updatedTaskData
                };
            }
        }
    });
    setProjects(newProjects);
    setEditingTask(null);
  };
  
  const handleDeleteTask = (taskId) => {
    const newProjects = produce(projects, draft => {
      const project = draft.find(p => p.tasks.some(t => t.id === taskId));
      if (project) {
        if (project.smartProject) {
          toast({ variant: "destructive", title: "Cannot delete smart task", description: "This task is linked to a shoot." });
          return;
        }
        const taskIndex = project.tasks.findIndex(t => t.id === taskId);
        if (taskIndex !== -1) {
          project.tasks.splice(taskIndex, 1);
        }
      }
    });
    setProjects(newProjects);
    toast({
      title: "Task deleted",
      description: "The task has been removed from your project.",
    });
  };


  const handleFileUpload = (taskId, file) => {
    if (!file) return;
    fileToDataURL(file).then(url => {
        const newAttachment = { 
            id: `att-${Date.now()}`,
            type: file.type.startsWith('image/') ? 'image' : 'file', 
            url: url,
            alt: file.name,
            label: file.name,
        };
        const newProjects = produce(projects, draft => {
            const project = draft.find(p => p.tasks.some(t => t.id === taskId));
            if (project) {
                const task = project.tasks.find(t => t.id === taskId);
                if (task) {
                    if (!task.attachments) task.attachments = [];
                    task.attachments.push(newAttachment);
                }
            }
        });
        setProjects(newProjects);
    });

     toast({
      title: "File added",
      description: `${file.name} has been attached to the task.`,
    });
  };
  
  const handleDeleteAttachment = (taskId, attachmentId) => {
     const newProjects = produce(projects, draft => {
      const project = draft.find(p => p.tasks.some(t => t.id === taskId));
      if (project) {
        const task = project.tasks.find(t => t.id === taskId);
        if (task && task.attachments) {
          const attachmentIndex = task.attachments.findIndex(att => att.id === attachmentId);
          if (attachmentIndex !== -1) {
            task.attachments.splice(attachmentIndex, 1);
          }
        }
      }
    });
    setProjects(newProjects);
     toast({
      variant: "destructive",
      title: "Attachment removed",
    });
  }

  const handleSaveVoiceNote = (taskId, audio) => {
     const newProjects = produce(projects, draft => {
      const project = draft.find(p => p.tasks.some(t => t.id === taskId));
      if (project) {
        const task = project.tasks.find(t => t.id === taskId);
        if (task) {
           if (!task.attachments) task.attachments = [];
           task.attachments.push({
            id: `att-${Date.now()}`,
            type: 'audio',
            duration: audio.duration,
            label: `Voice Note ${task.attachments.filter(a => a.type === 'audio').length + 1}`,
            url: audio.url,
          });
        }
      }
    });
    setProjects(newProjects);
    setRecordingTask(null);
     toast({
      title: "Voice note saved!",
      description: "Your voice note has been attached to the task.",
    });
  };
  
  const handleAddShoot = (newShootData) => {
    const newShoot = {
      id: `shoot-${Date.now()}`,
      ...newShootData,
      assets: [],
      invoiceStatus: 'Unsent',
      sendSneakPeeks: false,
      frictionLog: '',
      progress: {
        shoot: false,
        tickoff: false,
        cull: false,
        edit: false,
        exportUpload: false,
      }
    };
    const newShoots = produce(shoots, draft => {
      draft.unshift(newShoot);
    });
    setShoots(newShoots);
    addShootToCalendar(newShoot);
    setAddShootModalOpen(false);
    toast({
      title: "Shoot added!",
      description: `${newShoot.title} has been scheduled.`,
    });
  };

  const handleEditShoot = (updatedShootData) => {
    const newShoots = produce(shoots, draft => {
      const shootIndex = draft.findIndex(s => s.id === editingShoot.id);
      if (shootIndex !== -1) {
        draft[shootIndex] = { ...draft[shootIndex], ...updatedShootData };
      }
    });
    setShoots(newShoots);
    setEditingShoot(null);
    toast({
      title: "Shoot updated!",
      description: `${updatedShootData.title} has been updated.`,
    });
  };

  const handleShootUpdate = (shootId, updatedData) => {
    setShoots(prevShoots =>
      produce(prevShoots, draft => {
        const shoot = draft.find(s => s.id === shootId);
        if (shoot) {
          Object.assign(shoot, updatedData);
        }
      })
    );
  };

  const handleDeleteShoot = (shootId) => {
    setShoots(prevShoots => prevShoots.filter(s => s.id !== shootId));
    toast({
      title: "Shoot deleted",
      description: "The shoot has been removed.",
    });
  };

  const handleDeleteProject = (projectId) => {
    const project = projects.find(p => p.id === projectId);
    if (project?.smartProject) {
      toast({ variant: "destructive", title: "Cannot delete", description: "The Shoots project is system-managed." });
      return;
    }
    const newProjects = projects.filter(p => p.id !== projectId);
    setProjects(newProjects);
    // Select first available project
    if (selectedProjectId === projectId && newProjects.length > 0) {
      setSelectedProjectId(newProjects[0].id);
    }
    toast({
      title: "Project deleted",
      description: `${project?.name ?? 'Project'} has been removed.`,
    });
  };


  const renderContent = () => {
    const aiPlaceholder = activeView === 'projects'
      ? "e.g., 'Plan a launch campaign for a new coffee brand.'"
      : "e.g., 'Shoot for Maria at La Terraza Cafe next Tuesday for £1250.'";

    const contentHeader = (
       <div className="px-6 lg:px-10 mt-8 mb-8">
          <MagicAiInput
            placeholder={aiPlaceholder}
            onSubmit={handleAiSubmit}
            isProcessing={isAiProcessing}
          />
        </div>
    )


    if (searchTerm.trim()) {
       return (
         <div className="flex-1 overflow-y-auto">
          <MainContent
            project={null}
            allProjects={projects}
            onSelectProject={handleSelectProject}
            onEditTask={setEditingTask}
            onDeleteTask={handleDeleteTask}
            onToggleTask={handleToggleTask}
            onToggleSubtask={handleToggleSubtask}
            onFileUpload={handleFileUpload}
            onRecordVoiceNote={setRecordingTask}
            onDeleteAttachment={handleDeleteAttachment}
            onDeleteSubtask={handleDeleteSubtask}
            onViewImage={setLightboxImageUrl}
          />
         </div>
       );
    }

    switch (activeView) {
      case 'settings':
        return <SettingsView user={user} />;
      case 'shoots':
        return (
          <div className="flex-1 flex flex-col overflow-y-auto">
            {contentHeader}
            <ShootsView
              shoots={shoots}
              onAddShoot={() => setAddShootModalOpen(true)}
              onEditShoot={setEditingShoot}
              onShootUpdate={handleShootUpdate}
              onDeleteShoot={handleDeleteShoot}
            />
          </div>
        );
      case 'projects':
      default:
        return (
          <div className="flex-1 flex flex-col overflow-y-auto">
            {contentHeader}
            {selectedProject ? (
              <MainContent
                project={selectedProject}
                allProjects={projects}
                onAddTask={() => setAddTaskModalOpen(true)}
                onEditProject={() => setEditProjectModalOpen(true)}
                onDeleteProject={handleDeleteProject}
                onEditTask={setEditingTask}
                onDeleteTask={handleDeleteTask}
                onToggleTask={handleToggleTask}
                onToggleSubtask={handleToggleSubtask}
                onFileUpload={handleFileUpload}
                onRecordVoiceNote={setRecordingTask}
                onDeleteAttachment={handleDeleteAttachment}
                onDeleteSubtask={handleDeleteSubtask}
                onViewImage={setLightboxImageUrl}
              />
            ) : (
              <HomeView
                shoots={shoots}
                projects={projects}
                onNavigateToShoots={() => handleNavigate('shoots')}
                onSelectProject={handleSelectProject}
              />
            )}
          </div>
        );
    }
  };


  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col md:flex-row overflow-hidden font-body">

      <Sidebar
        projects={sortedProjects}
        user={user}
        selectedProjectId={selectedProjectId}
        onSelectProject={handleSelectProject}
        onAddProject={() => setAddProjectModalOpen(true)}
        onNavigate={handleNavigate}
        activeView={activeView}
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
      />

      <main className="flex-1 flex flex-col h-full relative overflow-hidden">
         <header className="h-24 flex items-center justify-between px-6 lg:px-10 bg-background/80 backdrop-blur-sm sticky top-0 z-10 border-b border-border">
          <div className="flex items-center gap-4 md:hidden">
            <button className="text-foreground p-1" onClick={() => setIsSidebarOpen(true)}><Menu size={24} /></button>
            <h2 className="text-lg font-bold">Dopamine</h2>
          </div>

          <div className="hidden md:flex items-center gap-2 text-sm font-medium">
             {selectedProject && !searchTerm.trim() && (
              <>
                <span className="opacity-40">Projects</span>
                <span className="opacity-20">/</span>
                {selectedProject.smartProject && <Camera size={14} className="text-primary mr-1" />}
                <span className="font-bold">{selectedProject.name}</span>
              </>
            )}
          </div>

          <div className="flex items-center gap-4 ml-auto">
            <form
              onSubmit={(e) => e.preventDefault()}
              className="hidden md:flex items-center h-11 px-4 rounded-xl bg-card shadow-sm w-64 border border-border focus-within:border-primary/50 focus-within:shadow-[0_0_0_3px_hsl(var(--primary)/0.1)] transition-all duration-200"
            >
              <Search size={16} className="opacity-30 mr-3 shrink-0" />
              <input
                className="bg-transparent border-none text-sm w-full outline-none text-foreground placeholder:opacity-40"
                placeholder="Search tasks…"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </form>
            {/* Sync status indicator */}
            {syncStatus === 'syncing' && (
              <div className="hidden md:flex items-center gap-1.5 text-xs text-muted-foreground">
                <span className="size-1.5 rounded-full bg-yellow-400 animate-pulse" />
                Syncing…
              </div>
            )}
            {syncStatus === 'synced' && (
              <div className="hidden md:flex items-center gap-1.5 text-xs text-green-500">
                <span className="size-1.5 rounded-full bg-green-500" />
                Saved
              </div>
            )}
            <button
              onClick={() => { setShowInquiriesPanel(p => !p); if (unreadCount > 0) pollNow(); }}
              className="relative p-2 rounded-full hover:bg-white/10 transition-colors"
              title="Email enquiries"
            >
              <Bell className="w-5 h-5" />
              {unreadCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 bg-red-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center font-bold">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </button>
          </div>
        </header>

        {renderContent()}

        {/* Email Enquiries Panel */}
        {showInquiriesPanel && (
          <div className="fixed inset-0 z-50 flex justify-end" onClick={() => setShowInquiriesPanel(false)}>
            <div className="relative w-full max-w-md bg-gray-900 shadow-2xl flex flex-col h-full overflow-hidden" onClick={e => e.stopPropagation()}>
              <div className="flex items-center justify-between p-4 border-b border-white/10">
                <div>
                  <h2 className="text-white font-semibold text-lg">Email Enquiries</h2>
                  <p className="text-white/50 text-xs mt-0.5">AI-detected shoot enquiries from your inbox</p>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={pollNow} className="text-white/50 hover:text-white text-xs px-2 py-1 rounded border border-white/20 hover:border-white/40 transition-colors">
                    Check now
                  </button>
                  <button onClick={() => setShowInquiriesPanel(false)} className="text-white/50 hover:text-white p-1 rounded transition-colors">
                    ✕
                  </button>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto">
                {/* Show connect prompt only if tokens are definitely not stored */}
                {statusLoaded && !gmailStatus.photography && !gmailStatus.personal ? (
                  <div className="flex flex-col items-center justify-center h-full text-white/30 p-8 text-center">
                    <div className="text-4xl mb-4">📬</div>
                    <p className="text-sm">Connect your Gmail accounts</p>
                    <p className="text-xs mt-2">Start detecting shoot enquiries automatically.</p>
                    <div className="mt-6 flex flex-col gap-2 w-full">
                      <button onClick={() => openGmailAuth('photography')} className="block w-full text-center text-xs py-2 px-4 rounded bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer">
                        Connect photography@ryanstanikk.co.uk
                      </button>
                      <button onClick={() => openGmailAuth('personal')} className="block w-full text-center text-xs py-2 px-4 rounded bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer">
                        Connect rstanikk@gmail.com
                      </button>
                    </div>
                  </div>
                ) : inquiries.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-white/30 p-8 text-center">
                    <div className="text-4xl mb-4">📬</div>
                    {statusLoaded ? (
                      <>
                        <p className="text-sm">No enquiries yet.</p>
                        <p className="text-xs mt-2">Gmail is connected. New shoot enquiries will appear here automatically.</p>
                        <div className="mt-4 flex flex-col gap-1 w-full">
                          {gmailStatus.photography && <p className="text-xs text-green-400/60">✓ photography@ryanstanikk.co.uk connected</p>}
                          {gmailStatus.personal && <p className="text-xs text-green-400/60">✓ rstanikk@gmail.com connected</p>}
                        </div>
                      </>
                    ) : (
                      <p className="text-xs mt-2 animate-pulse">Checking Gmail status…</p>
                    )}
                  </div>
                ) : (
                  <div className="divide-y divide-white/5">
                    {inquiries.map(inquiry => (
                      <div
                        key={inquiry.id}
                        className={`p-4 ${!inquiry.read ? 'bg-white/5' : ''}`}
                        onClick={() => markAsRead(inquiry.id)}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              {!inquiry.read && <span className="w-2 h-2 rounded-full bg-blue-400 flex-shrink-0" />}
                              <p className="text-white text-sm font-medium truncate">{inquiry.subject}</p>
                            </div>
                            <p className="text-white/50 text-xs mt-0.5 truncate">{inquiry.from}</p>
                            <p className="text-white/40 text-xs mt-1 line-clamp-2">{inquiry.body.slice(0, 120)}...</p>
                            {inquiry.extractedData && (
                              <div className="mt-2 flex flex-wrap gap-1">
                                {inquiry.extractedData.clientName && <span className="text-xs bg-white/10 text-white/70 px-2 py-0.5 rounded-full">👤 {inquiry.extractedData.clientName}</span>}
                                {inquiry.extractedData.shootType && <span className="text-xs bg-white/10 text-white/70 px-2 py-0.5 rounded-full">📷 {inquiry.extractedData.shootType}</span>}
                                {inquiry.extractedData.shootDate && <span className="text-xs bg-white/10 text-white/70 px-2 py-0.5 rounded-full">📅 {inquiry.extractedData.shootDate}</span>}
                              </div>
                            )}
                          </div>
                          <button
                            onClick={e => { e.stopPropagation(); dismissInquiry(inquiry.id); }}
                            className="text-white/30 hover:text-white/70 text-xs p-1 flex-shrink-0 transition-colors"
                          >
                            ✕
                          </button>
                        </div>
                        {!inquiry.addedAsShoot && (
                          <button
                            onClick={e => {
                              e.stopPropagation();
                              handleAddShootFromInquiry(inquiry);
                            }}
                            className="mt-3 w-full text-xs py-1.5 px-3 rounded bg-blue-600/80 hover:bg-blue-600 text-white transition-colors font-medium"
                          >
                            + Add as Shoot
                          </button>
                        )}
                        {inquiry.addedAsShoot && (
                          <p className="mt-2 text-xs text-green-400/70">✓ Added as shoot</p>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="p-3 border-t border-white/10">
                <div className="flex gap-2 mb-2">
                  <button
                    onClick={() => openGmailAuth('photography')}
                    className={`flex-1 text-center text-xs py-1.5 rounded border transition-colors cursor-pointer ${gmailStatus.photography ? 'border-green-500/40 text-green-400/70 hover:text-green-400' : 'border-white/20 text-white/40 hover:border-white/40 hover:text-white'}`}
                    title={gmailStatus.photography ? 'Reconnect photography@ryanstanikk.co.uk' : 'Connect photography@ryanstanikk.co.uk'}
                  >
                    {gmailStatus.photography ? '✓ photography@' : 'Connect photography@'}
                  </button>
                  <button
                    onClick={() => openGmailAuth('personal')}
                    className={`flex-1 text-center text-xs py-1.5 rounded border transition-colors cursor-pointer ${gmailStatus.personal ? 'border-green-500/40 text-green-400/70 hover:text-green-400' : 'border-white/20 text-white/40 hover:border-white/40 hover:text-white'}`}
                    title={gmailStatus.personal ? 'Reconnect rstanikk@gmail.com' : 'Connect rstanikk@gmail.com'}
                  >
                    {gmailStatus.personal ? '✓ rstanikk@gmail' : 'Connect rstanikk@gmail'}
                  </button>
                </div>
                <button
                  onClick={openCalendarAuth}
                  className={`w-full text-center text-xs py-1.5 rounded border transition-colors cursor-pointer ${calendarConnected ? 'border-green-500/40 text-green-400/70 hover:text-green-400' : 'border-white/20 text-white/40 hover:border-white/40 hover:text-white'}`}
                  title={calendarConnected ? 'Reconnect Google Calendar' : 'Connect Google Calendar (Photography)'}
                >
                  {calendarConnected ? '✓ Google Calendar connected' : '📅 Connect Google Calendar'}
                </button>
              </div>
            </div>
          </div>
        )}

      </main>


      <AddTaskModal
        isOpen={isAddTaskModalOpen}
        onClose={() => setAddTaskModalOpen(false)}
        onAddTask={handleAddTask}
      />
      
      <AddProjectModal
        isOpen={isAddProjectModalOpen}
        onClose={() => setAddProjectModalOpen(false)}
        onAddProject={handleAddProject}
      />

      <AddShootModal
        isOpen={isAddShootModalOpen}
        onClose={() => setAddShootModalOpen(false)}
        onAddShoot={handleAddShoot}
      />

      {editingShoot && (
        <EditShootModal
          isOpen={!!editingShoot}
          onClose={() => setEditingShoot(null)}
          onEditShoot={handleEditShoot}
          shoot={editingShoot}
        />
      )}

      {selectedProject && !selectedProject.smartProject && (
        <EditProjectModal
          isOpen={isEditProjectModalOpen}
          onClose={() => setEditProjectModalOpen(false)}
          onEditProject={handleEditProject}
          project={selectedProject}
        />
      )}

      {editingTask && (
        <EditTaskModal
          isOpen={!!editingTask}
          onClose={() => setEditingTask(null)}
          onEditTask={handleEditTask}
          task={editingTask}
        />
      )}

      {recordingTask && (
        <RecordVoiceNoteModal
          isOpen={!!recordingTask}
          onClose={() => setRecordingTask(null)}
          onSave={(audio) => handleSaveVoiceNote(recordingTask.id, audio)}
        />
      )}
      
      {lightboxImageUrl && (
        <ImageLightbox
          imageUrl={lightboxImageUrl}
          onClose={() => setLightboxImageUrl(null)}
        />
      )}


      {/* Mobile FAB */}
      {selectedProject && !selectedProject.smartProject && (
        <button
          onClick={() => setAddTaskModalOpen(true)}
          className="md:hidden fixed bottom-6 right-6 size-16 bg-primary text-primary-foreground rounded-full shadow-2xl flex items-center justify-center z-50 transform active:scale-95 transition-transform"
        >
          <Plus size={28} />
        </button>
      )}

    </div>
  );
};


export const DopamineApp = ({ defaultView } : { defaultView?: string }) => (
  <SearchProvider>
    <DopamineAppContent defaultView={defaultView} />
  </SearchProvider>
);
