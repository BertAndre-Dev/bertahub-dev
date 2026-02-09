"use client";

import { useEffect, useState } from "react";
import { useDispatch } from "react-redux";
import { AppDispatch } from "@/redux/store";
import { getBill } from "@/redux/slice/admin/bills-mgt/bills";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "react-toastify";

/** Form state: yearlyAmount can be string (empty input) or number */
interface BillFormState {
  estateId: string;
  name: string;
  description: string;
  yearlyAmount: number | string;
  id?: string;
}

/** Payload passed to onSubmit: yearlyAmount is always number */
export interface BillSubmitData {
  estateId: string;
  name: string;
  description: string;
  yearlyAmount: number;
  id?: string;
}

interface BillsFormProps {
  estateId: string;
  initialData?: BillSubmitData | null;
  onSubmit: (data: BillSubmitData) => void | Promise<void>;
}

export default function BillsForm({ estateId, initialData, onSubmit }: BillsFormProps) {
  const [formData, setFormData] = useState<BillFormState>({
    estateId,
    name: "",
    description: "",
    yearlyAmount: "",
  });
  const [loading, setLoading] = useState(false);
  const dispatch = useDispatch<AppDispatch>();

  // Fetch bill if editing
  useEffect(() => {
    const fetchExistingBill = async () => {
      if (!initialData?.id) return;

      try {
        setLoading(true);
        const res = await dispatch(getBill(initialData.id)).unwrap();
        const fetchData = res?.data;

        if (fetchData) {
          setFormData({
            estateId: estateId,
            id: fetchData.id,
            name: fetchData.name || "",
            description: fetchData.description || "",
            yearlyAmount: fetchData.yearlyAmount || 0,
          });
        }
      } catch (error: any) {
        toast.error(error?.message || "Failed to load bill");
      } finally {
        setLoading(false);
      }
    };

    fetchExistingBill();
  }, [dispatch, estateId, initialData]);

  const handleChange = (field: keyof BillFormState, value: string | number) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const payload: BillSubmitData = {
      ...formData,
      yearlyAmount: Number(formData.yearlyAmount) || 0,
    };
    onSubmit(payload);
  };

  return (
    <form onSubmit={handleSubmit}>
      <CardHeader>
        <CardTitle className="text-lg font-semibold">
          {initialData?.id ? "Update Estate Bill" : "Create Estate Bill"}
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-6">
        {loading ? (
          <p className="text-gray-500 italic">Loading...</p>
        ) : (
          <div className="border border-gray-200 p-4 rounded-lg space-y-4">
            <div>
              <Label>Name</Label>
              <Input
                type="text"
                value={formData.name}
                onChange={(e) => handleChange("name", e.target.value)}
                required
              />
            </div>

            <div>
              <Label>Description</Label>
              <Input
                type="text"
                value={formData.description}
                onChange={(e) => handleChange("description", e.target.value)}
                required
              />
            </div>

            <div>
              <Label>Yearly Amount</Label>
              <Input
                type="number"
                value={formData.yearlyAmount}
                onChange={(e) => handleChange("yearlyAmount", Number(e.target.value))}
                required
              />
            </div>
          </div>
        )}

        <div className="pt-6">
          <Button type="submit" className="w-full" disabled={!formData.name.trim()}>
            {initialData?.id ? "Update Bill" : "Create Bill"}
          </Button>
        </div>
      </CardContent>
    </form>
  );
}
