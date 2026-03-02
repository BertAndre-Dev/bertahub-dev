"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { useDispatch } from "react-redux";
import { AppDispatch } from "@/redux/store";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { toast } from "react-toastify";
import { verifyVisitor } from "@/redux/slice/admin/visitor/visitor";
import { formatVisitorCode } from "@/lib/utils";
import { CheckCircle, XCircle } from "lucide-react";
import type { VisitorDetailsData } from "@/app/dashboard/security/types";

interface VerifyVisitorFormProps {
  visitorDetails?: VisitorDetailsData | null;
  initialCode?: string;
}

export default function VerifyVisitorForm({
  visitorDetails,
  initialCode: initialCodeProp,
}: VerifyVisitorFormProps = {}) {
  const dispatch = useDispatch<AppDispatch>();
  const searchParams = useSearchParams();

  const codeFromUrl = searchParams.get("code") ?? "";
  const initialCode = initialCodeProp ?? codeFromUrl;
  const [code, setCode] = useState(() => formatVisitorCode(initialCode));
  const [loading, setLoading] = useState(false);
  const [denyLoading, setDenyLoading] = useState(false);

  useEffect(() => {
    if (visitorDetails?.visitorCode) {
      setCode(formatVisitorCode(visitorDetails.visitorCode));
    }
  }, [visitorDetails?.visitorCode]);

  const handleVerify = async () => {
    if (!code.trim()) {
      toast.warning("Enter visitor code");
      return;
    }
    try {
      setLoading(true);
      const res = await dispatch(verifyVisitor({ visitorCode: code })).unwrap();
      toast.success(res.message ?? "Visitor verified");
    } catch (error: unknown) {
      toast.error((error as { message?: string })?.message ?? "Verification failed");
    } finally {
      setLoading(false);
    }
  };

  const visitorName = visitorDetails
    ? `${visitorDetails.firstName} ${visitorDetails.lastName}`.trim() || "—"
    : "—";
  const location = visitorDetails?.addressId?.data
    ? Object.values(visitorDetails.addressId.data).filter(Boolean).join(", ")
    : "—";
  const reasonForVisit = visitorDetails?.purpose ?? "—";
  const numberOfPeople = 1;

  return (
    <div className="w-full bg-white rounded-2xl shadow-sm border border-gray-100 p-4 mx-auto space-y-6">
      <div className="border-b border-[#D9D9D9] pb-4">
        <h2 className="text-2xl font-bold text-gray-900">Visitor Details</h2>
      </div>

      <div className="flex items-center gap-4">
        <div className="w-16 h-16 rounded-full bg-blue-100 border-[3px] border-blue-600 flex items-center justify-center shrink-0">
          <span className="text-blue-700 font-semibold text-lg">
            {visitorName
              .split(" ")
              .filter(Boolean)
              .map((n) => n[0])
              .join("")
              .slice(0, 2) || "—"}
          </span>
        </div>
        <div>
          <p className="text-xl font-bold text-gray-900">{visitorName}</p>
          <p className="text-gray-500 text-sm mt-0.5">{location}</p>
        </div>
      </div>

      <div className="space-y-1.5">
        <Label className="text-sm text-gray-600">Visitor Code</Label>
        <Input
          value={code}
          onChange={(e) => setCode(formatVisitorCode(e.target.value))}
          title="Visitor Code"
          placeholder="EZR-HP5O"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label className="text-sm text-gray-500">Reason for visit</Label>
          <div className="border border-gray-200 rounded-xl px-4 py-3 text-gray-700 bg-gray-50 text-sm">
            {reasonForVisit}
          </div>
        </div>
        <div className="space-y-1.5">
          <Label className="text-sm text-gray-500">Number of people</Label>
          <div className="border border-gray-200 rounded-xl px-4 py-3 text-gray-700 bg-gray-50 text-sm">
            {numberOfPeople}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 pt-2">
        <Button
          onClick={handleVerify}
          disabled={loading || denyLoading}
          className="w-full bg-[#0150AC] hover:bg-[#0150Ad] text-white rounded-xl py-6 text-base font-medium flex items-center justify-center gap-2"
        >
          <CheckCircle className="w-5 h-5" />
          {loading ? "Verifying..." : "Verify & Allow Access"}
        </Button>
        <Button
          disabled={loading || denyLoading}
          variant="destructive"
          className="w-full rounded-xl py-6 text-base font-medium flex items-center justify-center gap-2"
        >
          <XCircle className="w-5 h-5" />
          {denyLoading ? "Denying..." : "Deny Access"}
        </Button>
      </div>
    </div>
  );
}
