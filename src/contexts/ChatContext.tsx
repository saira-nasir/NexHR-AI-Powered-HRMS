import React, { createContext, useState } from "react";

interface Message {
  sender: "user" | "bot";
  text: string;
}

interface ChatContextType {
  messages: Message[];
  sendMessage: (text: string) => void;
}

export const ChatContext = createContext<ChatContextType | undefined>(undefined);

export const ChatProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [messages, setMessages] = useState<Message[]>([]);

  const sendMessage = (text: string) => {
    const userMsg = { sender: "user", text };
    const botMsg = { sender: "bot", text: `You said: ${text}` };

    setMessages((prev) => [...prev, userMsg, botMsg]);
  };

  return (
    <ChatContext.Provider value={{ messages, sendMessage }}>
      {children}
    </ChatContext.Provider>
  );
};
