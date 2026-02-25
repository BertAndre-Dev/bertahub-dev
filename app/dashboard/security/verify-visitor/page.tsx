// "use client";

// import { useState } from "react";
// import { useSearchParams } from "next/navigation";
// import { useDispatch } from "react-redux";
// import { AppDispatch } from "@/redux/store";
// import { Input } from "@/components/ui/input";
// import { Label } from "@/components/ui/label";
// import { Button } from "@/components/ui/button";
// import { toast } from "react-toastify";
// import { verifyVisitor } from "@/redux/slice/admin/visitor/visitor";
// import { formatVisitorCode } from "@/lib/utils";

// export default function VerifyVisitorPage() {
//   const dispatch = useDispatch<AppDispatch>();
//   const searchParams = useSearchParams();

//   const initialCode = searchParams.get("code") || "";
//   const [code, setCode] = useState(formatVisitorCode(initialCode));
//   const [loading, setLoading] = useState(false);

//   const handleVerify = async () => {
//     if (!code.trim()) {
//       toast.warning("Enter visitor code");
//       return;
//     }

//     try {
//       setLoading(true);

//       const res: any = await dispatch(
//         verifyVisitor({ visitorCode: code })
//       ).unwrap();

//       toast.success(res.message || "Visitor verified");
//     } catch (error: any) {
//       toast.error(error?.message || "Verification failed");
//     } finally {
//       setLoading(false);
//     }
//   };

//   return (
//     <div className="bg-white p-6 mx-auto space-y-6">
//         <h2 className="text-lg font-semibold border-b-2 border-[#D9D9D9] pb-2">Visitor Details</h2>

//       <Label>Visitor Code</Label>
//       <Input
//         value={code}
//         onChange={(e) => setCode(formatVisitorCode(e.target.value))}
//         title="Visitor Code"
//         placeholder="EZR-HP5O"
//         // className="w-full"
//       />

//       <Button
//         className="w-full"
//         onClick={handleVerify}
//         disabled={loading}
//         title="Verify Visitor"
//       >
//         {loading ? "Verifying..." : "Verify Visitor"}
//       </Button>
//     </div>
//   );
// }

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
import { CheckCircle, XCircle } from "lucide-react";

// Mock visitor data — replace with data from your Redux state or API response
const visitorData = {
  name: "Jane Doe",
  location: "Block A, Apartment J45",
  avatar: "/avatar-placeholder.jpg", // replace with actual avatar URL
  reasonForVisit: "Delivery",
  numberOfPeople: 3,
};

export default function VerifyVisitorPage() {
  const dispatch = useDispatch<AppDispatch>();
  const searchParams = useSearchParams();

  const initialCode = searchParams.get("code") || "";
  const [code, setCode] = useState(formatVisitorCode(initialCode));
  const [loading, setLoading] = useState(false);
  const [denyLoading, setDenyLoading] = useState(false);

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

  // const handleDeny = async () => {
  //   if (!code.trim()) {
  //     toast.warning("Enter visitor code");
  //     return;
  //   }

  //   try {
  //     setDenyLoading(true);
  //     const res: any = await dispatch(
  //       denyVisitor({ visitorCode: code })
  //     ).unwrap();
  //     toast.success(res.message || "Access denied");
  //   } catch (error: any) {
  //     toast.error(error?.message || "Action failed");
  //   } finally {
  //     setDenyLoading(false);
  //   }
  // };

  return (
    <div className="w-full bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mx-auto space-y-6">
      {/* Header */}
      <div className="border-b border-[#D9D9D9] pb-4">
        <h2 className="text-2xl font-bold text-gray-900">Visitor Details</h2>
      </div>

      {/* Visitor Identity */}
      <div className="flex items-center gap-4">
        <div className="w-16 h-16 rounded-full bg-blue-100 border-[3px] border-blue-600 flex items-center justify-center shrink-0">
          <span className="text-blue-700 font-semibold text-lg">
            {visitorData.name
              .split(" ")
              .map((n) => n[0])
              .join("")}
          </span>
        </div>
        <div>
          <p className="text-xl font-bold text-gray-900">{visitorData.name}</p>
          <p className="text-gray-500 text-sm mt-0.5">{visitorData.location}</p>
        </div>
      </div>

      {/* Visitor Code Input (existing) */}
      <div className="space-y-1.5">
        <Label className="text-sm text-gray-600">Visitor Code</Label>
        <Input
          value={code}
          onChange={(e) => setCode(formatVisitorCode(e.target.value))}
          title="Visitor Code"
          placeholder="EZR-HP5O"
        />
      </div>

      {/* Visit Details */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label className="text-sm text-gray-500">Reason for visit</Label>
          <div className="border border-gray-200 rounded-xl px-4 py-3 text-gray-700 bg-gray-50 text-sm">
            {visitorData.reasonForVisit}
          </div>
        </div>
        <div className="space-y-1.5">
          <Label className="text-sm text-gray-500">Number of people</Label>
          <div className="border border-gray-200 rounded-xl px-4 py-3 text-gray-700 bg-gray-50 text-sm">
            {visitorData.numberOfPeople}
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="grid grid-cols-2 gap-4 pt-2">
        <Button
          onClick={handleVerify}
          disabled={loading || denyLoading}
          className="w-full bg-blue-700 hover:bg-blue-800 text-white rounded-xl py-6 text-base font-medium flex items-center justify-center gap-2"
        >
          <CheckCircle className="w-5 h-5" />
          {loading ? "Verifying..." : "Verify & Allow Access"}
        </Button>

        <Button
          // onClick={handleDeny}
          disabled={loading || denyLoading}
          className="w-full bg-red-500 hover:bg-red-600 text-white rounded-xl py-6 text-base font-medium flex items-center justify-center gap-2"
        >
          <XCircle className="w-5 h-5" />
          {denyLoading ? "Denying..." : "Deny Access"}
        </Button>
      </div>
    </div>
  );
}