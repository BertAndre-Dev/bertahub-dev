'use client';

import { Card } from "@/components/ui/card";
import Table from "@/components/tables/list/page";
import { toast } from "react-toastify";
import { RootState, AppDispatch } from "@/redux/store";
import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { getVisitorsByEstate, verifyVisitor } from "@/redux/slice/admin/visitor/visitor";
import { getSignedInUser } from "@/redux/slice/auth-mgt/auth-mgt";
import { CheckCircle, ShieldCheck } from "lucide-react";


export default function AdminVisitorManagement() {
  const dispatch = useDispatch<AppDispatch>();
  const [estateId, setEstateId] = useState<string | null>(null);

  const { visitors, pagination, loading } = useSelector((state: RootState) => {
    const visitorState = state.visitor;

    const defaultPagination = {
      total: 0,
      page: 1,
      limit: 10,
      pages: 1,
    };

    return {
      visitors: visitorState?.allVisitors?.data || [],
      pagination: visitorState?.allVisitors?.pagination || defaultPagination,
      loading: visitorState.getVisitorsByEstateState === "isLoading",
    };
  });

  // Fetch user + visitors
  useEffect(() => {
    (async () => {
      try {
        const userRes = await dispatch(getSignedInUser()).unwrap();
        const foundEstateId = userRes?.data?.estateId;

        if (!foundEstateId) {
          toast.warning("No estate found for this user");
          return;
        }

        setEstateId(foundEstateId);

        await dispatch(
          getVisitorsByEstate({ estateId: foundEstateId, page: 1, limit: 10 })
        ).unwrap();

      } catch (error: any) {
        toast.error(error?.message);
      }
    })();
  }, [dispatch]);

  // Pagination handler
  const handlePageChange = async (page: number) => {
    if (!estateId) return;

    try {
      await dispatch(
        getVisitorsByEstate({
          estateId,
          page,
          limit: pagination.limit
        })
      ).unwrap();
    } catch {
      toast.error("Failed to change page");
    }
  };


  const handleVerify = async (visitorCode: string) => {
        try {
            const res = await dispatch(verifyVisitor({ visitorCode })).unwrap();

            toast.success(res.message);

            // Refresh visitor list
            if (estateId) {
            await dispatch(
                getVisitorsByEstate({
                estateId,
                page: pagination.page,
                limit: pagination.limit,
                })
            );
            }
        } catch (error: any) {
            toast.error(error?.message);
        }
    };


  const columns = [
        {
            header: "Created At",
            key: "createdAt",
            render: (item: any) =>
            new Date(item.createdAt).toLocaleString(),
        },
        {
            header: "Visitor Code",
            key: "visitorCode",
            render: (item: any) => item.visitorCode,
        },
        {
            header: "Status",
            key: "isVerified",
            render: (item: any) => (
            <span
                className={`px-2 py-1 rounded text-xs ${
                item.isVerified
                    ? "bg-green-100 text-green-700"
                    : "bg-red-100 text-red-700"
                }`}
            >
                {item.isVerified ? "Verified" : "Not Verified"}
            </span>
            ),
        },
        {
            header: "Viewed By",
            key: "viewedBy",
            render: (item: any) => {
            if (!item.viewedBy) {
                return <span className="text-gray-500 text-xs">Not viewed</span>;
            }
            return (
                <span className="text-xs">
                {item.viewedBy.firstName} {item.viewedBy.lastName}
                </span>
            );
            },
        },
        {
            header: "Verified By",
            key: "verifiedBy",
            render: (item: any) => {
            if (!item.verifiedBy) {
                return <span className="text-gray-500 text-xs">Not verified</span>;
            }
            return (
                <span className="text-xs">
                {item.verifiedBy.firstName} {item.verifiedBy.lastName}
                </span>
            );
            },
        },
        {
            header: "Address",
            key: "entries",
            render: (item: any) => {
            if (!item.entries?.length)
                return <span className="text-gray-500 text-xs">No entries</span>;

            return item.entries.map((entry: any, index: number) => (
                <div key={index} className="text-xs">
                {Object.entries(entry.data)
                    .map(([key, value]) => `${key}: ${value}`)
                    .join(", ")}
                </div>
            ));
            },
        },


        {
            header: "Verify",
            key: "verify",
            render: (item: any) => {
            if (item.isVerified) {
                return (
                <CheckCircle className="w-5 h-5 text-green-500 opacity-70" />
                );
            }

            return (
                <button
                onClick={() => handleVerify(item.visitorCode)}
                className="text-blue-600 hover:text-blue-800"
                >
                <ShieldCheck className="w-5 h-5" />
                </button>
            );
            },
        },
    ];


  return (
    <div className="space-y-6">
      <h1 className="font-heading text-3xl font-bold">Visitor Management</h1>

      <Card className="p-4">
        <Table
          columns={columns}
          data={visitors}
          emptyMessage={loading ? "Loading visitors..." : "No visitors found."}
          showPagination
          paginationInfo={{
            total: pagination.total,
            current: pagination.page,
            pageSize: pagination.limit
          }}
          onPageChange={handlePageChange}
        />
      </Card>
    </div>
  );
}
