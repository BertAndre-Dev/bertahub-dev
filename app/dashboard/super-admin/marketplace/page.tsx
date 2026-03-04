"use client";

import { useState, useEffect, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "react-toastify";
import {
  Plus,
  Pencil,
  Trash2,
  PlayCircle,
  PauseCircle,
  Store,
  ListCheck,
  Search,
} from "lucide-react";
import {
  getMarketplaceList,
  createMarketplace,
  updateMarketplace,
  deleteMarketplace,
  suspendMarketplace,
  activateMarketplace,
  type MarketplaceItem,
} from "@/redux/slice/super-admin/marketplace/marketplace";
import { confirmDeleteToast } from "@/lib/confirm-delete-toast";
import type { RootState, AppDispatch } from "@/redux/store";
import Modal from "@/components/modal/page";
import Tab from "@/components/tabs/page";
import Table from "@/components/tables/list/page";
import AddBusinessForm from "@/components/super-admin/add-business-form/page";
import type { AddBusinessFormPayload } from "@/components/super-admin/add-business-form/page";
import SuspendRentModal from "@/components/resident/suspend-rent-modal/page";

export default function SuperAdminMarketplacePage() {
  const dispatch = useDispatch<AppDispatch>();
  const [modalOpen, setModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<MarketplaceItem | null>(null);
  const [suspendItem, setSuspendItem] = useState<MarketplaceItem | null>(null);
  const [suspendSubmitting, setSuspendSubmitting] = useState(false);
  const [search, setSearch] = useState("");

  const { list, pagination, getListStatus, createStatus, updateStatus } =
    useSelector((state: RootState) => {
      const s = (state as RootState).superAdminMarketplace;
      return {
        list: s?.list ?? null,
        pagination: s?.pagination ?? null,
        getListStatus: s?.getListStatus ?? "idle",
        createStatus: s?.createStatus ?? "idle",
        updateStatus: s?.updateStatus ?? "idle",
      };
    });

  const listings = list ?? [];

  const filteredListings = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return listings;
    return listings.filter((item) => {
      const company = (item.companyName ?? "").toLowerCase();
      const product = (item.productName ?? "").toLowerCase();
      const category = (item.productCategory ?? "").toLowerCase();
      const desc = (item.productDescription ?? "").toLowerCase();
      const link = (item.link ?? "").toLowerCase();
      return (
        company.includes(q) ||
        product.includes(q) ||
        category.includes(q) ||
        desc.includes(q) ||
        link.includes(q)
      );
    });
  }, [listings, search]);

  useEffect(() => {
    dispatch(getMarketplaceList({ page: 1, limit: 100 })).catch(() =>
      toast.error("Failed to load marketplace."),
    );
  }, [dispatch]);

  const openAddModal = () => {
    setEditingItem(null);
    setModalOpen(true);
  };

  const openEditModal = (item: MarketplaceItem) => {
    setEditingItem(item);
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setEditingItem(null);
  };

  const handleFormSubmit = async (payload: AddBusinessFormPayload) => {
    try {
      if (payload.marketPlaceId) {
        await dispatch(
          updateMarketplace({
            marketPlaceId: payload.marketPlaceId,
            companyName: payload.companyName,
            productName: payload.productName,
            link: payload.link,
            productCategory: payload.productCategory,
            productDescription: payload.productDescription,
          }),
        ).unwrap();
        toast.success("Business updated.");
      } else {
        await dispatch(
          createMarketplace({
            companyName: payload.companyName,
            productName: payload.productName,
            link: payload.link,
            productCategory: payload.productCategory,
            productDescription: payload.productDescription,
          }),
        ).unwrap();
        toast.success("Business added to marketplace.");
      }
      closeModal();
      dispatch(
        getMarketplaceList({ page: 1, limit: pagination?.limit ?? 100 }),
      );
    } catch (err: unknown) {
      const msg = (err as { message?: string })?.message ?? "Failed to save.";
      toast.error(msg);
    }
  };

  const openSuspendModal = (item: MarketplaceItem) => {
    if (!item.id) return;
    setSuspendItem(item);
  };

  const handleSuspendConfirm = async (reason: string) => {
    if (!suspendItem?.id) return;
    setSuspendSubmitting(true);
    try {
      await dispatch(
        suspendMarketplace({ marketPlaceId: suspendItem.id, reason }),
      ).unwrap();
      toast.success("Listing suspended.");
      setSuspendItem(null);
    } catch (e: unknown) {
      const msg = (e as { message?: string })?.message ?? "Failed to suspend.";
      toast.error(msg);
    } finally {
      setSuspendSubmitting(false);
    }
  };

  const handleActivate = (item: MarketplaceItem) => {
    if (!item.id) return;
    dispatch(activateMarketplace(item.id))
      .unwrap()
      .then(() => toast.success("Listing activated."))
      .catch((e: { message?: string }) =>
        toast.error(e?.message ?? "Failed to activate."),
      );
  };

  const handleDelete = (item: MarketplaceItem) => {
    if (!item.id) return;
    confirmDeleteToast({
      name: item.companyName ?? item.productName ?? "this listing",
      onConfirm: async () => {
        await dispatch(deleteMarketplace(item.id!)).unwrap();
        toast.success("Listing deleted.");
        dispatch(
          getMarketplaceList({ page: 1, limit: pagination?.limit ?? 100 }),
        );
      },
    });
  };

  const tableColumns = [
    { key: "createdAt" as const, header: "Created At" },
    { key: "companyName" as const, header: "Company" },
    { key: "productName" as const, header: "Product" },
    { key: "productCategory" as const, header: "Category" },
    {
      key: "link" as const,
      header: "Link",
      render: (item: MarketplaceItem) =>
        item.link ? (
          <a
            href={item.link}
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary hover:underline truncate max-w-[180px] inline-block"
          >
            {item.link}
          </a>
        ) : (
          "—"
        ),
    },
    {
      key: "status" as const,
      header: "Status",
      render: (item: MarketplaceItem) => (
        <span
          className={
            item.status === "active"
              ? "text-green-600 font-medium"
              : "text-amber-600 font-medium"
          }
        >
          {item.status ?? "—"}
        </span>
      ),
    },
    {
      key: "actions" as const,
      header: "Actions",
      exportable: false,
      render: (item: MarketplaceItem) => (
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            className="h-8"
            onClick={(e) => {
              e.stopPropagation();
              openEditModal(item);
            }}
          >
            <Pencil className="w-4 h-4" />
          </Button>
          {item.status === "suspended" ? (
            <Button
              variant="ghost"
              size="sm"
              className="h-8 text-green-600"
              onClick={(e) => {
                e.stopPropagation();
                handleActivate(item);
              }}
            >
              <PlayCircle className="w-4 h-4" />
            </Button>
          ) : (
            <Button
              variant="ghost"
              size="sm"
              className="h-8 text-amber-600"
              onClick={(e) => {
                e.stopPropagation();
                openSuspendModal(item);
              }}
            >
              <PauseCircle className="w-4 h-4" />
            </Button>
          )}
          <Button
            variant="ghost"
            size="sm"
            className="h-8 text-destructive"
            onClick={(e) => {
              e.stopPropagation();
              handleDelete(item);
            }}
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      ),
    },
  ];

  const formLoading =
    createStatus === "isLoading" || updateStatus === "isLoading";

  return (
    <div className="space-y-6 sm:space-y-8 pb-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="space-y-2">
          <h1 className="font-heading text-3xl font-bold">Marketplace</h1>
          <p className="text-muted-foreground mt-1">
            Manage businesses in marketplace.
          </p>
        </div>
        <Button
          onClick={openAddModal}
          className="shrink-0 flex items-center gap-2 text-white"
          style={{ backgroundColor: "#0150AC" }}
        >
          <Plus className="w-4 h-4" />
          Add business
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {[
          {
            label: "Total Businesses",
            value: String(listings.length),
            icon: Store,
            color: "bg-[#D0DFF280]",
          },
          {
            label: "Total Category",
            value: new Set(listings.map((item) => item.productCategory)).size,
            icon: ListCheck,
            color: "bg-[#D0DFF280]",
          },
        ].map((stat, i) => {
          const Icon = stat.icon;
          return (
            <Card key={i} className="p-6">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">{stat.label}</p>
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
        })}
      </div>

      <div className="flex items-center gap-2 bg-white p-4 rounded-lg border border-border">
        <Search className="w-5 h-5 text-muted-foreground shrink-0" />
        <Input
          type="text"
          placeholder="Search by company name, product name, category, etc..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-md border-gray-300"
        />
      </div>

       <div className="bg-white p-4 rounded-lg border border-border">
        <Tab
          titles={["Edit Business", "View Business"]}
          renderContent={(activeTab) => {
            if (activeTab === "Edit Business") {
              return (
                <div className="space-y-4">
                  {getListStatus === "isLoading" ? (
                    <p className="text-muted-foreground py-8 text-center">
                      Loading marketplace...
                    </p>
                  ) : filteredListings.length === 0 ? (
                    <p className="text-muted-foreground py-8 text-center">
                      {search.trim()
                        ? "No businesses match your search."
                        : "No businesses yet. Click \"Add business\" to create one."}
                    </p>
                  ) : (
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                      {filteredListings.map((item) => (
                        <Card key={item.id} className="p-4 overflow-hidden">
                          {item.images?.[0] ? (
                            <img
                              src={item.images[0]}
                              alt=""
                              className="w-full h-40 object-cover rounded-t-lg -mx-4 -mt-4 mb-3"
                            />
                          ) : (
                            <div className="w-full h-40 bg-muted rounded-t-lg -mx-4 -mt-4 mb-3 flex items-center justify-center text-muted-foreground text-sm">
                              No image
                            </div>
                          )}
                          <h3 className="font-semibold truncate">{item.companyName}</h3>
                          <p className="text-sm text-muted-foreground truncate">
                            {item.productName} · {item.productCategory}
                          </p>
                          <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                            {item.productDescription}
                          </p>
                          <div className="flex flex-wrap gap-2 mt-3">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8"
                              onClick={() => openEditModal(item)}
                            >
                              <Pencil className="w-4 h-4" />
                            </Button>
                            {item.status === "suspended" ? (
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-8 text-green-600"
                                onClick={() => handleActivate(item)}
                              >
                                <PlayCircle className="w-4 h-4" />
                              </Button>
                            ) : (
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-8 text-amber-600"
                                onClick={() => openSuspendModal(item)}
                              >
                                <PauseCircle className="w-4 h-4" />
                              </Button>
                            )}
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 text-destructive"
                              onClick={() => handleDelete(item)}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </Card>
                      ))}
                    </div>
                  )}
                </div>
              );
            }
            if (activeTab === "View Business") {
              return (
                <Table
                  columns={tableColumns}
                  data={filteredListings}
                  emptyMessage={
                    search.trim()
                      ? "No businesses match your search."
                      : getListStatus === "isLoading"
                        ? "Loading..."
                        : "No businesses yet. Click \"Add business\" to create one."
                  }
                  enableExport
                  exportFileName="marketplace-businesses"
                  onExportRequest={() => Promise.resolve(filteredListings)}
                />
              );
            }
            return null;
          }}
        />
      </div>

      <Modal visible={modalOpen} onClose={closeModal}>
        <div className="pr-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            {editingItem?.id ? "Edit business" : "Add business"}
          </h2>
          <AddBusinessForm
            initialData={editingItem}
            onSubmit={handleFormSubmit}
            onCancel={closeModal}
            loading={formLoading}
          />
        </div>
      </Modal>

      <SuspendRentModal
        visible={!!suspendItem}
        onClose={() => setSuspendItem(null)}
        tenantName={
          suspendItem
            ? suspendItem.companyName ?? suspendItem.productName ?? "this listing"
            : ""
        }
        title="Suspend listing"
        confirmLabel="Suspend"
        onConfirm={handleSuspendConfirm}
        loading={suspendSubmitting}
      />
    </div>
  );
}
