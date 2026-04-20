"use client";

import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { toast } from "react-toastify";
import { Megaphone, Calendar, Eye, Mail, Pencil } from "lucide-react";
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
import { canEditWithinOneHour } from "@/components/admin/announcement-card/page";
import { confirmDeleteToast } from "@/lib/confirm-delete-toast";
import type { RootState, AppDispatch } from "@/redux/store";
import AnnouncementsPageHeader from "@/components/admin/announcements/announcements-page-header/page";
import AnnouncementsStatsGrid from "@/components/admin/announcements/announcements-stats-grid/page";
import AnnouncementsListSection from "@/components/admin/announcements/announcements-list-section/page";
import Modal from "@/components/modal/page";
import { Button } from "@/components/ui/button";
import Loader from "@/components/ui/Loader";

function formatAnnouncementDate(dateStr?: string) {
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

export default function AdminAnnouncementsPage() {
  const dispatch = useDispatch<AppDispatch>();
  const [estateName, setEstateName] = useState("Estate");
  const [estateId, setEstateId] = useState<string | null>(null);
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<AnnouncementItem | null>(null);
  const [viewingItem, setViewingItem] = useState<AnnouncementItem | null>(null);
  const [bootstrapping, setBootstrapping] = useState(true);

  const { list, stats, getStatus, getStatsStatus, createStatus, updateStatus } =
    useSelector((state: RootState) => {
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
        const data = userRes?.data ?? (userRes as Record<string, unknown>);

        const rawEstateId = data?.estateId as
          | string
          | { id?: string; _id?: string; name?: string }
          | undefined;
        const normalizedEstateId =
          typeof rawEstateId === "string"
            ? rawEstateId
            : rawEstateId?._id || rawEstateId?.id || null;

        const nameFromEstateId =
          (rawEstateId as { name?: string } | undefined)?.name ?? "";
        const nameFromEstateObj =
          (data?.estate as { name?: string } | undefined)?.name ?? "";
        const fallbackEstateName = (data?.estateName as string) ?? "";
        const estateNameFinal =
          nameFromEstateId ||
          nameFromEstateObj ||
          fallbackEstateName ||
          "Estate";

        setEstateId(normalizedEstateId);
        setEstateName(estateNameFinal);

        if (normalizedEstateId) {
          dispatch(getAnnouncements({ estateId: normalizedEstateId })).catch(
            (err: unknown) => {
              const e = err as { message?: string };
              toast.error(e?.message ?? "Failed to load announcements.");
            },
          );
          dispatch(getAnnouncementStats(normalizedEstateId)).catch(() => {});
        }
      } catch {
        // keep default
      } finally {
        setBootstrapping(false);
      }
    })();
  }, [dispatch]);

  const announcements = list ?? [];
  const pageLoading =
    getStatus === "isLoading" || getStatsStatus === "isLoading";

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
      scheduledFor: data.sendNow ? undefined : data.scheduledFor || undefined,
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
      dispatch(getAnnouncements({ estateId }));
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
      scheduledFor: data.sendNow ? undefined : data.scheduledFor || undefined,
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
        dispatch(getAnnouncements({ estateId }));
        dispatch(getAnnouncementStats(estateId));
      },
    });
  };

  const statsCards = [
    {
      label: "Total",
      value: stats?.totalAnnouncements ?? 0,
      icon: Megaphone,
      color: "bg-[#D0DFF280]",
    },
    {
      label: "Published",
      value: stats?.publishedCount ?? 0,
      icon: Eye,
      color: "bg-green-100",
    },
    {
      label: "Scheduled",
      value: stats?.scheduledCount ?? 0,
      icon: Calendar,
      color: "bg-amber-100",
    },
    {
      label: "Draft",
      value: stats?.draftCount ?? 0,
      icon: Megaphone,
      color: "bg-gray-100",
    },
    {
      label: "Total views",
      value: stats?.totalViews ?? 0,
      icon: Eye,
      color: "bg-blue-100",
    },
    {
      label: "Emails sent",
      value: stats?.totalEmailsSent ?? 0,
      icon: Mail,
      color: "bg-blue-100",
    },
    {
      label: "Avg views/ann.",
      value: stats?.averageViewsPerAnnouncement ?? 0,
      icon: Eye,
      color: "bg-purple-100",
    },
  ];

  return (
    <div className="space-y-6">
      <AnnouncementsPageHeader
        estateName={estateName}
        onAddClick={() => setAddModalOpen(true)}
        addDisabled={!estateId}
      />

      {bootstrapping || (pageLoading && announcements.length === 0) ? (
        <div className="py-12">
          <Loader label="Loading announcements..." />
        </div>
      ) : (
        <>
          {getStatsStatus === "succeeded" && (
            <AnnouncementsStatsGrid stats={statsCards} />
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <AnnouncementsListSection
              loading={getStatus === "isLoading"}
              announcements={announcements}
              onView={setViewingItem}
              onEdit={setEditingItem}
              onDelete={handleDelete}
            />
          </div>
        </>
      )}

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

      <Modal visible={!!viewingItem} onClose={() => setViewingItem(null)}>
        {viewingItem && (
          <div className="p-2 md:p-4 overflow-x-hidden">
            <h2 className="font-heading font-bold text-lg text-foreground mb-2">
              {viewingItem.title || "Untitled"}
            </h2>
            <div className="flex items-center gap-2 flex-wrap text-sm text-muted-foreground mb-3">
              <span>
                {formatAnnouncementDate(
                  viewingItem.scheduledFor ??
                    viewingItem.createdAt ??
                    viewingItem.updatedAt,
                )}
              </span>
              <span>·</span>
              <span className="uppercase">{viewingItem.category ?? "—"}</span>
              <span>·</span>
              <span>Priority: {viewingItem.priority ?? "—"}</span>
              {viewingItem.isPinned && (
                <span className="text-xs bg-amber-100 text-amber-800 px-1.5 py-0.5 rounded">
                  Pinned
                </span>
              )}
            </div>
            <div
              className="prose prose-sm max-w-full pb-2 break-words prose-p:my-1 prose-ul:my-1 prose-ol:my-1 text-foreground"
              dangerouslySetInnerHTML={{
                __html:
                  viewingItem.content ??
                  viewingItem.description ??
                  "<span>No content.</span>",
              }}
            />
            <div className="flex gap-2 mt-6">
              <Button variant="outline" onClick={() => setViewingItem(null)}>
                Close
              </Button>
              {canEditWithinOneHour(viewingItem.createdAt) && (
                <Button
                  variant="default"
                  onClick={() => {
                    setEditingItem(viewingItem);
                    setViewingItem(null);
                  }}
                >
                  <Pencil className="w-4 h-4 mr-2" />
                  Edit
                </Button>
              )}
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
