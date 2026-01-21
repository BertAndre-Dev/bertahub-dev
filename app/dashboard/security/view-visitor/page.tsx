"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useDispatch } from "react-redux";
import { AppDispatch } from "@/redux/store";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { toast } from "react-toastify";
import { FaCopy } from "react-icons/fa";
import { getVisitorDetailsByCode } from "@/redux/slice/admin/visitor/visitor";

type VisitorDetails = {
  id?: string;
  visitorCode?: string;
  residentId?: {
    id?: string;
    firstName?: string;
    lastName?: string;
  };
  estateId?: {
    id?: string;
    name?: string;
  };
  addressId?: {
    id?: string;
    data?: {
      block?: string;
      apartment?: string;
    };
  };
  firstName?: string;
  lastName?: string;
  phone?: string;
  purpose?: string;
  isVerified?: boolean;
  createdAt?: string;
  viewedBy?: string;
};

const InfoRow = ({
  label,
  value,
}: {
  label: string;
  value: string | number | null | undefined;
}) => (
  <div className="flex flex-col gap-1 rounded-md border bg-muted/30 p-3">
    <span className="text-xs text-muted-foreground">{label}</span>
    <span className="text-sm font-medium wrap-break-word">
      {value || "-"}
    </span>
  </div>
);

export default function ViewVisitorPage() {
  const dispatch = useDispatch<AppDispatch>();
  const router = useRouter();

  const [code, setCode] = useState("");
  const [visitor, setVisitor] = useState<VisitorDetails | null>(null);
  const [loading, setLoading] = useState(false);

  const visitorFullName = useMemo(() => {
    if (!visitor) return "-";
    const first = visitor.firstName || "";
    const last = visitor.lastName || "";
    return `${first} ${last}`.trim() || "-";
  }, [visitor]);

  const residentFullName = useMemo(() => {
    if (!visitor?.residentId) return "-";
    const first = visitor.residentId.firstName || "";
    const last = visitor.residentId.lastName || "";
    return `${first} ${last}`.trim() || "-";
  }, [visitor]);

  const handleCopyCode = async () => {
    if (!visitor?.visitorCode) return;
    try {
      await navigator.clipboard.writeText(visitor.visitorCode);
      toast.success("Visitor code copied to clipboard!");
    } catch (error) {
      toast.error("Failed to copy visitor code");
    }
  };

  const handleView = async () => {
    if (!code.trim()) {
      toast.warning("Enter visitor code");
      return;
    }

    try {
      setLoading(true);

      const res: any = await dispatch(
        getVisitorDetailsByCode({ code })
      ).unwrap();

      setVisitor(res.data);
      toast.success(res.message || "Visitor details retrieved");
    } catch (error: any) {
      toast.error(error?.message || "Invalid visitor code");
      setVisitor(null);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-xl mx-auto p-6 space-y-6">
      <h2 className="text-lg font-semibold">View Visitor</h2>

      <Label>Visitor Code</Label>
      <Input
        value={code}
        onChange={(e) => setCode(e.target.value.toUpperCase())}
        placeholder="EZR-HP5O"
      />

      <Button
        className="w-full"
        onClick={handleView}
        disabled={loading}
      >
        {loading ? "Loading..." : "View Details"}
      </Button>

      {visitor && (
        <div className="space-y-4 rounded-lg border bg-card p-4 shadow-sm">
          <div className="flex items-center justify-between gap-3">
            <div className="flex-1">
              <p className="text-xs text-muted-foreground">Visitor Code</p>
              <div className="flex items-center gap-2">
                <p className="text-base font-semibold">{visitor.visitorCode}</p>
                <button
                  onClick={handleCopyCode}
                  className="text-blue-600 hover:text-blue-800 transition-colors cursor-pointer"
                  title="Copy Visitor Code"
                  type="button"
                >
                  <FaCopy size={10} />
                </button>
              </div>
            </div>
            <span
              className={`rounded-full px-3 py-1 text-xs font-semibold ${visitor.isVerified
                ? "bg-green-100 text-green-700"
                : "bg-amber-100 text-amber-700"
                }`}
            >
              {visitor.isVerified ? "Verified" : "Pending"}
            </span>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <InfoRow
              label="Created At"
              value={
                visitor.createdAt
                  ? new Date(visitor.createdAt).toLocaleString()
                  : "-"
              }
            />
            <InfoRow label="Visitor Name" value={visitorFullName} />
            <InfoRow label="Phone" value={visitor.phone} />
            <InfoRow label="Purpose" value={visitor.purpose} />
            <InfoRow label="Resident" value={residentFullName} />
            <InfoRow label="Estate" value={visitor.estateId?.name} />
            <InfoRow
              label="Address"
              value={
                visitor.addressId?.data
                  ? `${visitor.addressId.data.block || "-"} ${visitor.addressId.data.apartment || ""
                    }`.trim()
                  : "-"
              }
            />
            <InfoRow label="Viewed By" value={residentFullName} />
          </div>


        </div>
      )}
    </div>
  );
}
