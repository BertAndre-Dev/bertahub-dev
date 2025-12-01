"use client";

import { useState, useEffect } from "react";
import { useDispatch } from "react-redux";
import { AppDispatch } from "@/redux/store";
import { getField } from "@/redux/slice/admin/address-mgt/fields/fields";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "react-toastify";

interface FieldFormData {
  estateId: string;
  label: string;
  key: string;
  id?: string;
}

interface FieldFormProps {
  estateId: string;
  initialData?: { id?: string } | null;
  onSubmit: (data: FieldFormData) => void;
}

// ✅ Convert label to camelCase key
const toCamelCase = (str: string) =>
  str
    .replace(/[^a-zA-Z0-9 ]/g, "")
    .replace(/(?:^\w|[A-Z]|\b\w)/g, (word, index) =>
      index === 0 ? word.toLowerCase() : word.toUpperCase()
    )
    .replace(/\s+/g, "");

export default function FieldForm({
  estateId,
  initialData = null,
  onSubmit,
}: FieldFormProps) {
  const dispatch = useDispatch<AppDispatch>();

  const [formData, setFormData] = useState<FieldFormData>({
    estateId,
    label: "",
    key: "",
  });
  const [loading, setLoading] = useState(false);

  // ✅ Fetch existing field data if editing
  useEffect(() => {
    const fetchExistingField = async () => {
      if (!initialData?.id) return;

      try {
        setLoading(true);
        const res = await dispatch(getField(initialData.id)).unwrap();

        const fetchedData = res?.data;
        if (fetchedData) {
          setFormData({
            estateId: fetchedData.estateId || estateId,
            id: fetchedData.id,
            label: fetchedData.label || "",
            key: fetchedData.key || toCamelCase(fetchedData.label || ""),
          });
        }
      } catch (error: any) {
        toast.error(error.res?.data?.message)
      } finally {
        setLoading(false);
      }
    };

    if (initialData?.id) {
      fetchExistingField();
    } else {
      setFormData({
        estateId,
        label: "",
        key: "",
      });
    }
  }, [dispatch, estateId, initialData]);

  // ✅ Handle label input change and auto-generate key
  const handleLabelChange = (value: string) => {
    setFormData({
      ...formData,
      label: value,
      key: toCamelCase(value),
    });
  };

  // ✅ Submit the form
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.label.trim()) return;

    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit}>
      <CardHeader>
        <CardTitle className="text-lg font-semibold">
          {initialData?.id ? "Update Address Field" : "Create Address Field"}
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-6">
        {loading ? (
          <p className="text-gray-500 italic">Loading field...</p>
        ) : (
          <div className="border border-gray-200 p-4 rounded-lg space-y-4">
            <div>
              <Label>Label</Label>
              <Input
                type="text"
                value={formData.label}
                onChange={(e) => handleLabelChange(e.target.value)}
                placeholder="e.g. Block Name, Street, Flat Number"
                required
              />
            </div>
          </div>
        )}

        <div className="pt-6">
          <Button
            type="submit"
            className="w-full"
            disabled={!formData.label.trim()}
          >
            {initialData?.id ? "Update Field" : "Create Field"}
          </Button>
        </div>
      </CardContent>
    </form>
  );
}
