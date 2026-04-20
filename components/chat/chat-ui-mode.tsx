"use client";

import { createContext, useContext, type ReactNode } from "react";

export type ChatUiMode = "user" | "agent";

const ChatUiModeContext = createContext<ChatUiMode>("user");

type ProviderProps = {
  mode: ChatUiMode;
  children: ReactNode;
};

export function ChatUiModeProvider({ mode, children }: Readonly<ProviderProps>) {
  return (
    <ChatUiModeContext.Provider value={mode}>
      {children}
    </ChatUiModeContext.Provider>
  );
}

export function useChatUiMode(): ChatUiMode {
  return useContext(ChatUiModeContext);
}
