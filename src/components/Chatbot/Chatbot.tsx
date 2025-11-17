"use client";
import React, { useState, useRef, useEffect } from "react";
import { Bot, X, Send, StopCircle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import chatService from "@/services/chatService";
import { MarkdownRenderer } from "./MarkdownRenderer";

interface Message {
  id: string;
  sender: "user" | "bot";
  text: string;
  timestamp: Date;
  isStreaming?: boolean;
  error?: boolean;
  toolExecution?: {
    toolName: string;
    isExecuting: boolean;
    result?: any;
  };
  messageIds?: {
    userMessageId?: string;
    assistantMessageId?: string;
  };
}

export const Chatbot: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  // Single message stream state (no chat sessions)
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "msg-1",
      sender: "bot",
      text: "👋 Hi, I'm NexHR Assistant! How can I help you today?",
      timestamp: new Date(),
      isStreaming: false,
    },
  ]);
  const [input, setInput] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const streamingMessageIdRef = useRef<string | null>(null);
  // Lottie refs for chatbot animation
  const lottieChatContainer = useRef<HTMLDivElement | null>(null);
  const lottieChatAnimRef = useRef<any | null>(null);

  // no chat sessions - single active message thread
  const activeChat = null;

  // Auto-scroll on new message
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Focus textarea when chat opens
  useEffect(() => {
    if (isOpen && textareaRef.current) {
      setTimeout(() => textareaRef.current?.focus(), 100);
    }
  }, [isOpen]);

  // Load chatbot lottie when modal opens (same pattern as ScheduleInterviewModal)
  useEffect(() => {
    if (!isOpen) return;

    let mounted = true;

    const loadLottie = async () => {
      try {
        const lottieModule = await import('lottie-web');
        const lottie = (lottieModule as any).default || lottieModule;

        if (lottieChatContainer.current && mounted) {
          const anim = lottie.loadAnimation({
            container: lottieChatContainer.current,
            renderer: 'svg',
            loop: true,
            autoplay: true,
            path: '/lottieFiles/chatbot.json',
          });
          lottieChatAnimRef.current = anim;
        }
      } catch (err) {
        console.error('Failed to load chatbot lottie:', err);
      }
    };

    loadLottie();

    return () => {
      mounted = false;
      if (lottieChatAnimRef.current && typeof lottieChatAnimRef.current.destroy === 'function') {
        lottieChatAnimRef.current.destroy();
        lottieChatAnimRef.current = null;
      }
    };
  }, [isOpen]);

  const handleToolExecution = async (userQuery: string, toolName: string, toolArgs: Record<string, any>) => {
    const userMessage: Message = {
      id: `msg-${Date.now()}`,
      sender: "user",
      text: userQuery,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsStreaming(true);

    // Create waiting message
    const botMessageId = `msg-${Date.now()}-bot`;
    const waitingMessage: Message = {
      id: botMessageId,
      sender: "bot",
      text: "⏳ Executing requested action — please wait...",
      timestamp: new Date(),
      toolExecution: {
        toolName,
        isExecuting: true,
      },
    };

    setMessages((prev) => [...prev, waitingMessage]);

    try {
      const response = await chatService.executeTool(userQuery, {
        name: toolName,
        arguments: toolArgs,
      });

      // Update message with tool result
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === botMessageId
            ? {
                ...msg,
                text: response.content,
                toolExecution: {
                  toolName,
                  isExecuting: false,
                  result: response.tool_calls,
                },
                messageIds: {
                  userMessageId: response.user_message_id,
                  assistantMessageId: response.assistant_message_id,
                },
              }
            : msg
        )
      );
    } catch (error: any) {
      console.error("Tool execution error:", error);
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === botMessageId
            ? {
                ...msg,
                text: `❌ Tool execution failed: ${error.message}`,
                error: true,
                toolExecution: {
                  toolName,
                  isExecuting: false,
                },
              }
            : msg
        )
      );
    } finally {
      setIsStreaming(false);
    }
  };

  const handleSend = () => {
    if (!input.trim() || isStreaming) return;

    const userQuery = input;
    const newMessage: Message = {
      id: `msg-${Date.now()}`,
      sender: "user",
      text: userQuery,
      timestamp: new Date(),
    };

    // Update messages with user message
    setMessages((prev) => [...prev, newMessage]);

    setInput("");
    setIsStreaming(true);

    // Create placeholder bot message for streaming
    const botMessageId = `msg-${Date.now()}-bot`;
    streamingMessageIdRef.current = botMessageId;

    const placeholderMessage: Message = {
      id: botMessageId,
      sender: "bot",
      text: "",
      timestamp: new Date(),
      isStreaming: true,
    };

    setMessages((prev) => [...prev, placeholderMessage]);

    // Start SSE streaming
    chatService.streamChat(
      userQuery,
      {
        onConnected: () => {
          console.log("Connected to chat stream");
        },
        onToken: (text: string) => {
          // Append token to the streaming message
          setMessages((prev) =>
            prev.map((msg) => (msg.id === botMessageId ? { ...msg, text: msg.text + text } : msg))
          );
        },
        onDone: (assistantMessageId?: string) => {
          console.log("Stream completed", assistantMessageId);
          setIsStreaming(false);
          streamingMessageIdRef.current = null;

          // Mark message as complete and store message IDs
          setMessages((prev) => prev.map((m) => (m.id === botMessageId ? { 
            ...m, 
            isStreaming: false,
            messageIds: {
              ...m.messageIds,
              assistantMessageId,
            }
          } : m)));
        },
        onError: (error: string) => {
          console.error("Stream error:", error);
          setIsStreaming(false);
          streamingMessageIdRef.current = null;

          // Update message with error
          setMessages((prev) =>
            prev.map((msg) =>
              msg.id === botMessageId
                ? { ...msg, text: msg.text || `❌ Error: ${error}`, isStreaming: false, error: true }
                : msg
            )
          );
        },
      }
    );
  };

  const handleStopStreaming = () => {
    chatService.stopStream();
    setIsStreaming(false);
    streamingMessageIdRef.current = null;

    // Mark current streaming message as stopped
    setMessages((prev) => prev.map((msg) => (msg.isStreaming ? { ...msg, text: msg.text || "⏸️ Response stopped", isStreaming: false } : msg)));
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      chatService.stopStream();
    };
  }, []);

  // chat sessions removed - single conversation only

  const toggleChat = () => setIsOpen((prev) => !prev);
  const closeChat = () => setIsOpen(false);

  return (
    <>
      {/* Floating Chat Icon with Apple-style pulse effect */}
      <motion.button
        onClick={toggleChat}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        className="fixed bottom-5 right-5 z-50 bg-gradient-to-br from-[#2A2438] to-[#3d3358] text-white rounded-full p-4 shadow-2xl hover:shadow-xl transition-shadow duration-300"
      >
        <Bot size={24} />
        <motion.div
          className="absolute inset-0 rounded-full bg-[#2A2438]"
          initial={{ scale: 1, opacity: 0.5 }}
          animate={{ scale: 1.5, opacity: 0 }}
          transition={{ duration: 2, repeat: Infinity }}
        />
      </motion.button>

      {/* Apple-style Full Workspace Modal */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop with blur */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="fixed inset-0 z-[100] bg-black/40 backdrop-blur-sm"
              onClick={closeChat}
            />

            {/* Workspace Container */}
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="fixed inset-4 md:inset-8 lg:inset-16 z-[101] flex overflow-hidden rounded-2xl shadow-2xl bg-white/95 backdrop-blur-xl"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Left Sidebar - Quick feature list (no chat sessions) */}
              <div className="w-72 border-r border-gray-200/80 bg-gray-50/50 backdrop-blur-xl flex flex-col">
                <div className="p-4 border-b border-gray-200/80">
                  <h3 className="text-sm font-semibold text-gray-800">Try NexHR AI</h3>
                  <p className="text-xs text-gray-500 mt-1">Quick examples to get started</p>
                </div>

                <div className="flex-1 overflow-y-auto p-3 space-y-2">
                  <div className="text-xs font-semibold text-gray-600 mb-2 px-2">Quick Prompts</div>
                  <button className="w-full text-left p-3 rounded-lg hover:bg-white shadow-sm transition-colors" onClick={() => { setInput('Summarize the following text:'); textareaRef.current?.focus(); }}>
                    <div className="text-sm font-medium">Summarize text</div>
                    <div className="text-xs text-gray-500">Get a concise summary</div>
                  </button>
                  <button className="w-full text-left p-3 rounded-lg hover:bg-white shadow-sm transition-colors" onClick={() => { setInput('Draft a professional email to a client about a project delay.'); textareaRef.current?.focus(); }}>
                    <div className="text-sm font-medium">Draft an email</div>
                    <div className="text-xs text-gray-500">Create professional messages</div>
                  </button>
                  
                  <div className="text-xs font-semibold text-gray-600 mb-2 px-2 mt-4">Tool Actions</div>
                  <button 
                    className="w-full text-left p-3 rounded-lg hover:bg-white shadow-sm transition-colors border-l-2 border-blue-500"
                    onClick={() => !isStreaming && handleToolExecution('Fetch employee with ID 1', 'get_employee_by_id', { employee_id: 1 })}
                    disabled={isStreaming}
                  >
                    <div className="text-sm font-medium">Get Employee #1</div>
                    <div className="text-xs text-gray-500">Fetch employee details</div>
                  </button>
                  <button 
                    className="w-full text-left p-3 rounded-lg hover:bg-white shadow-sm transition-colors border-l-2 border-green-500"
                    onClick={() => !isStreaming && handleToolExecution('Search for employees matching "Ali"', 'get_employees', { search: 'Ali', limit: 10 })}
                    disabled={isStreaming}
                  >
                    <div className="text-sm font-medium">Search Employees</div>
                    <div className="text-xs text-gray-500">Find matching employees</div>
                  </button>
                  <button 
                    className="w-full text-left p-3 rounded-lg hover:bg-white shadow-sm transition-colors border-l-2 border-purple-500"
                    onClick={() => !isStreaming && handleToolExecution('List open jobs', 'execute_custom_select', { 
                      table: 'recruitment_jobdetails',
                      columns: ['id', 'job_title', 'city'],
                      filters: {},
                      limit: 20
                    })}
                    disabled={isStreaming}
                  >
                    <div className="text-sm font-medium">List Open Jobs</div>
                    <div className="text-xs text-gray-500">Query job postings</div>
                  </button>
                  
                  <div className="text-xs text-gray-400 mt-4 px-2">💡 Tool actions execute synchronously and show results</div>
                </div>
              </div>

              {/* Right Side - Current Chat */}
              <div className="flex-1 flex flex-col bg-white">
                {/* Chat Header */}
                <div className="flex items-center justify-between p-4 border-b border-gray-200/80 bg-white/80 backdrop-blur-xl">
                  <div className="flex items-center gap-4">
                    {/* Lottie animation (larger) */}
                    <div ref={lottieChatContainer} className="w-24 h-24 flex-shrink-0 mr-2" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }} />
                    <div>
                      <h2 className="font-semibold text-2xl text-gray-900">NEXHR AI</h2>
                      <p className="text-sm text-gray-500">Always here to help</p>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={closeChat}
                    className="hover:bg-gray-100 rounded-full"
                  >
                    <X size={20} />
                  </Button>
                </div>

                {/* Chat Messages */}
                <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-gradient-to-b from-white to-gray-50/30">
                  {messages.map((msg) => (
                    <motion.div
                      key={msg.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3 }}
                      className={cn(
                        "flex",
                        msg.sender === "user" ? "justify-end" : "justify-start"
                      )}
                    >
                      <div
                        className={cn(
                          "rounded-2xl px-4 py-3 text-sm max-w-[75%] shadow-sm relative",
                          msg.sender === "user"
                            ? "bg-gradient-to-br from-[#2A2438] to-[#3d3358] text-white"
                            : msg.error
                            ? "bg-red-50 border border-red-200 text-red-800"
                            : msg.toolExecution
                            ? "bg-blue-50 border border-blue-200 text-gray-800"
                            : "bg-white border border-gray-200/80 text-gray-800"
                        )}
                      >
                        {msg.sender === "bot" && !msg.error ? (
                          // Render bot messages with Markdown support
                          <div className="prose prose-sm max-w-none">
                            {msg.toolExecution?.isExecuting ? (
                              // Show waiting UI for tool execution
                              <div className="flex items-center gap-2">
                                <motion.div
                                  animate={{ rotate: 360 }}
                                  transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                                  className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full"
                                />
                                <span>{msg.text}</span>
                              </div>
                            ) : msg.toolExecution && !msg.toolExecution.isExecuting ? (
                              // Show tool result
                              <div>
                                <MarkdownRenderer content={msg.text} isBot={true} />
                                {msg.toolExecution.result && msg.toolExecution.result.length > 0 && (
                                  <div className="mt-3 p-3 bg-white rounded-lg border border-gray-200 text-xs">
                                    <div className="font-semibold text-gray-700 mb-2">🔧 Tool Execution Result:</div>
                                    {msg.toolExecution.result.map((tool: any, idx: number) => (
                                      <div key={idx} className="mb-2">
                                        <div className="font-medium text-blue-600">{tool.tool_name}</div>
                                        {tool.success ? (
                                          <div className="text-gray-600">✓ Success</div>
                                        ) : (
                                          <div className="text-red-600">✗ Error: {tool.error}</div>
                                        )}
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </div>
                            ) : msg.text || msg.isStreaming ? (
                              <>
                                <MarkdownRenderer content={msg.text} isBot={true} />
                                {msg.isStreaming && (
                                  <motion.span
                                    className="inline-block ml-1 text-gray-400"
                                    animate={{ opacity: [1, 0.3, 1] }}
                                    transition={{ duration: 1, repeat: Infinity }}
                                  >
                                    ▊
                                  </motion.span>
                                )}
                              </>
                            ) : (
                              <span className="text-gray-400">●●●</span>
                            )}
                          </div>
                        ) : (
                          // User messages or error messages - plain text
                          <>
                            {msg.text || (msg.isStreaming ? "●●●" : "")}
                            {msg.isStreaming && (
                              <motion.span
                                className="inline-block ml-1"
                                animate={{ opacity: [1, 0.3, 1] }}
                                transition={{ duration: 1, repeat: Infinity }}
                              >
                                ▊
                              </motion.span>
                            )}
                          </>
                        )}
                      </div>
                    </motion.div>
                  ))}
                  <div ref={chatEndRef} />
                </div>

                {/* Input Section */}
                <div className="border-t border-gray-200/80 bg-white/80 backdrop-blur-xl p-4">
                  <div className="flex items-end gap-2 max-w-4xl mx-auto">
                    <Textarea
                      ref={textareaRef}
                      placeholder={isStreaming ? "Streaming response..." : "Type your message..."}
                      className="resize-none min-h-[52px] max-h-[120px] rounded-xl border-gray-200 focus:ring-2 focus:ring-[#2A2438]/20 bg-white shadow-sm disabled:opacity-50"
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      onKeyDown={handleKeyDown}
                      rows={1}
                      disabled={isStreaming}
                    />
                    {isStreaming ? (
                      <Button
                        size="icon"
                        className="bg-red-500 hover:bg-red-600 text-white rounded-xl h-[52px] w-[52px] shadow-sm"
                        onClick={handleStopStreaming}
                      >
                        <StopCircle size={20} />
                      </Button>
                    ) : (
                      <Button
                        size="icon"
                        disabled={!input.trim()}
                        className="bg-gradient-to-br from-[#2A2438] to-[#3d3358] hover:opacity-90 text-white rounded-xl h-[52px] w-[52px] shadow-sm disabled:opacity-50"
                        onClick={handleSend}
                      >
                        <Send size={20} />
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
};
