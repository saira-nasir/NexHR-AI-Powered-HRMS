"use client";
import React, { useState, useRef, useEffect } from "react";
import { Bot, X, Maximize2, Send } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";

interface Message {
  sender: "user" | "bot";
  text: string;
}

export const Chatbot: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    { sender: "bot", text: "👋 Hi, I'm NexHR Assistant! How can I help you today?" },
  ]);
  const [input, setInput] = useState("");
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll on new message
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = () => {
    if (!input.trim()) return;
    const newMessage: Message = { sender: "user", text: input };
    setMessages((prev) => [...prev, newMessage]);
    setInput("");

    setTimeout(() => {
      setMessages((prev) => [
        ...prev,
        { sender: "bot", text: "🤖 Thanks! I'm processing your query..." },
      ]);
    }, 600);
  };

  const toggleChat = () => setIsOpen((prev) => !prev);
  const expandChat = () => setIsExpanded(true);
  const closeChat = () => {
    setIsOpen(false);
    setIsExpanded(false);
  };

  return (
    <>
      {/* Floating Chat Icon */}
      <button
        onClick={toggleChat}
        className="fixed bottom-5 right-5 z-50 bg-[#2A2438] text-white rounded-full p-4 shadow-lg hover:bg-[#3d3358] transition-all duration-300"
      >
        <Bot size={24} />
      </button>

      {/* Chat Window */}
      {isOpen && (
        <div
          className={`fixed bottom-20 right-6 z-50 flex flex-col bg-white shadow-2xl rounded-2xl border border-gray-200 transition-all duration-300 ${
            isExpanded
              ? "w-[90vw] h-[85vh] md:w-[600px] md:h-[600px]"
              : "w-[340px] h-[420px]"
          }`}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-3 border-b bg-gray-50 rounded-t-2xl">
            <div className="flex items-center gap-2">
              <Avatar className="h-8 w-8">
                <AvatarImage src="/bot-avatar.png" />
                <AvatarFallback>AI</AvatarFallback>
              </Avatar>
              <h2 className="font-medium text-gray-800">NexHR Assistant</h2>
            </div>
            <div className="flex gap-2">
              {!isExpanded && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={expandChat}
                  className="hover:bg-gray-200"
                >
                  <Maximize2 size={18} />
                </Button>
              )}
              <Button
                variant="ghost"
                size="icon"
                onClick={closeChat}
                className="hover:bg-gray-200"
              >
                <X size={18} />
              </Button>
            </div>
          </div>

          {/* Chat Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-white">
            {messages.map((msg, idx) => (
              <div
                key={idx}
                className={`flex ${
                  msg.sender === "user" ? "justify-end" : "justify-start"
                }`}
              >
                <div
                  className={`rounded-lg px-3 py-2 text-sm ${
                    msg.sender === "user"
                      ? "bg-[#2A2438] text-white"
                      : "bg-gray-100 text-gray-800"
                  } max-w-[75%]`}
                >
                  {msg.text}
                </div>
              </div>
            ))}
            <div ref={chatEndRef} />
          </div>

          {/* Input Section */}
          <div className="border-t bg-gray-50 p-3 flex items-center gap-2 rounded-b-2xl">
            <Textarea
              placeholder="Type your message..."
              className="resize-none h-[50px]"
              value={input}
              onChange={(e) => setInput(e.target.value)}
            />
            <Button
              size="icon"
              className="bg-[#2A2438] hover:bg-[#3d3358] text-white rounded-full"
              onClick={handleSend}
            >
              <Send size={18} />
            </Button>
          </div>
        </div>
      )}
    </>
  );
};
