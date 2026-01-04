"use client";

import * as React from "react";
import { Send, Paperclip, Mic, Square, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

interface ChatInputProps {
  onSend: (message: string) => void;
  onStop?: () => void;
  isLoading?: boolean;
  placeholder?: string;
  disabled?: boolean;
  suggestions?: string[];
  className?: string;
}

export function ChatInput({
  onSend,
  onStop,
  isLoading = false,
  placeholder = "Ask me anything...",
  disabled = false,
  suggestions = [],
  className,
}: ChatInputProps) {
  const [value, setValue] = React.useState("");
  const textareaRef = React.useRef<HTMLTextAreaElement>(null);

  // Auto-resize textarea
  React.useEffect(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = "auto";
      textarea.style.height = `${Math.min(textarea.scrollHeight, 200)}px`;
    }
  }, [value]);

  const handleSubmit = () => {
    if (value.trim() && !isLoading && !disabled) {
      onSend(value.trim());
      setValue("");
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleSuggestionClick = (suggestion: string) => {
    onSend(suggestion);
  };

  return (
    <div className={cn("space-y-2", className)}>
      {/* Suggestions */}
      {suggestions.length > 0 && !value && (
        <div className="flex flex-wrap gap-2 px-4">
          {suggestions.map((suggestion, idx) => (
            <button
              key={idx}
              onClick={() => handleSuggestionClick(suggestion)}
              className="px-3 py-1.5 text-sm rounded-full border border-black/10 dark:border-white/10 hover:bg-black/5 dark:hover:bg-white/5 transition-colors text-left"
            >
              {suggestion}
            </button>
          ))}
        </div>
      )}

      {/* Input area */}
      <div className="relative px-4 pb-4">
        <div className="flex items-end gap-2 p-2 rounded-xl border border-black/10 dark:border-white/10 bg-white dark:bg-white/5 shadow-sm focus-within:ring-2 focus-within:ring-black/10 dark:focus-within:ring-white/10">
          {/* Attachment button */}
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-8 w-8 shrink-0"
            disabled={isLoading || disabled}
            title="Attach file"
          >
            <Paperclip className="h-4 w-4" />
          </Button>

          {/* Textarea */}
          <textarea
            ref={textareaRef}
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            disabled={isLoading || disabled}
            rows={1}
            className={cn(
              "flex-1 resize-none bg-transparent text-sm placeholder:text-black/40 dark:placeholder:text-white/40",
              "focus:outline-none disabled:cursor-not-allowed disabled:opacity-50",
              "min-h-[36px] max-h-[200px] py-2"
            )}
          />

          {/* Voice input */}
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-8 w-8 shrink-0"
            disabled={isLoading || disabled}
            title="Voice input"
          >
            <Mic className="h-4 w-4" />
          </Button>

          {/* Send/Stop button */}
          {isLoading ? (
            <Button
              type="button"
              size="icon"
              className="h-8 w-8 shrink-0"
              onClick={onStop}
              title="Stop generating"
            >
              <Square className="h-3 w-3" />
            </Button>
          ) : (
            <Button
              type="button"
              size="icon"
              className="h-8 w-8 shrink-0"
              onClick={handleSubmit}
              disabled={!value.trim() || disabled}
              title="Send message"
            >
              {disabled ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </Button>
          )}
        </div>

        {/* Character count / hint */}
        <div className="flex justify-between mt-1 px-2 text-xs text-black/40 dark:text-white/40">
          <span>Press Enter to send, Shift+Enter for new line</span>
          {value.length > 0 && <span>{value.length} characters</span>}
        </div>
      </div>
    </div>
  );
}
