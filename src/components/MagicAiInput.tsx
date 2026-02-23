'use client';
import React, { useState } from 'react';
import { Sparkles, Loader2 } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';

interface MagicAiInputProps {
  onSubmit: (prompt: string) => void;
  isProcessing: boolean;
  placeholder?: string;
}

export const MagicAiInput: React.FC<MagicAiInputProps> = ({
  onSubmit,
  isProcessing,
  placeholder = "Tell Gemini what to do...",
}) => {
  const [prompt, setPrompt] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim() || isProcessing) return;
    onSubmit(prompt);
    setPrompt('');
  };

  return (
    <div className="bg-card p-2 rounded-2xl border border-border shadow-sm">
      <form onSubmit={handleSubmit} className="flex items-center gap-2">
        <Sparkles className="size-5 text-primary ml-3 shrink-0" />
        <Input
          type="text"
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder={placeholder}
          className="flex-1 border-none bg-transparent shadow-none focus-visible:ring-0 text-md"
          disabled={isProcessing}
        />
        <Button
          type="submit"
          className="bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl px-5 font-bold"
          disabled={!prompt.trim() || isProcessing}
        >
          {isProcessing ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Thinking...
            </>
          ) : (
            'Generate'
          )}
        </Button>
      </form>
    </div>
  );
};
