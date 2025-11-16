"use client";
import React, { useState, useRef, useEffect } from "react";
import { X, Maximize2, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";

interface Message {
  sender: "user" | "bot";
  text: string;
}

interface ChatMessageProps {
  isExpanded: boolean;
  onExpand: () => void;
  onClose: () => void;
}

const ChatMessage: React.FC<ChatMessageProps> = ({
  isExpanded,
  onExpand,
  onClose,
}) => {
  const [messages, setMessages] = useState<Message[]>([
    { sender: "bot", text: "👋 Hi! I'm NexHR Assistant. How can I help?" },
  ]);
  const [input, setInput] = useState("");
  const chatEndRef = useRef<HTMLDivElement>(null);

  const handleSend = () => {
    if (!input.trim()) return;
    const newMsg: Message = { sender: "user", text: input };
    setMessages((prev) => [...prev, newMsg]);
    setInput("");

    // Simulated bot response
    setTimeout(() => {
      setMessages((prev) => [
        ...prev,
        { sender: "bot", text: "I'm processing your request..." },
      ]);
    }, 600);
  };

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  return (
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
              onClick={onExpand}
              className="hover:bg-gray-200"
            >
              <Maximize2 size={18} />
            </Button>
          )}
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="hover:bg-gray-200"
          >
            <X size={18} />
          </Button>
        </div>
      </div>

      {/* Messages */}
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

      {/* Input */}
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
  );
};

export default ChatMessage;
