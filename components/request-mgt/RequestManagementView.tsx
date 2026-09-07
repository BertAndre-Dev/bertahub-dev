"use client";

import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useDispatch, useSelector } from "react-redux";
import { toast } from "react-toastify";
import { ClipboardList, Trash2 } from "lucide-react";
import Select from "react-select";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select as NativeSelect } from "@/components/ui/select";
import Table from "@/components/tables/list/page";
import Loader from "@/components/ui/Loader";
import DeleteModal from "@/components/resident/delete-modal/page";
import { getApiErrorMessage } from "@/lib/api-error";
import { isBusy } from "@/lib/async-status";
import type { AppDispatch } from "@/redux/store";
import RequestDetailModal, {
  formatCategory,
  formatDate,
  formatRequestCode,
  getActorName,
} from "./RequestDetailModal";
import {
  getRequestScopeApi,
  type RequestScope,
  type ScopedRequestItem,
  type ScopedRequestStatus,
} from "./request-scope";
import {
  requestDeleteIconButtonClass,
  requestViewButtonClass,
} from "./request-action-styles";
import {
  formatRequestStatusLabel,
  formatRequestStepsExport,
  getRequestStatusStyle,
} from "@/lib/request-record";
import { RequestStepsCell } from "./RequestStepsCell";

type EstateSelectOption = { label: string; value: string };

export interface RequestManagementViewProps {
  scope: RequestScope;
  title?: string;
  description: ReactNode;
  estateId: string | null;
  estateOptions?: EstateSelectOption[];
  selectedEstate?: EstateSelectOption | null;
  onEstateChange?: (option: EstateSelectOption | null) => void;
  estatesLoading?: boolean;
  bootstrapping?: boolean;
  emptyHint?: string;
  /** Optional content rendered above the requests list card (e.g. workflow config). */
  beforeList?: ReactNode;
  /** Optional actions rendered next to the page title. */
  headerActions?: ReactNode;
  /** Nested under another page header — use a section loader instead of a full-screen overlay. */
  embedded?: boolean;
  /** Hide the section title/description (e.g. when a parent tab already labels the view). */
  hideHeading?: boolean;
}

export default function RequestManagementView({
  scope,
  title = "Requests Management",
  description,
  estateId,
  estateOptions,
  selectedEstate = null,
  onEstateChange,
  estatesLoading = false,
  bootstrapping = false,
  emptyHint = "No requests found.",
  beforeList,
  headerActions,
  embedded = false,
  hideHeading = false,
}: RequestManagementViewProps) {
  const dispatch = useDispatch<AppDispatch>();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const api = useMemo(() => getRequestScopeApi(scope), [scope]);
  const [searchInput, setSearchInput] = useState("");
  const [viewingId, setViewingId] = useState<string | null>(null);
  const [viewingFallback, setViewingFallback] =
    useState<ScopedRequestItem | null>(null);
  const [requestToDelete, setRequestToDelete] =
    useState<ScopedRequestItem | null>(null);

  const clearRequestQuery = useCallback(() => {
    const params = new URLSearchParams(searchParams.toString());
    if (!params.has("id")) return;
    params.delete("id");
    params.delete("estateId");
    const qs = params.toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
  }, [pathname, router, searchParams]);

  const closeDetail = useCallback(() => {
    setViewingId(null);
    setViewingFallback(null);
    clearRequestQuery();
  }, [clearRequestQuery]);

  // Deep-link from notifications: /request?id=…&estateId=…
  useEffect(() => {
    const idFromUrl = searchParams.get("id")?.trim() || "";
    const estateFromUrl = searchParams.get("estateId")?.trim() || "";

    if (
      estateFromUrl &&
      onEstateChange &&
      estateOptions?.length &&
      selectedEstate?.value !== estateFromUrl
    ) {
      const match = estateOptions.find((opt) => opt.value === estateFromUrl);
      if (match) onEstateChange(match);
    }

    if (idFromUrl && viewingId !== idFromUrl) {
      setViewingId(idFromUrl);
      setViewingFallback(null);
    }
  }, [
    estateOptions,
    onEstateChange,
    searchParams,
    selectedEstate?.value,
    viewingId,
  ]);

  const { list, pagination, ui, getListStatus, deleteStatus } =
    useSelector(api.selectState);

  const { page, pageSize, search, statusFilter } = ui;
  const listLoading = isBusy(getListStatus);
  const deleting = isBusy(deleteStatus);
  const showEstateFilter = Boolean(estateOptions && onEstateChange);
  const showHeaderRow =
    !hideHeading || showEstateFilter || Boolean(headerActions);
  const fullPageLoading =
    bootstrapping ||
    estatesLoading ||
    (Boolean(estateId) && (listLoading || getListStatus === "idle"));
  const showOverlayLoader = fullPageLoading && !embedded;
  const showSectionLoader = fullPageLoading && embedded;

  const loadRequests = useCallback(() => {
    if (!estateId) return Promise.resolve();
    return dispatch(
      api.getList({
        estateId,
        page,
        limit: pageSize,
        status: statusFilter || undefined,
        search: search || undefined,
      }),
    )
      .unwrap()
      .catch((err: unknown) => {
        const message = getApiErrorMessage(err);
        if (message) toast.error(message);
      });
  }, [api, dispatch, estateId, page, pageSize, statusFilter, search]);

  const handleDeleteRequest = async () => {
    if (!requestToDelete?.id) return;
    try {
      await dispatch(
        api.delete({
          id: requestToDelete.id,
          estateId: estateId ?? undefined,
        }),
      ).unwrap();
      toast.success("Request deleted.");
      setRequestToDelete(null);
      if (viewingId === requestToDelete.id) {
        setViewingId(null);
        setViewingFallback(null);
      }
    } catch (err: unknown) {
      const message = getApiErrorMessage(err);
      if (message) toast.error(message);
      throw err;
    }
  };

  useEffect(() => {
    return () => {
      dispatch(api.resetUi());
    };
  }, [api, dispatch]);

  useEffect(() => {
    if (!estateId || bootstrapping || estatesLoading) return;
    loadRequests().catch(() => {});
  }, [estateId, bootstrapping, estatesLoading, loadRequests]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      if (searchInput !== search) {
        dispatch(api.setSearch(searchInput));
      }
    }, 350);
    return () => window.clearTimeout(timer);
  }, [api, dispatch, searchInput, search]);

  const columns = useMemo(
    () => [
      {
        key: "createdAt",
        header: "Created",
        render: (item: ScopedRequestItem) =>
          formatDate(item.createdAt || item.updatedAt),
        exportValue: (item: ScopedRequestItem) =>
          formatDate(item.createdAt || item.updatedAt),
      },
      {
        key: "code",
        header: "Code",
        render: (item: ScopedRequestItem) => (
          <span className="font-medium tracking-[0.02em] text-foreground">
            {formatRequestCode(item.code)}
          </span>
        ),
        exportValue: (item: ScopedRequestItem) => formatRequestCode(item.code),
      },
      {
        key: "title",
        header: "Title",
        render: (item: ScopedRequestItem) => (
          <div>
            <p className="font-medium text-foreground">{item.title || "—"}</p>
            {item.description ? (
              <p className="text-xs text-muted-foreground mt-1 line-clamp-1">
                {item.description}
              </p>
            ) : null}
          </div>
        ),
        exportValue: (item: ScopedRequestItem) => item.title || "—",
      },
      {
        key: "category",
        header: "Category",
        render: (item: ScopedRequestItem) => formatCategory(item.category),
        exportValue: (item: ScopedRequestItem) => formatCategory(item.category),
      },
      {
        key: "steps",
        header: "Steps",
        render: (item: ScopedRequestItem) => (
          <RequestStepsCell
            steps={item.steps}
            fallbackName={
              item.currentStepName?.trim() ||
              (item.currentStepOrder != null
                ? `Step ${item.currentStepOrder}`
                : undefined)
            }
          />
        ),
        exportValue: (item: ScopedRequestItem) =>
          formatRequestStepsExport(
            item.steps,
            item.currentStepName?.trim() ||
              (item.currentStepOrder != null
                ? `Step ${item.currentStepOrder}`
                : undefined),
          ),
      },
      {
        key: "status",
        header: "Status",
        render: (item: ScopedRequestItem) => (
          <span
            className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${getRequestStatusStyle(item.status)}`}
          >
            {formatRequestStatusLabel(item.status)}
          </span>
        ),
        exportValue: (item: ScopedRequestItem) =>
          formatRequestStatusLabel(item.status),
      },
      {
        key: "createdBy",
        header: "Created by",
        render: (item: ScopedRequestItem) => getActorName(item.createdBy),
        exportValue: (item: ScopedRequestItem) => getActorName(item.createdBy),
      },
      {
        key: "actions",
        header: "Actions",
        render: (item: ScopedRequestItem) => (
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              className={requestViewButtonClass}
              onClick={() => {
                setViewingFallback(item);
                setViewingId(item.id);
              }}
            >
              View
            </Button>
            <Button
              size="sm"
              variant="outline"
              className={requestDeleteIconButtonClass}
              disabled={deleting}
              onClick={() => setRequestToDelete(item)}
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        ),
        exportable: false,
      },
    ],
    [deleting],
  );

  const total = pagination?.total ?? list.length;

  return (
    <div className="relative">
      {showOverlayLoader ? (
        <Loader fullScreen label="Loading requests..." />
      ) : null}
      {showSectionLoader ? (
        <div className="absolute inset-0 z-10 flex items-center justify-center rounded-2xl bg-background/40 backdrop-blur-sm">
          <Loader label="Loading requests..." />
        </div>
      ) : null}

      <div
        className={[
          "space-y-6",
          fullPageLoading ? "pointer-events-none select-none" : "",
        ].join(" ")}
      >
        {showHeaderRow ? (
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          {hideHeading ? (
            <div />
          ) : (
          <div>
            <h1 className="font-heading text-3xl font-bold">{title}</h1>
            <p className="text-muted-foreground mt-1">{description}</p>
          </div>
          )}

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 shrink-0">
            {headerActions}
            {showEstateFilter ? (
              <div className="w-full sm:w-56 min-w-48">
                <Select
                  options={estateOptions}
                  placeholder="Select estate"
                  value={selectedEstate}
                  onChange={(option) => {
                    const next = option as EstateSelectOption | null;
                    setSearchInput("");
                    dispatch(api.setSearch(""));
                    onEstateChange?.(next);
                  }}
                  isSearchable
                  isDisabled={!estateOptions?.length}
                  styles={{
                    control: (base) => ({ ...base, cursor: "pointer" }),
                    option: (base) => ({ ...base, cursor: "pointer" }),
                    dropdownIndicator: (base) => ({
                      ...base,
                      cursor: "pointer",
                    }),
                    clearIndicator: (base) => ({ ...base, cursor: "pointer" }),
                  }}
                />
              </div>
            ) : null}
          </div>
        </div>
        ) : null}

        {beforeList}

        <Card className="p-4 space-y-4">
          <div className="flex flex-col lg:flex-row gap-3">
            <input
              type="text"
              placeholder="Search requests..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              disabled={!estateId}
              className="flex-1 px-3 py-2 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-50"
            />
            <NativeSelect
              options={api.statusOptions}
              value={statusFilter}
              disabled={!estateId}
              onChange={(e) =>
                dispatch(
                  api.setStatusFilter(
                    e.target.value as ScopedRequestStatus | "",
                  ),
                )
              }
              className="lg:max-w-[220px] rounded-xl"
            />
          </div>

          {!estateId && !fullPageLoading ? (
            <div className="py-12 rounded-lg border border-border bg-muted/20 text-center space-y-2">
              <ClipboardList className="w-12 h-12 mx-auto text-muted-foreground" />
              <p className="text-muted-foreground">
                Select an estate to view requests.
              </p>
            </div>
          ) : null}

          {estateId && !fullPageLoading && list.length === 0 ? (
            <div className="py-12 rounded-lg border border-border bg-muted/20 text-center space-y-2">
              <ClipboardList className="w-12 h-12 mx-auto text-muted-foreground" />
              <p className="text-muted-foreground">{emptyHint}</p>
            </div>
          ) : null}

          {estateId && (fullPageLoading || list.length > 0) ? (
            <Table
              columns={columns}
              data={list}
              emptyMessage={emptyHint}
              showPagination
              paginationInfo={{
                total,
                current: page,
                pageSize,
              }}
              onPageChange={(nextPage) => dispatch(api.setPage(nextPage))}
            />
          ) : null}
        </Card>
      </div>

      {viewingId ? (
        <RequestDetailModal
          scope={scope}
          requestId={viewingId}
          estateId={estateId}
          fallback={viewingFallback}
          onClose={closeDetail}
          onChanged={() => {
            void loadRequests();
          }}
        />
      ) : null}

      <DeleteModal
        visible={Boolean(requestToDelete)}
        onClose={() => {
          if (!deleting) setRequestToDelete(null);
        }}
        itemName={requestToDelete?.title ?? "this request"}
        onConfirm={handleDeleteRequest}
        loading={deleting}
        title="Delete request"
        message={
          <p className="text-sm text-muted-foreground mb-4">
            Permanently delete{" "}
            <strong>{requestToDelete?.title ?? "this request"}</strong>? The
            creator and everyone involved in the workflow will be notified.
          </p>
        }
      />
    </div>
  );
}
