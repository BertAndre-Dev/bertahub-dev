"use client";

import { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { toast } from "react-toastify";
import Select from "react-select";
import { Bell, FileText, Paperclip } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Loader from "@/components/ui/Loader";
import Modal from "@/components/modal/page";
import Pagination from "@/components/pagination/page";
import AnnouncementsStatsGrid from "@/components/admin/announcements/announcements-stats-grid/page";
import { isPending, isSettled } from "@/lib/async-status";
import { getApiErrorMessage } from "@/lib/api-error";
import { buildReadOnlyAnnouncementStatsCards } from "@/lib/announcement-stats";
import { getSignedInUser } from "@/redux/slice/auth-mgt/auth-mgt";
import { getCompanyEstates } from "@/redux/slice/company/estate-mgt/company-estate";
import {
  getCompanyAnnouncements,
  type CompanyAnnouncementItem,
} from "@/redux/slice/company/announcements/company-announcements";
import { resetCompanyAnnouncementsList } from "@/redux/slice/company/announcements/company-announcements-slice";
import { parseCompanyFromUser } from "@/app/dashboard/company/lib/company";
import {
  mapCompanyEstateRows,
  parseCompanyEstates,
  type EstateOption,
} from "@/app/dashboard/company/asset/lib/estate";
import type { AppDispatch, RootState } from "@/redux/store";

const PAGE_SIZE = 10;

type EstateSelectOption = { label: string; value: string };

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

function CompanyAnnouncementCard({
  item,
  onView,
}: Readonly<{
  item: CompanyAnnouncementItem;
  onView?: (item: CompanyAnnouncementItem) => void;
}>) {
  const title = item.title ?? "";
  const content = item.content ?? item.description ?? "";
  const date = item.scheduledFor ?? item.createdAt ?? item.updatedAt;
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
            {(item.fileUrl || item.file) && (
              <span
                className="bg-blue-50 text-blue-700 px-1.5 py-0.5 rounded inline-flex items-center gap-1"
                title="Has attachment"
              >
                <Paperclip className="h-3 w-3" />
                Attachment
              </span>
            )}
          </div>
          <h3 className="font-semibold text-foreground mb-2">{title}</h3>
          {(item.imageUrl || item.image) && (
            <img
              src={item.imageUrl || item.image}
              alt={title || "Announcement image"}
              className="mb-2 w-full rounded-md border border-border object-cover max-h-40"
            />
          )}
          <div
            className="text-sm text-muted-foreground line-clamp-4 prose prose-sm max-w-none prose-p:my-1 prose-ul:my-1 prose-ol:my-1"
            dangerouslySetInnerHTML={{ __html: content || "" }}
          />
        </div>
      </div>
    </Card>
  );
}

export default function CompanyAnnouncementsPage() {
  const dispatch = useDispatch<AppDispatch>();
  const [companyName, setCompanyName] = useState("Company");
  const [estates, setEstates] = useState<EstateOption[]>([]);
  const [selectedEstate, setSelectedEstate] =
    useState<EstateSelectOption | null>(null);
  const [estatesLoading, setEstatesLoading] = useState(true);
  const [viewingItem, setViewingItem] =
    useState<CompanyAnnouncementItem | null>(null);
  const [page, setPage] = useState(1);

  const { list, pagination, getListStatus } = useSelector(
    (state: RootState) => {
      const s = state.companyAnnouncements;
      return {
        list: s?.list ?? null,
        pagination: s?.pagination ?? null,
        getListStatus: s?.getListStatus ?? "idle",
      };
    },
  );

  const estateId = selectedEstate?.value ?? "";
  const estateName = selectedEstate?.label ?? "Estate";
  const announcements = list ?? [];

  const estateOptions = useMemo<EstateSelectOption[]>(
    () => estates.map((e) => ({ label: e.name, value: e.id })),
    [estates],
  );

  useEffect(() => {
    (async () => {
      try {
        const userRes = await dispatch(getSignedInUser()).unwrap();
        const data = (userRes?.data ?? userRes) as Record<string, unknown>;
        const company = parseCompanyFromUser(data);
        if (!company) {
          toast.warning("No company linked to your account.");
          setEstatesLoading(false);
          return;
        }
        setCompanyName(company.name);

        let options: EstateOption[] = [];
        try {
          const res = await dispatch(
            getCompanyEstates({ page: 1, limit: 200 }),
          ).unwrap();
          options = mapCompanyEstateRows(res?.data);
        } catch (err: unknown) {
          const message = getApiErrorMessage(err);
          if (message) toast.error(message);
        }
        if (!options.length) options = parseCompanyEstates(data);

        setEstates(options);
        if (options.length) {
          setSelectedEstate({ label: options[0].name, value: options[0].id });
        }
      } catch (err: unknown) {
        const message = getApiErrorMessage(err);
        if (message) toast.error(message);
      } finally {
        setEstatesLoading(false);
      }
    })();
  }, [dispatch]);

  useEffect(() => {
    if (!estateId || estatesLoading) return;
    dispatch(getCompanyAnnouncements({ estateId, page, limit: PAGE_SIZE }))
      .unwrap()
      .catch((err: unknown) => {
        const message = getApiErrorMessage(err);
        if (message) toast.error(message);
      });
  }, [dispatch, estateId, page, estatesLoading]);

  const handleEstateChange = (option: EstateSelectOption | null) => {
    setViewingItem(null);
    setPage(1);
    setSelectedEstate(option);
    dispatch(resetCompanyAnnouncementsList());
  };

  const listLoading = Boolean(estateId) && isPending(getListStatus);
  const fullPageLoading = estatesLoading || listLoading;
  const statsCards = buildReadOnlyAnnouncementStatsCards(
    pagination?.total ?? announcements.length,
  );
  const paginationInfo = {
    total: pagination?.total ?? announcements.length,
    current: pagination?.page ?? page,
    pageSize: pagination?.limit ?? PAGE_SIZE,
  };

  const handlePageChange = (nextPage: number) => {
    setPage(nextPage);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div className="relative">
      {fullPageLoading && <Loader fullScreen label="Loading announcements..." />}

      <div
        className={[
          "space-y-6 pb-8",
          fullPageLoading ? "pointer-events-none select-none" : "",
        ].join(" ")}
      >
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between flex-wrap gap-4">
          <div>
            <h1 className="font-heading text-3xl font-bold">Announcements</h1>
            <p className="mt-1 text-muted-foreground">
              Updates and notices for estates under{" "}
              {/* <span className="text-[18px] font-bold uppercase text-black underline">
                {companyName}
              </span> */}
              {estateId ? (
                <>
                  {" "}
                  —{" "}
                  <span className="text-[18px] font-bold uppercase text-black underline">
                    {estateName}
                  </span>
                </>
              ) : null}
              .
            </p>
          </div>

          <div className="w-48 min-w-[12rem]">
            <Select
              options={estateOptions}
              placeholder="Filter by estate"
              value={selectedEstate}
              onChange={(option) =>
                handleEstateChange(option as EstateSelectOption | null)
              }
              isSearchable
              isDisabled={!estateOptions.length}
              styles={{
                control: (base) => ({ ...base, cursor: "pointer" }),
                option: (base) => ({ ...base, cursor: "pointer" }),
                dropdownIndicator: (base) => ({ ...base, cursor: "pointer" }),
                clearIndicator: (base) => ({ ...base, cursor: "pointer" }),
              }}
            />
          </div>
        </div>

        {!estatesLoading && !estates.length ? (
          <Card className="p-12 text-center">
            <Bell className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
            <p className="text-muted-foreground">
              No estates linked to your company yet.
            </p>
          </Card>
        ) : !estateId && !estatesLoading ? (
          <p className="rounded-xl border border-border bg-muted/20 py-10 text-center text-muted-foreground">
            Select an estate to view announcements.
          </p>
        ) : (
          <>
            <AnnouncementsStatsGrid stats={statsCards} />

            {announcements.length === 0 && isSettled(getListStatus) ? (
              <Card className="p-12 text-center">
                <Bell className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
                <p className="text-muted-foreground">
                  No announcements yet for this estate.
                </p>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {announcements.map((item) => (
                  <CompanyAnnouncementCard
                    key={item.id}
                    item={item}
                    onView={setViewingItem}
                  />
                ))}
              </div>
            )}

            <Pagination
              paginationInfo={paginationInfo}
              onPageChange={handlePageChange}
              disabled={listLoading}
              itemLabel="announcements"
            />
          </>
        )}

        <Modal visible={!!viewingItem} onClose={() => setViewingItem(null)}>
          {viewingItem && (
            <div className="pr-8">
              <h2 className="font-heading font-bold text-lg text-foreground mb-2">
                {viewingItem.title || "Untitled"}
              </h2>
              <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground mb-3">
                <span>
                  {formatDate(
                    viewingItem.scheduledFor ??
                      viewingItem.createdAt ??
                      viewingItem.updatedAt,
                  )}
                </span>
                <span>·</span>
                <span className="capitalize">
                  {viewingItem.category ?? "—"}
                </span>
                <span>·</span>
                <span className="capitalize">
                  Priority: {viewingItem.priority ?? "—"}
                </span>
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
                className="prose prose-sm max-w-none prose-p:my-1 prose-ul:my-1 prose-ol:my-1 text-foreground"
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
              <div className="mt-6">
                <Button variant="outline" onClick={() => setViewingItem(null)}>
                  Close
                </Button>
              </div>
            </div>
          )}
        </Modal>
      </div>
    </div>
  );
}
