"use client";

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, Edit2, Trash2, ScrollText, Power, PowerOff } from "lucide-react";
import Table from "@/components/tables/list/page";
import Modal from "@/components/modal/page";
import BillsForm, {
  type BillSubmitData,
} from "@/components/admin/bills-form/page";
import BillForAddressForm, {
  type BillForAddressFormData,
} from "@/components/admin/bill-for-address-form/page";

import {
  activateBill,
  createBill,
  createBillForAddress,
  deleteBill,
  getBillsByEstate,
  getBillsForAddress,
  suspendBill,
  updateBill,
  type BillsForAddressItem,
} from "@/redux/slice/admin/bills-mgt/bills";
import { getSignedInUser } from "@/redux/slice/auth-mgt/auth-mgt";
import { toast } from "react-toastify";
import { useDispatch, useSelector } from "react-redux";
import { RootState, AppDispatch } from "@/redux/store";
import { useEffect, useState } from "react";
import { confirmDeleteToast } from "@/lib/confirm-delete-toast";
import SuspendRentModal from "@/components/resident/suspend-rent-modal/page";

interface BillData {
  id?: string;
  estateId: string;
  name: string;
  description: string;
  yearlyAmount: number;
  isActive?: boolean;
}

export default function BillPage() {
  const dispatch = useDispatch<AppDispatch>();
  const [selectedBill, setSelectedBill] = useState<BillData | null>(null);
  const [estateId, setEstateId] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const [assignBill, setAssignBill] = useState<BillData | null>(null);
  const [activeTab, setActiveTab] = useState<"create" | "assign">("create");
  const [billSearch, setBillSearch] = useState("");
  const [assignSearch, setAssignSearch] = useState("");
  const [assignAddressOptions, setAssignAddressOptions] = useState<
    { label: string; value: string }[]
  >([]);
  const [assignAddressId, setAssignAddressId] = useState<string>("");
  const [assignAddressLoading, setAssignAddressLoading] = useState(false);
  const [suspendBillItem, setSuspendBillItem] = useState<BillData | null>(null);
  const [suspendSubmitting, setSuspendSubmitting] = useState(false);

  const { allBills, pagination, loading, assignedBills, assignedPagination, loadingAssigned } =
    useSelector((state: RootState) => {
      const billState = state.adminBill as any;
      return {
        allBills: billState?.allBills?.data || [],
        pagination: billState?.allBills?.pagination || {},
        loading:
          billState.getBillsByEstateState === "isLoading" ||
          billState.createBillState === "isLoading" ||
          billState.updateBillState === "isLoading" ||
          billState.deleteBillState === "isLoading",
        assignedBills: (billState?.assignedBills || []) as BillsForAddressItem[],
        assignedPagination: billState?.assignedBillsPagination || null,
        loadingAssigned: billState?.getBillsForAddressState === "isLoading",
      };
    });

  useEffect(() => {
    (async () => {
      try {
        const userRes = await dispatch(getSignedInUser()).unwrap();
        const foundEstateId = userRes?.data?.estateId;

        if (!foundEstateId) {
          toast.warning("No estate found for this user.");
          return;
        }

        setEstateId(foundEstateId);

        await dispatch(
          getBillsByEstate({ estateId: foundEstateId, page: 1, limit: 10 }),
        ).unwrap();
      } catch {
        toast.error("Failed to fetch bills.");
      }
    })();
  }, [dispatch]);

  // Load address options for assign tab (using same estate fields/entries)
  useEffect(() => {
    if (activeTab !== "assign" || !estateId || assignAddressOptions.length > 0) {
      return;
    }
    (async () => {
      try {
        setAssignAddressLoading(true);
        const { getFieldByEstate } = await import(
          "@/redux/slice/admin/address-mgt/fields/fields"
        );
        const { getEntriesByField } = await import(
          "@/redux/slice/admin/address-mgt/entry/entry"
        );

        const fieldRes = await dispatch(getFieldByEstate(estateId)).unwrap();
        const fields = fieldRes?.data || [];
        if (!fields.length) {
          toast.error("No address fields configured for this estate.");
          return;
        }
        const primaryFieldId = fields[0].id;
        const entryRes = await dispatch(
          getEntriesByField({ fieldId: primaryFieldId, page: 1, limit: 200 }),
        ).unwrap();
        const entries =
          entryRes?.data ??
          (entryRes as {
            data?: Array<{ id: string; data?: Record<string, string> }>;
          })?.data ??
          [];
        const opts = entries.map(
          (entry: { id: string; data?: Record<string, string> }) => {
            const d = entry.data ?? {};
            const label = Object.entries(d)
              .map(([k, v]) => `${k}: ${v}`)
              .join(", ");
            return { label: label || entry.id, value: entry.id };
          },
        );
        setAssignAddressOptions(opts);
        if (opts.length > 0) {
          const firstId = opts[0].value;
          setAssignAddressId(firstId);
          await dispatch(
            getBillsForAddress({ addressId: firstId, estateId, page: 1, limit: 10 }),
          ).unwrap();
        }
      } catch {
        toast.error("Failed to load addresses for assigned bills.");
      } finally {
        setAssignAddressLoading(false);
      }
    })();
  }, [activeTab, estateId, assignAddressOptions.length, dispatch]);

  const handleOpenModal = (bill?: BillData) => {
    setSelectedBill(bill || null);
    setOpen(true);
  };

  const handleCloseModal = () => {
    setSelectedBill(null);
    setOpen(false);
  };

  const openAssignModal = (bill: BillData) => {
    setAssignBill(bill);
  };

  const closeAssignModal = () => {
    setAssignBill(null);
  };

  const openSuspendModal = (bill: BillData) => {
    if (!bill.id || !bill.isActive) return;
    setSuspendBillItem(bill);
  };

  const handleSuspendConfirm = async (_reason: string) => {
    if (!suspendBillItem?.id || !estateId) return;
    setSuspendSubmitting(true);
    try {
      await dispatch(suspendBill(suspendBillItem.id)).unwrap();
      toast.info(`${suspendBillItem.name} suspended.`);
      setSuspendBillItem(null);
      await dispatch(
        getBillsByEstate({ estateId, page: 1, limit: 10 }),
      ).unwrap();
    } catch (err: any) {
      toast.error(err?.message);
    } finally {
      setSuspendSubmitting(false);
    }
  };

  const handleActivateBill = async (bill: BillData) => {
    if (!bill.id || !estateId) return;
    try {
      await dispatch(activateBill(bill.id)).unwrap();
      toast.success(`${bill.name} activated.`);
      await dispatch(
        getBillsByEstate({ estateId, page: 1, limit: 10 }),
      ).unwrap();
    } catch (err: any) {
      toast.error(err?.message);
    }
  };

  const handleDeleteBill = async (id?: string, name?: string) => {
    if (!id || !estateId) return;

    confirmDeleteToast({
      name,
      onConfirm: async () => {
        await dispatch(deleteBill(id)).unwrap();
        toast.success(`${name} deleted successfully.`);
        await dispatch(
          getBillsByEstate({ estateId, page: 1, limit: 10 }),
        ).unwrap();
      },
    });
  };

  const handleSubmitBill = async (data: BillSubmitData) => {
    if (!estateId) return;

    try {
      if (selectedBill?.id) {
        await dispatch(updateBill({ billId: selectedBill.id, data })).unwrap();
        toast.success("Bill updated successfully!");
      } else {
        await dispatch(createBill(data)).unwrap();
        toast.success("Bill created successfully!");
      }

      handleCloseModal();
      await dispatch(
        getBillsByEstate({ estateId, page: 1, limit: 10 }),
      ).unwrap();
    } catch (err: any) {
      toast.error(err?.message || "Failed to save bill.");
    }
  };

  const handleAssignBillForAddress = async (data: BillForAddressFormData) => {
    if (!estateId || !assignBill?.id) return;

    try {
      await dispatch(
        createBillForAddress({
          billId: assignBill.id,
          addressId: data.addressId,
          estateId,
          frequency: data.frequency,
          amountPerBillingPeriod: data.amountPerBillingPeriod,
          startDate: data.startDate,
        }),
      ).unwrap();
      toast.success("Bill assigned to address successfully.");
      closeAssignModal();
    } catch (err: any) {
      toast.error(
        err?.message ??
          err?.payload?.message ??
          "Failed to assign bill to address.",
      );
    }
  };

  const columns: {
    key: string;
    header: string;
    render?: (item: BillData) => React.ReactNode;
  }[] = [
    { key: "name", header: "Bill Name" },
    { key: "description", header: "Description" },
    { key: "yearlyAmount", header: "Yearly Amount" },
    {
      key: "isActive",
      header: "Status",
      render: (item: BillData) => (
        <span
          className={`px-3 py-1 rounded-full text-xs font-semibold ${
            item.isActive
              ? "bg-green-100 text-green-700"
              : "bg-red-100 text-red-700"
          }`}
        >
          {item.isActive ? "Active" : "Suspended"}
        </span>
      ),
    },
    {
      key: "actions",
      header: "Actions",
      render: (item: BillData) => (
        <div className="flex items-center gap-2">
          <Button
            className="cursor-pointer"
            variant="ghost"
            size="sm"
            onClick={() => handleOpenModal(item)}
          >
            <Edit2 className="w-4 h-4 text-blue-600" />
          </Button>
          {item.isActive ? (
            <Button
              className="cursor-pointer"
              variant="ghost"
              size="sm"
              onClick={() => openSuspendModal(item)}
              title="Suspend bill"
            >
              <PowerOff className="w-4 h-4 text-red-600" />
            </Button>
          ) : (
            <Button
              className="cursor-pointer"
              variant="ghost"
              size="sm"
              onClick={() => handleActivateBill(item)}
              title="Activate bill"
            >
              <Power className="w-4 h-4 text-green-600" />
            </Button>
          )}
          <Button
            className="cursor-pointer"
            variant="ghost"
            size="sm"
            onClick={() => handleDeleteBill(item.id, item.name)}
          >
            <Trash2 className="w-4 h-4 text-red-600" />
          </Button>
          {item.isActive && (
            <Button
              className="cursor-pointer"
              variant="ghost"
              size="sm"
              onClick={() => openAssignModal(item)}
              title="Assign bill to address"
            >
              <ScrollText className="w-4 h-4 text-indigo-600" />
            </Button>
          )}
        </div>
      ),
    },
  ];

  const filteredBills = (allBills || []).filter((bill: BillData) => {
    const q = billSearch.trim().toLowerCase();
    if (!q) return true;
    return (
      bill.name.toLowerCase().includes(q) ||
      bill.description.toLowerCase().includes(q)
    );
  });

  const filteredAssignedBills = (assignedBills || []).filter(
    (item: BillsForAddressItem) => {
      const q = assignSearch.trim().toLowerCase();
      if (!q) return true;
      const billName = (item.billName ?? "").toLowerCase();
      const freq = (item.frequency ?? "").toString().toLowerCase();
      return billName.includes(q) || freq.includes(q);
    },
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="font-heading text-3xl font-bold">Bills Management</h1>
          <p className="text-muted-foreground mt-1">
            Welcome back! Here's is an overview on{" "}
            <span className="text-[18px] font-bold underline uppercase text-black">
              Doe Estate
            </span>
            .
          </p>
        </div>
        <div className="flex items-center gap-2 self-start sm:self-auto">
          <Button
            onClick={() => handleOpenModal()}
            className="flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Create Bill
          </Button>
          <Button
            variant="outline"
            className="flex items-center gap-2"
            onClick={() => {
              if (!allBills?.length) {
                toast.info("No bills available. Create a bill first.");
                return;
              }
              const firstActive =
                allBills.find((b: BillData) => b.isActive) ?? allBills[0];
              openAssignModal(firstActive);
            }}
          >
            <ScrollText className="w-4 h-4" />
            Assign Bill
          </Button>
        </div>
      </div>

      {/* Stats Card */}
      <div className="grid grid-cols-1 gap-4">
        {(() => {
          const stats = [
            {
              label: "Total Bills",
              value: allBills?.length || 0,
              icon: ScrollText,
              color: "bg-[#D0DFF280]",
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
        {/* Search */}
        <div className="mb-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <Input
            type="text"
            placeholder={
              activeTab === "create"
                ? "Search bills by name or description..."
                : "Search assigned bills by bill name or frequency..."
            }
            value={activeTab === "create" ? billSearch : assignSearch}
            onChange={(e) =>
              activeTab === "create"
                ? setBillSearch(e.target.value)
                : setAssignSearch(e.target.value)
            }
            className="w-full sm:w-80"
          />
        </div>

        {/* Tabs */}
        <div className="flex gap-2 border-b border-border overflow-x-auto mb-4">
          {[
            { id: "create" as const, label: "Create Bills" },
            { id: "assign" as const, label: "Assigned Bills" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-3 text-sm font-medium cursor-pointer border-b-2 transition-colors whitespace-nowrap ${
                activeTab === tab.id
                  ? "border-primary text-primary"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Create Bills Tab */}
        {activeTab === "create" && (
          <Table
            columns={columns}
            data={filteredBills}
            emptyMessage={loading ? "Loading bills..." : "No bills found."}
            showPagination
            paginationInfo={{
              total: pagination?.total || 0,
              current: Number(pagination?.page) || 1,
              pageSize: Number(pagination?.limit) || 10,
            }}
            enableExport
            exportFileName="bills"
            onExportRequest={
              estateId
                ? async () => {
                    const res = await dispatch(
                      getBillsByEstate({ estateId, page: 1, limit: 50000 }),
                    ).unwrap();
                    return res?.data ?? [];
                  }
                : undefined
            }
          />
        )}

        {/* Assigned Bills Tab */}
        {activeTab === "assign" && (
          <div className="space-y-4">
            {/* <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
              <div className="space-y-1 w-full sm:w-80">
                <Label htmlFor="assignAddress">Address</Label>
                <select
                  id="assignAddress"
                  aria-label="Select address for assigned bills"
                  className="w-full border border-border rounded-md px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#0150AC]"
                  value={assignAddressId}
                  onChange={async (e) => {
                    const addrId = e.target.value;
                    setAssignAddressId(addrId);
                    if (!addrId || !estateId) return;
                    try {
                      await dispatch(
                        getBillsForAddress({
                          addressId: addrId,
                          estateId,
                          page: 1,
                          limit: 10,
                        }),
                      ).unwrap();
                    } catch {
                      toast.error("Failed to load assigned bills for address.");
                    }
                  }}
                  disabled={assignAddressLoading || assignAddressOptions.length === 0}
                >
                  <option value="">Select address...</option>
                  {assignAddressOptions.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
                {assignAddressLoading && (
                  <p className="text-xs text-muted-foreground">Loading addresses...</p>
                )}
                {!assignAddressLoading && assignAddressOptions.length === 0 && (
                  <p className="text-xs text-muted-foreground">
                    No addresses configured for this estate.
                  </p>
                )}
              </div>

              <Button
                variant="outline"
                className="flex items-center gap-2"
                onClick={() => {
                  if (!allBills?.length) {
                    toast.info("No bills available. Create a bill first.");
                    return;
                  }
                  const firstActive =
                    allBills.find((b: BillData) => b.isActive) ?? allBills[0];
                  openAssignModal(firstActive);
                }}
              >
                <ScrollText className="w-4 h-4" />
                Assign Bill
              </Button>
            </div> */}

            <Table
              columns={[
                {
                  key: "billName",
                  header: "Bill Name",
                  render: (item: BillsForAddressItem) =>
                    item.billName ?? item.billId ?? "—",
                },
                {
                  key: "frequency",
                  header: "Frequency",
                  render: (item: BillsForAddressItem) => item.frequency ?? "—",
                },
                {
                  key: "amountPaid",
                  header: "Amount Paid (₦)",
                  render: (item: BillsForAddressItem) =>
                    item.amountPaid != null
                      ? Number(item.amountPaid).toLocaleString()
                      : "—",
                },
                {
                  key: "startDate",
                  header: "Start Date",
                  render: (item: BillsForAddressItem) =>
                    item.startDate
                      ? new Date(item.startDate).toLocaleDateString()
                      : "—",
                },
                {
                  key: "nextDueDate",
                  header: "Next Due Date",
                  render: (item: BillsForAddressItem) =>
                    item.nextDueDate
                      ? new Date(item.nextDueDate).toLocaleDateString()
                      : "—",
                },
                {
                  key: "createdAt",
                  header: "Created At",
                  render: (item: BillsForAddressItem) =>
                    item.createdAt
                      ? new Date(item.createdAt).toLocaleString()
                      : "—",
                },
              ]}
              data={filteredAssignedBills}
              emptyMessage={
                assignAddressId
                  ? loadingAssigned
                    ? "Loading assigned bills..."
                    : "No bills assigned to this address."
                  : "Select an address to view assigned bills."
              }
              showPagination
              paginationInfo={{
                total: assignedPagination?.total || 0,
                current: assignedPagination?.page || 1,
                pageSize: assignedPagination?.limit || 10,
              }}
            />
          </div>
        )}
      </Card>

      {open && estateId && (
        <Modal visible={open} onClose={handleCloseModal}>
          <BillsForm
            estateId={estateId}
            initialData={selectedBill}
            onSubmit={handleSubmitBill}
          />
        </Modal>
      )}

      {assignBill && estateId && (
        <Modal visible={!!assignBill} onClose={closeAssignModal}>
          <BillForAddressForm
            estateId={estateId}
            billName={assignBill.name}
            onSubmit={handleAssignBillForAddress}
            onClose={closeAssignModal}
          />
        </Modal>
      )}

      <SuspendRentModal
        visible={!!suspendBillItem}
        onClose={() => setSuspendBillItem(null)}
        tenantName={suspendBillItem?.name ?? "this bill"}
        title="Suspend bill"
        confirmLabel="Suspend"
        onConfirm={handleSuspendConfirm}
        loading={suspendSubmitting}
      />
    </div>
  );
}