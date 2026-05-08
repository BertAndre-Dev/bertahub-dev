import { createSlice } from "@reduxjs/toolkit";
import {
  createAssetCategory,
  deleteAssetCategory,
  getAssetCategories,
  updateAssetCategory,
  createAssets,
  deleteAsset,
  getAssetById,
  getAssets,
  updateAsset,
  type Asset,
  type AssetCategory,
  type ApiPagination,
} from "./company-asset";

type AsyncStatus = "idle" | "isLoading" | "succeeded" | "failed";

export interface CompanyAssetState {
  // Categories
  categories: AssetCategory[];
  categoriesPagination: ApiPagination | null;
  getCategoriesStatus: AsyncStatus;
  createCategoryStatus: AsyncStatus;
  updateCategoryStatus: AsyncStatus;
  deleteCategoryStatus: AsyncStatus;

  // Assets
  assets: Asset[];
  assetsPagination: ApiPagination | null;
  getAssetsStatus: AsyncStatus;
  getAssetStatus: AsyncStatus;
  createAssetsStatus: AsyncStatus;
  updateAssetStatus: AsyncStatus;
  deleteAssetStatus: AsyncStatus;
  currentAsset: Asset | null;

  error: string | null;
}

const initialState: CompanyAssetState = {
  categories: [],
  categoriesPagination: null,
  getCategoriesStatus: "idle",
  createCategoryStatus: "idle",
  updateCategoryStatus: "idle",
  deleteCategoryStatus: "idle",

  assets: [],
  assetsPagination: null,
  getAssetsStatus: "idle",
  getAssetStatus: "idle",
  createAssetsStatus: "idle",
  updateAssetStatus: "idle",
  deleteAssetStatus: "idle",
  currentAsset: null,

  error: null,
};

function getId(v: { id?: string; _id?: string } | undefined) {
  return v?.id || v?._id || "";
}

const companyAssetSlice = createSlice({
  name: "companyAsset",
  initialState,
  reducers: {
    clearCompanyAssetError: (state) => {
      state.error = null;
    },
    clearCurrentAsset: (state) => {
      state.currentAsset = null;
      state.getAssetStatus = "idle";
    },
  },
  extraReducers: (builder) => {
    // ── Categories
    builder
      .addCase(getAssetCategories.pending, (state) => {
        state.getCategoriesStatus = "isLoading";
        state.error = null;
      })
      .addCase(getAssetCategories.fulfilled, (state, action) => {
        state.getCategoriesStatus = "succeeded";
        state.categories = action.payload?.data ?? [];
        state.categoriesPagination = action.payload?.pagination ?? null;
      })
      .addCase(getAssetCategories.rejected, (state, action) => {
        state.getCategoriesStatus = "failed";
        state.categories = [];
        state.categoriesPagination = null;
        state.error =
          (action.payload as { message?: string } | undefined)?.message ??
          action.error.message ??
          "Failed to fetch asset categories";
      })
      .addCase(createAssetCategory.pending, (state) => {
        state.createCategoryStatus = "isLoading";
        state.error = null;
      })
      .addCase(createAssetCategory.fulfilled, (state, action) => {
        state.createCategoryStatus = "succeeded";
        const created = action.payload?.data;
        if (created) state.categories = [created, ...state.categories];
      })
      .addCase(createAssetCategory.rejected, (state, action) => {
        state.createCategoryStatus = "failed";
        state.error =
          (action.payload as { message?: string } | undefined)?.message ??
          action.error.message ??
          "Failed to create asset category";
      })
      .addCase(updateAssetCategory.pending, (state) => {
        state.updateCategoryStatus = "isLoading";
        state.error = null;
      })
      .addCase(updateAssetCategory.fulfilled, (state, action) => {
        state.updateCategoryStatus = "succeeded";
        const updated = (action.payload as any)?.data as AssetCategory | undefined;
        const id = (action.payload as any)?.id as string | undefined;
        const updatedId = getId(updated) || id;
        if (updatedId) {
          const idx = state.categories.findIndex((c) => getId(c) === updatedId);
          if (idx !== -1) state.categories[idx] = { ...state.categories[idx], ...updated };
        }
      })
      .addCase(updateAssetCategory.rejected, (state, action) => {
        state.updateCategoryStatus = "failed";
        state.error =
          (action.payload as { message?: string } | undefined)?.message ??
          action.error.message ??
          "Failed to update asset category";
      })
      .addCase(deleteAssetCategory.pending, (state) => {
        state.deleteCategoryStatus = "isLoading";
        state.error = null;
      })
      .addCase(deleteAssetCategory.fulfilled, (state, action) => {
        state.deleteCategoryStatus = "succeeded";
        const id = (action.payload as any)?.deletedId as string | undefined;
        if (id) state.categories = state.categories.filter((c) => getId(c) !== id);
      })
      .addCase(deleteAssetCategory.rejected, (state, action) => {
        state.deleteCategoryStatus = "failed";
        state.error =
          (action.payload as { message?: string } | undefined)?.message ??
          action.error.message ??
          "Failed to delete asset category";
      });

    // ── Assets
    builder
      .addCase(getAssets.pending, (state) => {
        state.getAssetsStatus = "isLoading";
        state.error = null;
      })
      .addCase(getAssets.fulfilled, (state, action) => {
        state.getAssetsStatus = "succeeded";
        state.assets = action.payload?.data ?? [];
        state.assetsPagination = action.payload?.pagination ?? null;
      })
      .addCase(getAssets.rejected, (state, action) => {
        state.getAssetsStatus = "failed";
        state.assets = [];
        state.assetsPagination = null;
        state.error =
          (action.payload as { message?: string } | undefined)?.message ??
          action.error.message ??
          "Failed to fetch assets";
      })
      .addCase(getAssetById.pending, (state) => {
        state.getAssetStatus = "isLoading";
        state.error = null;
      })
      .addCase(getAssetById.fulfilled, (state, action) => {
        state.getAssetStatus = "succeeded";
        state.currentAsset = action.payload?.data ?? null;
      })
      .addCase(getAssetById.rejected, (state, action) => {
        state.getAssetStatus = "failed";
        state.currentAsset = null;
        state.error =
          (action.payload as { message?: string } | undefined)?.message ??
          action.error.message ??
          "Failed to fetch asset";
      })
      .addCase(createAssets.pending, (state) => {
        state.createAssetsStatus = "isLoading";
        state.error = null;
      })
      .addCase(createAssets.fulfilled, (state, action) => {
        state.createAssetsStatus = "succeeded";
        const created = (action.payload as any)?.data as Asset | Asset[] | undefined;
        const createdRows = Array.isArray(created) ? created : created ? [created] : [];
        if (createdRows.length) state.assets = [...createdRows, ...state.assets];
      })
      .addCase(createAssets.rejected, (state, action) => {
        state.createAssetsStatus = "failed";
        state.error =
          (action.payload as { message?: string } | undefined)?.message ??
          action.error.message ??
          "Failed to create asset(s)";
      })
      .addCase(updateAsset.pending, (state) => {
        state.updateAssetStatus = "isLoading";
        state.error = null;
      })
      .addCase(updateAsset.fulfilled, (state, action) => {
        state.updateAssetStatus = "succeeded";
        const updated = (action.payload as any)?.data as Asset | undefined;
        const id = (action.payload as any)?.id as string | undefined;
        const updatedId = getId(updated) || id;
        if (updatedId) {
          const idx = state.assets.findIndex((a) => getId(a) === updatedId);
          if (idx !== -1) state.assets[idx] = { ...state.assets[idx], ...updated };
        }
        if (state.currentAsset && getId(state.currentAsset) === updatedId) {
          state.currentAsset = { ...state.currentAsset, ...updated };
        }
      })
      .addCase(updateAsset.rejected, (state, action) => {
        state.updateAssetStatus = "failed";
        state.error =
          (action.payload as { message?: string } | undefined)?.message ??
          action.error.message ??
          "Failed to update asset";
      })
      .addCase(deleteAsset.pending, (state) => {
        state.deleteAssetStatus = "isLoading";
        state.error = null;
      })
      .addCase(deleteAsset.fulfilled, (state, action) => {
        state.deleteAssetStatus = "succeeded";
        const id = (action.payload as any)?.deletedId as string | undefined;
        if (id) state.assets = state.assets.filter((a) => getId(a) !== id);
        if (state.currentAsset && getId(state.currentAsset) === id) {
          state.currentAsset = null;
        }
      })
      .addCase(deleteAsset.rejected, (state, action) => {
        state.deleteAssetStatus = "failed";
        state.error =
          (action.payload as { message?: string } | undefined)?.message ??
          action.error.message ??
          "Failed to delete asset";
      });
  },
});

export const { clearCompanyAssetError, clearCurrentAsset } =
  companyAssetSlice.actions;
export default companyAssetSlice.reducer;

