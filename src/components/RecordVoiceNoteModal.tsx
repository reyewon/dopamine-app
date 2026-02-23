'use client';
import React, { useState, useEffect, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Mic, Square, Save, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useToast } from "@/hooks/use-toast";

const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
};

export const RecordVoiceNoteModal = ({ isOpen, onClose, onSave }) => {
    const [isRecording, setIsRecording] = useState(false);
    const [isBlocked, setIsBlocked] = useState(false);
    const [elapsedTime, setElapsedTime] = useState(0);
    const mediaRecorderRef = useRef(null);
    const audioChunksRef = useRef([]);
    const timerRef = useRef(null);
    const { toast } = useToast();

    useEffect(() => {
        if (isOpen) {
            navigator.mediaDevices.getUserMedia({ audio: true })
                .then(stream => {
                    setIsBlocked(false);
                    mediaRecorderRef.current = new MediaRecorder(stream);
                    mediaRecorderRef.current.ondataavailable = event => {
                        audioChunksRef.current.push(event.data);
                    };
                })
                .catch(err => {
                    console.error("Mic access denied:", err);
                    setIsBlocked(true);
                     toast({
                        variant: "destructive",
                        title: "Microphone Access Denied",
                        description: "Please allow microphone access in your browser settings to record audio.",
                    });
                });
        }
    }, [isOpen, toast]);

    const startRecording = () => {
        if (isBlocked || !mediaRecorderRef.current) return;
        audioChunksRef.current = [];
        mediaRecorderRef.current.start();
        setIsRecording(true);
        timerRef.current = setInterval(() => {
            setElapsedTime(prev => prev + 1);
        }, 1000);
    };

    const stopRecording = () => {
        mediaRecorderRef.current.stop();
        setIsRecording(false);
        clearInterval(timerRef.current);
    };

    const handleStartStop = () => {
        if (isRecording) {
            stopRecording();
        } else {
            startRecording();
        }
    };

    const handleSave = () => {
        if (audioChunksRef.current.length === 0) return;

        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const audioUrl = URL.createObjectURL(audioBlob);
        
        onSave({ url: audioUrl, duration: formatTime(elapsedTime) });
        handleClose();
    };


    const handleClose = () => {
        if (isRecording) stopRecording();
        setElapsedTime(0);
        audioChunksRef.current = [];
        onClose();
    };

    return (
        <Dialog open={isOpen} onOpenChange={handleClose}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Record Voice Note</DialogTitle>
                    <DialogDescription>
                        {isBlocked 
                            ? "Microphone access is blocked."
                            : isRecording 
                            ? "Recording in progress..." 
                            : "Click the button to start recording."
                        }
                    </DialogDescription>
                </DialogHeader>
                
                <div className="flex flex-col items-center justify-center py-8 gap-6">
                    <button
                        onClick={handleStartStop}
                        disabled={isBlocked}
                        className={cn("size-24 rounded-full flex items-center justify-center transition-colors text-white disabled:bg-gray-400 disabled:cursor-not-allowed",
                            isRecording ? 'bg-red-500 hover:bg-red-600 animate-pulse' : 'bg-primary hover:bg-primary/90'
                        )}
                    >
                        {isBlocked ? <AlertTriangle size={40} /> : isRecording ? <Square size={40} fill="currentColor" /> : <Mic size={40} />}
                    </button>
                    <p className="text-2xl font-mono font-semibold text-foreground">
                        {formatTime(elapsedTime)}
                    </p>
                </div>

                <DialogFooter>
                    <Button type="button" variant="ghost" onClick={handleClose}>Cancel</Button>
                    <Button type="button" onClick={handleSave} disabled={elapsedTime === 0 || isRecording || isBlocked}>
                        <Save className="mr-2 h-4 w-4" />
                        Save Note
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};