'use client';

import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Modal from "@/components/modal/page";
import { toast } from "react-toastify";
import { RootState, AppDispatch } from "@/redux/store";
import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { getMeterByAddress, reconnectMeter, disconnectMeter } from "@/redux/slice/resident/meter-mgt/meter-mgt";
import { getSignedInUser } from "@/redux/slice/auth-mgt/auth-mgt";
import VendPower from "@/components/resident/vend-power/page";

export default function ResidentMeter() {
  const dispatch = useDispatch<AppDispatch>();
  const [open, setOpen] = useState(false);
  const [addressId, setAddressId] = useState<string | null>(null);
  const [walletId, setWalletId] = useState<string | null>(null);

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
