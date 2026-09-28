"use client";

import { useCallback, useEffect, useId, useState } from "react";
import { useSelector } from "react-redux";
import { toast } from "react-toastify";
import { ImagePlus, Trash2, Video } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { MultiFileUploadItem } from "@/hooks/useMultiFileUpload";
import { getApiErrorMessage } from "@/lib/api-error";
import { getAttachmentFilename } from "@/lib/download-attachment";
import { MARKETPLACE_PRESS } from "@/lib/marketplace";
import {
  MARKETPLACE_MEDIA_ACCEPT,
  marketplaceFileKind,
} from "@/lib/marketplace-media";
import { uploadFile } from "@/lib/uploads/uploadFile";
import { validateFile } from "@/lib/uploads/validate";
import { selectAuthToken } from "@/redux/slice/auth-mgt/auth-mgt-slice";
import type { RootState } from "@/redux/store";
import { cn } from "@/lib/utils";
import { IconTooltip } from "@/components/ui/tooltip";

const PRESS = MARKETPLACE_PRESS;

type MediaKind = "image" | "video";

type GalleryItem = MultiFileUploadItem & { kind: MediaKind };

let uploadSeq = 0;
function newId() {
  uploadSeq += 1;
  return `media-${Date.now()}-${uploadSeq}`;
}

function doneItems(urls: string[], kind: MediaKind): GalleryItem[] {
  return urls.map((url, index) => ({
    id: `done-${kind}-${index}-${url}`,
    name: getAttachmentFilename(url, index),
    url,
    status: "succeeded" as const,
    progress: 100,
    error: null,
    kind,
  }));
}

function uploadStatusCopy(item: GalleryItem) {
  if (item.status === "uploading") return `${item.progress}%`;
  if (item.status === "failed") return item.error ?? "Upload failed";
  return item.kind === "video" ? "Video" : "Photo";
}

function MediaPreview({ item }: Readonly<{ item: GalleryItem }>) {
  if (item.kind === "image" && item.url) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={item.url}
        alt={item.name}
        className="h-28 w-full object-cover"
      />
    );
  }
  if (item.kind === "video" && item.url) {
    return (
      <video
        src={item.url}
        muted
        playsInline
        preload="metadata"
        className="h-28 w-full object-cover"
      />
    );
  }
  return (
    <div className="flex h-28 items-center gap-3 px-4">
      {item.kind === "video" ? (
        <Video className="size-4 shrink-0 text-muted-foreground" />
      ) : (
        <ImagePlus className="size-4 shrink-0 text-muted-foreground" />
      )}
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium">{item.name}</p>
        <p
          className={cn(
            "text-xs",
            item.status === "failed"
              ? "text-destructive"
              : "text-muted-foreground",
          )}
        >
          {uploadStatusCopy(item)}
        </p>
      </div>
    </div>
  );
}

function MediaTile({
  item,
  disabled,
  onRemove,
}: Readonly<{
  item: GalleryItem;
  disabled: boolean;
  onRemove: () => void;
}>) {
  const uploading = item.status === "uploading";
  return (
    <div className="relative overflow-hidden rounded-2xl border border-black/5 bg-muted/40">
      <MediaPreview item={item} />
      {uploading ? null : (
        <span className="pointer-events-none absolute bottom-2 left-2 rounded-full bg-black/55 px-2 py-0.5 text-[10px] font-medium tracking-[0.01em] text-white">
          {item.kind === "video" ? "Video" : "Photo"}
        </span>
      )}
      <IconTooltip label={`Remove ${item.name}`}>
        <Button
          type="button"
          size="icon"
          variant="secondary"
          className={cn("absolute top-2 right-2 size-8 rounded-full", PRESS)}
          onClick={onRemove}
          disabled={disabled || uploading}
          aria-label={`Remove ${item.name}`}
        >
          <Trash2 className="size-3.5" />
        </Button>
      </IconTooltip>
    </div>
  );
}

type Props = Readonly<{
  images: string[];
  videos: string[];
  maxImages: number;
  maxVideos: number;
  disabled?: boolean;
  onImagesChange: (urls: string[]) => void;
  onVideosChange: (urls: string[]) => void;
  onBusyChange?: (busy: boolean) => void;
}>;

export function MarketplaceMediaPicker({
  images,
  videos,
  maxImages,
  maxVideos,
  disabled = false,
  onImagesChange,
  onVideosChange,
  onBusyChange,
}: Props) {
  const inputId = useId();
  const token = useSelector((state: RootState) => selectAuthToken(state));
  const [pending, setPending] = useState<GalleryItem[]>([]);
  const isUploading = pending.some((item) => item.status === "uploading");

  useEffect(() => {
    onBusyChange?.(isUploading);
  }, [isUploading, onBusyChange]);

  const pendingImages = pending.filter(
    (item) => item.kind === "image" && item.status !== "failed",
  ).length;
  const pendingVideos = pending.filter(
    (item) => item.kind === "video" && item.status !== "failed",
  ).length;
  const imageRemaining = maxImages - images.length - pendingImages;
  const videoRemaining = maxVideos - videos.length - pendingVideos;
  const canAdd = imageRemaining > 0 || videoRemaining > 0;

  const items: GalleryItem[] = [
    ...doneItems(images, "image"),
    ...doneItems(videos, "video"),
    ...pending,
  ];

  const addFiles = useCallback(
    async (files: File[]) => {
      if (!files.length) return;
      if (!token) {
        toast.error("You must be signed in to upload a file.");
        return;
      }

      let imageSlots = maxImages - images.length - pendingImages;
      let videoSlots = maxVideos - videos.length - pendingVideos;
      let nextImages = [...images];
      let nextVideos = [...videos];

      for (const file of files) {
        const kind = marketplaceFileKind(file);
        if (!kind) {
          toast.error(`${file.name} is not a photo or video.`);
          continue;
        }
        if (kind === "image" && imageSlots <= 0) {
          toast.error(`You can add up to ${maxImages} photos.`);
          continue;
        }
        if (kind === "video" && videoSlots <= 0) {
          toast.error(`You can add up to ${maxVideos} videos.`);
          continue;
        }

        const validation = validateFile(file, { kind });
        if (!validation.ok) {
          toast.error(validation.error);
          continue;
        }

        const id = newId();
        if (kind === "image") imageSlots -= 1;
        else videoSlots -= 1;

        setPending((prev) => [
          ...prev,
          {
            id,
            name: file.name,
            url: null,
            status: "uploading",
            progress: 0,
            error: null,
            kind,
          },
        ]);

        try {
          const result = await uploadFile(file, token, "general", {
            accept: kind,
            onProgress: (percent) => {
              setPending((prev) =>
                prev.map((item) =>
                  item.id === id ? { ...item, progress: percent } : item,
                ),
              );
            },
          });
          setPending((prev) => prev.filter((item) => item.id !== id));
          if (kind === "image") {
            nextImages = [...nextImages, result.file_url];
            onImagesChange(nextImages);
          } else {
            nextVideos = [...nextVideos, result.file_url];
            onVideosChange(nextVideos);
          }
        } catch (err: unknown) {
          const message = getApiErrorMessage(err) || "Failed to upload file.";
          setPending((prev) =>
            prev.map((item) =>
              item.id === id
                ? { ...item, status: "failed", error: message }
                : item,
            ),
          );
          toast.error(message);
        }
      }
    },
    [
      images,
      maxImages,
      maxVideos,
      onImagesChange,
      onVideosChange,
      pendingImages,
      pendingVideos,
      token,
      videos,
    ],
  );

  const removeItem = (item: GalleryItem) => {
    if (item.id.startsWith("done-")) {
      if (item.kind === "image") {
        onImagesChange(images.filter((url) => url !== item.url));
        return;
      }
      onVideosChange(videos.filter((url) => url !== item.url));
      return;
    }
    setPending((prev) => prev.filter((entry) => entry.id !== item.id));
  };

  return (
    <div className="space-y-2">
      <div className="">
        {items.map((item) => (
          <MediaTile
            key={item.id}
            item={item}
            disabled={disabled}
            onRemove={() => removeItem(item)}
          />
        ))}

        {canAdd ? (
          <label
            htmlFor={inputId}
            className={cn(
              "flex min-h-28 cursor-pointer flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-black/15 bg-muted/20 px-4 py-5 text-center",
              "transition-colors hover:bg-muted/40",
              PRESS,
              (disabled || isUploading) && "pointer-events-none opacity-60",
            )}
          >
            <ImagePlus className="size-5 text-muted-foreground" />
            <span className="text-sm font-medium">Add photos or videos</span>
            <span className="text-xs text-muted-foreground">
              {imageRemaining} photos · {videoRemaining} videos left
            </span>
          </label>
        ) : null}
      </div>
      <input
        id={inputId}
        type="file"
        className="sr-only"
        accept={MARKETPLACE_MEDIA_ACCEPT}
        multiple
        disabled={disabled || !canAdd}
        onChange={(event) => {
          const files = Array.from(event.target.files ?? []);
          event.target.value = "";
          void addFiles(files);
        }}
      />
    </div>
  );
}
