"use client";

import SideModal from "@/components/modal/side-modal";
import Image from "next/image";
import { useCallback, useMemo, useState } from "react";

import ChatSidebar from "@/components/chat/ChatSidebar";
import ChatWindow from "@/components/chat/ChatWindow";
import NewChatModal from "@/components/chat/NewChatModal";
import { Button } from "@/components/ui/button";
import { useChatPermissions } from "@/hooks/useChatPermissions";
import { useSelector } from "react-redux";
import type { RootState } from "@/redux/store";

type Props = {
  open: boolean;
  onClose: () => void;
  agentName?: string;
};

export default function SupportChatModal({
  open,
  onClose,
  agentName = "Zainab",
}: Readonly<Props>) {
  const { canCreateChat, canViewAgentChats } = useChatPermissions();
  const activeChat = useSelector((state: RootState) => state.chat.activeChat);
  const [newOpen, setNewOpen] = useState(false);

  const widthClassName = useMemo(() => {
    return canViewAgentChats ? "w-full sm:w-[980px]" : "w-full sm:w-[720px]";
  }, [canViewAgentChats]);

  const handleOpenNew = useCallback(() => setNewOpen(true), []);
  const handleCloseNew = useCallback(() => setNewOpen(false), []);

  return (
    <SideModal visible={open} onClose={onClose} widthClassName={widthClassName}>
      <div className="min-w-0">
        <div className="flex items-center justify-between gap-3 bg-primary px-4 py-6 text-primary-foreground">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-primary-foreground text-primary flex items-center justify-center font-bold">
              <Image src="/chatLogo1.svg" alt="Chat" width={30} height={30} />
            </div>
            <div className="min-w-0">
              <p className="font-semibold leading-tight">{agentName}</p>
              <p className="text-xs text-primary-foreground/90 leading-tight">
                Contact Support
              </p>
            </div>
          </div>

          {canCreateChat && !activeChat && (
            <Button
              type="button"
              variant="secondary"
              onClick={handleOpenNew}
              aria-label="Start new chat"
            >
              Start New Chat
            </Button>
          )}
        </div>

        <div className="p-4">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 min-h-[60vh]">
            <div className="lg:col-span-1">
              <ChatSidebar />
            </div>
            <div className="lg:col-span-2">
              <ChatWindow />
            </div>
          </div>
        </div>

        <NewChatModal open={newOpen} onClose={handleCloseNew} />
      </div>
    </SideModal>
  );
}

