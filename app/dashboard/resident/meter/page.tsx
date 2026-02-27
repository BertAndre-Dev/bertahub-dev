'use client';

import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { FaCopy } from "react-icons/fa";
import { Button } from "@/components/ui/button";
import Modal from "@/components/modal/page";
import { toast } from "react-toastify";
import { RootState, AppDispatch } from "@/redux/store";
import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { getMeterByAddress, reconnectMeter, disconnectMeter, getMeterVendHistory } from "@/redux/slice/resident/meter-mgt/meter-mgt";
import { getSignedInUser } from "@/redux/slice/auth-mgt/auth-mgt";
import VendPower from "@/components/resident/vend-power/page";
import Table from "@/components/tables/list/page";
import type { EnergyListItem } from "@/redux/slice/resident/meter-mgt/meter-mgt-slice";



export default function ResidentMeter() {
  const dispatch = useDispatch<AppDispatch>();
  const [open, setOpen] = useState(false);
  const [addressId, setAddressId] = useState<string | null>(null);
  const [walletId, setWalletId] = useState<string | null>(null);
  const { meterVendHistory, pagination, loading } = useSelector((state: RootState) => {
    const vendState = state.residentMeter as any
    const data = vendState.meterVendHistory?.data || []
    const pagination = vendState.meterVendHistory?.pagination || {}
    return {
      meterVendHistory: Array.isArray(data) ? data : [],
      pagination,
      loading: vendState.loading || false,
    }
  })

  const meter = useSelector((state: RootState) => state.residentMeter.residentMeter);

  useEffect(() => {
    (async () => {
      try {
        const userRes = await dispatch(getSignedInUser()).unwrap();
        const rawAddressId = userRes?.data?.addressId;
        // API may return addressId as object { id: string, data?: ... } or as string
        const foundAddressId: string | null =
          typeof rawAddressId === "string"
            ? rawAddressId
            : rawAddressId?.id ?? null;
        const foundWalletId: string | null = userRes?.data?.walletId ?? null;

        if (!foundAddressId) {
          toast.warning("No address attached to this meter.");
          return;
        }

        setAddressId(foundAddressId);
        setWalletId(foundWalletId);

        await dispatch(getMeterByAddress({ addressId: foundAddressId })).unwrap();
      } catch (error: any) {
        const message = error?.message ?? "Failed to fetch meter";
        toast.error(message);
      }
    })();
  }, [dispatch]);


  useEffect(() => {
    if (meter?.meterNumber) {
      dispatch(
        getMeterVendHistory({
          meterNumber: meter.meterNumber,
          page: 1,
          limit: 10,
        })
      );
    }
  }, [meter?.meterNumber]);


  const handleRefresh = async () => {
    if (!addressId) return;
    try {
      await dispatch(getMeterByAddress({ addressId })).unwrap();
    } catch (error: any) {
      const message = error?.message ?? "Failed to refresh meter";
      toast.error(message);
    }
  };

  const handleOpenModal = () => setOpen((prev) => !prev);

  const handleToggleMeter = async () => {
    if (!meter || !addressId) return;

    try {
      if (meter.isActive) {
        // Disconnect
        await dispatch(disconnectMeter({ meterNumber: meter.meterNumber })).unwrap();
        toast.success("Meter disconnected successfully");
      } else {
        // Reconnect
        await dispatch(reconnectMeter({ meterNumber: meter.meterNumber })).unwrap();
        toast.success("Meter reconnected successfully");
      }
      // Refresh meter data after toggling
      await handleRefresh();
    } catch (error: any) {
      toast.error("Failed to toggle meter status");
    }
  };


  const handleVendPageChange = (newPage: number) => {
    if (!meter?.meterNumber) return;
    dispatch(
      getMeterVendHistory({
        meterNumber: meter.meterNumber,
        page: newPage,
        limit: Number(pagination?.limit) || 10,
      })
    );
  };

  const vendColumns = [
    {
      key: "createdAt",
      header: "Date",
      render: (row: EnergyListItem) => {
        if (!row.createdAt) return "N/A";
        const date = new Date(row.createdAt);
        return date.toLocaleString("en-NG", {
          year: "numeric",
          month: "short",
          day: "2-digit",
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
        });
      },
    },
    {
      key: "amount",
      header: "Amount (₦)",
      render: (row: EnergyListItem) => Number(row.amount).toLocaleString(),
    },
    {
      key: "units",
      header: "Units Bought",
      render: (row: EnergyListItem) => `${row.value} ${row.unit}`,
    },
    {
      key: "receiptNo",
      header: "Receipt No",
      render: (row: EnergyListItem) => row.receiptNo ?? "—",
    },
    {
      key: "token",
      header: "Token",
      render: (row: EnergyListItem) => {
        if (!row.token) return "N/A";
        return (
          <div className="flex items-center gap-2">
            <span className="truncate max-w-[180px]">{row.token}</span>
            <button
              type="button"
              onClick={() => navigator.clipboard.writeText(row.token!)}
              className="text-blue-600 hover:text-blue-800"
              title="Copy Token"
            >
              <FaCopy size={14} />
            </button>
          </div>
        );
      },
    },
    {
      key: "price",
      header: "Price (₦/kWh)",
      render: (row: EnergyListItem) =>
        row.price ? Number(row.price).toLocaleString() : "N/A",
    },
    {
      key: "device",
      header: "Meter Number",
      render: (row: EnergyListItem) => row.device,
    },
  ];



  return (
    <div className="space-y-6">
      <Card className="p-6 shadow-md">
        <CardHeader>
          <CardTitle className="text-lg font-semibold">My Meter</CardTitle>
        </CardHeader>

        <CardContent>
          <div className="flex  items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Meter Balance</p>
              <p className="text-4xl font-bold mt-1">
                ₦{meter?.lastCredit?.toLocaleString() ?? 0}
              </p>
            </div>

            <div className="flex flex-col md:flex-row items-center gap-5">
              <Button onClick={handleOpenModal} size="lg" className="w-full md:w-auto px-6">
                Buy Power
              </Button>

              <Button 
                onClick={handleToggleMeter} 
                size="lg" 
                className="w-full md:w-auto px-6 capitalize"
                variant={meter?.isActive ? "destructive" : "default"}
              >
                {meter?.isActive ? "Disconnect Meter" : "Reconnect Meter"}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>


      <Card className="p-4">
          <h2 className="font-semibold mb-4">Vend History</h2>
          <Table
            columns={vendColumns}
            data={meterVendHistory || []}
            emptyMessage={
              loading ? "Loading Vend History..." : "No vend history available."
            }
            showPagination
            paginationInfo={{
              total: pagination?.total ?? meterVendHistory.length ?? 0,
              current: Number(pagination?.page) || 1,
              pageSize: Number(pagination?.limit) || 10,
            }}
            onPageChange={handleVendPageChange}
            enableExport
            exportFileName="meter-vend-history"
          />
        </Card>

      {open && meter && walletId && addressId && (
        <Modal visible={open} onClose={handleOpenModal}>
          <VendPower
            walletId={walletId}
            meterNumber={meter?.meterNumber ?? ""}
            onSubmitSuccess={handleRefresh}
            onClose={handleOpenModal}
          />
        </Modal>
      )}
    </div>
  );
}
