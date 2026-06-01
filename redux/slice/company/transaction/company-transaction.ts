import { createAsyncThunk } from "@reduxjs/toolkit";
import axiosInstance from "@/utils/axiosInstance";

interface VerifyTransactionPayload {
  tx_ref: string;
  paymentType?: string;
}

export const getCompanyTransactionHistory = createAsyncThunk(
  "company-transaction/getCompanyTransactionHistory",
  async (
    {
      companyId,
      estateId,
      page = 1,
      limit = 10,
      type,
      paymentStatus,
      search,
      startDate,
      endDate,
    }: {
      companyId?: string;
      estateId?: string;
      page?: number;
      limit?: number;
      type?: string;
      paymentStatus?: string;
      search?: string;
      startDate?: string;
      endDate?: string;
    },
    { rejectWithValue },
  ) => {
    try {
      if (estateId) {
        const params: Record<string, string | number> = {
          estateId,
          page,
          limit,
        };
        if (type) params.type = type;
        if (paymentStatus) params.paymentStatus = paymentStatus;
        if (search?.trim()) params.search = search.trim();

        const res = await axiosInstance.get(
          "/api/v1/transaction-mgt/estate-history",
          { params },
        );
        return res.data;
      }

      if (!companyId) {
        return rejectWithValue({
          message: "Company or estate is required to fetch transactions.",
        });
      }

      const params: Record<string, string | number> = {
        companyId,
        page,
        limit,
      };

      if (estateId) params.estateId = estateId;
      if (type) params.type = type;
      if (paymentStatus) params.paymentStatus = paymentStatus;
      if (search?.trim()) params.search = search.trim();
      if (startDate) params.startDate = startDate;
      if (endDate) params.endDate = endDate;

      const res = await axiosInstance.get(
        "/api/v1/transaction-mgt/company-history",
        { params },
      );
      return res.data;
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      return rejectWithValue({
        message:
          err?.response?.data?.message ||
          "Failed to fetch transaction history",
      });
    }
  },
);

export const getCompanyVends = createAsyncThunk(
  "company-transaction/getCompanyVends",
  async (
    {
      companyId,
      estateId,
      page = 1,
      limit = 10,
      startDate,
      endDate,
    }: {
      companyId?: string;
      estateId?: string;
      page?: number;
      limit?: number;
      startDate?: string;
      endDate?: string;
    },
    { rejectWithValue },
  ) => {
    try {
      const params = new URLSearchParams();
      if (page != null) params.set("page", String(page));
      if (limit != null) params.set("limit", String(limit));
      if (startDate) params.set("startDate", startDate);
      if (endDate) params.set("endDate", endDate);
      const query = params.toString();
      const suffix = query ? `?${query}` : "";

      if (estateId) {
        const res = await axiosInstance.get(
          `/api/v1/meters/estate/${estateId}/vends${suffix}`,
        );
        return res.data;
      }

      if (!companyId) {
        return rejectWithValue({
          message: "Company or estate is required to fetch vends.",
        });
      }

      const res = await axiosInstance.get(
        `/api/v1/meters/company/${companyId}/vends${suffix}`,
      );
      return res.data;
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      return rejectWithValue({
        message: err?.response?.data?.message || "Failed to fetch vends",
      });
    }
  },
);

export const getCompanyPaidBills = createAsyncThunk(
  "company-transaction/getCompanyPaidBills",
  async (
    {
      estateId,
      page = 1,
      limit = 10,
      startDate,
      endDate,
    }: {
      estateId: string;
      page?: number;
      limit?: number;
      startDate?: string;
      endDate?: string;
    },
    { rejectWithValue },
  ) => {
    try {
      if (!estateId) {
        return rejectWithValue({
          message: "Estate is required to fetch paid bills.",
        });
      }

      const params = new URLSearchParams();
      if (page != null) params.set("page", String(page));
      if (limit != null) params.set("limit", String(limit));
      if (startDate) params.set("startDate", startDate);
      if (endDate) params.set("endDate", endDate);
      const query = params.toString();
      const suffix = query ? `?${query}` : "";
      const res = await axiosInstance.get(
        `/api/v1/bills-mgt/paid/${estateId}${suffix}`,
      );
      return res.data;
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      return rejectWithValue({
        message:
          err?.response?.data?.message || "Failed to fetch paid bills",
      });
    }
  },
);

export const verifyCompanyTransaction = createAsyncThunk(
  "company-transaction/verifyCompanyTransaction",
  async ({ tx_ref }: VerifyTransactionPayload, { rejectWithValue }) => {
    try {
      if (!tx_ref) {
        throw new Error("Missing transaction reference for verification");
      }

      const response = await axiosInstance.post(
        `/api/v1/transaction-mgt/verify?tx_ref=${encodeURIComponent(tx_ref)}`,
        {},
      );

      return response.data;
    } catch (error: unknown) {
      const err = error as {
        response?: { data?: { message?: string } };
        message?: string;
      };
      return rejectWithValue(
        err.response?.data || { message: err.message || "Verification failed" },
      );
    }
  },
);
