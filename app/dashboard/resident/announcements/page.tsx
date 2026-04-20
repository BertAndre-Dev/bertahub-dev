"use client";

import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { toast } from "react-toastify";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Loader from "@/components/ui/Loader";
import { Bell, Megaphone } from "lucide-react";
import Modal from "@/components/modal/page";
import { getSignedInUser } from "@/redux/slice/auth-mgt/auth-mgt";
import {
  getResidentAnnouncements,
  type ResidentAnnouncementItem,
} from "@/redux/slice/resident/announcements/announcements";
import type { RootState, AppDispatch } from "@/redux/store";

function formatDate(dateStr?: string) {
  if (!dateStr) return "—";
  try {
    const d = new Date(dateStr);
    return d.toLocaleString("en-GB", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return dateStr;
  }
}

function ResidentAnnouncementCard({
  item,
  onView,
}: {
  item: ResidentAnnouncementItem;
  onView?: (item: ResidentAnnouncementItem) => void;
}) {
  const title = item.title ?? "";
  const content = item.content ?? item.description ?? "";
  const date =
    item.scheduledFor ?? item.createdAt ?? item.updatedAt;
  const category = item.category ?? "—";
  const priority = item.priority ?? "—";

  const handleClick = () => onView?.(item);

  return (
    <Card
      className="p-5 rounded-xl shadow-sm hover:shadow-md transition-shadow cursor-pointer"
      onClick={handleClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          handleClick();
        }
      }}
    >
      <div className="flex items-start gap-3">
        <div className="p-2 rounded-lg bg-[#D0DFF280] shrink-0">
          <Bell className="w-5 h-5 text-[#0150AC]" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground mb-1">
            <span>{formatDate(date)}</span>
            <span>·</span>
            <span className="capitalize">{category}</span>
            <span>·</span>
            <span className="capitalize">Priority: {priority}</span>
          </div>
          <h3 className="font-semibold text-foreground mb-2">{title}</h3>
          <div
            className="text-sm text-muted-foreground line-clamp-4 prose prose-sm max-w-none prose-p:my-1 prose-ul:my-1 prose-ol:my-1"
            dangerouslySetInnerHTML={{ __html: content || "" }}
          />
        </div>
      </div>
    </Card>
  );
}

export default function ResidentAnnouncementsPage() {
  const dispatch = useDispatch<AppDispatch>();
  const [estateId, setEstateId] = useState<string | null>(null);
  const [estateName, setEstateName] = useState("Estate");
  const [viewingItem, setViewingItem] = useState<ResidentAnnouncementItem | null>(null);
  const [bootstrapping, setBootstrapping] = useState(true);

  const { list, getListStatus } = useSelector((state: RootState) => {
    const s = (state as RootState).residentAnnouncements;
    return {
      list: s?.list ?? null,
      getListStatus: s?.getListStatus ?? "idle",
    };
  });

  const announcements = list ?? [];

  useEffect(() => {
    (async () => {
      try {
        const userRes = await dispatch(getSignedInUser()).unwrap();
        const data = userRes?.data ?? (userRes as Record<string, unknown>);
        const rawEstateId = data?.estateId as
          | string
          | { id?: string; _id?: string }
          | undefined;
        const eId =
          typeof rawEstateId === "string"
            ? rawEstateId
            : rawEstateId?._id || rawEstateId?.id || null;
        const name =
          (data?.estateId as { name?: string } | undefined)?.name ??
          (data?.estate as { name?: string } | undefined)?.name ??
          (data?.estateName as string) ??
          "Estate";
        setEstateId(eId);
        setEstateName(name);
        if (eId) {
          dispatch(getResidentAnnouncements({ estateId: eId })).catch((err: unknown) => {
            const e = err as { message?: string };
            toast.error(e?.message ?? "Failed to load announcements.");
          });
        }
      } catch {
        // keep default
      } finally {
        setBootstrapping(false);
      }
    })();
  }, [dispatch]);

  return (
    <div className="space-y-6 pb-8">
      <div className="relative rounded-2xl overflow-hidden bg-gradient-to-br from-[#0150AC] to-[#0A387E] text-white p-6 sm:p-8">
        <div className="relative z-10 flex items-center gap-3">
          <div className="p-2 rounded-lg bg-white/20">
            <Megaphone className="w-6 h-6" />
          </div>
          <div>
            <h1 className="font-heading text-2xl sm:text-3xl font-bold">
              Announcements
            </h1>
            <p className="text-white/90 text-sm mt-1">
              Updates and notices for {estateName}
            </p>
          </div>
        </div>
      </div>

      {bootstrapping || getListStatus === "isLoading" ? (
        <div className="py-12">
          <Loader label="Loading announcements..." />
        </div>
      ) : announcements.length === 0 ? (
        <Card className="p-12 text-center">
          <Bell className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
          <p className="text-muted-foreground">
            No announcements yet. Check back later.
          </p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {announcements.map((item) => (
            <ResidentAnnouncementCard
              key={item.id}
              item={item}
              onView={setViewingItem}
            />
          ))}
        </div>
      )}

      <Modal visible={!!viewingItem} onClose={() => setViewingItem(null)}>
        {viewingItem && (
          <div className="pr-8">
            <h2 className="font-heading font-bold text-lg text-foreground mb-2">
              {viewingItem.title || "Untitled"}
            </h2>
            <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground mb-3">
              <span>{formatDate(viewingItem.scheduledFor ?? viewingItem.createdAt ?? viewingItem.updatedAt)}</span>
              <span>·</span>
              <span className="capitalize">{viewingItem.category ?? "—"}</span>
              <span>·</span>
              <span className="capitalize">Priority: {viewingItem.priority ?? "—"}</span>
            </div>
            <div
              className="prose prose-sm max-w-none prose-p:my-1 prose-ul:my-1 prose-ol:my-1 text-foreground"
              dangerouslySetInnerHTML={{
                __html: viewingItem.content ?? viewingItem.description ?? "<span>No content.</span>",
              }}
            />
            <div className="mt-6">
              <Button variant="outline" onClick={() => setViewingItem(null)}>
                Close
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
