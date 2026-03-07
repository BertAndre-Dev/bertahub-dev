"use client";

import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { toast } from "react-toastify";
import { Megaphone, Calendar, Eye, Mail } from "lucide-react";
import { getSignedInUser } from "@/redux/slice/auth-mgt/auth-mgt";
import {
  getAnnouncements,
  getAnnouncementStats,
  createAnnouncement,
  updateAnnouncement,
  deleteAnnouncement,
  type AnnouncementItem,
  type CreateAnnouncementPayload,
  type UpdateAnnouncementPayload,
} from "@/redux/slice/admin/announcements/announcements";
import AnnouncementFormModal, {
  type AnnouncementFormData,
} from "@/components/admin/announcement-form-modal/page";
import { confirmDeleteToast } from "@/lib/confirm-delete-toast";
import type { RootState, AppDispatch } from "@/redux/store";
import AnnouncementsPageHeader from "@/components/admin/announcements/announcements-page-header/page";
import AnnouncementsStatsGrid from "@/components/admin/announcements/announcements-stats-grid/page";
import AnnouncementsListSection from "@/components/admin/announcements/announcements-list-section/page";

export default function AdminAnnouncementsPage() {
  const dispatch = useDispatch<AppDispatch>();
  const [estateName, setEstateName] = useState("Estate");
  const [estateId, setEstateId] = useState<string | null>(null);
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<AnnouncementItem | null>(null);

  const {
    list,
    stats,
    getStatus,
    getStatsStatus,
    createStatus,
    updateStatus,
  } = useSelector((state: RootState) => {
    const s = (state as RootState).adminAnnouncements;
    return {
      list: s?.list ?? null,
      stats: s?.stats ?? null,
      getStatus: s?.getStatus ?? "idle",
      getStatsStatus: s?.getStatsStatus ?? "idle",
      createStatus: s?.createStatus ?? "idle",
      updateStatus: s?.updateStatus ?? "idle",
    };
  });

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
          dispatch(getAnnouncements(eId)).catch((err: unknown) => {
            const e = err as { message?: string };
            toast.error(e?.message ?? "Failed to load announcements.");
          });
          dispatch(getAnnouncementStats(eId)).catch(() => {});
        }
      } catch {
        // keep default
      }
    })();
  }, [dispatch]);

  const announcements = list ?? [];

  const handleCreate = async (data: AnnouncementFormData) => {
    if (!estateId) {
      toast.error("Estate not found.");
      return;
    }
    const payload: CreateAnnouncementPayload = {
      estateId,
      title: data.title,
      content: data.content,
      description: data.description || undefined,
      scheduledFor: data.sendNow ? undefined : (data.scheduledFor || undefined),
      category: data.category,
      tags: data.tags,
      isPinned: data.isPinned,
      priority: data.priority,
      sendNow: data.sendNow,
    };
    await dispatch(createAnnouncement(payload)).unwrap();
    toast.success("Announcement created.");
    setAddModalOpen(false);
    if (estateId) {
      dispatch(getAnnouncements(estateId));
      dispatch(getAnnouncementStats(estateId));
    }
  };

  const handleUpdate = async (data: AnnouncementFormData) => {
    if (!editingItem?.id || !estateId) return;
    const payload: UpdateAnnouncementPayload = {
      estateId,
      id: editingItem.id,
      title: data.title,
      content: data.content,
      description: data.description || undefined,
      scheduledFor: data.sendNow ? undefined : (data.scheduledFor || undefined),
      category: data.category,
      tags: data.tags,
      isPinned: data.isPinned,
      priority: data.priority,
      sendNow: data.sendNow,
    };
    await dispatch(updateAnnouncement(payload)).unwrap();
    toast.success("Announcement updated.");
    setEditingItem(null);
  };

  const handleDelete = (item: AnnouncementItem) => {
    if (!item.id || !estateId) return;
    confirmDeleteToast({
      name: item.title ?? "this announcement",
      onConfirm: async () => {
        await dispatch(deleteAnnouncement({ estateId, id: item.id! })).unwrap();
        toast.success("Announcement deleted.");
        dispatch(getAnnouncements(estateId));
        dispatch(getAnnouncementStats(estateId));
      },
    });
  };

  const statsCards = [
    { label: "Total", value: stats?.totalAnnouncements ?? 0, icon: Megaphone, color: "bg-[#D0DFF280]" },
    { label: "Published", value: stats?.publishedCount ?? 0, icon: Eye, color: "bg-green-100" },
    { label: "Scheduled", value: stats?.scheduledCount ?? 0, icon: Calendar, color: "bg-amber-100" },
    { label: "Draft", value: stats?.draftCount ?? 0, icon: Megaphone, color: "bg-gray-100" },
    { label: "Total views", value: stats?.totalViews ?? 0, icon: Eye, color: "bg-blue-100" },
    { label: "Emails sent", value: stats?.totalEmailsSent ?? 0, icon: Mail, color: "bg-blue-100" },
    { label: "Avg views/ann.", value: stats?.averageViewsPerAnnouncement ?? 0, icon: Eye, color: "bg-purple-100" },
  ];

  return (
    <div className="space-y-6">
      <AnnouncementsPageHeader
        estateName={estateName}
        onAddClick={() => setAddModalOpen(true)}
        addDisabled={!estateId}
      />

      {getStatsStatus === "succeeded" && (
        <AnnouncementsStatsGrid stats={statsCards} />
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <AnnouncementsListSection
          loading={getStatus === "isLoading"}
          announcements={announcements}
          onEdit={setEditingItem}
          onDelete={handleDelete}
        />
      </div>

      <AnnouncementFormModal
        visible={addModalOpen}
        onClose={() => setAddModalOpen(false)}
        onSubmit={handleCreate}
        submitLabel="Send"
        title="Add Announcement"
        loading={createStatus === "isLoading"}
      />

      <AnnouncementFormModal
        visible={!!editingItem}
        onClose={() => setEditingItem(null)}
        initialData={editingItem ?? undefined}
        onSubmit={handleUpdate}
        submitLabel="Update"
        title="Edit Announcement"
        loading={updateStatus === "isLoading"}
      />
    </div>
  );
}
