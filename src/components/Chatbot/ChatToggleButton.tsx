"use client";
import React from "react";
import { Bot } from "lucide-react";

interface ChatToggleButtonProps {
  onClick: () => void;
}

const ChatToggleButton: React.FC<ChatToggleButtonProps> = ({ onClick }) => {
  return (
    <button
      onClick={onClick}
      className="fixed bottom-5 right-5 z-50 bg-[#2A2438] text-white rounded-full p-4 shadow-lg hover:bg-[#3d3358] transition-all duration-300"
    >
      <Bot size={24} />
    </button>
  );
};

export default ChatToggleButton;
