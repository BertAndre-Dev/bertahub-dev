"use client";

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, Edit2, Trash2, ScrollText, Power, PowerOff, ChevronDown } from "lucide-react";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import Table from "@/components/tables/list/page";
import Modal from "@/components/modal/page";
import BillsForm, {
  type BillSubmitData,
} from "@/components/staff/bills-form/page";
import BillForAddressForm, {
  type BillForAddressFormData,
  type BillForAddressInitialData,
} from "@/components/staff/bill-for-address-form/page";

import {
  activateBill,
  createBill,
  createBillForAddress,
  deleteBill,
  getBillsByEstate,
  getBillsForAddress,
  suspendBill,
  updateBill,
  updateBillForAddress,
} from "@/redux/slice/staff/bills-mgt/bills";
import type { AssignedBillData } from "@/redux/slice/staff/bills-mgt/bills-slice";
import { getSignedInUser } from "@/redux/slice/auth-mgt/auth-mgt";
import { getFieldByEstate } from "@/redux/slice/staff/address-mgt/fields/fields";
import { getEntriesByField } from "@/redux/slice/staff/address-mgt/entry/entry";
import { formatAddressEntryLabel } from "@/lib/address";
import { toast } from "react-toastify";
import { useDispatch, useSelector } from "react-redux";
import { RootState, AppDispatch } from "@/redux/store";
import { useCallback, useEffect, useState } from "react";
import { getApiErrorMessage } from "@/lib/api-error";
import DeleteModal from "@/components/resident/delete-modal/page";
import SuspendRentModal from "@/components/resident/suspend-rent-modal/page";
import Loader from "@/components/ui/Loader";
import { isBusy, isPending } from "@/lib/async-status";
import { formatAmountDisplay } from "@/lib/format-number";
import { canUseBillInterest } from "@/lib/user-modules";
import { selectEstateModules } from "@/redux/slice/auth-mgt/auth-mgt-slice";

interface BillData {
  createdAt?: string;
  id?: string;
  estateId: string;
  name: string;
  description: string;
  yearlyAmount: number;
  amount?: number;
  frequency?: string;
  isActive?: boolean;
  isServiceCharge?: boolean;
  compulsory?: boolean;
  accrueInterest?: boolean;
  interestRatePercent?: number;
  interestStartsAt?: string;
}

type BillsTab = "bills" | "assigned";

const TABS: { id: BillsTab; label: string }[] = [
  { id: "bills", label: "Bills" },
  { id: "assigned", label: "Assigned Bills" },
];

function formatFrequencyLabel(frequency?: string): string {
  if (!frequency) return "-";
  const map: Record<string, string> = {
    // oneoff: "One-off",
    oneOff: "One-off",
    quarterly: "Quarterly",
    yearly: "Yearly",
    monthly: "Monthly",
  };
  return map[frequency] || frequency;
}

function formatInterestRate(item: {
  accrueInterest?: boolean;
  interestRatePercent?: number;
}) {
  if (!item.accrueInterest) return "—";
  const rate = item.interestRatePercent;
  if (rate == null || Number.isNaN(Number(rate))) return "—";
  return `${Number(rate)}%`;
}

function formatInterestStartsAt(item: {
  accrueInterest?: boolean;
  interestStartsAt?: string;
}) {
  if (!item.accrueInterest || !item.interestStartsAt) return "—";
  const date = new Date(item.interestStartsAt);
  if (Number.isNaN(date.getTime())) return item.interestStartsAt;
  return date.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function YesNoBadge({ value }: { value?: boolean }) {
  return (
    <span
      className={`px-3 py-1 rounded-full text-xs font-semibold ${
        value
          ? "bg-amber-100 text-amber-800"
          : "bg-slate-100 text-slate-600"
      }`}
    >
      {value ? "Yes" : "No"}
    </span>
  );
}

export default function StaffBillPage() {
  const dispatch = useDispatch<AppDispatch>();
  const authUser = useSelector((state: RootState) => state.auth.user);
  const estateModules = useSelector(selectEstateModules);
  const canAccrueInterest = canUseBillInterest(authUser, estateModules);
  const [estateName, setEstateName] = useState("Estate");
  const [selectedBill, setSelectedBill] = useState<BillData | null>(null);
  const [estateId, setEstateId] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const [assignModalOpen, setAssignModalOpen] = useState(false);
  const [selectedAssignedBill, setSelectedAssignedBill] =
    useState<BillForAddressInitialData | null>(null);
  const [billSearch, setBillSearch] = useState("");
  const [billsStartDate, setBillsStartDate] = useState("");
  const [billsEndDate, setBillsEndDate] = useState("");
  const [suspendBillItem, setSuspendBillItem] = useState<{
    id?: string;
    name: string;
    isActive?: boolean;
  } | null>(null);
  const [suspendSubmitting, setSuspendSubmitting] = useState(false);
  const [billToDelete, setBillToDelete] = useState<{
    id: string;
    name: string;
  } | null>(null);
  const [deleteSubmitting, setDeleteSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState<BillsTab>("bills");

  const [addressOptions, setAddressOptions] = useState<
    { label: string; value: string }[]
  >([]);
  const [assignedAddressId, setAssignedAddressId] = useState("");
  const [assignedStartDate, setAssignedStartDate] = useState("");
  const [assignedEndDate, setAssignedEndDate] = useState("");
  const [loadingAddresses, setLoadingAddresses] = useState(false);
  const [bootstrapping, setBootstrapping] = useState(true);

  const {
    allBills,
    pagination,
    assignedBills,
    assignedPagination,
    getBillsByEstateState,
    getBillsForAddressState,
    mutationLoading,
  } = useSelector((state: RootState) => {
    const billState = state.staffBill as any;
    return {
      allBills: billState?.allBills?.data || [],
      pagination: billState?.allBills?.pagination || {},
      assignedBills: (billState?.assignedBills?.data ||
        []) as AssignedBillData[],
      assignedPagination: billState?.assignedBills?.pagination || {},
      getBillsByEstateState: billState.getBillsByEstateState as string,
      getBillsForAddressState: billState.getBillsForAddressState as string,
      mutationLoading:
        isBusy(billState.createBillState) ||
        isBusy(billState.updateBillState) ||
        isBusy(billState.deleteBillState) ||
        isBusy(billState.createBillForAddressState) ||
        isBusy(billState.activateBillState) ||
        isBusy(billState.suspendBillState),
    };
  });

  const loading =
    bootstrapping ||
    mutationLoading ||
    (activeTab === "bills"
      ? Boolean(estateId) && isPending(getBillsByEstateState)
      : Boolean(assignedAddressId) && isPending(getBillsForAddressState));

  const fetchAssignedBills = useCallback(
    async (
      addressId: string,
      eId: string,
      opts?: {
        page?: number;
        limit?: number;
        startDate?: string;
        endDate?: string;
      },
    ) => {
      const shouldApplyDate = Boolean(opts?.startDate && opts?.endDate);
      await dispatch(
        getBillsForAddress({
          addressId,
          estateId: eId,
          page: opts?.page ?? 1,
          limit: opts?.limit ?? 10,
          startDate: shouldApplyDate ? opts?.startDate : undefined,
          endDate: shouldApplyDate ? opts?.endDate : undefined,
        }),
      ).unwrap();
    },
    [dispatch],
  );

  useEffect(() => {
    (async () => {
      try {
        const userRes = await dispatch(getSignedInUser()).unwrap();
        const data = userRes?.data ?? (userRes as Record<string, unknown>);
        const rawEstateId = data?.estateId as
          | string
          | { id?: string; _id?: string }
          | undefined;
        const foundEstateId =
          typeof rawEstateId === "string"
            ? rawEstateId
            : rawEstateId?._id || rawEstateId?.id || "";

        const estateFromId =
          (data?.estateId as { name?: string } | undefined)?.name ?? "";
        const estateFromObj =
          (data?.estate as { name?: string } | undefined)?.name ?? "";
        const fallbackEstateName = (data?.estateName as string) ?? "";
        const name =
          estateFromId || estateFromObj || fallbackEstateName || "Estate";
        setEstateName(name);

        if (!foundEstateId) {
          toast.warning("No estate found for this user.");
          return;
        }

        setEstateId(foundEstateId);

        await dispatch(
          getBillsByEstate({ estateId: foundEstateId, page: 1, limit: 10 }),
        ).unwrap();
      } catch (err: unknown) {
        const message = getApiErrorMessage(err);
        if (message) toast.error(message);
      } finally {
        setBootstrapping(false);
      }
    })();
  }, [dispatch]);

  useEffect(() => {
    if (!estateId) return;

    (async () => {
      try {
        setLoadingAddresses(true);
        const fieldRes = await dispatch(getFieldByEstate(estateId)).unwrap();
        const fields = fieldRes?.data || [];
        if (!fields.length) {
          setAddressOptions([]);
          return;
        }

        const entryRes = await dispatch(
          getEntriesByField({ fieldId: fields[0].id, page: 1, limit: 500 }),
        ).unwrap();
        const entries = entryRes?.data || [];
        const options = entries.map(
          (entry: { id: string; data?: Record<string, string> }) => ({
            label: formatAddressEntryLabel(entry.data) || entry.id,
            value: entry.id,
          }),
        );
        setAddressOptions(options);
        if (options.length === 1) {
          setAssignedAddressId((prev) => prev || options[0].value);
        }
      } catch (err: unknown) {
        const message = getApiErrorMessage(err);
        if (message) toast.error(message);
      } finally {
        setLoadingAddresses(false);
      }
    })();
  }, [dispatch, estateId]);

  useEffect(() => {
    if (!estateId || activeTab !== "bills") return;
    const shouldApplyDate = Boolean(billsStartDate && billsEndDate);
    dispatch(
      getBillsByEstate({
        estateId,
        page: 1,
        limit: 10,
        startDate: shouldApplyDate ? billsStartDate : undefined,
        endDate: shouldApplyDate ? billsEndDate : undefined,
      }),
    )
      .unwrap()
      .catch((err: unknown) => {
        const message = getApiErrorMessage(err);
        if (message) toast.error(message);
      });
  }, [dispatch, estateId, billsStartDate, billsEndDate, activeTab]);

  useEffect(() => {
    if (!estateId || activeTab !== "assigned" || !assignedAddressId) return;

    fetchAssignedBills(assignedAddressId, estateId, {
      startDate: assignedStartDate,
      endDate: assignedEndDate,
    }).catch((err: unknown) => {
      const message = getApiErrorMessage(err);
      if (message) toast.error(message);
    });
  }, [
    activeTab,
    assignedAddressId,
    assignedEndDate,
    assignedStartDate,
    estateId,
    fetchAssignedBills,
  ]);

  const handleOpenModal = (bill?: BillData) => {
    setSelectedBill(bill || null);
    setOpen(true);
  };

  const handleCloseModal = () => {
    setSelectedBill(null);
    setOpen(false);
  };

  const openAssignModal = () => {
    setSelectedAssignedBill(null);
    setAssignModalOpen(true);
  };

  const openEditAssignedModal = (item: AssignedBillData) => {
    setSelectedAssignedBill({
      id: item.id,
      billId: item.billId,
      addressId: assignedAddressId || undefined,
      name: item.billName,
      amount: item.amountDue ?? item.amount ?? item.amountPaid,
      compulsory: item.compulsory,
      accrueInterest: item.accrueInterest,
      interestRatePercent: item.interestRatePercent,
      interestStartsAt: item.interestStartsAt,
    });
    setAssignModalOpen(true);
  };

  const closeAssignModal = () => {
    setAssignModalOpen(false);
    setSelectedAssignedBill(null);
  };

  const refreshCurrentBillsList = async () => {
    if (!estateId) return;

    if (activeTab === "assigned" && assignedAddressId) {
      await fetchAssignedBills(assignedAddressId, estateId, {
        startDate: assignedStartDate,
        endDate: assignedEndDate,
      });
      return;
    }

    await dispatch(
      getBillsByEstate({
        estateId,
        page: 1,
        limit: 10,
        startDate:
          billsStartDate && billsEndDate ? billsStartDate : undefined,
        endDate: billsStartDate && billsEndDate ? billsEndDate : undefined,
      }),
    ).unwrap();
  };

  const openSuspendModal = (bill: {
    id?: string;
    name: string;
    isActive?: boolean;
  }) => {
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
      await refreshCurrentBillsList();
    } catch (err: unknown) {
      const message = getApiErrorMessage(err);
      if (message) toast.error(message);
    } finally {
      setSuspendSubmitting(false);
    }
  };

  const handleActivateBill = async (bill: { id?: string; name: string }) => {
    if (!bill.id || !estateId) return;
    try {
      await dispatch(activateBill(bill.id)).unwrap();
      toast.success(`${bill.name} activated.`);
      await refreshCurrentBillsList();
    } catch (err: unknown) {
      const message = getApiErrorMessage(err);
      if (message) toast.error(message);
    }
  };

  const handleDeleteBill = (id?: string, name?: string) => {
    if (!id || !estateId) return;
    setBillToDelete({ id, name: name || "this bill" });
  };

  const handleConfirmDeleteBill = async () => {
    if (!billToDelete?.id || !estateId) return;
    try {
      setDeleteSubmitting(true);
      await dispatch(deleteBill(billToDelete.id)).unwrap();
      toast.success(`${billToDelete.name} deleted successfully.`);
      setBillToDelete(null);
      await refreshCurrentBillsList();
    } catch (err: unknown) {
      const message = getApiErrorMessage(err);
      if (message) toast.error(message);
      throw err;
    } finally {
      setDeleteSubmitting(false);
    }
  };

  const getAssignedBillActionId = (item: AssignedBillData) =>
    item.billId || item.id;

  const isAssignedBillActive = (item: AssignedBillData) =>
    (item.status || "").toLowerCase() === "active";

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
        getBillsByEstate({
          estateId,
          page: 1,
          limit: 10,
          startDate:
            billsStartDate && billsEndDate ? billsStartDate : undefined,
          endDate: billsStartDate && billsEndDate ? billsEndDate : undefined,
        }),
      ).unwrap();
    } catch (err: unknown) {
      const message = getApiErrorMessage(err);
      if (message) toast.error(message);
    }
  };

  const handleAssignBillForAddress = async (data: BillForAddressFormData) => {
    if (!estateId) return;

    try {
      const billId =
        selectedAssignedBill?.billId || selectedAssignedBill?.id;

      if (billId) {
        await dispatch(
          updateBillForAddress({
            billId,
            data: {
              name: data.name,
              description: data.description,
              amount: data.amount,
              frequency: "oneoff",
              compulsory: data.compulsory,
              accrueInterest: data.accrueInterest,
              interestRatePercent: data.interestRatePercent,
              interestStartsAt: data.interestStartsAt,
            },
          }),
        ).unwrap();
        toast.success("Assigned bill updated successfully.");
      } else {
        await dispatch(
          createBillForAddress({
            addressId: data.addressId,
            estateId,
            name: data.name,
            description: data.description,
            amount: data.amount,
            frequency: "oneoff",
            compulsory: data.compulsory,
            accrueInterest: data.accrueInterest,
            interestRatePercent: data.interestRatePercent,
            interestStartsAt: data.interestStartsAt,
          }),
        ).unwrap();
        toast.success("Bill created for address successfully.");
      }

      closeAssignModal();

      setAssignedAddressId(data.addressId);
      setActiveTab("assigned");
      await fetchAssignedBills(data.addressId, estateId, {
        startDate: assignedStartDate,
        endDate: assignedEndDate,
      });
    } catch (err: unknown) {
      const message = getApiErrorMessage(err);
      if (message) toast.error(message);
    }
  };

  const columns: {
    key: string;
    header: string;
    render?: (item: BillData) => React.ReactNode;
  }[] = [
    {
      key: "createdAt",
      header: "Created At",
      render: (item: BillData) =>
        new Date(item.createdAt as string | number | Date).toLocaleDateString(
          "en-GB",
          {
            day: "2-digit",
            month: "short",
            year: "numeric",
          },
        ),
    },
    { key: "name", header: "Bill Name" },
    { key: "description", header: "Description" },
    {
      key: "yearlyAmount",
      header: "Amount (₦)",
      render: (item: BillData) =>
        formatAmountDisplay(item.amount ?? item.yearlyAmount),
    },
    {
      key: "frequency",
      header: "Frequency",
      render: (item: BillData) => formatFrequencyLabel(item.frequency),
    },
    {
      key: "compulsory",
      header: "Compulsory",
      render: (item: BillData) => <YesNoBadge value={item.compulsory} />,
    },
    ...(canAccrueInterest
      ? [
          {
            key: "accrueInterest",
            header: "Accrue Interest",
            render: (item: BillData) => (
              <YesNoBadge value={item.accrueInterest} />
            ),
          },
          {
            key: "interestRatePercent",
            header: "Interest Rate",
            render: (item: BillData) => formatInterestRate(item),
          },
          {
            key: "interestStartsAt",
            header: "Interest Starts",
            render: (item: BillData) => formatInterestStartsAt(item),
          },
        ]
      : []),
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
        </div>
      ),
    },
  ];

  const assignedColumns: {
    key: string;
    header: string;
    render?: (item: AssignedBillData) => React.ReactNode;
  }[] = [
    {
      key: "createdAt",
      header: "Created At",
      render: (item) =>
        item.createdAt
          ? new Date(item.createdAt).toLocaleDateString("en-GB", {
              day: "2-digit",
              month: "short",
              year: "numeric",
            })
          : "-",
    },
    {
      key: "billName",
      header: "Bill Name",
      render: (item) => item.billName || "-",
    },
    {
      key: "frequency",
      header: "Frequency",
      render: (item) => formatFrequencyLabel(item.frequency),
    },
    {
      key: "amountDue",
      header: "Amount Due (₦)",
      render: (item) =>
        formatAmountDisplay(
          Number(item.amountDue ?? item.amount ?? item.amountPaid ?? 0),
        ),
    },
    {
      key: "compulsory",
      header: "Compulsory",
      render: (item) => <YesNoBadge value={item.compulsory} />,
    },
    ...(canAccrueInterest
      ? [
          {
            key: "accrueInterest",
            header: "Accrue Interest",
            render: (item: AssignedBillData) => (
              <YesNoBadge value={item.accrueInterest} />
            ),
          },
          {
            key: "interestRatePercent",
            header: "Interest Rate",
            render: (item: AssignedBillData) => formatInterestRate(item),
          },
          {
            key: "interestStartsAt",
            header: "Interest Starts",
            render: (item: AssignedBillData) => formatInterestStartsAt(item),
          },
        ]
      : []),
    {
      key: "status",
      header: "Status",
      render: (item) => {
        const active = isAssignedBillActive(item);
        return (
          <span
            className={`px-3 py-1 rounded-full text-xs font-semibold capitalize ${
              active
                ? "bg-green-100 text-green-700"
                : "bg-red-100 text-red-700"
            }`}
          >
            {item.status || "-"}
          </span>
        );
      },
    },
    {
      key: "actions",
      header: "Actions",
      render: (item) => {
        const actionId = getAssignedBillActionId(item);
        const name = item.billName || "Bill";

        return (
          <div className="flex items-center gap-2">
            <Button
              className="cursor-pointer"
              variant="ghost"
              size="sm"
              onClick={() => openEditAssignedModal(item)}
              title="Edit bill"
              disabled={!actionId}
            >
              <Edit2 className="w-4 h-4 text-blue-600" />
            </Button>
            <Button
              className="cursor-pointer"
              variant="ghost"
              size="sm"
              onClick={() => handleDeleteBill(actionId, name)}
              disabled={!actionId}
            >
              <Trash2 className="w-4 h-4 text-red-600" />
            </Button>
          </div>
        );
      },
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

  return (
    <div className="relative">
      {loading && <Loader fullScreen label="Loading bills..." />}

      <div
        className={[
          "space-y-6",
          loading ? "pointer-events-none select-none" : "",
        ].join(" ")}
      >
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h1 className="font-heading text-3xl font-bold">
              Bills Management
            </h1>
            <p className="text-muted-foreground mt-1">
              Create, track, and manage estate bills in{" "}
              <span className="text-[18px] font-bold underline uppercase text-black">
                {estateName}
              </span>
              .
            </p>
          </div>
          <DropdownMenu.Root>
            <DropdownMenu.Trigger asChild>
              <Button className="flex items-center gap-2 cursor-pointer">
                <Plus className="w-4 h-4" />
                Add Bill
                <ChevronDown className="w-4 h-4" />
              </Button>
            </DropdownMenu.Trigger>
            <DropdownMenu.Portal>
              <DropdownMenu.Content
                align="end"
                sideOffset={8}
                className="z-50 min-w-[180px] rounded-md border bg-white p-1 shadow-md"
              >
                <DropdownMenu.Item
                  onSelect={() => handleOpenModal()}
                  className="cursor-pointer select-none rounded px-3 py-2 text-sm outline-none hover:bg-gray-100 focus:bg-gray-100 flex items-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  Create Bill
                </DropdownMenu.Item>
                <DropdownMenu.Item
                  onSelect={() => openAssignModal()}
                  className="cursor-pointer select-none rounded px-3 py-2 text-sm outline-none hover:bg-gray-100 focus:bg-gray-100 flex items-center gap-2"
                >
                  <ScrollText className="w-4 h-4" />
                  Assign Bill
                </DropdownMenu.Item>
              </DropdownMenu.Content>
            </DropdownMenu.Portal>
          </DropdownMenu.Root>
        </div>

        <div className="grid grid-cols-1 gap-4 max-w-sm">
          <Card className="p-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Bills</p>
                <p className="font-heading text-2xl font-bold mt-2">
                  {pagination?.total ?? 0}
                </p>
              </div>
              <div className="p-3 rounded-lg bg-[#D0DFF280]">
                <ScrollText className="w-6 h-6" />
              </div>
            </div>
          </Card>
        </div>

        <div className="flex gap-1 overflow-x-auto border-b border-border">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={[
                "px-4 py-2.5 text-sm font-medium whitespace-nowrap border-b-2 transition-colors cursor-pointer",
                activeTab === tab.id
                  ? "border-primary text-primary"
                  : "border-transparent text-muted-foreground hover:text-foreground",
              ].join(" ")}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {activeTab === "bills" ? (
          <Card className="p-4">
            <div className="mb-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
              <Input
                type="text"
                placeholder="Search bills by name or description..."
                value={billSearch}
                onChange={(e) => setBillSearch(e.target.value)}
                className="w-full sm:w-80"
              />
            </div>

            <Table
              columns={columns}
              data={filteredBills}
              emptyMessage="No bills found."
              enableDateRangeFilter
              defaultDateRangeDays={0}
              startDate={billsStartDate}
              endDate={billsEndDate}
              onDateRangeChange={({ startDate, endDate }) => {
                setBillsStartDate(startDate);
                setBillsEndDate(endDate);
              }}
              showPagination
              paginationInfo={{
                total: pagination?.total || 0,
                current: Number(pagination?.page) || 1,
                pageSize: Number(pagination?.limit) || 10,
              }}
              onPageChange={(page) => {
                if (!estateId) return;
                const shouldApplyDate = Boolean(billsStartDate && billsEndDate);
                dispatch(
                  getBillsByEstate({
                    estateId,
                    page,
                    limit: 10,
                    startDate: shouldApplyDate ? billsStartDate : undefined,
                    endDate: shouldApplyDate ? billsEndDate : undefined,
                  }),
                )
                  .unwrap()
                  .catch((err: unknown) => {
                    const message = getApiErrorMessage(err);
                    if (message) toast.error(message);
                  });
              }}
              enableExport
              exportFileName="bills"
              onExportRequest={
                estateId
                  ? async () => {
                      const shouldApplyDate = Boolean(
                        billsStartDate && billsEndDate,
                      );
                      const res = await dispatch(
                        getBillsByEstate({
                          estateId,
                          page: 1,
                          limit: 50000,
                          startDate: shouldApplyDate
                            ? billsStartDate
                            : undefined,
                          endDate: shouldApplyDate ? billsEndDate : undefined,
                        }),
                      ).unwrap();
                      return res?.data ?? [];
                    }
                  : undefined
              }
            />
          </Card>
        ) : (
          <Card className="p-4">
            <div className="mb-4 space-y-2 w-full lg:w-80">
              <Label htmlFor="assigned-address-filter">
                Filter by address
              </Label>
              <select
                id="assigned-address-filter"
                aria-label="Filter assigned bills by address"
                className="w-full border border-border rounded-md px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#0150AC]"
                value={assignedAddressId}
                onChange={(e) => setAssignedAddressId(e.target.value)}
                disabled={loadingAddresses || addressOptions.length === 0}
              >
                <option value="">Select address...</option>
                {addressOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
              {loadingAddresses && (
                <p className="text-xs text-muted-foreground">
                  Loading addresses...
                </p>
              )}
            </div>

            {!assignedAddressId ? (
              <p className="text-sm text-muted-foreground py-8 text-center">
                Select an address to view bills assigned to it.
              </p>
            ) : (
              <Table
                columns={assignedColumns}
                data={assignedBills}
                emptyMessage="No bills assigned to this address."
                enableDateRangeFilter
                defaultDateRangeDays={0}
                startDate={assignedStartDate}
                endDate={assignedEndDate}
                onDateRangeChange={({ startDate, endDate }) => {
                  setAssignedStartDate(startDate);
                  setAssignedEndDate(endDate);
                }}
                showPagination
                paginationInfo={{
                  total: assignedPagination?.total || 0,
                  current:
                    Number(assignedPagination?.page) ||
                    Number(assignedPagination?.currentPage) ||
                    1,
                  pageSize:
                    Number(assignedPagination?.limit) ||
                    Number(assignedPagination?.pageSize) ||
                    10,
                }}
                onPageChange={(page) => {
                  if (!estateId || !assignedAddressId) return;
                  fetchAssignedBills(assignedAddressId, estateId, {
                    page,
                    startDate: assignedStartDate,
                    endDate: assignedEndDate,
                  }).catch((err: unknown) => {
                    const message = getApiErrorMessage(err);
                    if (message) toast.error(message);
                  });
                }}
                enableExport
                exportFileName="assigned-bills"
                onExportRequest={
                  estateId && assignedAddressId
                    ? async () => {
                        const res = await dispatch(
                          getBillsForAddress({
                            addressId: assignedAddressId,
                            estateId,
                            page: 1,
                            limit: 50000,
                            startDate:
                              assignedStartDate && assignedEndDate
                                ? assignedStartDate
                                : undefined,
                            endDate:
                              assignedStartDate && assignedEndDate
                                ? assignedEndDate
                                : undefined,
                          }),
                        ).unwrap();
                        return res?.data ?? [];
                      }
                    : undefined
                }
              />
            )}
          </Card>
        )}

        {open && estateId && (
          <Modal visible={open} onClose={handleCloseModal}>
            <BillsForm
              estateId={estateId}
              initialData={selectedBill}
              onSubmit={handleSubmitBill}
            />
          </Modal>
        )}

        {assignModalOpen && estateId && (
          <Modal visible={assignModalOpen} onClose={closeAssignModal}>
            <BillForAddressForm
              estateId={estateId}
              initialData={selectedAssignedBill}
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

        <DeleteModal
          visible={!!billToDelete}
          onClose={() => setBillToDelete(null)}
          itemName={billToDelete?.name ?? "this bill"}
          title="Delete bill"
          onConfirm={handleConfirmDeleteBill}
          loading={deleteSubmitting}
        />
      </div>
    </div>
  );
}
