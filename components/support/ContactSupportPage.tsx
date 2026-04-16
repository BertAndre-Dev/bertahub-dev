"use client";

import { useState } from "react";
import { MapPin, Phone } from "lucide-react";
import Image from "next/image";

import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import SupportChatModal from "@/components/support/SupportChatModal";

type Props = {
  title?: string;
  phone?: string;
  email?: string;
  hours?: string;
};

export default function ContactSupportPage({
  title = "Contact Support",
  phone = "+234 903 849 8288",
  email = "support@bertahub.com",
  hours = "Mon–Fri | 8AM – 4PM (WAT)",
}: Readonly<Props>) {
  const [chatOpen, setChatOpen] = useState(false);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-3xl font-bold">{title}</h1>
        <p className="text-muted-foreground mt-1">
          Reach out to us for any assistance
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 xl:max-w-6xl mx-auto">
        <Card className="p-6 bg-[#D0DFF24D] border-border rounded-2xl">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-background flex items-center justify-center border">
              <Phone className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="font-semibold">Call Us</p>
              <p className="text-sm text-muted-foreground mt-1">{phone}</p>
              <p className="text-sm text-muted-foreground">{hours}</p>
            </div>
          </div>
        </Card>

        <Card className="xl:max-w-6xl w-full mx-auto p-6 bg-[#D0DFF24D] border-border rounded-2xl">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-background flex items-center justify-center border">
              <MapPin className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="font-semibold">Email Us</p>
              <p className="text-sm text-muted-foreground mt-1">{email}</p>
            </div>
          </div>
        </Card>
      </div>

      <Card className="xl:max-w-6xl mx-auto p-6 md:p-8 rounded-2xl bg-[#D0DFF24D] border-border">
        <h2 className="text-center font-heading text-xl md:text-2xl font-semibold">
          Send us your complain or request
        </h2>

        <form
          // onSubmit={handleSubmit}
          className="mt-6 max-w-4xl mx-auto space-y-4"
        >
          <Input
            placeholder="Your Name"
            // value={name}
            // onChange={(e) => setName(e.target.value)}
            aria-label="Your name"
            className="h-12 rounded-xl bg-white border border-[#4480CA]"
          />
          <Input
            placeholder="Email Address"
            // value={emailAddress}
            // onChange={(e) => setEmailAddress(e.target.value)}
            aria-label="Email address"
            className="h-12 rounded-xl bg-white border border-[#4480CA]"
            type="email"
          />
          <Textarea
            placeholder="Write your message"
            // value={message}
            // onChange={(e) => setMessage(e.target.value)}
            aria-label="Message"
            className="rounded-xl min-h-[160px] bg-white border border-[#4480CA]"
          />
          <Button
            type="submit"
            // disabled={!canSubmit || submitting}
            className="w-full h-12 rounded-xl bg-primary hover:bg-primary/90"
          >
            Send Message
          </Button>
        </form>
      </Card>

      {/* Chat widget */}
      <div className="fixed bottom-9 right-6 z-50">
        <button
          type="button"
          onClick={() => setChatOpen(true)}
          className="h-14 w-14 rounded-full bg-[#0150AC] shadow-lg flex items-center justify-center hover:opacity-95 transition-opacity cursor-pointer"
          aria-label="Open chat"
          title="Chat with support"
        >
          <Image src="/chat.svg" alt="Chat" width={30} height={30} />
        </button>
      </div>

      <SupportChatModal open={chatOpen} onClose={() => setChatOpen(false)} />
    </div>
  );
}
