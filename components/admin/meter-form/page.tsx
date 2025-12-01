'use client';

import { useState, useEffect } from "react";
import { useDispatch } from "react-redux";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "react-toastify";
import { AppDispatch } from "@/redux/store";
import { Select } from "@/components/ui/select";
import { getSignedInUser } from "@/redux/slice/auth-mgt/auth-mgt";
import { getFieldByEstate } from "@/redux/slice/admin/address-mgt/fields/fields";
import { getEntriesByField } from "@/redux/slice/admin/address-mgt/entry/entry";
import { assignMeterToAddress } from "@/redux/slice/admin/meter-mgt/meter-mgt";


// ---------- Types ----------
type AssignMeterFormProps = {
  close: () => void;
  refresh: () => void;
  meterNumber: string; 
};

interface AssignMeterFormData {
  meterNumber: string;
  estateId: string;
  addressId: string;
}

interface SelectOption {
  label: string;
  value: string;
}

// ---------- Component ----------
const AssignMeterForm: React.FC<AssignMeterFormProps> = ({ close, refresh, meterNumber }) => {
  const dispatch = useDispatch<AppDispatch>();
  const [formData, setFormData] = useState<AssignMeterFormData>({
    meterNumber: meterNumber || "",
    estateId: "",
    addressId: "",
  });

  const [loading, setLoading] = useState(false);
  const [entryOptions, setEntryOptions] = useState<SelectOption[]>([]);

  // ---------------- Load estate, fields, and entries ----------------
  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);

        const userRes = await dispatch(getSignedInUser()).unwrap();
        const estateId = userRes?.data?.estateId;
        if (!estateId) {
          toast.error("No estate linked to this account");
          return;
        }

        setFormData((prev) => ({ ...prev, estateId, meterNumber }));

        const fieldsRes = await dispatch(getFieldByEstate(estateId)).unwrap();
        const fields = fieldsRes?.data || [];
        if (!fields.length) {
          toast.error("No address fields configured.");
          return;
        }

        const primaryFieldId = fields[0].id;
        const entryRes = await dispatch(
          getEntriesByField({ fieldId: primaryFieldId, page: 1, limit: 200 })
        ).unwrap();

        const entries = entryRes?.data || [];

        const options = entries.map((entry: any) => {
          const d = entry.data || {};
          const display = Object.entries(d)
            .map(([k, v]) => `${k}: ${v}`)
            .join(", ");

          return {
            label: display || "Unnamed Address",
            value: entry.id,
          };
        });

        setEntryOptions(options);
      } catch (error: any) {
        console.error(error);
        toast.error("Failed to load estate address entries.");
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [dispatch]);

  // ---------------- Submit handler ----------------
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.addressId) {
      toast.error("Please select an address");
      return;
    }

    setLoading(true);
    try {
      const res = await dispatch(assignMeterToAddress(formData)).unwrap();
      toast.success(res?.message || "Meter assigned successfully.");
      refresh();
      close();
    } catch (error: any) {
      console.error(error);
      toast.error(error?.message || "Failed to assign meter.");
    } finally {
      setLoading(false);
    }
  };

  // ---------------- Render ----------------
  return (
    <Card className="max-w-lg mx-auto mt-6">
      <CardHeader>
        <CardTitle className="text-lg font-semibold">Assign Meter</CardTitle>
      </CardHeader>

      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Address Dropdown */}
            <div>
                <Label>Address</Label>

                {loading ? (
                    <div className="border rounded-md px-3 py-2 text-sm text-gray-500 bg-gray-50">
                    Loading addresses...
                    </div>
                ) : (
                    <Select
                    options={entryOptions}
                    value={formData.addressId}
                    onChange={(e) =>
                        setFormData((prev) => ({ ...prev, addressId: e.target.value }))
                    }
                    />
                )}
            </div>
          {/* Submit Button */}
          <Button type="submit" disabled={loading} className="w-full">
            {loading ? "Assigning..." : "Assign Meter"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};

export default AssignMeterForm;
