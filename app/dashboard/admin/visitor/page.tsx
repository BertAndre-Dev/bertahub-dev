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
  deleteVisitor,
} from "@/redux/slice/admin/visitor/visitor";
import { getSignedInUser } from "@/redux/slice/auth-mgt/auth-mgt";
import {
  CheckCircle,
  Eye,
  ShieldCheck,
  ShieldCheckIcon,
  Trash2,
  UserPlus,
  UserPlus2,
} from "lucide-react";
import AdminVisitorForm from "@/components/admin/visitor-form/page";
import DeleteModal from "@/components/resident/delete-modal/page";

export default function AdminVisitorManagement() {
  const dispatch = useDispatch<AppDispatch>();
  const [estateId, setEstateId] = useState<string | null>(null);
  const [estateName, setEstateName] = useState("Estate");
  const [addVisitorOpen, setAddVisitorOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [verifyModalVisitor, setVerifyModalVisitor] = useState<{
    visitorCode: string;
    firstName?: string;
    lastName?: string;
  } | null>(null);
  const [visitorToDelete, setVisitorToDelete] = useState<any | null>(null);

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

  // ✅ Client-side filtered visitors
  const filteredVisitors = visitors.filter((v: any) => {
    if (!search) return true;
    const fullName = `${v.firstName} ${v.lastName}`.toLowerCase();
    const code = v.visitorCode?.toLowerCase() || "";
    return (
      fullName.includes(search.toLowerCase()) ||
      code.includes(search.toLowerCase())
    );
  });

  // Fetch user + visitors
  useEffect(() => {
    (async () => {
      try {
        const userRes = await dispatch(getSignedInUser()).unwrap();
        const data = userRes?.data ?? (userRes as Record<string, unknown>);
        const rawEstateId = data?.estateId as
          | string
          | { id?: string; _id?: string }
          | undefined;
        const foundEstateId =
          typeof rawEstateId === "string"
            ? rawEstateId
            : rawEstateId?._id || rawEstateId?.id || "";

        const estateFromId =
          (data?.estateId as { name?: string } | undefined)?.name ?? "";
        const estateFromObj =
          (data?.estate as { name?: string } | undefined)?.name ?? "";
        const fallbackEstateName = (data?.estateName as string) ?? "";
        const name =
          estateFromId || estateFromObj || fallbackEstateName || "Estate";
        setEstateName(name);

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

  // Refetch visitors when date range changes (only apply when both are selected)
  useEffect(() => {
    if (!estateId) return;
    const shouldApplyDate = Boolean(startDate && endDate);
    dispatch(
      getVisitorsByEstate({
        estateId,
        page: 1,
        limit: pagination.limit,
        startDate: shouldApplyDate ? startDate : undefined,
        endDate: shouldApplyDate ? endDate : undefined,
      }),
    )
      .unwrap()
      .catch(() => toast.error("Failed to fetch visitors"));
  }, [dispatch, estateId, startDate, endDate, pagination.limit]);

  // Pagination handler
  const handlePageChange = async (page: number) => {
    if (!estateId) return;

    try {
      const shouldApplyDate = Boolean(startDate && endDate);
      await dispatch(
        getVisitorsByEstate({
          estateId,
          page,
          limit: pagination.limit,
          startDate: shouldApplyDate ? startDate : undefined,
          endDate: shouldApplyDate ? endDate : undefined,
        }),
      ).unwrap();
    } catch {
      toast.error("Failed to change page");
    }
  };

  const openVerifyModal = (item: any) => {
    if (item.isVerified) return;
    setVerifyModalVisitor({
      visitorCode: item.visitorCode,
      firstName: item.firstName,
      lastName: item.lastName,
    });
  };

  const handleVerifyConfirm = async () => {
    if (!verifyModalVisitor?.visitorCode) return;
    try {
      const res = await dispatch(
        verifyVisitor({ visitorCode: verifyModalVisitor.visitorCode }),
      ).unwrap();
      toast.success(res.message);
      setVerifyModalVisitor(null);
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

  const refreshVisitors = () => {
    if (estateId) {
      const shouldApplyDate = Boolean(startDate && endDate);
      dispatch(
        getVisitorsByEstate({
          estateId,
          page: pagination.page,
          limit: pagination.limit,
          startDate: shouldApplyDate ? startDate : undefined,
          endDate: shouldApplyDate ? endDate : undefined,
        }),
      );
    }
  };

  const handleOpenDeleteModal = (visitor: any, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setVisitorToDelete(visitor);
  };

  const handleCloseDeleteModal = () => setVisitorToDelete(null);

  const handleConfirmDelete = async () => {
    if (!visitorToDelete?.id) return;
    try {
      await dispatch(deleteVisitor(visitorToDelete.id)).unwrap();
      toast.success("Visitor deleted successfully.");
      setVisitorToDelete(null);
      refreshVisitors();
    } catch (err: any) {
      toast.error(err?.message || "Failed to delete visitor");
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
        const { block, unit, flat, apartment, street } = item.addressId.data as {
          block?: string;
          unit?: string;
          flat?: string;
          apartment?: string;
          street?: string;
        };
        const unitOrFlat = unit ?? flat ?? apartment;
        return (
          <div className="text-xs">
            {block && unitOrFlat
              ? `${block}, ${unitOrFlat}${street ? ` (${street})` : ""}`
              : "N/A"}
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
        return (
          <div className="text-sm">
            {item.verifiedBy.firstName} {item.verifiedBy.lastName}
          </div>
        );
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
      header: "Actions",
      key: "actions",
      render: (item: any) => (
        <div className="flex items-center gap-2">
          {item.isVerified ? (
            <div className="flex items-center gap-1 text-green-600">
              <CheckCircle className="w-5 h-5" />
              <span className="text-xs">Verified</span>
            </div>
          ) : (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => openVerifyModal(item)}
              className="flex items-center gap-1 text-blue-600 hover:text-blue-800 transition-colors cursor-pointer"
              title="Verify visitor"
            >
              <ShieldCheck className="w-5 h-5" />
              <span className="text-xs">Verify</span>
            </Button>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => handleOpenDeleteModal(item, e)}
            className="flex items-center gap-1 text-destructive hover:bg-destructive/10 cursor-pointer"
            title="Delete visitor"
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h1 className="font-heading text-3xl font-bold">
            Visitor Management
          </h1>
          <p className="text-muted-foreground mt-1">
            Welcome back! Here's is an overview on{" "}
            <span className="text-[18px] font-bold underline uppercase text-black">
              {estateName}
            </span>
            .
          </p>
        </div>
        <Button
          onClick={() => setAddVisitorOpen(true)}
          disabled={!estateId}
          className="gap-2"
        >
          <UserPlus className="w-4 h-4" />
          Add Visitor
        </Button>
      </div>

      {/* Stats Card */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {(() => {
          const stats = [
            {
              label: "Total Visitors",
              value: filteredVisitors?.length || 0,
              icon: UserPlus2,
              color: "bg-[#FEE6D480]",
            },
            {
              label: "Viewed Visitors",
              value:
                filteredVisitors?.filter((v: any) => v.viewedBy)?.length || 0,
              icon: Eye,
              color: "bg-[#CCE4DB80]",
            },
            {
              label: "Verified Visitors",
              value:
                filteredVisitors?.filter((v: any) => v.isVerified)?.length || 0,
              icon: ShieldCheckIcon,
              color: "bg-[#D0DFF280]",
            },
          ];

          return stats.map((stat, i) => {
            const Icon = stat.icon;
            return (
              <Card key={i} className="p-6">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">
                      {stat.label}
                    </p>
                    <p className="font-heading text-2xl font-bold mt-2">
                      {stat.value}
                    </p>
                  </div>
                  <div className={`p-3 rounded-lg ${stat.color}`}>
                    <Icon className="w-6 h-6" />
                  </div>
                </div>
              </Card>
            );
          });
        })()}
      </div>

      {/* Search */}
      <Card className="p-4">
        <input
          type="text"
          placeholder="Search visitor by name or visitor code"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full max-w-sm px-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary"
        />
      </Card>

      <Modal visible={addVisitorOpen} onClose={() => setAddVisitorOpen(false)}>
        {estateId && (
          <AdminVisitorForm
            estateId={estateId}
            onSubmitSuccess={refreshVisitors}
            onClose={() => setAddVisitorOpen(false)}
          />
        )}
      </Modal>

      {/* Verify visitor confirmation modal */}
      <Modal
        visible={!!verifyModalVisitor}
        onClose={() => setVerifyModalVisitor(null)}
      >
        <div className="p-4 space-y-4">
          <h2 className="font-heading text-xl font-bold">Verify visitor</h2>
          <p className="text-sm text-muted-foreground">
            Are you sure you want to verify{" "}
            <strong>
              {verifyModalVisitor
                ? `${verifyModalVisitor.firstName ?? ""} ${verifyModalVisitor.lastName ?? ""}`.trim() ||
                  verifyModalVisitor.visitorCode
                : "this visitor"}
            </strong>
            ?
          </p>
          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => setVerifyModalVisitor(null)}
              className="cursor-pointer"
            >
              Cancel
            </Button>
            <Button
              onClick={handleVerifyConfirm}
              className="cursor-pointer gap-1"
            >
              <ShieldCheck className="w-4 h-4" />
              Verify
            </Button>
          </div>
        </div>
      </Modal>

      <DeleteModal
        visible={!!visitorToDelete}
        onClose={handleCloseDeleteModal}
        itemName={
          visitorToDelete
            ? `${visitorToDelete.firstName || ""} ${
                visitorToDelete.lastName || ""
              }`.trim() || visitorToDelete.visitorCode || "this visitor"
            : ""
        }
        title="Delete visitor"
        onConfirm={handleConfirmDelete}
      />

      <Card className="p-4">
        <Table
          columns={columns}
          data={filteredVisitors}
          emptyMessage={loading ? "Loading visitors..." : "No visitors found."}
          enableDateRangeFilter
          startDate={startDate}
          endDate={endDate}
          onDateRangeChange={({ startDate, endDate }) => {
            setStartDate(startDate);
            setEndDate(endDate);
          }}
          showPagination
          paginationInfo={{
            total: pagination.total,
            current: pagination.page,
            pageSize: pagination.limit,
          }}
          onPageChange={handlePageChange}
          enableExport
          exportFileName="visitors"
          onExportRequest={
            estateId
              ? async () => {
                  const shouldApplyDate = Boolean(startDate && endDate);
                  const res = await dispatch(
                    getVisitorsByEstate({
                      estateId,
                      page: 1,
                      limit: 50000,
                      startDate: shouldApplyDate ? startDate : undefined,
                      endDate: shouldApplyDate ? endDate : undefined,
                    }),
                  ).unwrap();
                  return res?.data ?? [];
                }
              : undefined
          }
        />
      </Card>
    </div>
  );
}
