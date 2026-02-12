"use client";

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Table from "@/components/tables/list/page";
import Modal from "@/components/modal/page";
import { toast } from "react-toastify";
import { RootState, AppDispatch } from "@/redux/store";
import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  getVisitorsByEstate,
  verifyVisitor,
} from "@/redux/slice/admin/visitor/visitor";
import { getSignedInUser } from "@/redux/slice/auth-mgt/auth-mgt";
import { CheckCircle, ShieldCheck, UserPlus } from "lucide-react";
import AdminVisitorForm from "@/components/admin/visitor-form/page";

export default function AdminVisitorManagement() {
  const dispatch = useDispatch<AppDispatch>();
  const [estateId, setEstateId] = useState<string | null>(null);
  const [addVisitorOpen, setAddVisitorOpen] = useState(false);

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
          getVisitorsByEstate({ estateId: foundEstateId, page: 1, limit: 10 }),
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
          limit: pagination.limit,
        }),
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
          }),
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
      render: (item: any) => new Date(item.createdAt).toLocaleString(),
    },
    {
      header: "Visitor Name",
      key: "visitorName",
      render: (item: any) => (
        <div className="text-sm">
          {item.firstName} {item.lastName}
        </div>
      ),
    },
    {
      header: "Phone",
      key: "phone",
      render: (item: any) => (
        <div className="text-sm">{item.phone || "N/A"}</div>
      ),
    },
    {
      header: "Visitor Code",
      key: "visitorCode",
      render: (item: any) => (
        <span className="font-mono text-sm font-semibold">
          {item.visitorCode}
        </span>
      ),
    },
    {
      header: "Purpose",
      key: "purpose",
      render: (item: any) => (
        <div className="text-sm capitalize">{item.purpose || "N/A"}</div>
      ),
    },
    {
      header: "Address",
      key: "address",
      render: (item: any) => {
        if (!item.addressId?.data) {
          return <span className="text-gray-500 text-xs">No address</span>;
        }

        const { block, unit } = item.addressId.data;
        return (
          <div className="text-xs">
            {block && unit ? `${block}, ${unit}` : "N/A"}
          </div>
        );
      },
    },
    {
      header: "Resident",
      key: "resident",
      render: (item: any) => {
        if (!item.residentId) {
          return <span className="text-gray-500 text-xs">N/A</span>;
        }
        return (
          <div className="text-sm">
            {item.residentId.firstName} {item.residentId.lastName}
          </div>
        );
      },
    },
    {
      header: "Viewed By",
      key: "viewedBy",
      render: (item: any) => {
        if (!item.viewedBy) {
          return <span className="text-gray-500 text-xs">Not viewed</span>;
        }
        return (
          <div className="text-sm">
            {item.viewedBy.firstName} {item.viewedBy.lastName}
          </div>
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
        return <div className="text-sm">{item.verifiedBy.firstName} {item.verifiedBy.lastName}</div>;
      },
    },
    {
      header: "Status",
      key: "isVerified",
      render: (item: any) => (
        <span
          className={`px-2 py-1 rounded text-xs font-medium ${
            item.isVerified
              ? "bg-green-100 text-green-700"
              : "bg-yellow-100 text-yellow-700"
          }`}
        >
          {item.isVerified ? "Verified" : "Pending"}
        </span>
      ),
    },
    {
      header: "Action",
      key: "verify",
      render: (item: any) => {
        if (item.isVerified) {
          return (
            <div className="flex items-center gap-1 text-green-600">
              <CheckCircle className="w-5 h-5" />
              <span className="text-xs">Verified</span>
            </div>
          );
        }

        return (
          <button
            onClick={() => handleVerify(item.visitorCode)}
            className="flex items-center gap-1 text-blue-600 hover:text-blue-800 transition-colors"
            title="Verify visitor"
          >
            <ShieldCheck className="w-5 h-5" />
            <span className="text-xs">Verify</span>
          </button>
        );
      },
    },
  ];

  const refreshVisitors = () => {
    if (estateId) {
      dispatch(
        getVisitorsByEstate({
          estateId,
          page: pagination.page,
          limit: pagination.limit,
        }),
      );
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <h1 className="font-heading text-3xl font-bold">Visitor Management</h1>
        <Button
          onClick={() => setAddVisitorOpen(true)}
          disabled={!estateId}
          className="gap-2"
        >
          <UserPlus className="w-4 h-4" />
          Add Visitor
        </Button>
      </div>

      <Modal visible={addVisitorOpen} onClose={() => setAddVisitorOpen(false)}>
        {estateId && (
          <AdminVisitorForm
            estateId={estateId}
            onSubmitSuccess={refreshVisitors}
            onClose={() => setAddVisitorOpen(false)}
          />
        )}
      </Modal>

      <Card className="p-4">
        <Table
          columns={columns}
          data={visitors}
          emptyMessage={loading ? "Loading visitors..." : "No visitors found."}
          showPagination
          paginationInfo={{
            total: pagination.total,
            current: pagination.page,
            pageSize: pagination.limit,
          }}
          onPageChange={handlePageChange}
        />
      </Card>
    </div>
  );
}
