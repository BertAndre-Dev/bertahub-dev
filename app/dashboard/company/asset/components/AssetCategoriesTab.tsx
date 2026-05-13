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
  createAssetCategory,
  deleteAssetCategory,
  getAssetCategories,
  updateAssetCategory,
  type AssetCategory,
} from "@/redux/slice/company/asset-mgt/company-asset";
import AssetCategoryFormModal from "./AssetCategoryFormModal";

const PAGE_SIZE = 10;

function getId(v: { id?: string; _id?: string } | undefined) {
  return v?.id || v?._id || "";
}

export default function AssetCategoriesTab() {
  const dispatch = useDispatch<AppDispatch>();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<AssetCategory | null>(null);

  const {
    categories,
    pagination,
    createStatus,
    updateStatus,
    deleteStatus,
  } = useSelector((state: RootState) => {
    const s: any = (state as any).companyAsset;
    return {
      categories: (s?.categories as AssetCategory[]) ?? [],
      pagination: s?.categoriesPagination ?? null,
      createStatus: s?.createCategoryStatus ?? "idle",
      updateStatus: s?.updateCategoryStatus ?? "idle",
      deleteStatus: s?.deleteCategoryStatus ?? "idle",
    };
  });

  useEffect(() => {
    dispatch(getAssetCategories({ page, limit: PAGE_SIZE, search }))
      .unwrap()
      .catch(() => toast.error("Failed to load asset categories."));
  }, [dispatch, page, search]);

  const columns = useMemo(
    () => [
      {
        key: "createdAt" as const,
        header: "Created",
        render: (item: AssetCategory) =>
          item.createdAt ? new Date(item.createdAt).toLocaleString() : "—",
        exportValue: (item: AssetCategory) =>
          item.createdAt ? new Date(item.createdAt).toISOString() : "",
      },
      {
        key: "updatedAt" as const,
        header: "Updated",
        render: (item: AssetCategory) =>
          item.updatedAt ? new Date(item.updatedAt).toLocaleString() : "—",
        exportValue: (item: AssetCategory) =>
          item.updatedAt ? new Date(item.updatedAt).toISOString() : "",
      },
      { key: "name" as const, header: "Category" },
      {
        key: "actions" as const,
        header: "Actions",
        exportable: false,
        render: (item: AssetCategory) => (
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
                  name: item.name ?? "this category",
                  onConfirm: async () => {
                    await dispatch(deleteAssetCategory(id)).unwrap();
                    toast.success("Category deleted.");
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
    [dispatch, deleteStatus],
  );

  const openCreate = () => {
    setEditing(null);
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setEditing(null);
  };

  const handleSubmit = async (payload: { name: string }) => {
    try {
      if (editing) {
        const id = getId(editing);
        if (!id) return;
        await dispatch(
          updateAssetCategory({ id, name: payload.name }),
        ).unwrap();
        toast.success("Category updated.");
      } else {
        await dispatch(createAssetCategory({ name: payload.name })).unwrap();
        toast.success("Category created.");
      }
      closeModal();
      setPage(1);
    } catch (err: any) {
      toast.error(err?.message ?? "Failed to save category.");
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h2 className="font-heading text-xl font-bold">Asset Categories</h2>
          <p className="text-muted-foreground text-sm">
            Create categories before adding assets.
          </p>
        </div>
        <Button
          onClick={openCreate}
          className="shrink-0 text-white"
          style={{ backgroundColor: "#0150AC" }}
        >
          + Create category
        </Button>
      </div>

      <Table
        columns={columns}
        data={categories}
        emptyMessage={
          search.trim()
            ? "No categories match your search."
            : "No categories yet. Create one to get started."
        }
        enableSearch
        onSearch={(value) => {
          setSearch(value);
          setPage(1);
        }}
        showPagination
        paginationInfo={{
          total:
            (pagination?.total as number | undefined) ??
            (pagination?.total as number | undefined) ??
            categories.length,
          current:
            Number(pagination?.page ?? pagination?.currentPage ?? page) || page,
          pageSize:
            Number(pagination?.limit ?? pagination?.pageSize ?? PAGE_SIZE) ||
            PAGE_SIZE,
        }}
        onPageChange={(p) => setPage(p)}
        enableExport
        exportFileName="asset-categories"
        onExportRequest={() => Promise.resolve(categories)}
      />

      <AssetCategoryFormModal
        visible={modalOpen}
        onClose={closeModal}
        initial={editing}
        loading={createStatus === "isLoading" || updateStatus === "isLoading"}
        onSubmit={handleSubmit}
      />
    </div>
  );
}
