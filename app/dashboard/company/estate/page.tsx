"use client";

import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { toast } from "react-toastify";
import DeleteModal from "@/components/resident/delete-modal/page";
import {
  Building2,
  Users,
  Home,
  TrendingUp,
  Plus,
  MoreVertical,
  Search,
} from "lucide-react";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Table from "@/components/tables/list/page";
import Modal from "@/components/modal/page";
import Loader from "@/components/ui/Loader";
import { isPending } from "@/lib/async-status";
import { getApiErrorMessage } from "@/lib/api-error";
import type { AppDispatch, RootState } from "@/redux/store";
import { getSignedInUser } from "@/redux/slice/auth-mgt/auth-mgt";
import { parseCompanyFromUser } from "../lib/company";
import {
  activateCompanyEstate,
  createCompanyEstate,
  deleteCompanyEstate,
  getCompanyEstates,
  suspendCompanyEstate,
  updateCompanyEstate,
  type EstateData,
} from "@/redux/slice/company/estate-mgt/company-estate";
import CompanyEstateForm from "./components/CompanyEstateForm";
import { CompanyEstateStatusModal } from "./components/CompanyEstateStatusModal";
import { labelForPlan, formatVendAmount } from "@/lib/plans";

type EstateTableRow = EstateData & {
  id?: string;
  _id?: string;
  modules?: string[];
  createdAt?: string | number | Date;
  visitorVerificationMode?: string;
};

function rowId(item: EstateTableRow) {
  return item.id || item._id || "";
}

export default function CompanyEstatePage() {
  const dispatch = useDispatch<AppDispatch>();
  const [companyName, setCompanyName] = useState("Company");
  const [open, setOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<{ id: string; name?: string } | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [selectedEstate, setSelectedEstate] = useState<EstateTableRow | null>(null);
  const [statusItem, setStatusItem] = useState<EstateTableRow | null>(null);
  const [statusMode, setStatusMode] = useState<"suspend" | "activate">("suspend");
  const [statusSubmitting, setStatusSubmitting] = useState(false);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [search, setSearch] = useState("");

  const { allEstates, pagination, loading } = useSelector((state: RootState) => {
    const s = state.companyEstate;
    return {
      allEstates: (s?.allEstates?.data as EstateTableRow[]) ?? [],
      pagination: s?.allEstates?.pagination ?? null,
      loading: isPending(s?.getAllEstatesStatus),
    };
  });

  const pageSize = Number(pagination?.pageSize) || 10;

  const fetchEstates = (page = 1) => {
    const shouldApplyDate = Boolean(startDate && endDate);
    return dispatch(
      getCompanyEstates({
        page,
        limit: pageSize,
        search: search.trim() || undefined,
        startDate: shouldApplyDate ? startDate : undefined,
        endDate: shouldApplyDate ? endDate : undefined,
      }),
    ).unwrap();
  };

  useEffect(() => {
    (async () => {
      try {
        const userRes = await dispatch(getSignedInUser()).unwrap();
        const data = (userRes?.data ?? userRes) as Record<string, unknown>;
        const company = parseCompanyFromUser(data);
        if (company?.name) setCompanyName(company.name);
      } catch {
        // keep default
      }
    })();
  }, [dispatch]);

  useEffect(() => {
    fetchEstates(1).catch((err: unknown) => {
      const message = getApiErrorMessage(err);
      if (message) toast.error(message);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dispatch, startDate, endDate, search]);

  const handleEstateModal = (estate?: EstateTableRow) => {
    setSelectedEstate(estate ?? null);
    setOpen(true);
  };

  const handleCloseModal = () => {
    setOpen(false);
    setSelectedEstate(null);
  };

  const handleSubmitEstate = async (data: EstateData) => {
    try {
      const id = selectedEstate ? rowId(selectedEstate) : "";
      if (id) {
        const { modules: _modules, ...updateData } = data;
        await dispatch(updateCompanyEstate({ id, data: updateData })).unwrap();
        toast.success("Estate updated successfully!");
      } else {
        await dispatch(createCompanyEstate(data)).unwrap();
        toast.success("Estate created successfully!");
      }
      handleCloseModal();
      await fetchEstates(1);
    } catch (err: unknown) {
      const message = getApiErrorMessage(err);
      if (message) toast.error(message);
    }
  };

  const closeStatusModal = () => {
    if (statusSubmitting) return;
    setStatusItem(null);
  };

  const openSuspendModal = (estate: EstateTableRow) => {
    setStatusItem(estate);
    setStatusMode("suspend");
  };

  const openActivateModal = (estate: EstateTableRow) => {
    setStatusItem(estate);
    setStatusMode("activate");
  };

  const handleConfirmStatus = async () => {
    const estate = statusItem;
    const id = estate ? rowId(estate) : "";
    if (!id) return;
    setStatusSubmitting(true);
    try {
      if (statusMode === "suspend") {
        await dispatch(suspendCompanyEstate(id)).unwrap();
        toast.info(`${estate?.name ?? "Estate"} has been suspended.`);
      } else {
        await dispatch(activateCompanyEstate(id)).unwrap();
        toast.success(`${estate?.name ?? "Estate"} has been activated.`);
      }
      closeStatusModal();
      await fetchEstates(Number(pagination?.currentPage) || 1);
    } catch (err: unknown) {
      const message = getApiErrorMessage(err);
      if (message) toast.error(message);
    } finally {
      setStatusSubmitting(false);
    }
  };

  const handleDeleteEstate = (id?: string, name?: string) => {
    if (!id) return;
    setItemToDelete({ id, name });
  };

  const handleConfirmDelete = async () => {
    if (!itemToDelete?.id) return;
    setDeleting(true);
    try {
      await dispatch(deleteCompanyEstate(itemToDelete.id)).unwrap();
      toast.success(`${itemToDelete.name ?? "Estate"} deleted successfully!`);
      setItemToDelete(null);
      await fetchEstates(1);
    } catch (err: unknown) {
      const message = getApiErrorMessage(err);
      if (message) toast.error(message);
      throw err;
    } finally {
      setDeleting(false);
    }
  };

  const columns = [
    {
      key: "createdAt" as const,
      header: "Created At",
      render: (item: EstateTableRow) =>
        item.createdAt
          ? new Date(item.createdAt as string | number | Date).toLocaleDateString(
              "en-GB",
              { day: "2-digit", month: "short", year: "numeric" },
            )
          : "—",
    },
    { key: "name" as const, header: "Estate Name" },
    { key: "address" as const, header: "Address" },
    { key: "city" as const, header: "City" },
    { key: "state" as const, header: "State" },
    { key: "country" as const, header: "Country" },
    {
      key: "plan" as const,
      header: "Plan",
      render: (item: EstateTableRow) => (
        <span className="font-medium">{labelForPlan(item.plan)}</span>
      ),
      exportValue: (item: EstateTableRow) => labelForPlan(item.plan),
    },
    {
      key: "minVendAmount" as const,
      header: "Min vend",
      render: (item: EstateTableRow) => formatVendAmount(item.minVendAmount),
      exportValue: (item: EstateTableRow) => formatVendAmount(item.minVendAmount),
    },
    {
      key: "maxVendAmount" as const,
      header: "Max vend",
      render: (item: EstateTableRow) => formatVendAmount(item.maxVendAmount),
      exportValue: (item: EstateTableRow) => formatVendAmount(item.maxVendAmount),
    },
    {
      key: "visitorVerificationMode" as const,
      header: "Visitor Verification",
      render: (item: EstateTableRow) => {
        const v = item.visitorVerificationMode;
        const label =
          v === "VIEW_AND_VERIFY"
            ? "View and verify"
            : v === "VERIFY_ONLY"
              ? "Verify only"
              : v === "VIEW_ONLY"
                ? "View only"
                : "—";
        return <span className="font-medium">{label}</span>;
      },
    },
    {
      key: "isActive" as const,
      header: "Status",
      render: (item: EstateTableRow) => (
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
      key: "actions" as const,
      header: "Actions",
      exportable: false,
      render: (item: EstateTableRow) => (
        <DropdownMenu.Root>
          <DropdownMenu.Trigger asChild>
            <Button
              variant="ghost"
              size="sm"
              title="Actions"
              className="cursor-pointer"
            >
              <MoreVertical className="w-4 h-4" />
            </Button>
          </DropdownMenu.Trigger>
          <DropdownMenu.Portal>
            <DropdownMenu.Content
              align="end"
              sideOffset={8}
              className="z-50 min-w-[200px] rounded-md border bg-white p-1 shadow-md"
            >
              <DropdownMenu.Item
                onSelect={() => handleEstateModal(item)}
                className="cursor-pointer select-none rounded px-3 py-2 text-sm outline-none hover:bg-gray-100 focus:bg-gray-100"
              >
                Update Estate Details
              </DropdownMenu.Item>
              <DropdownMenu.Item
                onSelect={() =>
                  item.isActive
                    ? openSuspendModal(item)
                    : openActivateModal(item)
                }
                className={`cursor-pointer select-none rounded px-3 py-2 text-sm outline-none hover:bg-gray-100 focus:bg-gray-100 ${
                  item.isActive ? "text-red-600" : "text-green-600"
                }`}
              >
                {item.isActive ? "Suspend Estate" : "Activate Estate"}
              </DropdownMenu.Item>
              <DropdownMenu.Item
                onSelect={() => handleDeleteEstate(rowId(item), item.name)}
                className="cursor-pointer select-none rounded px-3 py-2 text-sm text-red-600 outline-none hover:bg-gray-100 focus:bg-gray-100"
              >
                Delete Estate
              </DropdownMenu.Item>
            </DropdownMenu.Content>
          </DropdownMenu.Portal>
        </DropdownMenu.Root>
      ),
    },
  ];

  const estates = allEstates as EstateTableRow[];
  const stats = [
    {
      label: "Total Estates",
      value: pagination?.total ?? 0,
      icon: Building2,
      color: "bg-[#D0DFF280]",
    },
    {
      label: "Active Estates",
      value: estates.filter((e) => e.isActive).length,
      icon: Home,
      color: "bg-[#CCE4DB80]",
    },
    {
      label: "Cities Covered",
      value: new Set(estates.map((e) => e.city).filter(Boolean)).size,
      icon: Users,
      color: "bg-[#FEE6D480]",
    },
    {
      label: "States",
      value: new Set(estates.map((e) => e.state).filter(Boolean)).size,
      icon: TrendingUp,
      color: "bg-[#CABDFF80]",
    },
  ];

  return (
    <div className="relative">
      {loading && <Loader fullScreen label="Loading estates..." />}

      <div
        className={[
          "space-y-6",
          loading ? "pointer-events-none select-none" : "",
        ].join(" ")}
      >
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h1 className="font-heading text-3xl font-bold">Estate Management</h1>
            <p className="text-muted-foreground mt-1">
              Manage estates for{" "}
              {/* <span className="text-[18px] font-bold underline uppercase text-black">
                {companyName}
              </span> */}
              .
            </p>
          </div>
          <Button
            onClick={() => handleEstateModal()}
            className="flex items-center justify-center gap-2 cursor-pointer shrink-0"
          >
            <Plus className="w-4 h-4" />
            Create Estate
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {stats.map((stat) => {
            const Icon = stat.icon;
            return (
              <Card key={stat.label} className="p-6">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">{stat.label}</p>
                    <p className="font-heading text-2xl font-bold mt-2">{stat.value}</p>
                  </div>
                  <div className={`p-3 rounded-lg ${stat.color}`}>
                    <Icon className="w-6 h-6" />
                  </div>
                </div>
              </Card>
            );
          })}
        </div>

        <div className="bg-white p-4 rounded-lg">
          <div className="relative w-full max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              placeholder="Search by estate name, address, city etc..."
              className="w-full pl-9 pr-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        <Card className="p-4">
          <Table
            columns={columns}
            data={estates}
            emptyMessage="No estates found"
            enableDateRangeFilter
            startDate={startDate}
            endDate={endDate}
            onDateRangeChange={({ startDate: s, endDate: e }) => {
              setStartDate(s);
              setEndDate(e);
            }}
            showPagination
            paginationInfo={{
              total: pagination?.total || 0,
              current: Number(pagination?.currentPage) || 1,
              pageSize,
            }}
            onPageChange={(page) => {
              fetchEstates(page).catch((err: unknown) => {
                const message = getApiErrorMessage(err);
                if (message) toast.error(message);
              });
            }}
            enableExport
            exportFileName="company-estates"
            onExportRequest={async () => {
              const shouldApplyDate = Boolean(startDate && endDate);
              const res = await dispatch(
                getCompanyEstates({
                  page: 1,
                  limit: 50000,
                  search: search.trim() || undefined,
                  startDate: shouldApplyDate ? startDate : undefined,
                  endDate: shouldApplyDate ? endDate : undefined,
                }),
              ).unwrap();
              return res?.data ?? [];
            }}
          />
        </Card>

        {open && (
          <Modal
            visible={open}
            onClose={handleCloseModal}
            contentClassName="p-4 md:w-[42%] lg:w-[36%] xl:w-[32%]"
          >
            <CompanyEstateForm
              initialData={
                selectedEstate
                  ? {
                      name: selectedEstate.name,
                      address: selectedEstate.address ?? "",
                      city: selectedEstate.city ?? "",
                      state: selectedEstate.state ?? "",
                      country: selectedEstate.country ?? "",
                      plan: selectedEstate.plan,
                      visitorVerificationMode:
                        (selectedEstate as EstateTableRow).visitorVerificationMode,
                    }
                  : null
              }
              onSubmit={handleSubmitEstate}
            />
          </Modal>
        )}

        <CompanyEstateStatusModal
          visible={Boolean(statusItem)}
          onClose={closeStatusModal}
          estateName={statusItem?.name ?? "this estate"}
          mode={statusMode}
          loading={statusSubmitting}
          onConfirm={handleConfirmStatus}
        />
      </div>
    
      <DeleteModal
        visible={Boolean(itemToDelete)}
        onClose={() => setItemToDelete(null)}
        itemName={itemToDelete?.name ?? "this estate"}
        title="Delete estate"
        loading={deleting}
        onConfirm={handleConfirmDelete}
      />
    </div>
  );
}
