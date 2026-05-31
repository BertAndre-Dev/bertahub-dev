"use client";

import React, { useState, useEffect, useRef } from "react";
import dynamic from "next/dynamic";
import "react-quill-new/dist/quill.snow.css";
import { Calendar, FileText, ImageIcon, X } from "lucide-react";
import { toast } from "react-toastify";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Modal from "@/components/modal/page";
import { Select } from "@/components/ui/select";
import type { AnnouncementItem } from "@/redux/slice/admin/announcements/announcements";
import { fileToBase64 } from "@/lib/file-to-base64";

const ReactQuill = dynamic(() => import("react-quill-new"), { ssr: false });

const MAX_IMAGE_BYTES = 5 * 1024 * 1024; // 5MB
const MAX_FILE_BYTES = 10 * 1024 * 1024; // 10MB
const IMAGE_ACCEPT = "image/jpeg,image/png,image/webp,image/gif";
const FILE_ACCEPT =
  ".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.csv,application/pdf";

export interface AnnouncementFormData {
  title: string;
  content: string;
  description: string;
  scheduledFor: string;
  category: string;
  tags: string[];
  isPinned: boolean;
  priority: string;
  sendNow: boolean;
  /** Full data URL, e.g. `data:image/png;base64,...`. */
  image: string | null;
  /** Full data URL, e.g. `data:application/pdf;base64,...`. */
  file: string | null;
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

// "send_now" | "schedule"
type SendMode = "send_now" | "schedule";

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
  const [sendMode, setSendMode] = useState<SendMode>("send_now");
  const [formImage, setFormImage] = useState<File | null>(null);
  const [formFile, setFormFile] = useState<File | null>(null);
  const [existingImageUrl, setExistingImageUrl] = useState<string>("");
  const [existingFileUrl, setExistingFileUrl] = useState<string>("");
  const imageInputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

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
      setSendMode(initialData?.scheduledFor ? "schedule" : "send_now");
      setFormImage(null);
      setFormFile(null);
      setExistingImageUrl(
        initialData?.imageUrl ?? initialData?.image ?? "",
      );
      setExistingFileUrl(initialData?.fileUrl ?? initialData?.file ?? "");
      if (imageInputRef.current) imageInputRef.current.value = "";
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }, [visible, initialData]);

  const handleSendModeChange = (mode: SendMode) => {
    setSendMode(mode);
    if (mode === "send_now") setFormScheduledFor("");
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0] ?? null;
    if (!f) {
      setFormImage(null);
      return;
    }
    if (f.size > MAX_IMAGE_BYTES) {
      toast.error("Image must be 5MB or less.");
      e.target.value = "";
      return;
    }
    setFormImage(f);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0] ?? null;
    if (!f) {
      setFormFile(null);
      return;
    }
    if (f.size > MAX_FILE_BYTES) {
      toast.error("Attachment must be 10MB or less.");
      e.target.value = "";
      return;
    }
    setFormFile(f);
  };

  const clearImage = () => {
    setFormImage(null);
    if (imageInputRef.current) imageInputRef.current.value = "";
  };

  const clearFile = () => {
    setFormFile(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const t = formTitle.trim();
    if (!t) return;
    if (sendMode === "schedule" && !formScheduledFor.trim()) {
      return;
    }
    const tags = formTagsStr
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
    try {
      let imageDataUrl: string | null = null;
      let fileDataUrl: string | null = null;
      if (formImage) {
        imageDataUrl = await fileToBase64(formImage);
      }
      if (formFile) {
        fileDataUrl = await fileToBase64(formFile);
      }
      await onSubmit({
        title: t,
        content: formContent.trim(),
        description: formDescription.trim(),
        scheduledFor:
          sendMode === "schedule" && formScheduledFor.trim()
            ? new Date(formScheduledFor).toISOString()
            : "",
        category: formCategory,
        tags,
        isPinned: formIsPinned,
        priority: formPriority,
        sendNow: sendMode === "send_now",
        image: imageDataUrl,
        file: fileDataUrl,
      });
      onClose();
    } catch (err: unknown) {
      const msg =
        (err as { message?: string })?.message ?? "Failed to process image.";
      toast.error(msg);
    }
  };

  const formatBytes = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const filenameFromUrl = (url: string): string => {
    try {
      const u = new URL(url);
      const last = u.pathname.split("/").filter(Boolean).pop();
      return last ? decodeURIComponent(last) : url;
    } catch {
      return url.split("/").pop() ?? url;
    }
  };

  return (
    <Modal visible={visible} onClose={onClose}>
      <div className="p-2 max-w-lg mx-auto max-h-[85vh]">
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
            <div className="mt-1 [&_.ql-container]:min-h-[120px] [&_.ql-editor]:min-h-[120px]">
              <ReactQuill
                id="announcement-content"
                theme="snow"
                value={formContent}
                onChange={(value) => setFormContent(value ?? "")}
                placeholder="Main announcement body (bold, italics, etc.)"
                readOnly={loading}
                modules={{
                  toolbar: [
                    ["bold", "italic", "underline", "strike"],
                    [{ list: "ordered" }, { list: "bullet" }],
                    ["clean"],
                  ],
                }}
                className="rounded-md border border-input bg-background"
              />
            </div>
          </div>

          {/* <div>
            <Label htmlFor="announcement-description">Description</Label>
            <Input
              id="announcement-description"
              value={formDescription}
              onChange={(e) => setFormDescription(e.target.value)}
              placeholder="Short description"
              className="mt-1"
              disabled={loading}
            />
          </div> */}

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
            <Label htmlFor="announcement-tags">Tags</Label>
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

          {/* Image upload */}
          <div>
            <Label htmlFor="announcement-image">Image</Label>
            <p className="text-xs text-muted-foreground mt-0.5">
              JPEG, PNG, WebP or GIF · Max 5MB
            </p>
            <div className="mt-1.5">
              <input
                ref={imageInputRef}
                id="announcement-image"
                type="file"
                accept={IMAGE_ACCEPT}
                onChange={handleImageChange}
                disabled={loading}
                title="Announcement image"
                aria-label="Announcement image"
                className="block w-full text-sm text-foreground file:mr-3 file:py-1.5 file:px-3 file:rounded-md file:border file:border-input file:bg-background file:text-sm file:font-medium file:cursor-pointer hover:file:bg-muted"
              />
            </div>

            {formImage && (
              <div className="mt-2 flex items-center gap-2 rounded-md border border-border p-2 text-sm">
                <ImageIcon className="h-4 w-4 shrink-0 text-muted-foreground" />
                <span className="truncate flex-1">{formImage.name}</span>
                <span className="text-xs text-muted-foreground">
                  {formatBytes(formImage.size)}
                </span>
                <button
                  type="button"
                  onClick={clearImage}
                  disabled={loading}
                  className="p-1 rounded hover:bg-muted text-muted-foreground"
                  aria-label="Remove image"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            )}

            {!formImage && existingImageUrl && (
              <div className="mt-2 flex items-center gap-2 rounded-md border border-border p-2 text-sm">
                <ImageIcon className="h-4 w-4 shrink-0 text-muted-foreground" />
                <a
                  href={existingImageUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="truncate flex-1 text-primary hover:underline"
                >
                  {filenameFromUrl(existingImageUrl)}
                </a>
                <span className="text-xs text-muted-foreground">current</span>
              </div>
            )}
          </div>

          {/* Attachment upload */}
          <div>
            <Label htmlFor="announcement-file">Attachment</Label>
            <p className="text-xs text-muted-foreground mt-0.5">
              PDF, DOCX, etc. · Max 10MB
            </p>
            <div className="mt-1.5">
              <input
                ref={fileInputRef}
                id="announcement-file"
                type="file"
                accept={FILE_ACCEPT}
                onChange={handleFileChange}
                disabled={loading}
                title="Announcement attachment"
                aria-label="Announcement attachment"
                className="block w-full text-sm text-foreground file:mr-3 file:py-1.5 file:px-3 file:rounded-md file:border file:border-input file:bg-background file:text-sm file:font-medium file:cursor-pointer hover:file:bg-muted"
              />
            </div>

            {formFile && (
              <div className="mt-2 flex items-center gap-2 rounded-md border border-border p-2 text-sm">
                <FileText className="h-4 w-4 shrink-0 text-muted-foreground" />
                <span className="truncate flex-1">{formFile.name}</span>
                <span className="text-xs text-muted-foreground">
                  {formatBytes(formFile.size)}
                </span>
                <button
                  type="button"
                  onClick={clearFile}
                  disabled={loading}
                  className="p-1 rounded hover:bg-muted text-muted-foreground"
                  aria-label="Remove attachment"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            )}

            {!formFile && existingFileUrl && (
              <div className="mt-2 flex items-center gap-2 rounded-md border border-border p-2 text-sm">
                <FileText className="h-4 w-4 shrink-0 text-muted-foreground" />
                <a
                  href={existingFileUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="truncate flex-1 text-primary hover:underline"
                >
                  {filenameFromUrl(existingFileUrl)}
                </a>
                <span className="text-xs text-muted-foreground">current</span>
              </div>
            )}
          </div>

          {/* Send mode — only one can be checked at a time */}
          <div className="space-y-3 rounded-md border border-border p-3 bg-muted/20">
            <p className="text-sm font-medium text-foreground">When to send</p>

            {/* Send now */}
            <div className="flex items-center gap-2">
              <input
                title="Send now"
                id="send-now"
                type="checkbox"
                checked={sendMode === "send_now"}
                onChange={() => handleSendModeChange("send_now")}
                disabled={loading}
                className="rounded border-input"
              />
              <Label htmlFor="send-now" className="cursor-pointer">
                Send now
              </Label>
            </div>

            {/* Schedule */}
            <div className="flex items-center gap-2">
              <input
                title="Schedule for later"
                id="send-schedule"
                type="checkbox"
                checked={sendMode === "schedule"}
                onChange={() => handleSendModeChange("schedule")}
                disabled={loading}
                className="rounded border-input"
              />
              <Label htmlFor="send-schedule" className="cursor-pointer">
                Schedule for later
              </Label>
            </div>

            {/* Date/time input — only shown when schedule is ticked */}
            {sendMode === "schedule" && (
              <div className="pt-1">
                <Label htmlFor="announcement-scheduled">Date &amp; time</Label>
                <div className="mt-1 flex items-center gap-2">
                  <Calendar
                    className="h-4 w-4 shrink-0 text-muted-foreground"
                    aria-hidden
                  />
                  <Input
                    id="announcement-scheduled"
                    type="datetime-local"
                    value={formScheduledFor}
                    onChange={(e) => setFormScheduledFor(e.target.value)}
                    className="min-w-0 flex-1"
                    disabled={loading}
                    required
                  />
                </div>
              </div>
            )}
          </div>

          {/* Pin */}
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

          <Button type="submit" className="w-full mb-8" disabled={loading}>
            {loading ? "Sending…" : submitLabel}
          </Button>
        </form>
      </div>
    </Modal>
  );
}
