"use client";

import { useState } from "react";
import { useDispatch } from "react-redux";
import { AppDispatch } from "@/redux/store";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "react-toastify";
import axiosInstance from "@/utils/axiosInstance";

export default function VisitorVerificationForm() {
  const dispatch = useDispatch<AppDispatch>();

  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [visitorData, setVisitorData] = useState<any>(null);

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!code.trim()) {
      toast.warning("Please enter a verification code");
      return;
    }

    try {
      setLoading(true);

      const res = await axiosInstance.get(
        `/api/v1/visitor-mgt/view-details?code=${code}`
      );

      setVisitorData(res?.data?.data);
      toast.success("Visitor details retrieved!");
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Invalid visitor code");
      setVisitorData(null);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleVerify}
      className="p-40"
    >
      <CardHeader>
        <CardTitle className="text-lg font-semibold">
          Verify Visitor Access Code
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-6">
        <div className="border border-gray-200 p-4 rounded-lg space-y-4">
          <div>
            <Label>Enter Visitor Code</Label>
            <Input
              type="text"
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              placeholder="e.g. EZR-NKPI"
              required
            />
          </div>
        </div>

        <div className="pt-2">
          <Button className="w-full" type="submit" disabled={loading}>
            {loading ? "Checking..." : "Verify Code"}
          </Button>
        </div>

        {visitorData && (
          <div className="border border-gray-300 rounded-lg p-4 space-y-3 bg-gray-50">
            <h3 className="font-semibold text-gray-700">Visitor Details</h3>

            <p>
              <strong>Visitor Code:</strong>{" "}
              {visitorData.visitor?.visitorCode}
            </p>

            <p>
              <strong>Status:</strong>{" "}
              {visitorData.visitor?.isVerified ? (
                <span className="text-green-600 font-semibold">Verified</span>
              ) : (
                <span className="text-red-600 font-semibold">Not Verified</span>
              )}
            </p>

            <p>
              <strong>Created At:</strong>{" "}
              {new Date(visitorData.visitor?.createdAt).toLocaleString()}
            </p>

            <p>
              <strong>Resident ID:</strong> {visitorData.visitor?.residentId}
            </p>

            <div>
              <strong>Address:</strong>
              {visitorData.entries?.length === 0 ? (
                <p className="text-xs text-gray-500">No address found</p>
              ) : (
                visitorData.entries.map((entry: any, idx: number) => (
                  <div key={idx} className="text-sm">
                    {Object.entries(entry.data)
                      .map(([k, v]) => `${k}: ${v}`)
                      .join(", ")}
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </CardContent>
    </form>
  );
}
