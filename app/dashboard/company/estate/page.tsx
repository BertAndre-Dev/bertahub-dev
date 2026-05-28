"use client";

import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { toast } from "react-toastify";
import {
  Building2,
  Users,
  Home,
  TrendingUp,
  Plus,
  Edit,
  Power,
  PowerOff,
  Trash2,
  Search,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Table from "@/components/tables/list/page";
import Modal from "@/components/modal/page";
import Loader from "@/components/ui/Loader";
import { confirmDeleteToast } from "@/lib/confirm-delete-toast";
import type { AppDispatch, RootState } from "@/redux/store";
import { getSignedInUser } from "@/redux/slice/auth-mgt/auth-mgt";
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

type EstateTableRow = EstateData & {
  id?: string;
  _id?: string;
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
      loading: s?.getAllEstatesStatus === "isLoading",
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
        const data = userRes?.data ?? (userRes as Record<string, unknown>);
        const companyFromId =
          (data?.companyId as { name?: string } | undefined)?.name ?? "";
        const companyFromObj =
          (data?.company as { name?: string } | undefined)?.name ?? "";
        const fallback = (data?.companyName as string) ?? "";
        setCompanyName(companyFromId || companyFromObj || fallback || "Company");
      } catch {
        // keep default
      }
    })();
  }, [dispatch]);

  useEffect(() => {
    fetchEstates(1).catch(() => toast.error("Failed to fetch estates"));
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
        await dispatch(updateCompanyEstate({ id, data })).unwrap();
        toast.success("Estate updated successfully!");
      } else {
        await dispatch(createCompanyEstate(data)).unwrap();
        toast.success("Estate created successfully!");
      }
      handleCloseModal();
      await fetchEstates(1);
    } catch (err: unknown) {
      toast.error((err as { message?: string })?.message ?? "Failed to save estate");
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
      toast.error(
        (err as { message?: string })?.message ?? "Failed to update estate status.",
      );
    } finally {
      setStatusSubmitting(false);
    }
  };

  const handleDeleteEstate = (id?: string, name?: string) => {
    if (!id) return;
    confirmDeleteToast({
      name,
      onConfirm: async () => {
        await dispatch(deleteCompanyEstate(id)).unwrap();
        toast.success(`${name ?? "Estate"} deleted successfully!`);
        await fetchEstates(1);
      },
    });
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
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleEstateModal(item)}
            title="Edit Estate"
            className="cursor-pointer"
          >
            <Edit className="w-4 h-4 text-blue-600" />
          </Button>
          {item.isActive ? (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => openSuspendModal(item)}
              title="Suspend Estate"
              className="cursor-pointer"
            >
              <PowerOff className="w-4 h-4 text-red-600" />
            </Button>
          ) : (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => openActivateModal(item)}
              title="Activate Estate"
              className="cursor-pointer"
            >
              <Power className="w-4 h-4 text-green-600" />
            </Button>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleDeleteEstate(rowId(item), item.name)}
            title="Delete Estate"
            className="cursor-pointer"
          >
            <Trash2 className="w-4 h-4 text-red-600" />
          </Button>
        </div>
      ),
    },
  ];

  const estates = allEstates as EstateTableRow[];
  const stats = [
    {
      label: "Total Estates",
      value: pagination?.total ?? estates.length,
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
      {loading && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-background/40 backdrop-blur-sm">
          <Loader label="Loading estates..." />
        </div>
      )}

      <div
        className={[
          "space-y-6",
          loading ? "blur-sm opacity-60 pointer-events-none select-none" : "",
        ].join(" ")}
      >
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h1 className="font-heading text-3xl font-bold">Estate Management</h1>
            <p className="text-muted-foreground mt-1">
              Manage estates for{" "}
              <span className="text-[18px] font-bold underline uppercase text-black">
                {companyName}
              </span>
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
              fetchEstates(page).catch(() => toast.error("Failed to fetch estates"));
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
          <Modal visible={open} onClose={handleCloseModal}>
            <CompanyEstateForm
              initialData={
                selectedEstate
                  ? {
                      name: selectedEstate.name,
                      address: selectedEstate.address ?? "",
                      city: selectedEstate.city ?? "",
                      state: selectedEstate.state ?? "",
                      country: selectedEstate.country ?? "",
                      modules: Array.isArray(selectedEstate.modules)
                        ? [...selectedEstate.modules]
                        : [],
                      visitorVerificationMode:
                        (selectedEstate as any).visitorVerificationMode,
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
    </div>
  );
}
