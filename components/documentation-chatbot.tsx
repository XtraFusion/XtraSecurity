"use client";

import React, { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import {
  MessageCircle,
  Send,
  X,
  Loader,
  AlertCircle,
  HelpCircle,
} from "lucide-react";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

interface ChatbotProps {
  isOpen?: boolean;
  onClose?: () => void;
}

export function DocumentationChatbot({ isOpen = true, onClose }: ChatbotProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      role: "assistant",
      content:
        "Hi! 👋 I'm here to help with XtraSecurity docs. Ask me about CLI commands, setup, secret management, or anything else!",
      timestamp: new Date(),
    },
  ]);
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isMinimized, setIsMinimized] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Quick suggestions
  const quickSuggestions = [
    "How do I install the xtra CLI?",
    "How do I rotate a secret?",
    "What's the difference between secrets and keys?",
    "How do I use xtra run with my app?",
    "How do I set up authentication?",
  ];

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSendMessage = async (e: React.FormEvent, message?: string) => {
    e?.preventDefault?.();
    const messageToSend = message || inputValue.trim();
    if (!messageToSend || isLoading) return;

    // Add user message
    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: messageToSend,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue("");
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/chatbot", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messages: [...messages, userMessage],
          userMessage: messageToSend,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        const errorMsg = data.error || "Failed to get response";
        setError(errorMsg);
        // Add error message to chat
        setMessages(prev => [
          ...prev,
          {
            id: Date.now().toString(),
            role: "assistant",
            content: errorMsg,
            timestamp: new Date(),
          },
        ]);
      } else {
        // Add assistant response
        setMessages(prev => [
          ...prev,
          {
            id: Date.now().toString(),
            role: "assistant",
            content: data.response || "I couldn't generate a response. Please try again.",
            timestamp: new Date(),
          },
        ]);
      }
    } catch (err) {
      const errorMsg =
        err instanceof Error ? err.message : "An error occurred";
      setError("Network error. Please check your connection.");
      setMessages(prev => [
        ...prev,
        {
          id: Date.now().toString(),
          role: "assistant",
          content:
            "Sorry, I encountered a network error. Please check your connection and try again.",
          timestamp: new Date(),
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  // Minimized view
  if (isMinimized) {
    return (
      <div className="fixed bottom-6 right-6 z-50">
        <Button
          onClick={() => setIsMinimized(false)}
          size="lg"
          className="rounded-full shadow-lg w-14 h-14 p-0 flex items-center justify-center bg-emerald-600 hover:bg-emerald-700 text-white transition-all hover:scale-110 active:scale-95"
        >
          <MessageCircle className="h-6 w-6" />
        </Button>
      </div>
    );
  }

  return (
    <Card className="fixed bottom-6 right-6 w-96 max-h-[32rem] shadow-2xl border border-emerald-500/20 flex flex-col bg-white dark:bg-slate-900 z-50 rounded-2xl overflow-hidden">
      {/* Header */}
      <CardHeader className="border-b border-emerald-500/10 pb-3 bg-gradient-to-r from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-gradient-to-br from-emerald-500 to-cyan-600 rounded-xl flex items-center justify-center shadow-lg">
              <HelpCircle className="h-5 w-5 text-white" />
            </div>
            <div>
              <CardTitle className="text-sm font-semibold text-slate-900 dark:text-white">
                Doc Assistant
              </CardTitle>
              <p className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">Always ready to help</p>
            </div>
          </div>
          <div className="flex gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsMinimized(true)}
              className="h-8 w-8 p-0 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition"
            >
              <MessageCircle className="h-4 w-4 text-slate-600 dark:text-slate-300" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="h-8 w-8 p-0 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition"
            >
              <X className="h-4 w-4 text-slate-600 dark:text-slate-300" />
            </Button>
          </div>
        </div>
      </CardHeader>

      {/* Messages */}
      <div 
        className="flex-1 overflow-y-auto overflow-x-hidden bg-white dark:bg-slate-900"
        onWheel={(e) => {
          // Prevent scroll event from bubbling to parent
          e.stopPropagation();
        }}
        style={{
          scrollBehavior: 'smooth',
        }}
      >
        <div className="space-y-3 p-4">
          {messages.map(message => (
            <div
              key={message.id}
              className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-xs rounded-lg px-4 py-2.5 text-sm leading-relaxed ${
                  message.role === "user"
                    ? "bg-emerald-600 text-white rounded-br-none shadow-md"
                    : "bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-100 rounded-bl-none border border-slate-200 dark:border-slate-700"
                }`}
              >
                <p className="whitespace-pre-wrap break-words">{message.content}</p>
              </div>
            </div>
          ))}

          {/* Quick suggestions */}
          {messages.length === 1 && !isLoading && (
            <div className="mt-4 space-y-2">
              <p className="text-xs text-slate-500 dark:text-slate-400 font-semibold uppercase tracking-wider">
                Quick questions
              </p>
              {quickSuggestions.map((suggestion, idx) => (
                <button
                  key={idx}
                  onClick={(e) => {
                    e.preventDefault();
                    handleSendMessage({} as React.FormEvent, suggestion);
                  }}
                  className="w-full text-left px-3 py-2 text-sm text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-emerald-100 dark:hover:bg-emerald-900/30 rounded-lg border border-slate-200 dark:border-slate-700 hover:border-emerald-300 dark:hover:border-emerald-600 transition-all duration-200 hover:text-emerald-700 dark:hover:text-emerald-300"
                >
                  •  {suggestion}
                </button>
              ))}
            </div>
          )}

          {isLoading && (
            <div className="flex justify-start">
              <div className="bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-4 py-2.5 rounded-bl-none">
                <div className="flex items-center gap-2">
                  <Loader className="h-4 w-4 animate-spin text-emerald-600 dark:text-emerald-400" />
                  <span className="text-sm text-slate-600 dark:text-slate-400">Thinking...</span>
                </div>
              </div>
            </div>
          )}
          
          {/* Auto-scroll anchor */}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input */}
      <form onSubmit={handleSendMessage} className="border-t border-slate-200 dark:border-slate-700 p-3 bg-slate-50 dark:bg-slate-800">
        <div className="flex gap-2">
          <Input
            placeholder="Ask about XtraSecurity..."
            value={inputValue}
            onChange={e => setInputValue(e.target.value)}
            disabled={isLoading}
            className="bg-white dark:bg-slate-700 border-slate-300 dark:border-slate-600 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:border-emerald-500 dark:focus:border-emerald-400 focus:ring-emerald-500/20 text-sm rounded-lg"
          />
          <Button
            type="submit"
            disabled={isLoading || !inputValue.trim()}
            size="sm"
            className="bg-emerald-600 hover:bg-emerald-700 text-white disabled:opacity-50 disabled:cursor-not-allowed transition-all rounded-lg"
          >
            {isLoading ? (
              <Loader className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </div>
        {error && (
          <p className="text-xs text-red-600 dark:text-red-400 mt-2 flex items-center gap-1">
            <AlertCircle className="h-3 w-3" />
            {error}
          </p>
        )}
      </form>
    </Card>
  );
}

export default DocumentationChatbot;
