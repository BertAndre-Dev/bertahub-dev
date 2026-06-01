"use client";

import { useCallback, useState } from "react";
import { useSelector } from "react-redux";

import { Button } from "@/components/ui/button";
import { ChatUiModeProvider } from "@/components/chat/chat-ui-mode";
import EstateAdminChatSidebar from "@/components/dashboard/estate-admin/chat/EstateAdminChatSidebar";
import EstateAdminChatWindow from "@/components/dashboard/estate-admin/chat/EstateAdminChatWindow";
import EstateAdminNewChatModal from "@/components/dashboard/estate-admin/chat/EstateAdminNewChatModal";
import type { RootState } from "@/redux/store";

function EstateAdminChatPageInner() {
  const activeChat = useSelector(
    (state: RootState) => state.estateAdminChat.activeChat,
  );
  const [newOpen, setNewOpen] = useState(false);

  const handleOpenNew = useCallback(() => setNewOpen(true), []);
  const handleCloseNew = useCallback(() => setNewOpen(false), []);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-heading text-3xl font-bold">Contact Support</h1>
          <p className="mt-1 text-muted-foreground">
            Chat with Bertahub support about billing, wallet, or estate issues.
          </p>
        </div>
        {!activeChat && (
          <Button
            type="button"
            onClick={handleOpenNew}
            aria-label="Start new chat"
          >
            Start New Chat
          </Button>
        )}
      </div>

      <div className="grid min-h-[75vh] grid-cols-1 gap-4 xl:grid-cols-3">
        <div className="xl:col-span-1">
          <EstateAdminChatSidebar />
        </div>
        <div className="xl:col-span-2">
          <EstateAdminChatWindow />
        </div>
      </div>

      <EstateAdminNewChatModal open={newOpen} onClose={handleCloseNew} />
    </div>
  );
}

export default function EstateAdminChatPage() {
  return (
    <ChatUiModeProvider mode="user">
      <EstateAdminChatPageInner />
    </ChatUiModeProvider>
  );
}
