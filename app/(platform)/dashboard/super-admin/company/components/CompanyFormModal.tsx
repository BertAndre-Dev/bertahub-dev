"use client";

import { Button } from "@/components/ui/button";
import { CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Modal from "@/components/modal/page";
import { InvitePlanSelect } from "@/components/invite/InvitePlanSelect";
import type { CreateCompanyPayload } from "@/redux/slice/super-admin/company-mgt/company";

export function CompanyFormModal({
  open,
  onClose,
  mode,
  form,
  setForm,
  onSubmit,
}: {
  readonly open: boolean;
  readonly onClose: () => void;
  readonly mode: "create" | "update";
  readonly form: CreateCompanyPayload;
  readonly setForm: React.Dispatch<React.SetStateAction<CreateCompanyPayload>>;
  readonly onSubmit: (e: React.FormEvent) => void | Promise<void>;
}) {
  return (
    <Modal visible={open} onClose={onClose}>
      <form onSubmit={onSubmit}>
        <CardHeader>
          <CardTitle className="text-lg font-semibold pb-4">
            {mode === "update" ? "Update Company" : "Create Company"}
          </CardTitle>
        </CardHeader>

        <CardContent className="space-y-5">
          <div className="space-y-2">
            <Label htmlFor="name">Company Name</Label>
            <Input
              id="name"
              value={form.name}
              onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
              placeholder="e.g. Green Estate Corporations"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="address">Address</Label>
            <Input
              id="address"
              value={form.address}
              onChange={(e) => setForm((p) => ({ ...p, address: e.target.value }))}
              placeholder="e.g. 12356 Palm Avenue"
              required
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="city">City</Label>
              <Input
                id="city"
                value={form.city}
                onChange={(e) => setForm((p) => ({ ...p, city: e.target.value }))}
                placeholder="e.g. Lagos"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="state">State</Label>
              <Input
                id="state"
                value={form.state}
                onChange={(e) => setForm((p) => ({ ...p, state: e.target.value }))}
                placeholder="e.g. Lagos State"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="country">Country</Label>
            <Input
              id="country"
              value={form.country}
              onChange={(e) => setForm((p) => ({ ...p, country: e.target.value }))}
              placeholder="e.g. Nigeria"
              required
            />
          </div>

          <InvitePlanSelect
            value={form.plan}
            onChange={(plan) => setForm((prev) => ({ ...prev, plan }))}
            description="Assigns modules and vending/bill rates from this plan."
          />

          <div className="pt-2 flex gap-3">
            <Button type="submit" className="w-full cursor-pointer">
              {mode === "update" ? "Update" : "Create"}
            </Button>
          </div>
        </CardContent>
      </form>
    </Modal>
  );
}
