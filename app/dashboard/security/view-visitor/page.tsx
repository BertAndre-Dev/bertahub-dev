"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useDispatch } from "react-redux";
import { AppDispatch } from "@/redux/store";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { toast } from "react-toastify";
import { getVisitorDetailsByCode } from "@/redux/slice/admin/visitor/visitor";

export default function ViewVisitorPage() {
  const dispatch = useDispatch<AppDispatch>();
  const router = useRouter();

  const [code, setCode] = useState("");
  const [visitor, setVisitor] = useState<any>(null);
  const [loading, setLoading] = useState(false);

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
      toast.success("Visitor details retrieved");
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
        <div className="border rounded-lg p-4 space-y-2 bg-gray-50">
          <p><strong>Name:</strong> {visitor.firstName} {visitor.lastName}</p>
          <p><strong>Purpose:</strong> {visitor.purpose}</p>
          <p><strong>Status:</strong> Not Verified</p>

          <Button
            className="w-full mt-4"
            onClick={() =>
              router.push(`/visitor/verify?code=${visitor.visitorCode}`)
            }
          >
            Proceed to Verify
          </Button>
        </div>
      )}
    </div>
  );
}
