"use client";

import React, { useEffect, useState, useMemo } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Eye, Edit, Trash2 } from "lucide-react";
import Table from "@/components/tables/list/page";
import Modal from "@/components/modal/page";
import VisitorForm from "@/components/resident/visitor-form/page";
import DeleteModal from "@/components/resident/delete-modal/page";
import SwitchAddress from "@/components/resident/switch-address/page";
import {
    getVisitorsByResident,
    getVisitorById,
    deleteVisitor,
} from "@/redux/slice/resident/visitor/visitor";
import { getSignedInUser } from "@/redux/slice/auth-mgt/auth-mgt";
import { normalizeAddresses, toAddressIdString, type AddressOption } from "@/lib/address";
import { toast } from "react-toastify";
import { useDispatch } from "react-redux";
import { AppDispatch } from "@/redux/store";

interface VisitorData {
    id: string;
    visitorCode: string;
    firstName?: string;
    lastName?: string;
    phone?: string;
    purpose?: string;
    isVerified: boolean;
    createdAt: string;
    updatedAt?: string;
    addressId?: any;
    estateId?: any;
    residentId?: any;
}

export default function VisitorPage() {
    const dispatch = useDispatch<AppDispatch>();
    const [open, setOpen] = useState(false);
    const [viewModalOpen, setViewModalOpen] = useState(false);
    const [selectedVisitorId, setSelectedVisitorId] = useState<string | null>(null);
    const [mode, setMode] = useState<"create" | "edit" | "view">("create");

    const [visitors, setVisitors] = useState<VisitorData[]>([]);
    const [pagination, setPagination] = useState<any>({});
    const [loading, setLoading] = useState<boolean>(true);
    const [viewingVisitor, setViewingVisitor] = useState<VisitorData | null>(null);
    const [visitorToDelete, setVisitorToDelete] = useState<VisitorData | null>(null);

    // User meta
    const [userId, setUserId] = useState<string>("");
    const [estateId, setEstateId] = useState<string>("");
    const [addressOptions, setAddressOptions] = useState<AddressOption[]>([]);
    const [selectedAddressId, setSelectedAddressId] = useState<string | null>(null);

    // Fetch user and visitors
    useEffect(() => {
        (async () => {
            setLoading(true);
            try {
                const userRes = await dispatch(getSignedInUser()).unwrap();
                const user = userRes?.data as Record<string, unknown> | undefined;
                if (!user) {
                    toast.warning("No signed in user found");
                    setLoading(false);
                    return;
                }

                const uId = ((user.id as string | undefined) ?? (user._id as string | undefined) ?? "") || "";

                const rawEstate =
                    (user.estateId as string | { id?: string; _id?: string } | undefined) ??
                    (user.estate as { id?: string; _id?: string } | undefined);
                let eId = "";
                if (typeof rawEstate === "string") {
                    eId = rawEstate;
                } else if (rawEstate && typeof rawEstate === "object") {
                    eId = rawEstate.id ?? rawEstate._id ?? "";
                }
                const addresses = normalizeAddresses(user);
                const firstId = addresses.length > 0 ? addresses[0].id : null;

                setUserId(uId);
                setEstateId(eId);
                setAddressOptions(addresses);
                setSelectedAddressId((prev) => prev ?? firstId);

                if (!uId) {
                    toast.warning("No user ID found");
                    setLoading(false);
                    return;
                }

                // Get visitors for this resident
                const visitorsRes = await dispatch(
                    getVisitorsByResident({ residentId: uId, page: 1, limit: 10 })
                ).unwrap();
                setVisitors(visitorsRes?.data || []);
                setPagination(visitorsRes?.pagination || {});
            } catch (err: any) {
                toast.error(err?.message || "Failed to fetch visitors");
            } finally {
                setLoading(false);
            }
        })();
    }, [dispatch]);

    const refreshVisitors = async () => {
        if (!userId) return;
        try {
            const visitorsRes = await dispatch(
                getVisitorsByResident({ residentId: userId, page: pagination?.page || 1, limit: pagination?.limit || 10 })
            ).unwrap();
            setVisitors(visitorsRes?.data || []);
            setPagination(visitorsRes?.pagination || {});
        } catch (err: any) {
            console.error("Refresh visitors failed:", err);
        }
    };

    const handleOpenModal = (mode: "create" | "edit" | "view", visitorId?: string) => {
        setMode(mode);
        setSelectedVisitorId(visitorId || null);
        if (mode === "view" && visitorId) {
            loadVisitorForView(visitorId);
        }
        if (mode === "create" || mode === "edit") {
            setOpen(true);
        } else {
            setViewModalOpen(true);
        }
    };

    const loadVisitorForView = async (id: string) => {
        try {
            const res = await dispatch(getVisitorById(id)).unwrap();
            // API response has flat structure, not nested visitor object
            const visitorData = res?.data?.visitor || res?.data;
            setViewingVisitor(visitorData || null);
        } catch (err: any) {
            toast.error(err?.message || "Failed to load visitor details");
        }
    };

    const handleCloseModal = () => {
        setSelectedVisitorId(null);
        setOpen(false);
        setViewModalOpen(false);
        setViewingVisitor(null);
    };

    const handleOpenDeleteModal = (visitor: VisitorData, e?: React.MouseEvent) => {
        if (e) e.stopPropagation();
        setVisitorToDelete(visitor);
    };

    const handleCloseDeleteModal = () => setVisitorToDelete(null);

    const handleConfirmDelete = async () => {
        if (!visitorToDelete) return;
        try {
            await dispatch(deleteVisitor(visitorToDelete.id)).unwrap();
            toast.success("Visitor deleted successfully.");
            setVisitorToDelete(null);
            await refreshVisitors();
        } catch (err: any) {
            toast.error(err?.message || "Failed to delete visitor");
        }
    };

    const handlePageChange = async (newPage: number) => {
        if (!userId) return;
        try {
            const visitorsRes = await dispatch(
                getVisitorsByResident({ residentId: userId, page: newPage, limit: pagination?.limit || 10 })
            ).unwrap();
            setVisitors(visitorsRes?.data || []);
            setPagination(visitorsRes?.pagination || {});
        } catch (err: any) {
            toast.error(err?.message || "Failed to fetch visitors");
        }
    };

    // When owner has multiple addresses, show only visitors for the selected address
    const displayedVisitors = useMemo(() => {
        if (addressOptions.length <= 1 || !selectedAddressId) return visitors;
        return visitors.filter((v) => toAddressIdString(v.addressId) === selectedAddressId);
    }, [visitors, addressOptions.length, selectedAddressId]);

    // For form: pass addressId as string or { id, data: { block, unit } } to match VisitorFormProps
    const selectedAddressForForm = useMemo((): string | { id: string; data: { block: string; unit: string } } => {
        if (!selectedAddressId) return "";
        const opt = addressOptions.find((a) => a.id === selectedAddressId);
        if (!opt) return selectedAddressId;
        const d = opt.data ?? {};
        return {
            id: opt.id,
            data: {
                block: d.block ?? "",
                unit: d.unit ?? d.flat ?? "",
            },
        };
    }, [addressOptions, selectedAddressId]);

    // Table columns
    const columns = [
        {
            key: "createdAt",
            header: "Created At",
            render: (item: VisitorData) =>
                item.createdAt
                    ? new Date(item.createdAt).toLocaleDateString()
                    : "—",
        },
        { key: "visitorCode", header: "Visitor Code" },
        {
            key: "name",
            header: "Name",
            render: (item: VisitorData) =>
                `${item.firstName || ""} ${item.lastName || ""}`.trim() || "—",
        },
        { key: "phone", header: "Phone", render: (item: VisitorData) => item.phone || "—" },
        { key: "purpose", header: "Purpose", render: (item: VisitorData) => item.purpose || "—" },
        {
            key: "isVerified",
            header: "Status",
            render: (item: VisitorData) => (
                <span
                    className={`px-2 py-1 rounded text-xs font-semibold ${item.isVerified
                        ? "bg-green-100 text-green-800"
                        : "bg-yellow-100 text-yellow-800"
                        }`}
                >
                    {item.isVerified ? "Verified" : "Pending"}
                </span>
            ),
        },
        {
            key: "actions",
            header: "Actions",
            render: (item: VisitorData) => (
                <div className="flex gap-2">
                    <Button
                        className="cursor-pointer"
                        variant="outline"
                        size="sm"
                        onClick={(e) => {
                            e.stopPropagation();
                            handleOpenModal("view", item.id);
                        }}
                    >
                        <Eye className="w-4 h-4 mr-1" />
                        View
                    </Button>
                    <Button
                        variant="outline"
                        className="cursor-pointer"
                        size="sm"
                        onClick={(e) => {
                            e.stopPropagation();
                            handleOpenModal("edit", item.id);
                        }}
                    >
                        <Edit className="w-4 h-4 mr-1 cursor-pointer" />
                        Edit
                    </Button>
                    <Button
                        variant="outline"
                        size="sm"
                        className="cursor-pointer text-destructive hover:bg-destructive/10"
                        onClick={(e) => handleOpenDeleteModal(item, e)}
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
            <div className="flex flex-col md:flex-row gap-5 md:gap-0 items-start md:items-center justify-between">
                <h1 className="font-heading text-3xl font-bold">Visitor Management</h1>
                <Button
                    onClick={() => handleOpenModal("create")}
                    className="flex items-center gap-2"
                >
                    <Plus className="w-4 h-4" />
                    Add Visitor
                </Button>
            </div>

            <SwitchAddress
                addresses={addressOptions}
                value={selectedAddressId}
                onChange={setSelectedAddressId}
            />

            {/* Visitors table */}
            <Card className="p-4">
                <h2 className="font-semibold mb-4">My Visitors</h2>
                <Table
                    columns={columns}
                    data={displayedVisitors || []}
                    emptyMessage={loading ? "Loading visitors..." : "You haven't created any visitors yet."}
                    showPagination
                    paginationInfo={{
                        total: addressOptions.length > 1 ? displayedVisitors.length : (pagination?.total || visitors.length || 0),
                        current: Number(pagination?.page) || 1,
                        pageSize: Number(pagination?.limit) || 10,
                    }}
                    onPageChange={handlePageChange}
                    enableExport
                    exportFileName="visitors"
                    onExportRequest={
                        userId
                            ? async () => {
                                const res = await dispatch(
                                    getVisitorsByResident({
                                        residentId: userId,
                                        page: 1,
                                        limit: 50000,
                                    }),
                                ).unwrap();
                                return res?.data ?? [];
                            }
                            : undefined
                    }
                />
            </Card>

            {/* Create/Edit Modal */}
            {open && (mode === "create" || mode === "edit") && (
                <Modal visible={open} onClose={handleCloseModal}>
                    <VisitorForm
                        visitorId={mode === "edit" ? selectedVisitorId : undefined}
                        residentId={userId}
                        estateId={estateId}
                        addressId={selectedAddressForForm ?? ""}
                        onSubmitSuccess={refreshVisitors}
                        onClose={handleCloseModal}
                    />
                </Modal>
            )}

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

            {/* View Modal */}
            {viewModalOpen && viewingVisitor && (
                <Modal visible={viewModalOpen} onClose={handleCloseModal}>
                    <div className="space-y-6">
                        {/* Header */}
                        <div className="border-b border-gray-200 pb-4">
                            <h2 className="text-2xl font-semibold text-gray-900">Visitor Information</h2>
                            <p className="text-sm text-gray-500 mt-1">Complete details for this visitor entry</p>
                        </div>

                        {/* Content */}
                        <div className="space-y-5">
                            {/* Visitor Code & Status Row */}
                            <div className="flex items-start justify-between">
                                <div className="flex-1">
                                    <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Visitor Code</p>
                                    <p className="text-lg font-semibold text-gray-900">{viewingVisitor.visitorCode || "—"}</p>
                                </div>
                                <div className="flex-shrink-0">
                                    <span
                                        className={`inline-flex items-center px-3 py-1.5 rounded-full text-xs font-medium ${viewingVisitor.isVerified
                                            ? "bg-green-50 text-green-700 ring-1 ring-green-600/20"
                                            : "bg-amber-50 text-amber-700 ring-1 ring-amber-600/20"
                                            }`}
                                    >
                                        {viewingVisitor.isVerified ? "✓ Verified" : "⋯ Pending"}
                                    </span>
                                </div>
                            </div>

                            {/* Divider */}
                            <div className="border-t border-gray-100"></div>

                            {/* Personal Information */}
                            <div>
                                <h3 className="text-sm font-semibold text-gray-700 mb-3">Personal Information</h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="bg-gray-50 rounded-lg p-3">
                                        <p className="text-xs font-medium text-gray-500 mb-1">Full Name</p>
                                        <p className="text-base text-gray-900">
                                            {`${viewingVisitor.firstName || ""} ${viewingVisitor.lastName || ""}`.trim() || "—"}
                                        </p>
                                    </div>
                                    <div className="bg-gray-50 rounded-lg p-3">
                                        <p className="text-xs font-medium text-gray-500 mb-1">Phone Number</p>
                                        <p className="text-base text-gray-900">{viewingVisitor.phone || "—"}</p>
                                    </div>
                                </div>
                            </div>

                            {/* Visit Information */}
                            <div>
                                <h3 className="text-sm font-semibold text-gray-700 mb-3">Visit Information</h3>
                                <div className="bg-gray-50 rounded-lg p-3">
                                    <p className="text-xs font-medium text-gray-500 mb-1">Purpose of Visit</p>
                                    <p className="text-base text-gray-900">{viewingVisitor.purpose || "—"}</p>
                                </div>
                            </div>

                            {/* Timestamps */}
                            <div>
                                <h3 className="text-sm font-semibold text-gray-700 mb-3">Timestamps</h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="flex items-start space-x-2">
                                        <svg className="w-4 h-4 text-gray-400 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                        </svg>
                                        <div>
                                            <p className="text-xs font-medium text-gray-500">Created</p>
                                            <p className="text-sm text-gray-900">
                                                {viewingVisitor.createdAt
                                                    ? new Date(viewingVisitor.createdAt).toLocaleString('en-US', {
                                                        dateStyle: 'medium',
                                                        timeStyle: 'short'
                                                    })
                                                    : "—"}
                                            </p>
                                        </div>
                                    </div>
                                    {viewingVisitor.updatedAt && (
                                        <div className="flex items-start space-x-2">
                                            <svg className="w-4 h-4 text-gray-400 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                            </svg>
                                            <div>
                                                <p className="text-xs font-medium text-gray-500">Last Updated</p>
                                                <p className="text-sm text-gray-900">
                                                    {new Date(viewingVisitor.updatedAt).toLocaleString('en-US', {
                                                        dateStyle: 'medium',
                                                        timeStyle: 'short'
                                                    })}
                                                </p>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Footer */}
                        <div className="pt-4">
                            <Button variant="outline" onClick={handleCloseModal} className="w-full cursor-pointer">
                                Close
                            </Button>
                        </div>

                    </div>
                </Modal>
            )}


        </div>
    );
}
