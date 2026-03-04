"use client";

import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Modal from "@/components/modal/page";
import { Select } from "@/components/ui/select";
import type { AnnouncementItem } from "@/redux/slice/admin/announcements/announcements";

export interface AnnouncementFormModalProps {
  readonly visible: boolean;
  readonly onClose: () => void;
  readonly initialData?: AnnouncementItem | null;
  readonly onSubmit: (data: {
    title: string;
    description: string;
    sendTo: string;
  }) => void | Promise<void>;
  readonly submitLabel?: string;
  readonly title?: string;
  readonly loading?: boolean;
}

const SEND_TO_OPTIONS = [
  { label: "All", value: "all" },
  { label: "Residents", value: "residents" },
  { label: "Owners", value: "owners" },
];

export default function AnnouncementFormModal({
  visible,
  onClose,
  initialData,
  onSubmit,
  submitLabel = "Send",
  title = "Add Announcement",
  loading = false,
}: AnnouncementFormModalProps) {
  const [formTitle, setFormTitle] = useState("");
  const [formDescription, setFormDescription] = useState("");
  const [formSendTo, setFormSendTo] = useState("all");

  useEffect(() => {
    if (visible) {
      setFormTitle(initialData?.title ?? "");
      setFormDescription(initialData?.description ?? "");
      setFormSendTo(
        (initialData as { sendTo?: string })?.sendTo ?? "all"
      );
    }
  }, [visible, initialData]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const t = formTitle.trim();
    if (!t) return;
    try {
      await onSubmit({
        title: t,
        description: formDescription.trim(),
        sendTo: formSendTo,
      });
      onClose();
    } catch {
      // Caller can toast
    }
  };

  return (
    <Modal visible={visible} onClose={onClose}>
      <div className="p-2 max-w-lg mx-auto">
        <h2 className="font-heading text-xl font-bold mb-4">{title}</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="announcement-title">Title</Label>
            <Input
              id="announcement-title"
              value={formTitle}
              onChange={(e) => setFormTitle(e.target.value)}
              placeholder="Enter title"
              className="mt-1"
              disabled={loading}
              required
            />
          </div>
          <div>
            <Label htmlFor="announcement-description">Description</Label>
            <textarea
              id="announcement-description"
              value={formDescription}
              onChange={(e) => setFormDescription(e.target.value)}
              placeholder="Enter description"
              rows={4}
              className="mt-1 flex w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs transition-[color,box-shadow] outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
              disabled={loading}
            />
          </div>
          <div>
            <Label htmlFor="announcement-sendto">Send to</Label>
            <Select
              id="announcement-sendto"
              options={SEND_TO_OPTIONS}
              value={formSendTo}
              onChange={(e) => setFormSendTo(e.target.value)}
              disabled={loading}
              className="mt-1"
            />
          </div>
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Sending…" : submitLabel}
          </Button>
        </form>
      </div>
    </Modal>
  );
}
