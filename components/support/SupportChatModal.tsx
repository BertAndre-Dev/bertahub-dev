"use client";

import { useState } from "react";

import SideModal from "@/components/modal/side-modal";
import { Input } from "@/components/ui/input";
import Image from "next/image";
import { Paperclip, Send } from "lucide-react";

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
  const [chatInput, setChatInput] = useState("");

  return (
    <SideModal visible={open} onClose={onClose} widthClassName="w-full sm:w-[440px]">
      <div className="min-w-0">
        <div className="flex items-center justify-between gap-3 bg-primary px-4 py-6 text-primary-foreground">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-primary-foreground text-primary flex items-center justify-center font-bold">
              <Image src="/chatLogo1.svg" alt="Chat" width={30} height={30} />
            </div>
            <div className="min-w-0">
              <p className="font-semibold leading-tight">{agentName}</p>
              <p className="text-xs text-primary-foreground/90 leading-tight">
                Support
              </p>
            </div>
          </div>
        </div>

        <div className="mt-4 space-y-4 p-6">
          <div className="flex gap-3 items-start">
            <div className="h-9 w-9 rounded-full bg-[#D0DFF24D] flex items-center justify-center shrink-0">
              <Image src="/chatLogo2.svg" alt="Chat" width={20} height={20} />
            </div>
            <div className="rounded-xl bg-muted px-4 py-3 min-w-0">
              <p className="text-sm font-medium">
                Hi there! Welcome to BertaHub Support.
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                How can we help you today?
              </p>
            </div>
          </div>

          <div className="flex gap-3 items-start justify-end">
            <div className="max-w-[75%] rounded-xl bg-primary px-4 py-3 text-primary-foreground">
              <p className="text-sm">
                Hi, I want to make a complain, i&apos;m not able to add funds to
                my wallet
              </p>
              <p className="text-xs opacity-90 mt-2 text-right">03:53 PM</p>
            </div>
          </div>

          <div className="flex gap-3 items-start">
            <div className="h-9 w-9 rounded-full bg-[#D0DFF24D] flex items-center justify-center shrink-0">
              <Image src="/chatLogo2.svg" alt="Chat" width={20} height={20} />
            </div>
            <div className="rounded-xl bg-muted px-4 py-3 min-w-0">
              <p className="text-sm font-semibold">{agentName}</p>
              <p className="text-sm mt-1">
                Sorry to hear about your predicament, I&apos;ll look into this
              </p>
              <p className="text-xs text-muted-foreground mt-2">03:53 PM</p>
            </div>
          </div>
        </div>

        <div className="p-6">
          <div className="relative">
            <Input
              placeholder="Write a message"
              className="h-12 pr-20"
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
            />
            <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-3">
              <button
                type="button"
                className="text-muted-foreground hover:text-foreground transition-colors"
                aria-label="Attach file"
                title="Attach"
                onClick={() => {
                  // UI-only for now
                }}
              >
                <Paperclip className="w-5 h-5" />
              </button>
              <button
                type="button"
                className="text-muted-foreground hover:text-foreground transition-colors"
                aria-label="Send message"
                title="Send"
                onClick={() => {
                  // UI-only for now
                }}
              >
                <Send className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </SideModal>
  );
}

