"use client";

import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { toast } from "react-toastify";
import { Card } from "@/components/ui/card";
import { Bell, Megaphone } from "lucide-react";
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

function ResidentAnnouncementCard({ item }: { item: ResidentAnnouncementItem }) {
  const title = item.title ?? "";
  const content = item.content ?? item.description ?? "";
  const date =
    item.scheduledFor ?? item.createdAt ?? item.updatedAt;
  const category = item.category ?? "—";
  const priority = item.priority ?? "—";

  return (
    <Card className="p-5 rounded-xl shadow-sm hover:shadow-md transition-shadow">
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
          <p className="text-sm text-muted-foreground whitespace-pre-wrap line-clamp-4">
            {content}
          </p>
        </div>
      </div>
    </Card>
  );
}

export default function ResidentAnnouncementsPage() {
  const dispatch = useDispatch<AppDispatch>();
  const [estateId, setEstateId] = useState<string | null>(null);
  const [estateName, setEstateName] = useState("Estate");

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
        const eId =
          userRes?.data?.estateId ??
          userRes?.data?.estate?.id ??
          null;
        const name =
          userRes?.data?.estate?.name ??
          userRes?.data?.estateName ??
          "Estate";
        setEstateId(eId);
        setEstateName(name);
        if (eId) {
          dispatch(getResidentAnnouncements(eId)).catch((err: unknown) => {
            const e = err as { message?: string };
            toast.error(e?.message ?? "Failed to load announcements.");
          });
        }
      } catch {
        // keep default
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

      {getListStatus === "isLoading" ? (
        <p className="text-muted-foreground py-12 text-center">
          Loading announcements...
        </p>
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
            <ResidentAnnouncementCard key={item.id} item={item} />
          ))}
        </div>
      )}
    </div>
  );
}
