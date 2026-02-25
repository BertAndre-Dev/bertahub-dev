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
import { formatVisitorCode } from "@/lib/utils";

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

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="mx-auto bg-white rounded-lg p-6 space-y-6">
      <h2 className="text-xl sm:text-2xl font-semibold">Visitor Verification</h2>

      <div className="space-y-2">
        <Label>Visitor Code</Label>
        <div className="flex gap-2">
          <Input
            value={code}
            onChange={(e) => setCode(formatVisitorCode(e.target.value))}
            placeholder="EZR-HP5O"
            className="flex-1"
          />
          <Button onClick={handleView} disabled={loading} className="w-32">
            {loading ? "Loading..." : "Search"}
          </Button>
        </div>
      </div>

      {visitor && (
        <div className="border rounded-lg p-4 sm:p-6 space-y-5 bg-white shadow-sm">
          <div className="pb-4 border-b">
            <h3 className="text-lg font-semibold text-gray-900">
              Visitor Information
            </h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4">
            <div>
              <p className="text-xs sm:text-sm text-gray-500 mb-1">
                First Name
              </p>
              <p className="font-medium text-gray-900">{visitor.firstName}</p>
            </div>

            <div>
              <p className="text-xs sm:text-sm text-gray-500 mb-1">
                Last Name
              </p>
              <p className="font-medium text-gray-900">{visitor.lastName}</p>
            </div>

            <div>
              <p className="text-xs sm:text-sm text-gray-500 mb-1">
                Phone Number
              </p>
              <p className="font-medium text-gray-900">{visitor.phone}</p>
            </div>

            <div>
              <p className="text-xs sm:text-sm text-gray-500 mb-1">
                Visitor Code
              </p>
              <p className="font-medium text-blue-600">{formatVisitorCode(visitor.visitorCode)}</p>
            </div>

            <div>
              <p className="text-xs sm:text-sm text-gray-500 mb-1">
                Purpose of Visit
              </p>
              <p className="font-medium text-gray-900">{visitor.purpose}</p>
            </div>

            <div>
              <p className="text-xs sm:text-sm text-gray-500 mb-1">Status</p>
              <span
                className={`inline-block px-3 py-1 text-xs sm:text-sm font-medium rounded-full ${
                  visitor.isVerified
                    ? "bg-green-100 text-green-700"
                    : "bg-yellow-100 text-yellow-700"
                }`}
              >
                {visitor.isVerified ? "Verified" : "Not Verified"}
              </span>
            </div>

            <div>
              <p className="text-xs sm:text-sm text-gray-500 mb-1">Estate</p>
              <p className="font-medium text-gray-900">
                {visitor.estateId?.name || "N/A"}
              </p>
            </div>

            <div>
              <p className="text-xs sm:text-sm text-gray-500 mb-1">Address</p>
              <p className="font-medium text-gray-900">
                {visitor.addressId?.data?.block},{" "}
                {visitor.addressId?.data?.unit}
              </p>
            </div>

            <div>
              <p className="text-xs sm:text-sm text-gray-500 mb-1">
                Visiting Resident
              </p>
              <p className="font-medium text-gray-900">
                {visitor.residentId?.firstName} {visitor.residentId?.lastName}
              </p>
            </div>

            <div>
              <p className="text-xs sm:text-sm text-gray-500 mb-1">
                Created At
              </p>
              <p className="font-medium text-gray-900">
                {formatDate(visitor.createdAt)}
              </p>
            </div>

            {visitor.updatedAt !== visitor.createdAt && (
              <div className="sm:col-span-2">
                <p className="text-xs sm:text-sm text-gray-500 mb-1">
                  Last Updated
                </p>
                <p className="font-medium text-gray-900">
                  {formatDate(visitor.updatedAt)}
                </p>
              </div>
            )}
          </div>

          {/* Uncomment if you want the verify button */}
          {/* {!visitor.isVerified && (
            <div className="pt-4 border-t">
              <Button
                className="w-full"
                onClick={() =>
                  router.push(`/visitor/verify?code=${visitor.visitorCode}`)
                }
              >
                Proceed to Verify
              </Button>
            </div>
          )} */}
        </div>
      )}
    </div>
  );
}