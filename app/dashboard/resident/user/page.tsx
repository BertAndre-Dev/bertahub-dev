"use client";

import { useState } from "react";
import { useSelector } from "react-redux";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import Modal from "@/components/modal/page";
import InviteTenantForm from "@/components/resident/invite-tenant-form/page";
import type { RootState } from "@/redux/store";

export default function ResidentUserPage() {
  const [open, setOpen] = useState(false);

  const inviteTenantState = useSelector(
    (state: RootState) => (state as any).residentInviteTenant,
  );
  const inviteStatus = inviteTenantState?.status ?? "idle";

  const handleOpenModal = () => setOpen(true);
  const handleCloseModal = () => setOpen(false);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-3xl font-bold">Invite Tenant</h1>
      </div>

      <div className="grid grid-cols-1 gap-4">
        <Card className="p-6">
          <div className="flex items-start justify-between">
            <div>
              <p className="font-heading text-2xl font-bold mt-2">
                Add tenants to your address(es)
              </p>
            </div>

            <Button
              onClick={handleOpenModal}
              className="flex items-center gap-2 shrink-0"
              disabled={inviteStatus === "isLoading"}
            >
              <Plus className="w-4 h-4" />
              Invite Tenant
            </Button>
          </div>
        </Card>
      </div>

      {open && (
        <Modal visible={open} onClose={handleCloseModal}>
          <InviteTenantForm close={handleCloseModal} />
        </Modal>
      )}
    </div>
  );
}
