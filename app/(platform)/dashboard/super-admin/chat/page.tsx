// "use client";

// import { useCallback, useEffect, useMemo, useState } from "react";
// import { useRouter } from "next/navigation";
// import { useSelector } from "react-redux";

// import ChatSidebar from "@/components/chat/ChatSidebar";
// import ChatWindow from "@/components/chat/ChatWindow";
// import NewChatModal from "@/components/chat/NewChatModal";
// import { ChatUiModeProvider } from "@/components/chat/chat-ui-mode";
// import { Button } from "@/components/ui/button";
// import { useChatPermissions } from "@/hooks/useChatPermissions";
// import type { RootState } from "@/redux/store";

// function SuperAdminChatInboxInner() {
//   const router = useRouter();
//   const { role, canCreateChat } = useChatPermissions();
//   const activeChat = useSelector((state: RootState) => state.chat.activeChat);

//   const [newOpen, setNewOpen] = useState(false);

//   // Guard: only super-admin should access this page
//   useEffect(() => {
//     if (role && role !== "super-admin") {
//       router.replace("/dashboard/settings");
//     }
//   }, [role, router]);

//   const showNewButton = useMemo(
//     () => canCreateChat && !activeChat,
//     [canCreateChat, activeChat],
//   );

//   const handleOpenNew = useCallback(() => setNewOpen(true), []);
//   const handleCloseNew = useCallback(() => setNewOpen(false), []);

//   return (
//     <div className="space-y-4">
//       <div className="flex items-center justify-between gap-3">
//         <div>
//           <h1 className="font-heading text-3xl font-bold">
//             Contact Support Inbox
//           </h1>
//           <p className="text-muted-foreground mt-1">
//             Manage and respond to conversations routed through Contact Support.
//           </p>
//         </div>
//         {showNewButton && (
//           <Button
//             type="button"
//             onClick={handleOpenNew}
//             aria-label="Start new chat"
//           >
//             Start New Chat
//           </Button>
//         )}
//       </div>

//       <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 min-h-[75vh]">
//         <div className="xl:col-span-1">
//           <ChatSidebar />
//         </div>
//         <div className="xl:col-span-2">
//           <ChatWindow />
//         </div>
//       </div>

//       <NewChatModal open={newOpen} onClose={handleCloseNew} />
//     </div>
//   );
// }

// export default function SuperAdminChatInboxPage() {
//   return (
//     <ChatUiModeProvider mode="agent">
//       <SuperAdminChatInboxInner />
//     </ChatUiModeProvider>
//   );
// }


"use client";

import Image from "next/image";

export default function ComingSoon() {
  return (
    <main className="min-h-[60vh] flex items-center justify-center  px-6 mt-10 lg:mt-0">
      <div className="text-center max-w-md w-full">
        {/* Logo / Name */}
        <div className="flex flex-col gap-2 items-center justify-center">
          <Image src="/chat-Logo.svg" alt="Berta Hub" width={140} height={48} />
          <h1 className="text-3xl md:text-4xl font-bold text-blue-600">
            Support Inbox - Berta Hub
          </h1>
        </div>

        {/* Message */}
        <p className="mt-3 text-gray-600 text-sm md:text-base">
          We’re working on something great. Launching soon.
        </p>

        {/* Divider */}
        <div className="w-12 h-1 bg-blue-600 mx-auto mt-6 rounded-full" />
      </div>
    </main>
  );
}