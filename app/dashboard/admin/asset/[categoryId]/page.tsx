"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useDispatch, useSelector } from "react-redux";
import { toast } from "react-toastify";
import { CiSearch } from "react-icons/ci";
import {
  ArrowLeft,
  MapPin,
  Pencil,
  Trash2,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Loader from "@/components/ui/Loader";
import Table from "@/components/tables/list/page";
import DeleteModal from "@/components/resident/delete-modal/page";
import { getApiErrorMessage } from "@/lib/api-error";
import { isBusy, isPending, isSettled } from "@/lib/async-status";
import { slugify } from "@/lib/slug";
import type { AppDispatch, RootState } from "@/redux/store";
import { getSignedInUser } from "@/redux/slice/auth-mgt/auth-mgt";
import {
  createAssets,
  deleteAsset,
  deleteAssetCategory,
  getAssetCategories,
  getAssets,
  updateAsset,
  updateAssetCategory,
  type Asset,
  type AssetCategory,
} from "@/redux/slice/admin/asset-mgt/admin-asset";
import { parseAdminEstate } from "../lib/estate";
import AssetCategoryFormModal from "../components/AssetCategoryFormModal";
import AssetFormModal from "../components/AssetFormModal";
import AssetEditModal from "../components/AssetEditModal";

const PAGE_SIZE = 10;

function getId(v: { id?: string; _id?: string } | undefined) {
  return v?.id || v?._id || "";
}

export default function AssetCategoryDetailPage() {
  const dispatch = useDispatch<AppDispatch>();
  const router = useRouter();
  const params = useParams<{ categoryId: string }>();
  const slugOrId = params?.categoryId ?? "";

  const [estateId, setEstateId] = useState("");
  const [estateName, setEstateName] = useState("Estate");
  const [bootstrapping, setBootstrapping] = useState(true);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

  const [editCategoryOpen, setEditCategoryOpen] = useState(false);
  const [deleteCategoryOpen, setDeleteCategoryOpen] = useState(false);
  const [addAssetOpen, setAddAssetOpen] = useState(false);
  const [editingAsset, setEditingAsset] = useState<Asset | null>(null);
  const [assetToDelete, setAssetToDelete] = useState<Asset | null>(null);

  const {
    categories,
    categoriesStatus,
    assets,
    assetsPagination,
    assetsStatus,
    updateCategoryStatus,
    deleteCategoryStatus,
    createAssetsStatus,
    updateAssetStatus,
    deleteAssetStatus,
  } = useSelector((state: RootState) => {
    const s = state.adminAsset;
    return {
      categories: s?.categories ?? [],
      categoriesStatus: s?.getCategoriesStatus as string | undefined,
      assets: s?.assets ?? [],
      assetsPagination: s?.assetsPagination ?? null,
      assetsStatus: s?.getAssetsStatus as string | undefined,
      updateCategoryStatus: s?.updateCategoryStatus ?? "idle",
      deleteCategoryStatus: s?.deleteCategoryStatus ?? "idle",
      createAssetsStatus: s?.createAssetsStatus ?? "idle",
      updateAssetStatus: s?.updateAssetStatus ?? "idle",
      deleteAssetStatus: s?.deleteAssetStatus ?? "idle",
    };
  });

  useEffect(() => {
    (async () => {
      try {
        const userRes = await dispatch(getSignedInUser()).unwrap();
        const data = (userRes?.data ?? userRes) as Record<string, unknown>;
        const estate = parseAdminEstate(data);
        if (!estate) {
          toast.warning("No estate linked to your account.");
          return;
        }
        setEstateId(estate.id);
        setEstateName(estate.name);
      } catch (err: unknown) {
        const message = getApiErrorMessage(err);
        if (message) toast.error(message);
      } finally {
        setBootstrapping(false);
      }
    })();
  }, [dispatch]);

  useEffect(() => {
    if (!estateId) return;
    dispatch(
      getAssetCategories({ estateId, page: 1, limit: 200 }),
    ).catch(() => {});
  }, [dispatch, estateId]);

  const category: AssetCategory | null = useMemo(() => {
    if (!slugOrId) return null;
    const byId = categories.find((c) => getId(c) === slugOrId);
    if (byId) return byId;
    return (
      categories.find((c) => slugify(c.name ?? "") === slugOrId) ?? null
    );
  }, [categories, slugOrId]);

  const categoryId = getId(category ?? undefined);

  useEffect(() => {
    if (!estateId || !categoryId) return;
    dispatch(
      getAssets({
        estateId,
        page,
        limit: PAGE_SIZE,
        search,
        assetCategoryId: categoryId,
      }),
    )
      .unwrap()
      .catch((err: unknown) => {
        const message = getApiErrorMessage(err);
        if (message) toast.error(message);
      });
  }, [dispatch, estateId, categoryId, page, search]);

  const visibleAssets = useMemo(() => {
    if (!categoryId) return assets;
    return assets.filter((a) => {
      const aid =
        typeof a.assetCategoryId === "string"
          ? a.assetCategoryId
          : getId(a.assetCategoryId);
      return aid === categoryId;
    });
  }, [assets, categoryId]);

  const columns = useMemo(
    () => [
      {
        key: "createdAt" as const,
        header: "Date",
        render: (item: Asset) =>
          item.createdAt
            ? new Date(item.createdAt).toLocaleDateString()
            : item.datePurchased
              ? new Date(item.datePurchased).toLocaleDateString()
              : "—",
        exportValue: (item: Asset) =>
          item.createdAt ?? item.datePurchased ?? "",
      },
      {
        key: "assetCategoryId" as const,
        header: "Asset Category",
        render: () => category?.name ?? "—",
        exportValue: () => category?.name ?? "",
      },
      { key: "name" as const, header: "Asset Name" },
      { key: "tag" as const, header: "Asset Code" },
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
        key: "datePurchased" as const,
        header: "Purchased",
        render: (item: Asset) =>
          item.datePurchased
            ? new Date(item.datePurchased).toLocaleDateString()
            : "—",
        exportValue: (item: Asset) => item.datePurchased ?? "",
      },
      {
        key: "actions" as const,
        header: "Action",
        exportable: false,
        render: (item: Asset) => (
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              className="text-[#0150AC] hover:text-[#01408A] h-8"
              onClick={(e) => {
                e.stopPropagation();
                setEditingAsset(item);
              }}
            >
              <Pencil className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="text-destructive hover:text-destructive h-8"
              disabled={isBusy(deleteAssetStatus)}
              onClick={(e) => {
                e.stopPropagation();
                const id = getId(item);
                if (!id) return;
                setAssetToDelete(item);
              }}
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        ),
      },
    ],
    [category, deleteAssetStatus, dispatch],
  );

  const handleEditCategory = async (payload: { name: string }) => {
    if (!categoryId) return;
    try {
      await dispatch(
        updateAssetCategory({ id: categoryId, name: payload.name }),
      ).unwrap();
      toast.success("Category updated.");
      setEditCategoryOpen(false);
    } catch (err: unknown) {
      const message = getApiErrorMessage(err);
      if (message) toast.error(message);
    }
  };

  const handleDeleteCategory = async () => {
    if (!categoryId || !estateId) return;
    try {
      await dispatch(
        deleteAssetCategory({ id: categoryId, estateId }),
      ).unwrap();
      toast.success("Category deleted.");
      router.push("/dashboard/admin/asset");
    } catch (err: unknown) {
      const message = getApiErrorMessage(err);
      if (message) toast.error(message);
    }
  };

  const handleConfirmDeleteAsset = async () => {
    if (!assetToDelete) return;
    const id = getId(assetToDelete);
    if (!id) return;
    try {
      await dispatch(deleteAsset(id)).unwrap();
      toast.success("Asset deleted.");
      setAssetToDelete(null);
    } catch (err: unknown) {
      const message = getApiErrorMessage(err);
      if (message) toast.error(message);
      throw err;
    }
  };


  const handleAddAssets = async (
    payloads: Parameters<
      React.ComponentProps<typeof AssetFormModal>["onSubmit"]
    >[0],
  ) => {
    try {
      await dispatch(createAssets({ assets: payloads })).unwrap();
      toast.success(
        payloads.length > 1
          ? `${payloads.length} assets added.`
          : "Asset added.",
      );
      setAddAssetOpen(false);
      if (estateId) {
        dispatch(
          getAssets({
            estateId,
            page,
            limit: PAGE_SIZE,
            search,
            assetCategoryId: categoryId,
          }),
        ).catch(() => {});
      }
    } catch (err: unknown) {
      const message = getApiErrorMessage(err);
      if (message) toast.error(message);
    }
  };

  const handleEditAssetSubmit = async (
    payload: Parameters<
      React.ComponentProps<typeof AssetEditModal>["onSubmit"]
    >[0],
  ) => {
    const id = getId(editingAsset ?? undefined);
    if (!id) return;
    try {
      await dispatch(updateAsset({ id, ...payload })).unwrap();
      toast.success("Asset updated.");
      setEditingAsset(null);
    } catch (err: unknown) {
      const message = getApiErrorMessage(err);
      if (message) toast.error(message);
    }
  };

  const totalAssets = Number(
    assetsPagination?.total ?? visibleAssets.length ?? 0,
  );

  const pageLoading =
    bootstrapping ||
    (Boolean(estateId) &&
      (isPending(categoriesStatus) ||
        (Boolean(categoryId) && isPending(assetsStatus))));
  const categoryMissing =
    isSettled(categoriesStatus) && categories.length > 0 && !category;

  return (
    <div className="relative">
      {pageLoading && <Loader fullScreen label="Loading assets..." />}

      <div
        className={`space-y-6${pageLoading ? " pointer-events-none select-none" : ""}`}
      >
        <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
          <div className="flex items-start gap-2">
            <button
              type="button"
              aria-label="Back to asset categories"
              onClick={() => router.push("/dashboard/admin/asset")}
              className="mt-1 h-8 w-8 grid place-items-center rounded-full hover:bg-muted cursor-pointer"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="font-heading text-2xl sm:text-3xl font-bold">
                Asset Category – {category?.name ?? "—"}
              </h1>
              <p className="text-muted-foreground mt-1">
                Manage your assets in{" "}
                <span className="font-bold underline uppercase text-black">
                  {estateName}
                </span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              aria-label="Edit category"
              onClick={() => setEditCategoryOpen(true)}
              disabled={!category}
              className="text-[#0150AC] hover:text-[#01408A] h-9 w-9 grid place-items-center rounded-full border border-border bg-white hover:bg-muted disabled:opacity-50 cursor-pointer"
            >
              <Pencil className="w-4 h-4" />
            </button>
            <button
              type="button"
              aria-label="Delete category"
              onClick={() => setDeleteCategoryOpen(true)}
              disabled={!category}
              className="text-rose-600 hover:text-rose-700 h-9 w-9 grid place-items-center rounded-full border border-rose-200 bg-rose-50 hover:bg-rose-100 disabled:opacity-50 cursor-pointer"
            >
              <Trash2 className="w-4 h-4" />
            </button>
            <Button
              onClick={() => setAddAssetOpen(true)}
              disabled={!category}
              className="text-white"
              style={{ backgroundColor: "#0150AC" }}
            >
              + Add Asset
            </Button>
          </div>
        </div>

        {categoryMissing ? (
          <Card className="p-10 mt-0 text-center">
            <p className="text-muted-foreground">
              This asset category could not be found.
            </p>
            <Button
              variant="outline"
              className="mt-4"
              onClick={() => router.push("/dashboard/admin/asset")}
            >
              Back to categories
            </Button>
          </Card>
        ) : (
          <>
            <Card className="p-4 mt-0">
              <div className="relative">
                <CiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <Input
                  placeholder="Search by name or asset ID"
                  className="pl-10 h-11"
                  value={search}
                  onChange={(e) => {
                    setSearch(e.target.value);
                    setPage(1);
                  }}
                />
              </div>
            </Card>

            <Card className="p-6 mt-0">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Asset</p>
                  <p className="font-heading text-3xl font-bold mt-1">
                    {visibleAssets.length}
                  </p>
                </div>
                <div className="p-3 rounded-full bg-[#D0DFF280]">
                  <MapPin className="w-5 h-5 text-[#0150AC]" />
                </div>
              </div>
            </Card>

            <Card className="p-2 mt-0">
              <Table
                columns={columns}
                data={visibleAssets}
                emptyMessage={
                  search.trim()
                    ? "No assets match your search."
                    : "No assets in this category yet."
                }
                showPagination
                paginationInfo={{
                  total: totalAssets,
                  current:
                    Number(
                      assetsPagination?.page ??
                        assetsPagination?.currentPage ??
                        page,
                    ) || page,
                  pageSize:
                    Number(
                      assetsPagination?.limit ??
                        assetsPagination?.pageSize ??
                        PAGE_SIZE,
                    ) || PAGE_SIZE,
                }}
                onPageChange={(p) => setPage(p)}
              />
            </Card>
          </>
        )}

        <AssetCategoryFormModal
          visible={editCategoryOpen}
          onClose={() => setEditCategoryOpen(false)}
          loading={isBusy(updateCategoryStatus)}
          initial={category}
          onSubmit={handleEditCategory}
        />

        <DeleteModal
          visible={deleteCategoryOpen}
          onClose={() => setDeleteCategoryOpen(false)}
          title="Delete category"
          itemName={category?.name ?? "this category"}
          loading={isBusy(deleteCategoryStatus)}
          onConfirm={handleDeleteCategory}
        />
        <DeleteModal
          visible={Boolean(assetToDelete)}
          onClose={() => setAssetToDelete(null)}
          title="Delete asset"
          itemName={assetToDelete?.name ?? "this asset"}
          loading={isBusy(deleteAssetStatus)}
          onConfirm={handleConfirmDeleteAsset}
        />

        <AssetFormModal
          visible={addAssetOpen}
          onClose={() => setAddAssetOpen(false)}
          loading={isBusy(createAssetsStatus)}
          category={category}
          estateId={estateId}
          onSubmit={handleAddAssets}
        />

        <AssetEditModal
          visible={!!editingAsset}
          onClose={() => setEditingAsset(null)}
          loading={isBusy(updateAssetStatus)}
          category={category}
          asset={editingAsset}
          onSubmit={handleEditAssetSubmit}
        />
      </div>
    </div>
  );
}
