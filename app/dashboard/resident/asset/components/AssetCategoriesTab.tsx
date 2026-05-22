"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { toast } from "react-toastify";
import Table from "@/components/tables/list/page";
import { Button } from "@/components/ui/button";
import { Pencil, Trash2 } from "lucide-react";
import DeleteModal from "@/components/resident/delete-modal/page";
import type { RootState, AppDispatch } from "@/redux/store";
import {
  createAssetCategory,
  deleteAssetCategory,
  getAssetCategories,
  updateAssetCategory,
  type AssetCategory,
} from "@/redux/slice/resident/asset-mgt/resident-asset";
import AssetCategoryFormModal from "./AssetCategoryFormModal";

const PAGE_SIZE = 10;

function getId(v: { id?: string; _id?: string } | undefined) {
  return v?.id || v?._id || "";
}

type Props = {
  estateId: string;
};

export default function AssetCategoriesTab({ estateId }: Readonly<Props>) {
  const dispatch = useDispatch<AppDispatch>();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<AssetCategory | null>(null);
  const [categoryToDelete, setCategoryToDelete] = useState<AssetCategory | null>(null);

  const {
    categories,
    pagination,
    createStatus,
    updateStatus,
    deleteStatus,
  } = useSelector((state: RootState) => {
    const s = state.residentAsset;
    return {
      categories: s?.categories ?? [],
      pagination: s?.categoriesPagination ?? null,
      createStatus: s?.createCategoryStatus ?? "idle",
      updateStatus: s?.updateCategoryStatus ?? "idle",
      deleteStatus: s?.deleteCategoryStatus ?? "idle",
    };
  });

  useEffect(() => {
    if (!estateId) return;
    dispatch(getAssetCategories({ estateId, page, limit: PAGE_SIZE, search }))
      .unwrap()
      .catch(() => toast.error("Failed to load asset categories."));
  }, [dispatch, estateId, page, search]);

  const handleConfirmDelete = async () => {
    if (!categoryToDelete || !estateId) return;
    const id = getId(categoryToDelete);
    if (!id) return;
    await dispatch(deleteAssetCategory({ id, estateId })).unwrap();
    toast.success("Category deleted.");
    setPage(1);
  };

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
                if (!getId(item)) return;
                setCategoryToDelete(item);
              }}
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        ),
      },
    ],
    [deleteStatus],
  );

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
        await dispatch(
          createAssetCategory({ name: payload.name, estateId }),
        ).unwrap();
        toast.success("Category created.");
      }
      setModalOpen(false);
      setEditing(null);
      setPage(1);
    } catch (err: unknown) {
      const message =
        (err as { message?: string })?.message ?? "Failed to save category.";
      toast.error(message);
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
          onClick={() => {
            setEditing(null);
            setModalOpen(true);
          }}
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
          total: Number(pagination?.total ?? categories.length),
          current: Number(pagination?.page ?? pagination?.currentPage ?? page) || page,
          pageSize: Number(pagination?.limit ?? pagination?.pageSize ?? PAGE_SIZE) || PAGE_SIZE,
        }}
        onPageChange={(p) => setPage(p)}
        enableExport
        exportFileName="asset-categories"
        onExportRequest={() => Promise.resolve(categories)}
      />

      <AssetCategoryFormModal
        visible={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setEditing(null);
        }}
        initial={editing}
        loading={createStatus === "isLoading" || updateStatus === "isLoading"}
        onSubmit={handleSubmit}
      />

      <DeleteModal
        visible={!!categoryToDelete}
        onClose={() => setCategoryToDelete(null)}
        itemName={categoryToDelete?.name ?? "this category"}
        title="Delete category"
        loading={deleteStatus === "isLoading"}
        onConfirm={handleConfirmDelete}
      />
    </div>
  );
}
