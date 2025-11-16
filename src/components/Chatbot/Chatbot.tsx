"use client";
import React, { useState, useRef, useEffect } from "react";
import { Bot, X, Send, Plus, MessageSquare, Sparkles } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

interface Message {
  id: string;
  sender: "user" | "bot";
  text: string;
  timestamp: Date;
}

interface ChatHistory {
  id: string;
  title: string;
  preview: string;
  timestamp: Date;
  messages: Message[];
}

export const Chatbot: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [chatHistories, setChatHistories] = useState<ChatHistory[]>([
    {
      id: "1",
      title: "Welcome Chat",
      preview: "Hi, I'm NexHR Assistant!",
      timestamp: new Date(),
      messages: [
        {
          id: "msg-1",
          sender: "bot",
          text: "👋 Hi, I'm NexHR Assistant! How can I help you today?",
          timestamp: new Date(),
        },
      ],
    },
  ]);
  const [activeChatId, setActiveChatId] = useState<string>("1");
  const [input, setInput] = useState("");
  const chatEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const activeChat = chatHistories.find((chat) => chat.id === activeChatId);

  // Auto-scroll on new message
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [activeChat?.messages]);

  // Focus textarea when chat opens
  useEffect(() => {
    if (isOpen && textareaRef.current) {
      setTimeout(() => textareaRef.current?.focus(), 100);
    }
  }, [isOpen]);

  const handleSend = () => {
    if (!input.trim() || !activeChat) return;

    const newMessage: Message = {
      id: `msg-${Date.now()}`,
      sender: "user",
      text: input,
      timestamp: new Date(),
    };

    // Update chat history
    setChatHistories((prev) =>
      prev.map((chat) =>
        chat.id === activeChatId
          ? {
              ...chat,
              messages: [...chat.messages, newMessage],
              preview: input.slice(0, 50),
              timestamp: new Date(),
            }
          : chat
      )
    );

    setInput("");

    // Simulate bot response
    setTimeout(() => {
      const botMessage: Message = {
        id: `msg-${Date.now()}`,
        sender: "bot",
        text: "🤖 Thanks! I'm processing your query...",
        timestamp: new Date(),
      };

      setChatHistories((prev) =>
        prev.map((chat) =>
          chat.id === activeChatId
            ? { ...chat, messages: [...chat.messages, botMessage] }
            : chat
        )
      );
    }, 600);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const createNewChat = () => {
    const newChat: ChatHistory = {
      id: `chat-${Date.now()}`,
      title: "New Chat",
      preview: "Start a conversation...",
      timestamp: new Date(),
      messages: [
        {
          id: `msg-${Date.now()}`,
          sender: "bot",
          text: "👋 Hi! How can I assist you today?",
          timestamp: new Date(),
        },
      ],
    };
    setChatHistories((prev) => [newChat, ...prev]);
    setActiveChatId(newChat.id);
  };

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
              {/* Left Sidebar - Chat History */}
              <div className="w-72 border-r border-gray-200/80 bg-gray-50/50 backdrop-blur-xl flex flex-col">
                {/* Sidebar Header */}
                <div className="p-4 border-b border-gray-200/80">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                      <Sparkles size={20} className="text-[#2A2438]" />
                      NexHR AI
                    </h2>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={createNewChat}
                      className="h-8 w-8 rounded-lg hover:bg-white/80"
                    >
                      <Plus size={18} />
                    </Button>
                  </div>
                </div>

                {/* Chat History List */}
                <div className="flex-1 overflow-y-auto p-2 space-y-1">
                  {chatHistories.map((chat) => (
                    <motion.button
                      key={chat.id}
                      onClick={() => setActiveChatId(chat.id)}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      className={cn(
                        "w-full text-left p-3 rounded-lg transition-all duration-200",
                        activeChatId === chat.id
                          ? "bg-white shadow-sm border border-gray-200/80"
                          : "hover:bg-white/60"
                      )}
                    >
                      <div className="flex items-start gap-2">
                        <MessageSquare
                          size={16}
                          className={cn(
                            "mt-1 flex-shrink-0",
                            activeChatId === chat.id
                              ? "text-[#2A2438]"
                              : "text-gray-400"
                          )}
                        />
                        <div className="flex-1 min-w-0">
                          <h3
                            className={cn(
                              "text-sm font-medium truncate",
                              activeChatId === chat.id
                                ? "text-gray-900"
                                : "text-gray-700"
                            )}
                          >
                            {chat.title}
                          </h3>
                          <p className="text-xs text-gray-500 truncate mt-0.5">
                            {chat.preview}
                          </p>
                        </div>
                      </div>
                    </motion.button>
                  ))}
                </div>
              </div>

              {/* Right Side - Current Chat */}
              <div className="flex-1 flex flex-col bg-white">
                {/* Chat Header */}
                <div className="flex items-center justify-between p-4 border-b border-gray-200/80 bg-white/80 backdrop-blur-xl">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-9 w-9 ring-2 ring-gray-100">
                      <AvatarImage src="/bot-avatar.png" />
                      <AvatarFallback className="bg-gradient-to-br from-[#2A2438] to-[#3d3358] text-white">
                        AI
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <h2 className="font-semibold text-gray-900">
                        {activeChat?.title || "NexHR Assistant"}
                      </h2>
                      <p className="text-xs text-gray-500">Always here to help</p>
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
                  {activeChat?.messages.map((msg) => (
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
                          "rounded-2xl px-4 py-3 text-sm max-w-[75%] shadow-sm",
                          msg.sender === "user"
                            ? "bg-gradient-to-br from-[#2A2438] to-[#3d3358] text-white"
                            : "bg-white border border-gray-200/80 text-gray-800"
                        )}
                      >
                        {msg.text}
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
                      placeholder="Type your message..."
                      className="resize-none min-h-[52px] max-h-[120px] rounded-xl border-gray-200 focus:ring-2 focus:ring-[#2A2438]/20 bg-white shadow-sm"
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      onKeyDown={handleKeyDown}
                      rows={1}
                    />
                    <Button
                      size="icon"
                      disabled={!input.trim()}
                      className="bg-gradient-to-br from-[#2A2438] to-[#3d3358] hover:opacity-90 text-white rounded-xl h-[52px] w-[52px] shadow-sm disabled:opacity-50"
                      onClick={handleSend}
                    >
                      <Send size={20} />
                    </Button>
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
