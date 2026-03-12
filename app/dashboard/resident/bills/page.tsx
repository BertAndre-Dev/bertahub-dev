"use client";

import React, { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import Table from "@/components/tables/list/page";
import Modal from "@/components/modal/page";
import BillsForm from "@/components/resident/bill-form/page";
import SwitchAddress from "@/components/resident/switch-address/page";
import {
  getBillsByEstate,
  getResidentBills,
} from "@/redux/slice/resident/bill-mgt/bills-mgt";
import { getSignedInUser } from "@/redux/slice/auth-mgt/auth-mgt";
import { normalizeAddresses, type AddressOption } from "@/lib/address";
import { toast } from "react-toastify";
import { useDispatch } from "react-redux";
import { AppDispatch } from "@/redux/store";

interface BillData {
  id?: string;
  estateId?: string;
  name?: string;
  description?: string;
  yearlyAmount?: number;
  isActive?: boolean;
  createdAt?: string;
}

export default function BillPage() {
  const dispatch = useDispatch<AppDispatch>();
  const [open, setOpen] = useState(false);
  const [selectedBillId, setSelectedBillId] = useState<string | null>(null);

  // local copies of responses to avoid Redux state collision between two thunks
  const [payableBills, setPayableBills] = useState<BillData[]>([]);
  const [payablePagination, setPayablePagination] = useState<any>({});
  const [paidBills, setPaidBills] = useState<BillData[]>([]);
  const [paidPagination, setPaidPagination] = useState<any>({});
  const [loading, setLoading] = useState<boolean>(true);

  // signed in user meta
  const [userId, setUserId] = useState<string>("");
  const [estateId, setEstateId] = useState<string>("");
  const [addressOptions, setAddressOptions] = useState<AddressOption[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(null);

  // fetch user, addresses, payable bills (estate), and resident paid bills
  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const userRes = await dispatch(getSignedInUser()).unwrap();
        const user = userRes?.data as Record<string, unknown> | undefined;
        if (!user) {
          toast.warning("No signed in user found");
          setLoading(false);
          return;
        }
        const uId = (user.id ?? user._id ?? "") as string;

        const rawEstateId = user.estateId as
          | string
          | { id?: string; _id?: string }
          | undefined;
        const eId =
          typeof rawEstateId === "string"
            ? rawEstateId
            : rawEstateId?._id ||
              rawEstateId?.id ||
              ((user.estate as { id?: string } | undefined)?.id ?? "");
        const addresses = normalizeAddresses(user);
        const firstId = addresses.length > 0 ? addresses[0].id : null;

        setUserId(uId);
        setEstateId(eId);
        setAddressOptions(addresses);
        setSelectedAddressId((prev) => prev ?? firstId);

        if (!eId) {
          toast.warning("The signed-in user does not have an estate assigned.");
        } else {
          // get bills payable for estate
          const estateRes = await dispatch(
            getBillsByEstate({ estateId: eId, page: 1, limit: 10 }),
          ).unwrap();
          const estateData = estateRes?.data || [];
          setPayableBills(estateData);
          setPayablePagination(estateRes?.pagination || {});
        }

        // get bills already paid by resident
        const residentRes = await dispatch(
          getResidentBills({ residentId: uId, page: 1, limit: 10 }),
        ).unwrap();
        const residentData = residentRes?.data || [];
        setPaidBills(residentData);
        setPaidPagination(residentRes?.pagination || {});
      } catch (err: any) {
        toast.error(err?.message || "Failed to fetch bills or user info");
      } finally {
        setLoading(false);
      }
    })();
  }, [dispatch]);

  // Open modal for a particular bill
  const handleOpenModal = (billId: string) => {
    setSelectedBillId(billId);
    setOpen(true);
  };

  const handleCloseModal = () => {
    setSelectedBillId(null);
    setOpen(false);
  };

  // After paying, refresh both lists
  const refreshLists = async () => {
    if (!userId) return;
    try {
      if (estateId) {
        const estateRes = await dispatch(
          getBillsByEstate({ estateId, page: 1, limit: 50 }),
        ).unwrap();
        setPayableBills(estateRes?.data || []);
        setPayablePagination(estateRes?.pagination || {});
      }

      const residentRes = await dispatch(
        getResidentBills({ residentId: userId, page: 1, limit: 50 }),
      ).unwrap();
      setPaidBills(residentRes?.data || []);
      setPaidPagination(residentRes?.pagination || {});
    } catch (err: any) {
      // show non-blocking error
      console.error("Refresh lists failed:", err);
    }
  };

  // Table columns for paid bills
  const columns = [
    { key: "billName", header: "Bill Name" },
    { key: "frequency", header: "Frequency" },
    {
      key: "amountPaid",
      header: "Amount Paid",
      render: (item: any) =>
        `₦${Number(item.amountPaid ?? 0).toLocaleString()}`,
    },
    {
      key: "startDate",
      header: "Start Date",
      render: (item: any) =>
        item.startDate ? new Date(item.startDate).toLocaleString() : "-",
    },
    {
      key: "nextDueDate",
      header: "Next Due Date",
      render: (item: any) =>
        item.nextDueDate ? new Date(item.nextDueDate).toLocaleString() : "-",
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="font-heading text-3xl font-bold">Estate Bills</h1>
        <Button
          onClick={() =>
            toast.info("To pay a bill, click any payable bill card.")
          }
          className="flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          How to Pay
        </Button>
      </div>

      <SwitchAddress
        addresses={addressOptions}
        value={selectedAddressId}
        onChange={setSelectedAddressId}
      />

      {/* Payable bills - cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {loading ? (
          <p className="text-muted-foreground">Loading bills...</p>
        ) : payableBills.length === 0 ? (
          <p className="text-muted-foreground">
            No payable bills for this estate.
          </p>
        ) : (
          payableBills.map((b) => (
            <Card
              key={b.id}
              className="p-4 cursor-pointer hover:shadow-md"
              onClick={() => b.id && handleOpenModal(b.id)}
            >
              <div className="flex flex-col">
                <div>
                  <h3 className="text-sm font-semibold capitalize text-blue-600">
                    {b.name}
                  </h3>
                </div>
                <div className="">
                  <p className="text-md font-bold mt-1 capitalize">
                    ₦{Number(b.yearlyAmount ?? 0).toLocaleString()}/annum
                  </p>
                </div>
              </div>
            </Card>
          ))
        )}
      </div>

      {/* Paid bills table */}
      <Card className="p-4">
        <h2 className="font-semibold mb-4">Your Paid Bills</h2>
        <Table
          columns={columns}
          data={paidBills || []}
          emptyMessage={
            loading
              ? "Loading paid bills..."
              : "You haven't paid any bills yet."
          }
          showPagination
          paginationInfo={{
            total: paidPagination?.total || paidBills.length || 0,
            current: Number(paidPagination?.page) || 1,
            pageSize: Number(paidPagination?.limit) || 10,
          }}
          enableExport
          exportFileName="paid-bills"
          onExportRequest={
            userId
              ? async () => {
                  const res = await dispatch(
                    getResidentBills({ residentId: userId, page: 1, limit: 50000 }),
                  ).unwrap();
                  return res?.data ?? [];
                }
              : undefined
          }
        />
      </Card>

      {open && selectedBillId && (
        <Modal visible={open} onClose={handleCloseModal}>
          <BillsForm
            billId={selectedBillId}
            onSubmitSuccess={refreshLists}
            onClose={handleCloseModal}
          />
        </Modal>
      )}
    </div>
  );
}
