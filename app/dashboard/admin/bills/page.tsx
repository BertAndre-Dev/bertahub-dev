"use client";

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Edit2, Trash2, ScrollText } from "lucide-react";
import Table from "@/components/tables/list/page";
import Modal from "@/components/modal/page";
import BillsForm, {
  type BillSubmitData,
} from "@/components/admin/bills-form/page";

import {
  activateBill,
  createBill,
  deleteBill,
  getBillsByEstate,
  suspendBill,
  updateBill,
} from "@/redux/slice/admin/bills-mgt/bills";
import { getSignedInUser } from "@/redux/slice/auth-mgt/auth-mgt";
import { toast } from "react-toastify";
import { useDispatch, useSelector } from "react-redux";
import { RootState, AppDispatch } from "@/redux/store";
import { useEffect, useState } from "react";
import { confirmDeleteToast } from "@/lib/confirm-delete-toast";

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

  const { allBills, pagination, loading } = useSelector((state: RootState) => {
    const billState = state.adminBill as any;
    return {
      allBills: billState?.allBills?.data || [],
      pagination: billState?.allBills?.pagination || {},
      loading:
        billState.getBillsByEstateState === "isLoading" ||
        billState.createBillState === "isLoading" ||
        billState.updateBillState === "isLoading" ||
        billState.deleteBillState === "isLoading",
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

  const handleOpenModal = (bill?: BillData) => {
    setSelectedBill(bill || null);
    setOpen(true);
  };

  const handleCloseModal = () => {
    setSelectedBill(null);
    setOpen(false);
  };

  const handleStatusToggle = async (bill: BillData) => {
    if (!bill.id || !estateId) return;

    try {
      if (bill.isActive) {
        await dispatch(suspendBill(bill.id)).unwrap();
        toast.info(`${bill.name} suspended.`);
      } else {
        await dispatch(activateBill(bill.id)).unwrap();
        toast.success(`${bill.name} activated.`);
      }

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

  const columns = [
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
          <Button
            className="cursor-pointer"
            variant="ghost"
            size="sm"
            onClick={() => handleStatusToggle(item)}
          >
            <span className="text-yellow-600 text-sm">
              {item.isActive ? "Suspend" : "Activate"}
            </span>
          </Button>
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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
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
        <Button
          onClick={() => handleOpenModal()}
          className="flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Create Bill
        </Button>
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
        <Table
          columns={columns}
          data={allBills || []}
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
    </div>
  );
}