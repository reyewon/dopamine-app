'use client';
import React, { useState, useRef } from 'react';
import { Sparkles, ArrowRight } from 'lucide-react';

interface MagicAiInputProps {
  onSubmit: (prompt: string) => void;
  isProcessing: boolean;
  placeholder?: string;
}

export const MagicAiInput: React.FC<MagicAiInputProps> = ({
  onSubmit,
  isProcessing,
  placeholder = "e.g. 'Plan a launch campaign for a new coffee brand.'",
}) => {
  const [prompt, setPrompt] = useState('');
  const [focused, setFocused] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim() || isProcessing) return;
    onSubmit(prompt);
    setPrompt('');
  };

  const hasContent = prompt.trim().length > 0;

  return (
    <form
      onSubmit={handleSubmit}
      onClick={() => inputRef.current?.focus()}
      className={[
        'relative flex items-center gap-3 px-4 py-3 rounded-2xl cursor-text bg-white border transition-all duration-300',
        focused
          ? 'border-primary/50 shadow-[0_0_0_4px_hsl(15_66%_60%_/_0.1),0_4px_20px_-4px_hsl(15_66%_60%_/_0.2)]'
          : 'border-border shadow-sm hover:border-primary/30 hover:shadow-md',
      ].join(' ')}
    >
      {/* Animated sparkle */}
      <div className={`shrink-0 transition-colors duration-300 ${focused || isProcessing ? 'text-primary' : 'text-muted-foreground/50'}`}>
        {isProcessing ? (
          <div className="size-[18px] relative flex items-center justify-center">
            <span className="absolute inset-0 rounded-full border-2 border-primary/30 border-t-primary animate-spin" />
          </div>
        ) : (
          <Sparkles size={18} className={focused ? 'animate-sparkle' : ''} />
        )}
      </div>

      <input
        ref={inputRef}
        type="text"
        value={prompt}
        onChange={(e) => setPrompt(e.target.value)}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        placeholder={isProcessing ? 'Thinking…' : placeholder}
        disabled={isProcessing}
        className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground/40 outline-none disabled:opacity-50 min-w-0"
      />

      <button
        type="submit"
        disabled={!hasContent || isProcessing}
        className={[
          'shrink-0 flex items-center gap-1.5 px-5 py-2 rounded-xl font-bold text-sm transition-all duration-200',
          hasContent && !isProcessing
            ? 'bg-primary text-primary-foreground hover:brightness-110 active:scale-95 shadow-sm'
            : 'bg-muted text-muted-foreground cursor-not-allowed opacity-60',
        ].join(' ')}
      >
        {isProcessing ? 'Thinking…' : (
          <>
            Generate
            <ArrowRight size={14} className="hidden sm:block" />
          </>
        )}
      </button>
    </form>
  );
};
