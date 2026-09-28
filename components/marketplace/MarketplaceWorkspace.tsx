"use client";

import { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Plus, Search, Store } from "lucide-react";
import { toast } from "react-toastify";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import Loader from "@/components/ui/Loader";
import Modal from "@/components/modal/page";
import Pagination from "@/components/pagination/page";
import DeleteModal from "@/components/resident/delete-modal/page";
import SuspendRentModal from "@/components/resident/suspend-rent-modal/page";
import { MarketplaceAdCard } from "@/components/marketplace/MarketplaceAdCard";
import { MarketplaceAdDetail } from "@/components/marketplace/MarketplaceAdDetail";
import { MarketplaceAdForm } from "@/components/marketplace/MarketplaceAdForm";
import { MarketplaceReviewModal } from "@/components/marketplace/MarketplaceReviewModal";
import { getApiErrorMessage } from "@/lib/api-error";
import { isBusy, isPending, isSettled } from "@/lib/async-status";
import {
  MARKETPLACE_CATEGORIES,
  MARKETPLACE_PRESS,
  canCreateMarketplaceAds,
} from "@/lib/marketplace";
import { selectUserRole } from "@/redux/slice/auth-mgt/auth-mgt-slice";
import {
  activateMarketplaceAd,
  approveMarketplaceAd,
  createMarketplaceAd,
  deleteMarketplaceAd,
  getMarketplaceFeed,
  getMyMarketplaceAds,
  getPendingMarketplaceAds,
  rejectMarketplaceAd,
  suspendMarketplaceAd,
  updateMarketplaceAd,
  type CreateMarketplacePayload,
  type MarketplaceAd,
} from "@/redux/slice/marketplace/marketplace";
import { resetMarketplaceMutation } from "@/redux/slice/marketplace/marketplace-slice";
import type { AppDispatch, RootState } from "@/redux/store";
import { cn } from "@/lib/utils";

const PAGE_SIZE = 12;
const PRESS = MARKETPLACE_PRESS;

type TabKey = "discover" | "mine" | "review";

function notifyError(err: unknown) {
  const message = getApiErrorMessage(err);
  if (message) toast.error(message);
}

function emptyCopy(tab: TabKey, filtered: boolean) {
  if (filtered) return "No listings match your filters.";
  if (tab === "mine") return "You have not posted a listing yet.";
  if (tab === "review") return "Nothing is waiting for review.";
  return "No listings in the feed yet.";
}

function pickTabState(
  tab: TabKey,
  data: {
    feed: MarketplaceAd[];
    mine: MarketplaceAd[];
    pending: MarketplaceAd[];
    feedPagination: RootState["marketplace"]["feedPagination"];
    minePagination: RootState["marketplace"]["minePagination"];
    pendingPagination: RootState["marketplace"]["pendingPagination"];
    getFeedStatus: RootState["marketplace"]["getFeedStatus"];
    getMineStatus: RootState["marketplace"]["getMineStatus"];
    getPendingStatus: RootState["marketplace"]["getPendingStatus"];
  },
) {
  if (tab === "mine") {
    return {
      source: data.mine,
      pagination: data.minePagination,
      status: data.getMineStatus,
    };
  }
  if (tab === "review") {
    return {
      source: data.pending,
      pagination: data.pendingPagination,
      status: data.getPendingStatus,
    };
  }
  return {
    source: data.feed,
    pagination: data.feedPagination,
    status: data.getFeedStatus,
  };
}

function matchSearch(item: MarketplaceAd, query: string) {
  if (!query) return true;
  const haystack = [
    item.companyName,
    item.productName,
    item.productCategory,
    item.productDescription,
  ]
    .join(" ")
    .toLowerCase();
  return haystack.includes(query);
}

export function MarketplaceWorkspace() {
  const dispatch = useDispatch<AppDispatch>();
  const role = useSelector(selectUserRole);
  const canCreate = canCreateMarketplaceAds(role);
  const isSuperAdmin = role === "super admin";

  const {
    feed,
    mine,
    pending,
    feedPagination,
    minePagination,
    pendingPagination,
    getFeedStatus,
    getMineStatus,
    getPendingStatus,
    createStatus,
    updateStatus,
    moderateStatus,
  } = useSelector((state: RootState) => state.marketplace);

  const [tab, setTab] = useState<TabKey>("discover");
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(PAGE_SIZE);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<MarketplaceAd | null>(null);
  const [detail, setDetail] = useState<MarketplaceAd | null>(null);
  const [toDelete, setToDelete] = useState<MarketplaceAd | null>(null);
  const [toSuspend, setToSuspend] = useState<MarketplaceAd | null>(null);
  const [review, setReview] = useState<{
    item: MarketplaceAd;
    mode: "approve" | "reject";
  } | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [suspendSubmitting, setSuspendSubmitting] = useState(false);

  const tabs = useMemo(() => {
    const items: { key: TabKey; label: string }[] = [
      { key: "discover", label: "Discover" },
    ];
    if (canCreate) items.push({ key: "mine", label: "My ads" });
    if (isSuperAdmin) items.push({ key: "review", label: "Review" });
    return items;
  }, [canCreate, isSuperAdmin]);

  useEffect(() => {
    if (tab === "discover") {
      dispatch(
        getMarketplaceFeed({
          page,
          limit: pageSize,
          category: category === "All" ? undefined : category,
        }),
      ).catch(notifyError);
      return;
    }
    if (tab === "mine") {
      dispatch(getMyMarketplaceAds({ page, limit: pageSize })).catch(
        notifyError,
      );
      return;
    }
    dispatch(getPendingMarketplaceAds({ page, limit: pageSize })).catch(
      notifyError,
    );
  }, [category, dispatch, page, pageSize, tab]);

  const { source, pagination, status: listStatus } = pickTabState(tab, {
    feed,
    mine,
    pending,
    feedPagination,
    minePagination,
    pendingPagination,
    getFeedStatus,
    getMineStatus,
    getPendingStatus,
  });

  const listings = useMemo(() => {
    const query = search.trim().toLowerCase();
    return source.filter((item) => matchSearch(item, query));
  }, [search, source]);

  const pageLoading = isPending(listStatus);
  const formLoading = isBusy(createStatus) || isBusy(updateStatus);

  const openCreate = () => {
    setEditing(null);
    setFormOpen(true);
  };

  const handleSave = async (payload: CreateMarketplacePayload) => {
    try {
      if (editing?.id) {
        await dispatch(
          updateMarketplaceAd({ ...payload, marketPlaceId: editing.id }),
        ).unwrap();
        toast.success("Listing updated. It may need approval again.");
      } else {
        await dispatch(createMarketplaceAd(payload)).unwrap();
        toast.success("Submitted for approval.");
      }
      setFormOpen(false);
      setEditing(null);
      dispatch(resetMarketplaceMutation());
      if (tab !== "mine" && canCreate) {
        setTab("mine");
        setPage(1);
      }
    } catch (err: unknown) {
      notifyError(err);
    }
  };

  const handleDelete = async () => {
    if (!toDelete?.id) return;
    setDeleting(true);
    try {
      await dispatch(deleteMarketplaceAd(toDelete.id)).unwrap();
      toast.success("Listing deleted.");
      setToDelete(null);
    } catch (err: unknown) {
      notifyError(err);
      throw err;
    } finally {
      setDeleting(false);
    }
  };

  const handleSuspend = async (reason: string) => {
    if (!toSuspend?.id) return;
    setSuspendSubmitting(true);
    try {
      await dispatch(
        suspendMarketplaceAd({ marketPlaceId: toSuspend.id, reason }),
      ).unwrap();
      toast.success("Listing suspended.");
      setToSuspend(null);
    } catch (err: unknown) {
      notifyError(err);
    } finally {
      setSuspendSubmitting(false);
    }
  };

  const handleActivate = (item: MarketplaceAd) => {
    if (!item.id) return;
    dispatch(activateMarketplaceAd({ marketPlaceId: item.id }))
      .unwrap()
      .then(() => toast.success("Listing activated."))
      .catch(notifyError);
  };

  const handleReview = async (value: string) => {
    if (!review?.item.id) return;
    try {
      if (review.mode === "approve") {
        await dispatch(
          approveMarketplaceAd({
            marketPlaceId: review.item.id,
            notes: value,
          }),
        ).unwrap();
        toast.success("Listing approved.");
      } else {
        await dispatch(
          rejectMarketplaceAd({
            marketPlaceId: review.item.id,
            reason: value,
          }),
        ).unwrap();
        toast.success("Listing rejected.");
      }
      setReview(null);
    } catch (err: unknown) {
      notifyError(err);
    }
  };

  return (
    <div className="relative">
      {pageLoading ? (
        <Loader fullScreen label="Loading marketplace..." />
      ) : null}

      <div
        className={cn(
          "space-y-6 pb-8",
          pageLoading && "pointer-events-none select-none",
        )}
      >
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-[1.65rem] font-semibold tracking-[-0.03em]">
              Marketplace
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Offers from people and businesses in the community.
            </p>
          </div>
          {canCreate ? (
            <Button onClick={openCreate} className={cn("h-11 rounded-xl", PRESS)}>
              <Plus className="size-4" />
              Post listing
            </Button>
          ) : null}
        </div>

        {tabs.length > 1 ? (
          <div className="flex gap-1 rounded-full bg-muted/70 p-1">
            {tabs.map((item) => (
              <button
                key={item.key}
                type="button"
                onClick={() => {
                  setTab(item.key);
                  setPage(1);
                  setSearch("");
                }}
                className={cn(
                  "flex-1 rounded-full px-4 py-2 text-sm",
                  PRESS,
                  tab === item.key
                    ? "bg-background font-medium shadow-sm"
                    : "text-muted-foreground",
                )}
              >
                {item.label}
              </button>
            ))}
          </div>
        ) : null}

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative max-w-md flex-1">
            <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search listings"
              className="h-11 rounded-xl pl-9"
            />
          </div>
        </div>

        {tab === "discover" ? (
          <div className="flex flex-wrap gap-2">
            {["All", ...MARKETPLACE_CATEGORIES].map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => {
                  setCategory(item);
                  setPage(1);
                }}
                className={cn(
                  "rounded-full px-3 py-1.5 text-sm",
                  PRESS,
                  category === item
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted/70 text-muted-foreground hover:bg-muted",
                )}
              >
                {item}
              </button>
            ))}
          </div>
        ) : null}

        {listings.length === 0 && isSettled(listStatus) ? (
          <Card className="p-12 text-center">
            <Store className="mx-auto mb-3 size-10 text-muted-foreground" />
            <p className="text-muted-foreground">
              {emptyCopy(tab, Boolean(search.trim() || category !== "All"))}
            </p>
          </Card>
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {listings.map((item) => (
              <MarketplaceAdCard
                key={item.id ?? item.productName}
                item={item}
                showStatus={tab !== "discover"}
                onOpen={setDetail}
                onEdit={
                  tab === "mine" ? (ad) => {
                    setEditing(ad);
                    setFormOpen(true);
                  } : undefined
                }
                onDelete={tab === "mine" || isSuperAdmin ? setToDelete : undefined}
                onSuspend={isSuperAdmin ? setToSuspend : undefined}
                onActivate={isSuperAdmin ? handleActivate : undefined}
                onApprove={
                  tab === "review"
                    ? (ad) => setReview({ item: ad, mode: "approve" })
                    : undefined
                }
                onReject={
                  tab === "review"
                    ? (ad) => setReview({ item: ad, mode: "reject" })
                    : undefined
                }
              />
            ))}
          </div>
        )}

        <Pagination
          paginationInfo={{
            total: pagination?.total ?? listings.length,
            current: pagination?.page ?? page,
            pageSize,
          }}
          onPageChange={setPage}
          onPageSizeChange={(size) => {
            setPageSize(size);
            setPage(1);
          }}
          disabled={pageLoading}
          itemLabel="listings"
        />
      </div>

      <Modal
        visible={formOpen}
        onClose={() => {
          setFormOpen(false);
          setEditing(null);
        }}
        contentClassName="md:w-[min(40rem,92vw)]"
      >
        <div className="pr-8">
          <h2 className="mb-2 text-xl font-semibold tracking-[-0.02em]">
            {editing?.id ? "Edit listing" : "Post listing"}
          </h2>
          <MarketplaceAdForm
            initialData={editing}
            loading={formLoading}
            onSubmit={handleSave}
            onCancel={() => {
              setFormOpen(false);
              setEditing(null);
            }}
          />
        </div>
      </Modal>

      <Modal
        visible={Boolean(detail)}
        onClose={() => setDetail(null)}
        contentClassName="md:w-[min(36rem,92vw)]"
      >
        {detail ? (
          <MarketplaceAdDetail
            key={detail.id ?? detail.productName}
            item={detail}
            showStatus={tab !== "discover"}
          />
        ) : null}
      </Modal>

      <Modal
        visible={Boolean(review)}
        onClose={() => setReview(null)}
        contentClassName="md:w-[min(28rem,92vw)]"
      >
        {review ? (
          <MarketplaceReviewModal
            mode={review.mode}
            loading={isBusy(moderateStatus)}
            onCancel={() => setReview(null)}
            onConfirm={handleReview}
          />
        ) : null}
      </Modal>

      <SuspendRentModal
        requireReason
        visible={Boolean(toSuspend)}
        onClose={() => setToSuspend(null)}
        tenantName={
          toSuspend?.companyName ?? toSuspend?.productName ?? "this listing"
        }
        title="Suspend listing"
        confirmLabel="Suspend"
        onConfirm={handleSuspend}
        loading={suspendSubmitting}
      />

      <DeleteModal
        visible={Boolean(toDelete)}
        onClose={() => setToDelete(null)}
        itemName={toDelete?.companyName ?? toDelete?.productName ?? "this listing"}
        title="Delete listing"
        loading={deleting}
        onConfirm={handleDelete}
      />
    </div>
  );
}
