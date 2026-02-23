export interface Subtask {
  id: string;
  text: string;
  completed: boolean;
}

export interface Task {
  id: string;
  name: string;
  description: string;
  completed: boolean;
  subtasks: Subtask[];
  files: { name: string; url: string }[];
  audioNotes: { name: string; url: string }[];
}

export interface Project {
  id: string;
  name: string;
  tasks: Task[];
  progress: number;
}
