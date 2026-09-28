import { createAsyncThunk } from "@reduxjs/toolkit";
import axiosInstance from "@/utils/axiosInstance";
import { apiErrorRejectValue } from "@/lib/api-error";
import type {
  PlatformFeeListItem,
  PlatformFeeQueryParams,
  PlatformFeeResponse,
} from "@/types/analytics";

export const PLATFORM_FEE_MAX_PAGE_SIZE = 50;

function toRequestParams(
  params: PlatformFeeQueryParams,
): Record<string, string | number> {
  const query: Record<string, string | number> = {
    startDate: params.startDate,
    endDate: params.endDate,
  };
  const estateId = params.estateId?.trim();
  const companyId = params.companyId?.trim();
  if (estateId) query.estateId = estateId;
  if (companyId) query.companyId = companyId;
  if (params.page != null) query.page = params.page;
  if (params.limit != null) {
    query.limit = Math.min(params.limit, PLATFORM_FEE_MAX_PAGE_SIZE);
  }
  return query;
}

/** Fetches every settled-fee row for the current filters without touching Redux. */
export async function fetchAllPlatformFeeList(
  params: Omit<PlatformFeeQueryParams, "page" | "limit">,
): Promise<PlatformFeeListItem[]> {
  const items: PlatformFeeListItem[] = [];
  let page = 1;
  let pages = 1;

  const MAX_PAGES = 100;
  do {
    const res = await axiosInstance.get<PlatformFeeResponse>(
      "/api/v1/analytics/finance/platform-fees",
      {
        params: toRequestParams({
          ...params,
          page,
          limit: PLATFORM_FEE_MAX_PAGE_SIZE,
        }),
      },
    );
    items.push(...(res.data.data?.list ?? []));
    pages = Math.max(1, Number(res.data.pagination?.pages) || 1);
    page += 1;
  } while (page <= pages && page <= MAX_PAGES);

  return items;
}

/** GET /api/v1/analytics/finance/platform-fees */
export const getPlatformFeeAnalytics = createAsyncThunk(
  "super-admin-platform-fees/get",
  async (params: PlatformFeeQueryParams, { rejectWithValue }) => {
    try {
      const res = await axiosInstance.get<PlatformFeeResponse>(
        "/api/v1/analytics/finance/platform-fees",
        { params: toRequestParams(params) },
      );
      return res.data;
    } catch (error: unknown) {
      return rejectWithValue(apiErrorRejectValue(error));
    }
  },
);
