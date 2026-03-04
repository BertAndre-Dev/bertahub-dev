"use client";

import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { toast } from "react-toastify";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { getSignedInUser } from "@/redux/slice/auth-mgt/auth-mgt";
import {
  getAnnouncements,
  createAnnouncement,
  updateAnnouncement,
  deleteAnnouncement,
  type AnnouncementItem,
  type CreateAnnouncementPayload,
  type UpdateAnnouncementPayload,
} from "@/redux/slice/admin/announcements/announcements";
import AnnouncementCard from "@/components/admin/announcement-card/page";
import AnnouncementFormModal from "@/components/admin/announcement-form-modal/page";
import { confirmDeleteToast } from "@/lib/confirm-delete-toast";
import type { RootState, AppDispatch } from "@/redux/store";

export default function AdminAnnouncementsPage() {
  const dispatch = useDispatch<AppDispatch>();
  const [estateName, setEstateName] = useState("Estate");
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<AnnouncementItem | null>(null);

  const { list, getStatus, createStatus, updateStatus } = useSelector(
    (state: RootState) => {
      const s = (state as RootState).adminAnnouncements;
      return {
        list: s?.list ?? null,
        getStatus: s?.getStatus ?? "idle",
        createStatus: s?.createStatus ?? "idle",
        updateStatus: s?.updateStatus ?? "idle",
      };
    }
  );

  useEffect(() => {
    (async () => {
      try {
        const userRes = await dispatch(getSignedInUser()).unwrap();
        const name =
          userRes?.data?.estate?.name ??
          userRes?.data?.estateName ??
          "Estate";
        setEstateName(name);
      } catch {
        // keep default
      }
    })();
  }, [dispatch]);

  useEffect(() => {
    dispatch(getAnnouncements()).catch((err: unknown) => {
      const e = err as { message?: string };
      toast.error(e?.message ?? "Failed to load announcements.");
    });
  }, [dispatch]);

  const loading =
    getStatus === "isLoading" ||
    createStatus === "isLoading" ||
    updateStatus === "isLoading";
  const announcements = list ?? [];

  const handleCreate = async (data: {
    title: string;
    description: string;
    sendTo: string;
  }) => {
    const payload: CreateAnnouncementPayload = {
      title: data.title,
      description: data.description,
      sendTo: data.sendTo,
    };
    await dispatch(createAnnouncement(payload)).unwrap();
    toast.success("Announcement created.");
    setAddModalOpen(false);
  };

  const handleUpdate = async (data: {
    title: string;
    description: string;
    sendTo: string;
  }) => {
    if (!editingItem?.id) return;
    const payload: UpdateAnnouncementPayload = {
      id: editingItem.id,
      title: data.title,
      description: data.description,
      sendTo: data.sendTo,
    };
    await dispatch(updateAnnouncement(payload)).unwrap();
    toast.success("Announcement updated.");
    setEditingItem(null);
  };

  const handleDelete = (item: AnnouncementItem) => {
    if (!item.id) return;
    confirmDeleteToast({
      name: item.title ?? "this announcement",
      onConfirm: async () => {
        await dispatch(deleteAnnouncement(item.id!)).unwrap();
        toast.success("Announcement deleted.");
        dispatch(getAnnouncements());
      },
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="font-heading text-3xl font-bold">Announcements</h1>
          <p className="text-muted-foreground mt-1">
            Welcome back! Here&apos;s an overview on{" "}
            <span className="text-[18px] font-bold underline uppercase text-black">
              {estateName}
            </span>
            .
          </p>
        </div>
        <Button
          onClick={() => setAddModalOpen(true)}
          className="shrink-0 flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Add Announcement
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {getStatus === "isLoading" ? (
          <p className="text-muted-foreground col-span-2 py-8 text-center">
            Loading announcements...
          </p>
        ) : announcements.length === 0 ? (
          <p className="text-muted-foreground col-span-2 py-8 text-center rounded-lg border border-border bg-muted/20">
            No announcements yet. Create one to get started.
          </p>
        ) : (
          announcements.map((item) => (
            <AnnouncementCard
              key={item.id}
              announcement={item}
              onEdit={setEditingItem}
              onDelete={handleDelete}
            />
          ))
        )}
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
