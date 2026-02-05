"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { useDispatch } from "react-redux";
import { AppDispatch } from "@/redux/store";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { toast } from "react-toastify";
import { verifyVisitor } from "@/redux/slice/admin/visitor/visitor";
import { formatVisitorCode } from "@/lib/utils";

export default function VerifyVisitorPage() {
  const dispatch = useDispatch<AppDispatch>();
  const searchParams = useSearchParams();

  const initialCode = searchParams.get("code") || "";
  const [code, setCode] = useState(formatVisitorCode(initialCode));
  const [loading, setLoading] = useState(false);

  const handleVerify = async () => {
    if (!code.trim()) {
      toast.warning("Enter visitor code");
      return;
    }

    try {
      setLoading(true);

      const res: any = await dispatch(
        verifyVisitor({ visitorCode: code })
      ).unwrap();

      toast.success(res.message || "Visitor verified");
    } catch (error: any) {
      toast.error(error?.message || "Verification failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-xl mx-auto p-6 space-y-6">
      <h2 className="text-lg font-semibold">Verify Visitor</h2>

      <Label>Visitor Code</Label>
      <Input
        value={code}
        onChange={(e) => setCode(formatVisitorCode(e.target.value))}
        title="Visitor Code"
        placeholder="EZR-HP5O"
        // className="w-full"
      />

      <Button
        className="w-full"
        onClick={handleVerify}
        disabled={loading}
        title="Verify Visitor"
      >
        {loading ? "Verifying..." : "Verify Visitor"}
      </Button>
    </div>
  );
}
