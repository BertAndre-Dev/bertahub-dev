"use client";

import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { toast } from "react-toastify";
import { Pencil, FileText } from "lucide-react";
import { getApiErrorMessage } from "@/lib/api-error";
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
import DeleteModal from "@/components/resident/delete-modal/page";
import type { RootState, AppDispatch } from "@/redux/store";
import AnnouncementsPageHeader from "@/components/admin/announcements/announcements-page-header/page";
import AnnouncementsStatsGrid from "@/components/admin/announcements/announcements-stats-grid/page";
import Pagination from "@/components/pagination/page";
import AnnouncementsListSection from "@/components/admin/announcements/announcements-list-section/page";
import { buildAdminAnnouncementStatsCards } from "@/lib/announcement-stats";
import Modal from "@/components/modal/page";
import { Button } from "@/components/ui/button";
import Loader from "@/components/ui/Loader";
import { isBusy, isPending } from "@/lib/async-status";

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

const PAGE_SIZE = 10;

export default function AdminAnnouncementsPage() {
  const dispatch = useDispatch<AppDispatch>();
  const [estateName, setEstateName] = useState("Estate");
  const [estateId, setEstateId] = useState<string | null>(null);
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<AnnouncementItem | null>(null);
  const [deletingItem, setDeletingItem] = useState<AnnouncementItem | null>(null);
  const [viewingItem, setViewingItem] = useState<AnnouncementItem | null>(null);
  const [bootstrapping, setBootstrapping] = useState(true);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(PAGE_SIZE);

  const { list, pagination, stats, getStatus, getStatsStatus, createStatus, updateStatus, deleteStatus } =
    useSelector((state: RootState) => {
      const s = (state as RootState).adminAnnouncements;
      return {
        list: s?.list ?? null,
        pagination: s?.pagination ?? null,
        stats: s?.stats ?? null,
        getStatus: s?.getStatus ?? "idle",
        getStatsStatus: s?.getStatsStatus ?? "idle",
        createStatus: s?.createStatus ?? "idle",
        updateStatus: s?.updateStatus ?? "idle",
        deleteStatus: s?.deleteStatus ?? "idle",
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
          dispatch(getAnnouncementStats(normalizedEstateId)).catch(() => {});
        }
      } catch {
        // keep default
      } finally {
        setBootstrapping(false);
      }
    })();
  }, [dispatch]);

  const fetchAnnouncements = (targetPage = page) => {
    if (!estateId) return;
    dispatch(
      getAnnouncements({ estateId, page: targetPage, limit: pageSize }),
    )
      .unwrap()
      .catch((err: unknown) => {
        const message = getApiErrorMessage(err);
        if (message) toast.error(message);
      });
  };

  useEffect(() => {
    if (!estateId || bootstrapping) return;
    fetchAnnouncements(page);
  }, [estateId, page, pageSize, bootstrapping]);

  const announcements = list ?? [];
  const listLoading = Boolean(estateId) && isPending(getStatus);
  const fullPageLoading =
    bootstrapping ||
    listLoading ||
    (Boolean(estateId) && isPending(getStatsStatus));
  const statsCards = buildAdminAnnouncementStatsCards(
    stats,
    pagination?.total ?? announcements.length,
  );
  const paginationInfo = {
    total: pagination?.total ?? announcements.length,
    current: pagination?.page ?? page,
    pageSize,
  };

  const handlePageChange = (nextPage: number) => {
    setPage(nextPage);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const refreshAfterMutation = (targetPage = page) => {
    if (!estateId) return;
    fetchAnnouncements(targetPage);
    dispatch(getAnnouncementStats(estateId)).catch(() => {});
  };

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
      image: data.image ?? null,
      file: data.file ?? null,
    };
    await dispatch(createAnnouncement(payload)).unwrap();
    toast.success("Announcement created.");
    setAddModalOpen(false);
    setPage(1);
    refreshAfterMutation(1);
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
      image: data.image ?? null,
      file: data.file ?? null,
    };
    await dispatch(updateAnnouncement(payload)).unwrap();
    toast.success("Announcement updated.");
    setEditingItem(null);
    refreshAfterMutation();
  };

  const handleDelete = (item: AnnouncementItem) => {
    if (!item.id) return;
    setDeletingItem(item);
  };

  const handleConfirmDelete = async () => {
    if (!deletingItem?.id || !estateId) return;
    try {
      await dispatch(
        deleteAnnouncement({ estateId, id: deletingItem.id }),
      ).unwrap();
      toast.success("Announcement deleted.");
      const nextPage =
        announcements.length <= 1 && page > 1 ? page - 1 : page;
      if (nextPage !== page) setPage(nextPage);
      refreshAfterMutation(nextPage);
    } catch (err: unknown) {
      const message = getApiErrorMessage(err);
      if (message) toast.error(message);
      throw err;
    }
  };

  return (
    <div className="relative">
      {fullPageLoading && <Loader fullScreen label="Loading announcements..." />}

      <div
        className={[
          "space-y-6",
          fullPageLoading ? "pointer-events-none select-none" : "",
        ].join(" ")}
      >
        <AnnouncementsPageHeader
          estateName={estateName}
          onAddClick={() => setAddModalOpen(true)}
          addDisabled={!estateId}
        />

        <AnnouncementsStatsGrid stats={statsCards} />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <AnnouncementsListSection
            loading={listLoading && !fullPageLoading}
            announcements={announcements}
            onView={setViewingItem}
            onEdit={setEditingItem}
            onDelete={handleDelete}
          />
        </div>

        <Pagination
          paginationInfo={paginationInfo}
          onPageChange={handlePageChange}
          onPageSizeChange={(size) => {
            setPageSize(size);
            setPage(1);
          }}
          disabled={listLoading}
          itemLabel="announcements"
        />

        <AnnouncementFormModal
          visible={addModalOpen}
          onClose={() => setAddModalOpen(false)}
          onSubmit={handleCreate}
          submitLabel="Send"
          title="Add Announcement"
          loading={isBusy(createStatus)}
        />

        <AnnouncementFormModal
          visible={!!editingItem}
          onClose={() => setEditingItem(null)}
          initialData={editingItem ?? undefined}
          onSubmit={handleUpdate}
          submitLabel="Update"
          title="Edit Announcement"
          loading={isBusy(updateStatus)}
        />

        <DeleteModal
          visible={!!deletingItem}
          onClose={() => setDeletingItem(null)}
          itemName={deletingItem?.title ?? "this announcement"}
          title="Delete announcement"
          onConfirm={handleConfirmDelete}
          loading={isBusy(deleteStatus)}
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
              {(viewingItem.imageUrl || viewingItem.image) && (
                <div className="mb-4">
                  <img
                    src={viewingItem.imageUrl || viewingItem.image}
                    alt={viewingItem.title ?? "Announcement image"}
                    className="w-full rounded-lg border border-border object-cover max-h-72"
                  />
                </div>
              )}
              <div
                className="prose prose-sm max-w-full pb-2 break-words prose-p:my-1 prose-ul:my-1 prose-ol:my-1 text-foreground"
                dangerouslySetInnerHTML={{
                  __html:
                    viewingItem.content ??
                    viewingItem.description ??
                    "<span>No content.</span>",
                }}
              />
              {(viewingItem.fileUrl || viewingItem.file) && (
                <a
                  href={viewingItem.fileUrl || viewingItem.file}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-3 inline-flex items-center gap-2 rounded-md border border-border px-3 py-2 text-sm text-primary hover:bg-muted"
                >
                  <FileText className="h-4 w-4" />
                  <span className="truncate max-w-[260px]">
                    {viewingItem.fileName ?? "Download attachment"}
                  </span>
                </a>
              )}
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
    </div>
  );
}
