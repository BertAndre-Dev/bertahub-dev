"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { toast } from "react-toastify";
import { useReducedMotion } from "framer-motion";
import { Pencil, Plus, Power, PowerOff, Search, Trash2 } from "lucide-react";
import DeleteModal from "@/components/resident/delete-modal/page";
import Loader from "@/components/ui/Loader";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import Table from "@/components/tables/list/page";
import {
  DesignationFormSheet,
  type DesignationFormValues,
} from "@/components/designations/DesignationFormSheet";
// import { DesignationToggle } from "@/components/designations/DesignationToggle";
import { getApiErrorMessage } from "@/lib/api-error";
import { isBusy, isPending } from "@/lib/async-status";
import {
  DESIGNATIONS_PAGE_SIZE,
  designationWriteScope,
  isInheritedCompanyTitle,
  isStaffAssignmentDeleteError,
  type Designation,
} from "@/lib/designations";
import { labelForEstateModule } from "@/lib/estate-module-labels";
import { parseAdminEstate } from "@/app/dashboard/admin/asset/lib/estate";
import { parseCompanyFromUser } from "@/app/dashboard/company/lib/company";
import { getSignedInUser } from "@/redux/slice/auth-mgt/auth-mgt";
import {
  createDesignation,
  deleteDesignation,
  getDesignations,
  updateDesignation,
} from "@/redux/slice/designations/designations";
import {
  selectDesignations,
  selectDesignationsPagination,
  selectDesignationsState,
} from "@/redux/slice/designations/designations-slice";
import type { AppDispatch } from "@/redux/store";

type Role = "company" | "estate";

type Props = {
  role: Role;
  /** Nested in another page (e.g. company staff tabs). Hides the page heading. */
  compact?: boolean;
  companyId?: string;
  companyName?: string;
  estateId?: string;
  estateName?: string;
  /** Never resolve a company id — write and list with estateId only. */
  lockToEstateScope?: boolean;
};

function formatDesignationDate(value?: string) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

const VISIBLE_MODULE_LIMIT = 2;

function DesignationModulesCell({
  modules,
}: Readonly<{ modules?: string[] }>) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const mods = modules ?? [];

  useEffect(() => {
    if (!open) return;
    const handler = (event: MouseEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  if (!mods.length) return <span className="text-muted-foreground">—</span>;

  const visible = mods.slice(0, VISIBLE_MODULE_LIMIT);
  const overflow = mods.slice(VISIBLE_MODULE_LIMIT);

  return (
    <div className="relative flex flex-wrap items-center gap-1" ref={ref}>
      {visible.map((key) => (
        <span
          key={key}
          className="px-2 py-0.5 rounded-full text-xs bg-muted whitespace-nowrap"
        >
          {labelForEstateModule(key)}
        </span>
      ))}
      {overflow.length > 0 ? (
        <>
          <button
            type="button"
            onClick={() => setOpen((value) => !value)}
            className="px-2 py-0.5 rounded-full text-xs bg-primary/10 text-primary font-medium hover:bg-primary/20 transition-colors cursor-pointer whitespace-nowrap"
          >
            +{overflow.length} more
          </button>
          {open ? (
            <div className="absolute left-0 top-full mt-1 z-50 w-64 max-w-[min(16rem,70vw)] rounded-lg border border-border bg-popover shadow-md p-3">
              <p className="text-xs font-semibold text-muted-foreground mb-2 uppercase tracking-wide">
                All modules ({mods.length})
              </p>
              <div className="flex flex-wrap gap-1.5">
                {mods.map((key) => (
                  <span
                    key={key}
                    className="px-2 py-0.5 rounded-full text-xs bg-muted whitespace-nowrap"
                  >
                    {labelForEstateModule(key)}
                  </span>
                ))}
              </div>
            </div>
          ) : null}
        </>
      ) : null}
    </div>
  );
}

export function DesignationsManager({
  role,
  compact = false,
  companyId: injectedCompanyId,
  companyName: injectedCompanyName,
  estateId: injectedEstateId,
  estateName: injectedEstateName,
  lockToEstateScope = false,
}: Readonly<Props>) {
  const dispatch = useDispatch<AppDispatch>();
  const reduceMotion = useReducedMotion();
  const items = useSelector(selectDesignations);
  const pagination = useSelector(selectDesignationsPagination);
  const { listStatus, createStatus, updateStatus, deleteStatus } = useSelector(
    selectDesignationsState,
  );

  const [companyId, setCompanyId] = useState(
    lockToEstateScope ? "" : injectedCompanyId?.trim() ?? "",
  );
  const [estateId, setEstateId] = useState(injectedEstateId?.trim() ?? "");
  const [scopeName, setScopeName] = useState(
    injectedCompanyName ||
      injectedEstateName ||
      (role === "company" ? "Company" : "Estate"),
  );
  const [scopeLoading, setScopeLoading] = useState(
    lockToEstateScope
      ? !injectedEstateId?.trim()
      : !injectedCompanyId?.trim(),
  );

  const writeScope = designationWriteScope({
    companyId: lockToEstateScope ? "" : companyId,
    estateId: role === "company" ? "" : estateId,
  });
  const apiCompanyId = writeScope.companyId ?? "";
  const apiEstateId = writeScope.estateId ?? "";
  const usesCompanyScope = Boolean(apiCompanyId);
  const scopeId = apiCompanyId || apiEstateId;
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [includeInactive, setIncludeInactive] = useState(false);
  const [page, setPage] = useState(1);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [editing, setEditing] = useState<Designation | null>(null);
  const [itemToDelete, setItemToDelete] = useState<Designation | null>(null);
  const [itemToToggle, setItemToToggle] = useState<Designation | null>(null);

  const listLoading = isPending(listStatus);
  const saving = isBusy(createStatus) || isBusy(updateStatus);
  const deleting = isBusy(deleteStatus);
  const toggling = isBusy(updateStatus) && Boolean(itemToToggle);
  const showInitialLoader = scopeLoading || (listLoading && items.length === 0);

  useEffect(() => {
    const timeout = window.setTimeout(() => setSearch(searchInput.trim()), 240);
    return () => window.clearTimeout(timeout);
  }, [searchInput]);

  useEffect(() => {
    setPage(1);
  }, [search, includeInactive, scopeId]);

  useEffect(() => {
    if (!lockToEstateScope && injectedCompanyId?.trim()) {
      setCompanyId(injectedCompanyId.trim());
      if (injectedCompanyName) setScopeName(injectedCompanyName);
    }
    if (injectedEstateId?.trim()) {
      setEstateId(injectedEstateId.trim());
      if (
        (lockToEstateScope || !injectedCompanyId?.trim()) &&
        injectedEstateName
      ) {
        setScopeName(injectedEstateName);
      }
    }
    if (
      (role === "company" && injectedCompanyId?.trim()) ||
      (role === "estate" && injectedCompanyId?.trim() && !lockToEstateScope) ||
      (lockToEstateScope && injectedEstateId?.trim())
    ) {
      setScopeLoading(false);
    }
  }, [
    injectedCompanyId,
    injectedCompanyName,
    injectedEstateId,
    injectedEstateName,
    lockToEstateScope,
    role,
  ]);

  useEffect(() => {
    if (lockToEstateScope) {
      if (injectedEstateId?.trim()) setScopeLoading(false);
      return;
    }
    const companyAlreadyKnown =
      Boolean(injectedCompanyId?.trim()) ||
      (role === "company" && Boolean(injectedCompanyId?.trim()));
    if (role === "company" && companyAlreadyKnown) return;
    if (role === "estate" && injectedCompanyId?.trim()) return;

    (async () => {
      try {
        const userRes = await dispatch(getSignedInUser()).unwrap();
        const data = (userRes?.data ?? userRes) as Record<string, unknown>;
        const company = parseCompanyFromUser(data);

        if (role === "company") {
          if (!company) {
            toast.warning("No company linked to your account.");
            return;
          }
          setCompanyId(company.id);
          setScopeName(company.name);
          return;
        }

        if (company) {
          setCompanyId(company.id);
          setScopeName(company.name);
        }
        const estate = parseAdminEstate(data);
        if (estate) {
          setEstateId(estate.id);
          if (!company) setScopeName(estate.name);
        }
        if (!company && !estate) {
          toast.warning("No company or estate linked to your account.");
        }
      } catch (err: unknown) {
        const message = getApiErrorMessage(err);
        if (message) toast.error(message);
      } finally {
        setScopeLoading(false);
      }
    })();
  }, [dispatch, injectedCompanyId, injectedEstateId, lockToEstateScope, role]);

  const loadList = useCallback(
    async (nextPage = page) => {
      if (!apiCompanyId && !apiEstateId) return;

      await dispatch(
        getDesignations({
          companyId: apiCompanyId || undefined,
          estateId: apiCompanyId ? undefined : apiEstateId || undefined,
          search: search || undefined,
          includeInactive,
          page: nextPage,
          limit: DESIGNATIONS_PAGE_SIZE,
        }),
      ).unwrap();
    },
    [apiCompanyId, apiEstateId, dispatch, includeInactive, page, search],
  );

  useEffect(() => {
    if (scopeLoading || !scopeId) return;
    loadList(page).catch((err: unknown) => {
      const message = getApiErrorMessage(err);
      if (message) toast.error(message);
    });
  }, [loadList, page, scopeId, scopeLoading]);

  const openCreate = () => {
    setEditing(null);
    setSheetOpen(true);
  };

  const openEdit = (item: Designation) => {
    setEditing(item);
    setSheetOpen(true);
  };

  const closeSheet = () => {
    setSheetOpen(false);
    setEditing(null);
  };

  const handleSubmit = async (values: DesignationFormValues) => {
    try {
      if (editing) {
        await dispatch(
          updateDesignation({
            id: editing.id,
            name: values.name,
            description: values.description,
            isActive: values.isActive,
            modules: values.modules,
          }),
        ).unwrap();
        toast.success("Designation updated.");
      } else {
        if (!apiCompanyId && !apiEstateId) {
          toast.warning(
            usesCompanyScope
              ? "No company linked to your account."
              : "No estate linked to your account.",
          );
          return;
        }
        await dispatch(
          createDesignation({
            name: values.name,
            description: values.description || undefined,
            companyId: apiCompanyId || undefined,
            estateId: apiCompanyId ? undefined : apiEstateId || undefined,
            modules: values.modules,
          }),
        ).unwrap();
        toast.success("Designation created.");
      }
      closeSheet();
      await loadList(page);
    } catch (err: unknown) {
      const message = getApiErrorMessage(err);
      if (message) toast.error(message);
    }
  };

  const handleConfirmToggle = async () => {
    if (!itemToToggle) return;
    const nextActive = !itemToToggle.isActive;
    try {
      await dispatch(
        updateDesignation({
          id: itemToToggle.id,
          isActive: nextActive,
        }),
      ).unwrap();
      toast.success(
        nextActive ? "Designation activated." : "Designation deactivated.",
      );
      setItemToToggle(null);
      if (!includeInactive && !nextActive) {
        await loadList(page);
      }
    } catch (err: unknown) {
      const message = getApiErrorMessage(err);
      if (message) toast.error(message);
      throw err;
    }
  };

  const handleConfirmDelete = async () => {
    if (!itemToDelete) return;
    try {
      await dispatch(deleteDesignation(itemToDelete.id)).unwrap();
      toast.success("Designation deleted.");
      setItemToDelete(null);
    } catch (err: unknown) {
      const message = getApiErrorMessage(err);
      if (isStaffAssignmentDeleteError(message)) {
        toast.error(
          message ??
            "This title is still assigned to staff. Deactivate it instead.",
        );
        setItemToDelete(null);
        setItemToToggle(itemToDelete);
        return;
      }
      if (message) toast.error(message);
      throw err;
    }
  };

  const paginationInfo = {
    total: pagination?.total ?? items.length,
    current: pagination?.page ?? page,
    pageSize: pagination?.limit ?? DESIGNATIONS_PAGE_SIZE,
  };

  const columns = useMemo(
    () => [
      {
        key: "createdAt",
        header: "Created",
        render: (item: Designation) => formatDesignationDate(item.createdAt),
        exportValue: (item: Designation) => item.createdAt ?? "",
      },
      {
        key: "name",
        header: "Name",
        render: (item: Designation) => item.name || "—",
      },
      {
        key: "description",
        header: "Description",
        render: (item: Designation) => item.description || "—",
      },
      {
        key: "modules",
        header: "Modules",
        render: (item: Designation) => (
          <DesignationModulesCell modules={item.modules} />
        ),
        exportValue: (item: Designation) =>
          (item.modules ?? []).map(labelForEstateModule).join(", "),
      },
      {
        key: "isActive",
        header: "Status",
        render: (item: Designation) => (
          <span
            className={`px-3 py-1 rounded-full text-xs font-semibold ${
              item.isActive
                ? "bg-green-100 text-green-700"
                : "bg-red-100 text-red-700"
            }`}
          >
            {item.isActive ? "Active" : "Inactive"}
          </span>
        ),
      },
      {
        key: "actions",
        header: "Actions",
        exportable: false,
        render: (item: Designation) => {
          const inherited =
            !usesCompanyScope &&
            role === "estate" &&
            isInheritedCompanyTitle(item, apiEstateId);
          if (inherited) {
            return (
              <span className="text-xs text-muted-foreground">Inherited</span>
            );
          }
          return (
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="sm"
                className="cursor-pointer"
                onClick={() => openEdit(item)}
                title="Edit designation"
              >
                <Pencil className="w-4 h-4 text-blue-600" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="cursor-pointer"
                onClick={() => setItemToToggle(item)}
                title={
                  item.isActive
                    ? "Deactivate designation"
                    : "Activate designation"
                }
              >
                {item.isActive ? (
                  <PowerOff className="w-4 h-4 text-amber-600" />
                ) : (
                  <Power className="w-4 h-4 text-green-600" />
                )}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="cursor-pointer"
                onClick={() => setItemToDelete(item)}
                title="Delete designation"
              >
                <Trash2 className="w-4 h-4 text-red-600" />
              </Button>
            </div>
          );
        },
      },
    ],
    [role, usesCompanyScope, apiEstateId],
  );

  const canCreate = Boolean(scopeId);

  const toolbar = (
    <div
      className={
        compact
          ? "flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between"
          : "mt-4 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between"
      }
    >
      <div className="relative min-w-0 flex-1">
        <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-black/35" />
        <Input
          value={searchInput}
          onChange={(event) => setSearchInput(event.target.value)}
          placeholder="Search titles"
          className="h-11 rounded-2xl bg-white/80 pl-9"
          aria-label="Search designations"
        />
      </div>
      {/* <div className="rounded-2xl border border-black/5 bg-white/70 px-3.5 py-2.5 lg:min-w-[220px]">
        <DesignationToggle
          checked={includeInactive}
          label="Show inactive"
          onCheckedChange={setIncludeInactive}
        />
      </div> */}
      {compact ? (
        <Button
          type="button"
          onClick={openCreate}
          disabled={!canCreate}
          className="self-start shrink-0"
        >
          <Plus className="size-4" />
          New designation
        </Button>
      ) : null}
    </div>
  );

  return (
    <div className="relative space-y-5">
      {showInitialLoader ? (
        <div className={compact ? "min-h-[12rem]" : undefined}>
          <Loader fullScreen={!compact} label="Loading designations..." />
        </div>
      ) : null}

      {compact ? (
        <div className="bg-white p-4 rounded-lg">{toolbar}</div>
      ) : (
      <header
        className={[
          "sticky top-0 z-10 -mx-1 rounded-[24px] px-4 py-4 sm:px-5",
          "border border-white/40 bg-white/60 shadow-[0_8px_30px_rgba(15,23,42,0.04)]",
          "backdrop-blur-[20px] saturate-[180%]",
          "motion-reduce:bg-white motion-reduce:backdrop-blur-none",
          "[@media(prefers-reduced-transparency:reduce)]:bg-white",
          "[@media(prefers-reduced-transparency:reduce)]:backdrop-blur-none",
        ].join(" ")}
      >
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <p className="text-[11px] font-medium uppercase tracking-[0.08em] text-black/45">
              {usesCompanyScope ? "Company" : "Estate"} · {scopeName}
            </p>
            <h1 className="mt-1 font-heading text-[32px] font-bold leading-[1.05] tracking-[-0.03em]">
              Designations
            </h1>
          </div>
          <Button
            type="button"
            onClick={openCreate}
            disabled={!canCreate}
            className="self-start rounded-full bg-[#0150AC] text-white active:scale-[0.97] hover:bg-[#0150AC]/90"
          >
            <Plus className="size-4" />
            New designation
          </Button>
        </div>
        {toolbar}
      </header>
      )}

      {!(compact && showInitialLoader) ? (
      <Card className="p-4">
        <Table
          columns={columns}
          data={items}
          emptyMessage="No designations found."
          showPagination
          paginationInfo={paginationInfo}
          onPageChange={(nextPage) => {
            setPage(nextPage);
            window.scrollTo({
              top: 0,
              behavior: reduceMotion ? "auto" : "smooth",
            });
          }}
        />
      </Card>
      ) : null}

      <DesignationFormSheet
        open={sheetOpen}
        saving={saving}
        initial={editing}
        scopeLabel={usesCompanyScope ? "Company" : "Estate"}
        companyId={role === "company" ? apiCompanyId : undefined}
        defaultEstateId={role === "company" ? "" : estateId}
        onClose={closeSheet}
        onSubmit={handleSubmit}
      />

      <DeleteModal
        visible={Boolean(itemToDelete)}
        onClose={() => setItemToDelete(null)}
        itemName={itemToDelete?.name ?? "this designation"}
        title="Delete designation"
        loading={deleting}
        onConfirm={handleConfirmDelete}
        message={
          <p className="mb-4 text-sm text-muted-foreground">
            Delete <strong>{itemToDelete?.name ?? "this designation"}</strong>?
            This fails if staff still have this title — deactivate it instead.
          </p>
        }
      />

      <DeleteModal
        visible={Boolean(itemToToggle)}
        onClose={() => setItemToToggle(null)}
        itemName={itemToToggle?.name ?? "this designation"}
        title={
          itemToToggle?.isActive === false
            ? "Activate designation"
            : "Deactivate designation"
        }
        confirmLabel={
          itemToToggle?.isActive === false ? "Activate" : "Deactivate"
        }
        confirmClassName={
          itemToToggle?.isActive === false
            ? "bg-emerald-600 hover:bg-emerald-700 text-white"
            : "bg-amber-600 hover:bg-amber-700 text-white"
        }
        loading={toggling}
        loadingLabel={
          itemToToggle?.isActive === false ? "Activating…" : "Deactivating…"
        }
        onConfirm={handleConfirmToggle}
        message={
          <p className="mb-4 text-sm text-muted-foreground">
            {itemToToggle?.isActive === false
              ? `Activate ${itemToToggle?.name ?? "this designation"} so it can be assigned to staff again?`
              : `Deactivate ${itemToToggle?.name ?? "this designation"}? Existing staff keep the title, but it won’t be offered for new assignments.`}
          </p>
        }
      />
    </div>
  );
}
