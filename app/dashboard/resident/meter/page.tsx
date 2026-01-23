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

export interface MeterVendHistoryResponse {
  success: boolean;
  message: string;
  data: EnergyListItem[];
}

export interface EnergyListItem {
  tt?: string;
  amount: string;
  krn?: string;
  sgc?: string;
  token?: string;
  taxRate: string;
  unit: string;
  at?: string;
  ti: string;
  price: string;
  receiptNo: string;
  taxAmount: string;
  tiDesc: string;
  device: string;
  value: string;
  createdAt: string;
}

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
        const foundAddressId: string | null = userRes?.data?.addressId ?? null;
        const foundWalletId: string | null = userRes?.data?.walletId ?? null;

        if (!foundAddressId) {
          toast.warning("No address attached to this meter.");
          return;
        }

        setAddressId(foundAddressId);
        setWalletId(foundWalletId);

        await dispatch(getMeterByAddress({ addressId: foundAddressId })).unwrap();
      } catch (error: any) {
        toast.error("Failed to fetch meter");
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
      toast.error("Failed to refresh meter");
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


  const vendColumns = [
    {
      key: "createdAt",
      header: "Date",
      render: (row: EnergyListItem & { transTime?: string }) => {
        if (!row.transTime) return "N/A";
        const date = new Date(row.transTime);
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
      key: "token",
      header: "Token",
      render: (row: EnergyListItem) => {
        if (!row.token) return "N/A";

        const handleCopyToken = async () => {
          try {
            await navigator.clipboard.writeText(row.token!);
            toast.success("Token copied to clipboard!");
          } catch (error) {
            toast.error("Failed to copy token");
          }
        };

        return (
          <div className="flex items-center gap-2">
            <span className="truncate max-w-[180px]">{row.token}</span>
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleCopyToken();
              }}
              className="text-blue-600 hover:text-blue-800 transition-colors cursor-pointer"
              title="Copy Token"
              type="button"
            >
              <FaCopy size={9} />
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
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Meter Balance</p>
              <p className="text-4xl font-bold mt-1">
                ₦{meter?.lastCredit?.toLocaleString() ?? 0}
              </p>
            </div>

            <div className="flex items-center gap-x-5">
              <Button onClick={handleOpenModal} size="lg" className="px-6">
                Buy Power
              </Button>

              <Button
                onClick={handleToggleMeter}
                size="lg"
                className="px-6 capitalize"
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
            total: pagination?.total || meterVendHistory.length || 0,
            current: Number(pagination?.page) || 1,
            pageSize: Number(pagination?.limit) || 10,
          }}
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
