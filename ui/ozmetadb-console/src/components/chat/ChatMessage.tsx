"use client";

import * as React from "react";
import { Bot, User, Copy, Check, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

export interface Message {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  timestamp: Date;
  status?: "pending" | "streaming" | "complete" | "error";
  metadata?: {
    wizardStep?: string;
    wizardProgress?: number;
    suggestions?: string[];
    actions?: { label: string; action: string }[];
    wizardComplete?: { type: string; data: Record<string, unknown> };
  };
}

interface ChatMessageProps {
  message: Message;
  onRetry?: () => void;
  onAction?: (action: string) => void;
  isStreaming?: boolean;
}

export function ChatMessage({ message, onRetry, onAction, isStreaming }: ChatMessageProps) {
  const [copied, setCopied] = React.useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(message.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const isUser = message.role === "user";
  const isAssistant = message.role === "assistant";

  return (
    <div
      className={cn(
        "group flex gap-3 px-4 py-3",
        isUser && "bg-black/[0.02] dark:bg-white/[0.02]"
      )}
    >
      {/* Avatar */}
      <div
        className={cn(
          "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg",
          isUser
            ? "bg-black/10 dark:bg-white/10"
            : "bg-gradient-to-br from-blue-500 to-purple-600 text-white"
        )}
      >
        {isUser ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
      </div>

      {/* Content */}
      <div className="flex-1 space-y-2 overflow-hidden">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium">
            {isUser ? "You" : "OZMeta Assistant"}
          </span>
          <span className="text-xs text-black/40 dark:text-white/40">
            {message.timestamp.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
          </span>
          {isStreaming && (
            <span className="flex items-center gap-1 text-xs text-blue-500">
              <span className="h-1.5 w-1.5 rounded-full bg-blue-500 animate-pulse" />
              Thinking...
            </span>
          )}
        </div>

        {/* Message content */}
        <div className="prose prose-sm dark:prose-invert max-w-none">
          <div className="whitespace-pre-wrap break-words">{message.content}</div>
          {isStreaming && (
            <span className="inline-block h-4 w-1 bg-black/50 dark:bg-white/50 animate-pulse ml-0.5" />
          )}
        </div>

        {/* Wizard progress */}
        {message.metadata?.wizardStep && (
          <div className="mt-3 p-3 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-blue-700 dark:text-blue-300">
                {message.metadata.wizardStep}
              </span>
              {message.metadata.wizardProgress !== undefined && (
                <span className="text-xs text-blue-600 dark:text-blue-400">
                  {Math.round(message.metadata.wizardProgress)}% complete
                </span>
              )}
            </div>
            {message.metadata.wizardProgress !== undefined && (
              <div className="h-1.5 bg-blue-200 dark:bg-blue-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-blue-500 rounded-full transition-all duration-300"
                  style={{ width: `${message.metadata.wizardProgress}%` }}
                />
              </div>
            )}
          </div>
        )}

        {/* Suggestions */}
        {message.metadata?.suggestions && message.metadata.suggestions.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-3">
            {message.metadata.suggestions.map((suggestion, idx) => (
              <button
                key={idx}
                onClick={() => onAction?.(suggestion)}
                className="px-3 py-1.5 text-sm rounded-full border border-black/10 dark:border-white/10 hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
              >
                {suggestion}
              </button>
            ))}
          </div>
        )}

        {/* Actions */}
        {message.metadata?.actions && message.metadata.actions.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-3">
            {message.metadata.actions.map((action, idx) => (
              <Button
                key={idx}
                variant="outline"
                size="sm"
                onClick={() => onAction?.(action.action)}
              >
                {action.label}
              </Button>
            ))}
          </div>
        )}

        {/* Error state */}
        {message.status === "error" && (
          <div className="flex items-center gap-2 mt-2 text-sm text-red-500">
            <span>Failed to send message</span>
            {onRetry && (
              <button
                onClick={onRetry}
                className="flex items-center gap-1 hover:underline"
              >
                <RefreshCw className="h-3 w-3" />
                Retry
              </button>
            )}
          </div>
        )}
      </div>

      {/* Actions */}
      {isAssistant && message.status !== "streaming" && (
        <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-start gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={handleCopy}
            title="Copy message"
          >
            {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
          </Button>
        </div>
      )}
    </div>
  );
}
