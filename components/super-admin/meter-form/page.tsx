'use client';

import { useState, useEffect } from "react";
import { useDispatch } from "react-redux";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "react-toastify";
import { AppDispatch } from "@/redux/store";
import { Select } from "@/components/ui/select";
import { getAllEstates } from "@/redux/slice/super-admin/super-admin-est-mgt/super-admin-est-mgt";
import { assignMeterToEstate } from "@/redux/slice/super-admin/super-admin-meter-mgt/super-admin-meter";

// ---------- Types ----------
type AssignMeterFormProps = {
  close: () => void;
  refresh: () => void;
};

interface AssignMeterFormData {
  meterNumber: string;
  estateId: string;
}

interface SelectOption {
  label: string;
  value: string;
}

// ---------- Component ----------
const AssignMeterForm: React.FC<AssignMeterFormProps> = ({ close, refresh }) => {
  const dispatch = useDispatch<AppDispatch>();
  const [formData, setFormData] = useState<AssignMeterFormData>({
    meterNumber: "",
    estateId: "",
  });

  const [loading, setLoading] = useState(false);
  const [estates, setEstates] = useState<SelectOption[]>([]);

  // ---------------- Load all estates ----------------
  useEffect(() => {
    const loadEstates = async () => {
      try {
        setLoading(true);
        const res = await  dispatch(getAllEstates({ page: 1, limit: 10 })).unwrap()


        if (res?.success && res.data) {
          const options = res.data.map((estate: any) => ({
            label: estate.name,
            value: estate.id,
          }));
          setEstates(options);
        } else {
          toast.error("No estates found.");
        }
      } catch (error: any) {
        console.error("Failed to fetch estates:", error);
        toast.error("Failed to load estates.");
      } finally {
        setLoading(false);
      }
    };

    loadEstates();
  }, [dispatch]);

  // ---------------- Submit handler ----------------
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.estateId) {
      toast.error("Please select an estate");
      return;
    }

    if (!formData.meterNumber) {
      toast.error("Please enter a meter number");
      return;
    }

    setLoading(true);
    try {
      // Convert meterNumber to string before saving (in case input returns number)
      const payload = {
        ...formData,
        meterNumber: String(formData.meterNumber),
      };
      const res = await dispatch(assignMeterToEstate(payload)).unwrap();
      toast.success(res?.message || "Meter assigned successfully.");
      refresh();
      close();
    } catch (error: any) {
      console.error(error);
      toast.error(error?.message);
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
        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Meter Number Field */}
          <div>
            <Label>Meter Number</Label>
            <Input
              type="number"
              placeholder="Enter meter number"
              value={formData.meterNumber}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, meterNumber: e.target.value }))
              }
              required
            />
          </div>
          {/* Estate Dropdown */}
          <div className="space-y-2">
            <Label>Assign to Estate</Label>
            {loading ? (
              <div className="border rounded-md px-3 py-2 text-sm text-gray-500 bg-gray-50">
                Loading estates...
              </div>
            ) : (
              <Select
                value={formData.estateId}
                onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
                  setFormData((prev) => ({ ...prev, estateId: e.target.value }))
                }
                options={[
                  { value: "", label: "Select an estate" }, // Placeholder option
                  ...estates,
                ]}
              />
            )}
          </div>


          {/* Submit Button */}
          <Button type="submit" disabled={loading || !formData.estateId || !formData.meterNumber} className="w-full">
            {loading ? "Assigning..." : "Assign Meter"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};

export default AssignMeterForm;
