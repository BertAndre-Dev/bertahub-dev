"use client";

import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Modal from "@/components/modal/page";
import { Select } from "@/components/ui/select";
import type { AnnouncementItem } from "@/redux/slice/admin/announcements/announcements";

export interface AnnouncementFormData {
  title: string;
  content: string;
  description: string;
  scheduledFor: string;
  category: string;
  tags: string[];
  isPinned: boolean;
  priority: string;
}

export interface AnnouncementFormModalProps {
  readonly visible: boolean;
  readonly onClose: () => void;
  readonly initialData?: AnnouncementItem | null;
  readonly onSubmit: (data: AnnouncementFormData) => void | Promise<void>;
  readonly submitLabel?: string;
  readonly title?: string;
  readonly loading?: boolean;
}

const CATEGORY_OPTIONS = [
  { label: "General", value: "General" },
  { label: "Maintenance", value: "Maintenance" },
  { label: "Security", value: "Security" },
  { label: "Event", value: "Event" },
  { label: "Payment", value: "Payment" },
  { label: "Other", value: "Other" },
];

const PRIORITY_OPTIONS = [
  { label: "Low", value: "low" },
  { label: "Medium", value: "medium" },
  { label: "High", value: "high" },
];

function formatDateTimeLocal(iso?: string): string {
  if (!iso) return "";
  try {
    const d = new Date(iso);
    const pad = (n: number) => String(n).padStart(2, "0");
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
  } catch {
    return "";
  }
}

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
  const [formContent, setFormContent] = useState("");
  const [formDescription, setFormDescription] = useState("");
  const [formScheduledFor, setFormScheduledFor] = useState("");
  const [formCategory, setFormCategory] = useState("General");
  const [formTagsStr, setFormTagsStr] = useState("");
  const [formIsPinned, setFormIsPinned] = useState(false);
  const [formPriority, setFormPriority] = useState("low");

  useEffect(() => {
    if (visible) {
      setFormTitle(initialData?.title ?? "");
      setFormContent(initialData?.content ?? "");
      setFormDescription(initialData?.description ?? "");
      setFormScheduledFor(formatDateTimeLocal(initialData?.scheduledFor));
      setFormCategory(initialData?.category ?? "General");
      setFormTagsStr((initialData?.tags ?? []).join(", "));
      setFormIsPinned(initialData?.isPinned ?? false);
      setFormPriority(initialData?.priority ?? "low");
    }
  }, [visible, initialData]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const t = formTitle.trim();
    if (!t) return;
    const tags = formTagsStr
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
    try {
      await onSubmit({
        title: t,
        content: formContent.trim(),
        description: formDescription.trim(),
        scheduledFor: formScheduledFor.trim()
          ? new Date(formScheduledFor).toISOString()
          : "",
        category: formCategory,
        tags,
        isPinned: formIsPinned,
        priority: formPriority,
      });
      onClose();
    } catch {
      // Caller can toast
    }
  };

  return (
    <Modal visible={visible} onClose={onClose}>
      <div className="p-2 max-w-lg mx-auto max-h-[85vh] overflow-y-auto">
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
            <Label htmlFor="announcement-content">Content</Label>
            <textarea
              id="announcement-content"
              value={formContent}
              onChange={(e) => setFormContent(e.target.value)}
              placeholder="Main announcement body"
              rows={4}
              className="mt-1 flex w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs outline-none focus-visible:ring-2 focus-visible:ring-ring"
              disabled={loading}
              required
            />
          </div>
          <div>
            <Label htmlFor="announcement-description">Description (optional)</Label>
            <Input
              id="announcement-description"
              value={formDescription}
              onChange={(e) => setFormDescription(e.target.value)}
              placeholder="Short description"
              className="mt-1"
              disabled={loading}
            />
          </div>
          <div>
            <Label htmlFor="announcement-scheduled">Scheduled for (optional)</Label>
            <Input
              id="announcement-scheduled"
              type="datetime-local"
              value={formScheduledFor}
              onChange={(e) => setFormScheduledFor(e.target.value)}
              className="mt-1"
              disabled={loading}
            />
          </div>
          <div>
            <Label htmlFor="announcement-category">Category</Label>
            <Select
              id="announcement-category"
              options={CATEGORY_OPTIONS}
              value={formCategory}
              onChange={(e) => setFormCategory(e.target.value)}
              disabled={loading}
              className="mt-1"
            />
          </div>
          <div>
            <Label htmlFor="announcement-tags">Tags (comma-separated)</Label>
            <Input
              id="announcement-tags"
              value={formTagsStr}
              onChange={(e) => setFormTagsStr(e.target.value)}
              placeholder="e.g. urgent, maintenance"
              className="mt-1"
              disabled={loading}
            />
          </div>
          <div>
            <Label htmlFor="announcement-priority">Priority</Label>
            <Select
              id="announcement-priority"
              options={PRIORITY_OPTIONS}
              value={formPriority}
              onChange={(e) => setFormPriority(e.target.value)}
              disabled={loading}
              className="mt-1"
            />
          </div>
          <div className="flex items-center gap-2">
            <input
              id="announcement-pinned"
              type="checkbox"
              checked={formIsPinned}
              onChange={(e) => setFormIsPinned(e.target.checked)}
              disabled={loading}
              className="rounded border-input"
              title="Pin this announcement"
              aria-label="Pin this announcement"
            />
            <Label htmlFor="announcement-pinned" className="cursor-pointer">
              Pin this announcement
            </Label>
          </div>
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Sending…" : submitLabel}
          </Button>
        </form>
      </div>
    </Modal>
  );
}
