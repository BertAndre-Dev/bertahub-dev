"use client";

import { Card } from "@/components/ui/card";
import { useDispatch, useSelector } from "react-redux";
import { RootState, AppDispatch } from "@/redux/store";
import { useEffect, useState } from "react";
import { getSignedInUser } from "@/redux/slice/auth-mgt/auth-mgt";
import { getEstateBills } from "@/redux/slice/estate-admin/estate-bills/estate-bills";
import Table from "@/components/tables/list/page";
import type { EstateBillItem } from "@/redux/slice/estate-admin/estate-bills/estate-bills-slice";
import { toast } from "react-toastify";

export default function EstateBillsPage() {
  const dispatch = useDispatch<AppDispatch>();
  const [estateId, setEstateId] = useState<string | null>(null);
  const limit = 10;

  const bills = useSelector(
    (state: RootState) =>
      (state as any).estateAdminEstateBills?.estateBills?.data ?? []
  );
  const totals = useSelector(
    (state: RootState) =>
      (state as any).estateAdminEstateBills?.estateBills?.totals
  );
  const pagination = useSelector(
    (state: RootState) =>
      (state as any).estateAdminEstateBills?.estateBills?.pagination
  );
  const loading =
    useSelector(
      (state: RootState) =>
        (state as any).estateAdminEstateBills?.getEstateBillsState
    ) === "isLoading";

  useEffect(() => {
    (async () => {
      try {
        const userRes = await dispatch(getSignedInUser()).unwrap();
        const estateIdFromUser =
          userRes?.data?.estateId ?? userRes?.data?.estate?.id;

        if (!estateIdFromUser) {
          toast.warning("No estate found for this user.");
          return;
        }

        setEstateId(estateIdFromUser);

        await dispatch(
          getEstateBills({
            estateId: estateIdFromUser,
            page: 1,
            limit,
          })
        ).unwrap();
      } catch (err: any) {
        toast.error(err?.message ?? "Failed to load estate bills.");
      }
    })();
  }, [dispatch]);

  const handlePageChange = async (newPage: number) => {
    if (!estateId) return;
    try {
      await dispatch(
        getEstateBills({ estateId, page: newPage, limit })
      ).unwrap();
    } catch (err: any) {
      toast.error(err?.message ?? "Failed to load estate bills.");
    }
  };

  const pag = pagination ?? {};
  const total = typeof pag.total === "number" ? pag.total : Number(pag.total) || 0;
  const pageNum = typeof pag.page === "number" ? pag.page : Number(pag.page) || 1;
  const pageSize = typeof pag.limit === "number" ? pag.limit : Number(pag.limit) || limit;

  const columns = [
    {
      key: "createdAt",
      header: "Date",
      render: (item: EstateBillItem) =>
        item.createdAt
          ? new Date(item.createdAt).toLocaleString("en-NG", {
              year: "numeric",
              month: "short",
              day: "2-digit",
            })
          : "—",
    },
    {
      key: "nextDueDate",
      header: "Next Due",
      render: (item: EstateBillItem) =>
        item.nextDueDate
          ? new Date(item.nextDueDate).toLocaleDateString("en-NG", {
              year: "numeric",
              month: "short",
              day: "2-digit",
            })
          : "—",
    },
    {
      key: "user",
      header: "Resident",
      render: (item: EstateBillItem) =>
        item.user
          ? `${item.user.firstName} ${item.user.lastName}`.trim() || item.user.email
          : "—",
    },
    {
      key: "bill",
      header: "Bill",
      render: (item: EstateBillItem) => item.bill?.name ?? "—",
    },
    {
      key: "amountPaid",
      header: "Amount Paid (₦)",
      render: (item: EstateBillItem) =>
        typeof item.amountPaid === "number"
          ? Number(item.amountPaid).toLocaleString()
          : "—",
    },
    {
      key: "frequency",
      header: "Frequency",
      render: (item: EstateBillItem) => item.frequency ?? "—",
    },
    {
      key: "status",
      header: "Status",
      render: (item: EstateBillItem) => (
        <span
          className={
            item.status === "active"
              ? "text-green-600 font-medium"
              : "text-muted-foreground"
          }
        >
          {item.status ?? "—"}
        </span>
      ),
    },
  ];

  const totalRecords = totals?.totalRecords ?? 0;
  const totalAmountPaid = totals?.totalAmountPaid ?? 0;

  return (
    <div className="space-y-6">
      <Card className="p-6 shadow-md">
        <h1 className="font-heading text-3xl font-bold">Estate Bills</h1>
        <p className="text-muted-foreground mt-1">
          All bills paid by residents in this estate.
        </p>
        <div className="mt-4 flex flex-wrap gap-6">
          <div>
            <p className="text-sm text-muted-foreground">Total Records</p>
            <p className="text-xl font-semibold">{totalRecords.toLocaleString()}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Total Amount Paid</p>
            <p className="text-xl font-semibold">
              ₦{totalAmountPaid.toLocaleString()}
            </p>
          </div>
        </div>
      </Card>

      <Card className="p-4">
        <h2 className="font-semibold mb-4">Resident Bills</h2>
        <Table<EstateBillItem>
          columns={columns}
          data={bills}
          emptyMessage={
            loading ? "Loading estate bills..." : "No paid bills found."
          }
          showPagination
          paginationInfo={{
            total,
            current: pageNum,
            pageSize,
          }}
          onPageChange={handlePageChange}
        />
      </Card>
    </div>
  );
}
