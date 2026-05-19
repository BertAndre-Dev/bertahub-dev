"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { toast } from "react-toastify";
import Table from "@/components/tables/list/page";
import { Button } from "@/components/ui/button";
import { Pencil, Trash2 } from "lucide-react";
import { confirmDeleteToast } from "@/lib/confirm-delete-toast";
import type { RootState, AppDispatch } from "@/redux/store";
import {
  createAssets,
  deleteAsset,
  getAssetCategories,
  getAssets,
  updateAsset,
  type Asset,
  type AssetCategory,
  type CreateAssetItemPayload,
} from "@/redux/slice/resident/asset-mgt/resident-asset";
import AssetFormModal from "./AssetFormModal";

const PAGE_SIZE = 10;

function getId(v: { id?: string; _id?: string } | undefined) {
  return v?.id || v?._id || "";
}

function getCategoryName(
  assetCategoryId: string | AssetCategory | undefined,
  categories: AssetCategory[],
) {
  if (!assetCategoryId) return "—";
  if (typeof assetCategoryId !== "string") return assetCategoryId?.name ?? "—";
  const match = categories.find((c) => getId(c) === assetCategoryId);
  return match?.name ?? "—";
}

type Props = {
  estateId: string;
  estateName: string;
};

export default function AssetsTab({ estateId, estateName }: Readonly<Props>) {
  const dispatch = useDispatch<AppDispatch>();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Asset | null>(null);

  const { assets, assetsPagination, categories } = useSelector(
    (state: RootState) => {
      const s = state.residentAsset;
      return {
        assets: s?.assets ?? [],
        assetsPagination: s?.assetsPagination ?? null,
        categories: s?.categories ?? [],
      };
    },
  );

  const { createStatus, updateStatus, deleteStatus } = useSelector(
    (state: RootState) => {
      const s = state.residentAsset;
      return {
        createStatus: s?.createAssetsStatus ?? "idle",
        updateStatus: s?.updateAssetStatus ?? "idle",
        deleteStatus: s?.deleteAssetStatus ?? "idle",
      };
    },
  );

  useEffect(() => {
    dispatch(getAssetCategories({ page: 1, limit: 100, search: "" }))
      .unwrap()
      .catch(() => {});
  }, [dispatch]);

  useEffect(() => {
    if (!estateId) return;
    dispatch(getAssets({ estateId, page, limit: PAGE_SIZE, search }))
      .unwrap()
      .catch(() => toast.error("Failed to load assets."));
  }, [dispatch, estateId, page, search]);

  const columns = useMemo(
    () => [
      {
        key: "datePurchased" as const,
        header: "Purchased",
        render: (item: Asset) =>
          item.datePurchased
            ? new Date(item.datePurchased).toLocaleDateString()
            : "—",
        exportValue: (item: Asset) =>
          item.datePurchased ? String(item.datePurchased) : "",
      },
      {
        key: "createdAt" as const,
        header: "Created",
        render: (item: Asset) =>
          item.createdAt ? new Date(item.createdAt).toLocaleString() : "—",
        exportValue: (item: Asset) =>
          item.createdAt ? new Date(item.createdAt).toISOString() : "",
      },
      { key: "name" as const, header: "Asset" },
      { key: "tag" as const, header: "Tag" },
      {
        key: "assetCategoryId" as const,
        header: "Category",
        render: (item: Asset) =>
          getCategoryName(item.assetCategoryId as string | AssetCategory, categories),
        exportValue: (item: Asset) =>
          getCategoryName(item.assetCategoryId as string | AssetCategory, categories),
      },
      {
        key: "amount" as const,
        header: "Amount (₦)",
        render: (item: Asset) =>
          item.amount != null
            ? new Intl.NumberFormat("en-NG").format(Number(item.amount))
            : "—",
        exportValue: (item: Asset) =>
          item.amount != null ? String(item.amount) : "",
      },
      {
        key: "useFullLife" as const,
        header: "Useful life",
        render: (item: Asset) =>
          item.useFullLife != null ? `${item.useFullLife} year(s)` : "—",
        exportValue: (item: Asset) =>
          item.useFullLife != null ? String(item.useFullLife) : "",
      },
      {
        key: "actions" as const,
        header: "Actions",
        exportable: false,
        render: (item: Asset) => (
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              className="h-8"
              onClick={(e) => {
                e.stopPropagation();
                setEditing(item);
                setModalOpen(true);
              }}
            >
              <Pencil className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="h-8 text-destructive"
              disabled={deleteStatus === "isLoading"}
              onClick={(e) => {
                e.stopPropagation();
                const id = getId(item);
                if (!id) return;
                confirmDeleteToast({
                  name: item.name ?? "this asset",
                  onConfirm: async () => {
                    await dispatch(deleteAsset(id)).unwrap();
                    toast.success("Asset deleted.");
                    setPage(1);
                  },
                });
              }}
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        ),
      },
    ],
    [categories, deleteStatus, dispatch],
  );

  const openCreate = () => {
    if (!categories.length) {
      toast.info("Create an asset category first.");
      return;
    }
    setEditing(null);
    setModalOpen(true);
  };

  const handleSubmit = async (payload: CreateAssetItemPayload) => {
    try {
      if (editing) {
        const id = getId(editing);
        if (!id) return;
        await dispatch(updateAsset({ id, ...payload })).unwrap();
        toast.success("Asset updated.");
      } else {
        await dispatch(createAssets({ assets: [payload] })).unwrap();
        toast.success("Asset created.");
      }
      setModalOpen(false);
      setEditing(null);
      setPage(1);
    } catch (err: unknown) {
      const message =
        (err as { message?: string })?.message ?? "Failed to save asset.";
      toast.error(message);
    }
  };

  const pagination = assetsPagination;
  const total = Number(pagination?.total ?? assets.length);
  const current = Number(pagination?.page ?? pagination?.currentPage ?? page) || page;
  const pageSize = Number(pagination?.limit ?? pagination?.pageSize ?? PAGE_SIZE) || PAGE_SIZE;

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h2 className="font-heading text-xl font-bold">Assets</h2>
          <p className="text-muted-foreground text-sm">
            Create and manage assets for your estate.
          </p>
        </div>
        <Button
          onClick={openCreate}
          className="shrink-0 text-white"
          style={{ backgroundColor: "#0150AC" }}
          disabled={!estateId}
        >
          + Create asset
        </Button>
      </div>

      <Table
        columns={columns}
        data={assets}
        emptyMessage={
          search.trim()
            ? "No assets match your search."
            : "No assets yet. Create an asset to get started."
        }
        enableSearch
        onSearch={(value) => {
          setSearch(value);
          setPage(1);
        }}
        showPagination
        paginationInfo={{ total, current, pageSize }}
        onPageChange={(p) => setPage(p)}
        enableExport
        exportFileName="resident-assets"
        onExportRequest={() => Promise.resolve(assets)}
      />

      <AssetFormModal
        visible={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setEditing(null);
        }}
        initial={editing}
        categories={categories}
        estateId={estateId}
        estateName={estateName}
        loading={createStatus === "isLoading" || updateStatus === "isLoading"}
        onSubmit={handleSubmit}
      />
    </div>
  );
}
