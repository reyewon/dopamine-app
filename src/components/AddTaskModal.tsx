'use client';
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { DatePicker } from './DatePicker';
import { PlusCircle, Trash2 } from 'lucide-react';

export const AddTaskModal = ({ isOpen, onClose, onAddTask }) => {
    const [taskName, setTaskName] = useState('');
    const [taskDescription, setTaskDescription] = useState('');
    const [dueDate, setDueDate] = useState<Date | null>(null);
    const [subtasks, setSubtasks] = useState([{ id: `sub-${Date.now()}`, label: '', isDone: false }]);

    const handleAddSubtask = () => {
        setSubtasks([...subtasks, { id: `sub-${Date.now()}`, label: '', isDone: false }]);
    };
    
    const handleSubtaskChange = (id, value) => {
        const newSubtasks = subtasks.map(st => st.id === id ? { ...st, label: value } : st);
        setSubtasks(newSubtasks);
    };

    const handleRemoveSubtask = (id) => {
        if (subtasks.length > 1) {
            setSubtasks(subtasks.filter(st => st.id !== id));
        }
    };
    
    const resetState = () => {
        setTaskName('');
        setTaskDescription('');
        setDueDate(null);
        setSubtasks([{ id: `sub-${Date.now()}`, label: '', isDone: false }]);
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!taskName) return;
        
        const finalSubtasks = subtasks.filter(st => st.label.trim() !== '');

        onAddTask({ 
            name: taskName, 
            description: taskDescription,
            dueDate: dueDate,
            subtasks: finalSubtasks,
        });
        resetState();
    };

    const handleClose = () => {
        resetState();
        onClose();
    }

    return (
        <Dialog open={isOpen} onOpenChange={handleClose}>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle>Add New Task</DialogTitle>
                    <DialogDescription>
                        Enter the details for your new task below. Click save when you're done.
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit}>
                    <div className="grid gap-4 py-4">
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="name" className="text-right">
                                Name
                            </Label>
                            <Input
                                id="name"
                                value={taskName}
                                onChange={(e) => setTaskName(e.target.value)}
                                className="col-span-3"
                                placeholder="e.g., Select menu photos"
                                required
                            />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="description" className="text-right">
                                Description
                            </Label>
                            <Textarea
                                id="description"
                                value={taskDescription}
                                onChange={(e) => setTaskDescription(e.target.value)}
                                className="col-span-3"
                                placeholder="e.g., Choose the best 5 shots for the slider."
                            />
                        </div>
                         <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="duedate" className="text-right">
                                Due Date
                            </Label>
                            <DatePicker date={dueDate} setDate={setDueDate} />
                        </div>
                        <div className="grid grid-cols-4 items-start gap-4">
                            <Label className="text-right pt-2">
                                Subtasks
                            </Label>
                            <div className="col-span-3 space-y-2">
                                {subtasks.map((st, index) => (
                                    <div key={st.id} className="flex items-center gap-2">
                                        <Input
                                            value={st.label}
                                            onChange={(e) => handleSubtaskChange(st.id, e.target.value)}
                                            placeholder={`Subtask ${index + 1}`}
                                        />
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="icon"
                                            onClick={() => handleRemoveSubtask(st.id)}
                                            disabled={subtasks.length === 1 && !st.label}
                                            className="text-muted-foreground hover:text-destructive"
                                        >
                                            <Trash2 size={16} />
                                        </Button>
                                    </div>
                                ))}
                                <Button type="button" variant="outline" size="sm" onClick={handleAddSubtask} className="mt-2">
                                    <PlusCircle size={16} className="mr-2" /> Add Subtask
                                </Button>
                            </div>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button type="button" variant="ghost" onClick={handleClose}>Cancel</Button>
                        <Button type="submit">Save Task</Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
};
