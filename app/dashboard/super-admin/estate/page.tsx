"use client";

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Building2,
  Users,
  Home,
  TrendingUp,
  Plus,
  MoreVertical,
  Search,
} from "lucide-react";
import { useRouter } from "next/navigation";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import Table from "@/components/tables/list/page";
import {
  getAllEstates,
  createEstate,
  updateEstate,
  activateEstate,
  suspendEstate,
  deleteEstate,
  type EstateData,
} from "@/redux/slice/super-admin/super-admin-est-mgt/super-admin-est-mgt";
import { toast } from "react-toastify";
import { getApiErrorMessage } from "@/lib/api-error";
import { useDispatch, useSelector } from "react-redux";
import { RootState, AppDispatch } from "@/redux/store";
import { useCallback, useEffect, useState } from "react";
import Modal from "@/components/modal/page";
import EstateForm from "@/components/super-admin/estate-form/page";
import DeleteModal from "@/components/resident/delete-modal/page";
import Loader from "@/components/ui/Loader";
import { isPending } from "@/lib/async-status";
import { EstateStatusModal } from "./components/EstateStatusModal";
import { formatVendAmount, labelForPlan } from "@/lib/plans";

type EstateTableRow = Omit<EstateData, "modules"> & {
  id?: string;
  modules?: string[];
  plan?: string;
  createdAt?: string | number | Date;
  visitorVerificationMode?: string;
};

const PAGE_SIZE = 10;

export default function EstatePage() {
  const dispatch = useDispatch<AppDispatch>();
  const router = useRouter();

  const { allEstates, pagination, loading } = useSelector(
    (state: RootState) => {
      const estateState = state.estate as any;
      const data = estateState.allEstates?.data || [];
      const pagination = estateState.allEstates?.pagination || {};
      return {
        allEstates: Array.isArray(data) ? data : [],
        pagination,
        loading: isPending(estateState.getAllEstatesState),
      };
    },
  );

  const [open, setOpen] = useState(false);
  const [selectedEstate, setSelectedEstate] = useState<EstateTableRow | null>(null);
  const [statusItem, setStatusItem] = useState<EstateTableRow | null>(null);
  const [statusMode, setStatusMode] = useState<"suspend" | "activate">("suspend");
  const [statusSubmitting, setStatusSubmitting] = useState(false);
  const [estateToDelete, setEstateToDelete] = useState<EstateTableRow | null>(
    null,
  );
  const [deleting, setDeleting] = useState(false);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [searchInput, setSearchInput] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  const fetchEstates = useCallback(
    (page = 1, search = searchQuery) => {
      const shouldApplyDate = Boolean(startDate && endDate);
      return dispatch(
        getAllEstates({
          page,
          limit: PAGE_SIZE,
          search: search.trim() || undefined,
          startDate: shouldApplyDate ? startDate : undefined,
          endDate: shouldApplyDate ? endDate : undefined,
        }),
      )
        .unwrap()
        .then((result) => {
          setCurrentPage(page);
          return result;
        });
    },
    [dispatch, startDate, endDate, searchQuery],
  );

  useEffect(() => {
    fetchEstates(1).catch((err: unknown) => {
      const message = getApiErrorMessage(err);
      if (message) toast.error(message);
    });
  }, [fetchEstates]);

  const applySearch = useCallback(() => {
    setSearchQuery(searchInput.trim());
    setCurrentPage(1);
  }, [searchInput]);

  const clearSearch = useCallback(() => {
    setSearchInput("");
    setSearchQuery("");
    setCurrentPage(1);
  }, []);

  const handleSearchInputChange = (value: string) => {
    setSearchInput(value);
    if (!value.trim() && searchQuery) {
      setSearchQuery("");
      setCurrentPage(1);
    }
  };

  const handleEstateModal = (estate?: EstateTableRow) => {
    setSelectedEstate(estate || null);
    setOpen(true);
  };

  const handleCloseModal = () => {
    setOpen(false);
    setSelectedEstate(null);
  };

  const handleSubmitEstate = async (data: EstateData) => {
    try {
      if (selectedEstate?.id) {
        const { modules: _modules, ...updateData } = data;
        await dispatch(
          updateEstate({ id: selectedEstate.id, data: updateData as EstateData }),
        ).unwrap();
        toast.success("Estate updated successfully!");
      } else {
        await dispatch(createEstate(data)).unwrap();
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
    if (!estate?.id) return;
    setStatusSubmitting(true);
    try {
      if (statusMode === "suspend") {
        await dispatch(suspendEstate(estate.id)).unwrap();
        toast.info(`${estate.name} has been suspended.`);
      } else {
        await dispatch(activateEstate(estate.id)).unwrap();
        toast.success(`${estate.name} has been activated.`);
      }
      closeStatusModal();
      await fetchEstates(1);
    } catch (err: unknown) {
      const message = getApiErrorMessage(err);
      if (message) toast.error(message);
    } finally {
      setStatusSubmitting(false);
    }
  };

  // ✅ Handle Delete Estate with DeleteModal confirmation
  const handleDeleteEstate = (estate: EstateTableRow) => {
    if (!estate.id) return;
    setEstateToDelete(estate);
  };

  const handleConfirmDeleteEstate = async () => {
    if (!estateToDelete?.id) return;
    setDeleting(true);
    try {
      await dispatch(deleteEstate(estateToDelete.id)).unwrap();
      toast.success(
        `${estateToDelete.name ?? "Estate"} deleted successfully!`,
      );
      setEstateToDelete(null);
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
      key: "createdAt",
      header: "Created At",
      render: (item: EstateTableRow) =>
        new Date(item.createdAt as string | number | Date).toLocaleDateString(
          "en-GB",
          {
            day: "2-digit",
            month: "short",
            year: "numeric",
          },
        ),
    },
    { key: "name", header: "Estate Name" },
    { key: "address", header: "Address" },
    { key: "city", header: "City" },
    { key: "state", header: "State" },
    { key: "country", header: "Country" },
    {
      key: "plan",
      header: "Plan",
      render: (item: EstateTableRow) => (
        <span className="font-medium">{labelForPlan(item.plan)}</span>
      ),
      exportValue: (item: EstateTableRow) => labelForPlan(item.plan),
    },
    {
      key: "minVendAmount",
      header: "Min vend",
      render: (item: EstateTableRow) => formatVendAmount(item.minVendAmount),
      exportValue: (item: EstateTableRow) => formatVendAmount(item.minVendAmount),
    },
    {
      key: "maxVendAmount",
      header: "Max vend",
      render: (item: EstateTableRow) => formatVendAmount(item.maxVendAmount),
      exportValue: (item: EstateTableRow) => formatVendAmount(item.maxVendAmount),
    },
    {
      key: "visitorVerificationMode",
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
      key: "isActive",
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
      key: "actions",
      header: "Actions",
      render: (item: EstateTableRow) => (
        <div className="flex items-center gap-1">
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
                onSelect={() => {
                  if (item.id) router.push(`/dashboard/super-admin/estate/${item.id}`);
                }}
                className="cursor-pointer select-none rounded px-3 py-2 text-sm outline-none hover:bg-gray-100 focus:bg-gray-100"
              >
                View Estate
              </DropdownMenu.Item>
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
                onSelect={() => handleDeleteEstate(item)}
                className="cursor-pointer select-none rounded px-3 py-2 text-sm text-red-600 outline-none hover:bg-gray-100 focus:bg-gray-100"
              >
                Delete Estate
              </DropdownMenu.Item>
            </DropdownMenu.Content>
          </DropdownMenu.Portal>
        </DropdownMenu.Root>
        </div>
      ),
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
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading text-3xl font-bold">Estate Management</h1>
          <p className="text-muted-foreground mt-1">
            Overview of created estates.
          </p>
        </div>

        <Button
          onClick={() => handleEstateModal()}
          className="flex items-center justify-center gap-2 cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          Create Estate
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {(() => {
          const estates = allEstates as EstateTableRow[];

          const stats = [
            {
              label: "Total Estates",
              value: pagination?.total || 0,
              icon: Building2,
              color: "bg-[#D0DFF280]",
            },
            {
              label: "Active Estates",
              value: estates?.filter((e) => e.isActive)?.length || 0,
              icon: Home,
              color: "bg-[#CCE4DB80]",
            },
            {
              label: "Cities Covered",
              value: new Set(estates.map((e) => e.city)).size || 0,
              icon: Users,
              color: "bg-[#FEE6D480]",
            },
            {
              label: "States",
              value: new Set(estates.map((e) => e.state)).size || 0,
              icon: TrendingUp,
              color: "bg-[#CABDFF80]",
            },
          ];

          return stats.map((stat, i) => {
            const Icon = stat.icon;
            return (
              <Card key={i} className="p-6">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">
                      {stat.label}
                    </p>
                    <p className="font-heading text-2xl font-bold mt-2">
                      {stat.value}
                    </p>
                  </div>
                  <div className={`p-3 rounded-lg ${stat.color}`}>
                    <Icon className="w-6 h-6" />
                  </div>
                </div>
              </Card>
            );
          });
        })()}
      </div>

      <Card className="p-4">
        <div className="relative w-full max-w-sm flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              placeholder="Search by estate name, address, city etc..."
              value={searchInput}
              onChange={(e) => handleSearchInputChange(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") applySearch();
                if (e.key === "Escape") clearSearch();
              }}
              className="w-full pl-9 pr-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          {searchInput.trim().length > 0 && (
            <Button type="button" onClick={applySearch} className="cursor-pointer">
              Search
            </Button>
          )}
        </div>
      </Card>

      {/* Estates Table */}
      <Card className="p-4">
        <Table
          columns={columns}
          data={allEstates}
          emptyMessage="No estates found"
          enableDateRangeFilter
          defaultDateRangeDays={0}
          startDate={startDate}
          endDate={endDate}
          onDateRangeChange={({ startDate, endDate }) => {
            setStartDate(startDate);
            setEndDate(endDate);
          }}
          showPagination={true}
          paginationInfo={{
            total: pagination?.total || 0,
            current: currentPage,
            pageSize: PAGE_SIZE,
          }}
          onPageChange={(page) => {
            fetchEstates(page).catch((err: unknown) => {
              const message = getApiErrorMessage(err);
              if (message) toast.error(message);
            });
          }}
          enableExport
          exportFileName="estates"
          onExportRequest={async () => {
            const shouldApplyDate = Boolean(startDate && endDate);
            const res = await dispatch(
              getAllEstates({
                page: 1,
                limit: 50000,
                search: searchQuery.trim() || undefined,
                startDate: shouldApplyDate ? startDate : undefined,
                endDate: shouldApplyDate ? endDate : undefined,
              }),
            ).unwrap();
            return res?.data ?? [];
          }}
        />
      </Card>

      {/* Estate Form Modal */}
      {open && (
        <Modal visible={open} onClose={handleCloseModal}>
          <EstateForm
            initialData={
              selectedEstate
                ? {
                    name: selectedEstate.name,
                    address: selectedEstate.address,
                    city: selectedEstate.city,
                    state: selectedEstate.state,
                    country: selectedEstate.country,
                    plan: selectedEstate.plan,
                    visitorVerificationMode:
                      (selectedEstate as any).visitorVerificationMode,
                  }
                : null
            }
            onSubmit={handleSubmitEstate}
          />
        </Modal>
      )}

      <EstateStatusModal
        visible={Boolean(statusItem)}
        onClose={closeStatusModal}
        estateName={statusItem?.name ?? "this estate"}
        mode={statusMode}
        loading={statusSubmitting}
        onConfirm={handleConfirmStatus}
      />

      <DeleteModal
        visible={Boolean(estateToDelete)}
        onClose={() => setEstateToDelete(null)}
        itemName={estateToDelete?.name ?? "this estate"}
        title="Delete estate"
        loading={deleting}
        onConfirm={handleConfirmDeleteEstate}
      />
      </div>
    </div>
  );
}