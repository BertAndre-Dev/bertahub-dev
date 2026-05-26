import { createAsyncThunk } from "@reduxjs/toolkit";
import axiosInstance from "@/utils/axiosInstance";

export type ApiPagination = {
  total?: number;
  page?: number;
  limit?: number;
  pages?: number;
};

export type CompanyOperationsReportingType = {
  id?: string;
  _id?: string;
  estateId?: string;
  name: string;
  description?: string;
  createdAt?: string;
  updatedAt?: string;
};

export type CompanyOperationsReportingField = {
  id?: string;
  _id?: string;
  estateId?: string;
  typeId?: string;
  label: string;
  key: string;
  createdAt?: string;
  updatedAt?: string;
};

export type CompanyOperationsReportingEntry = {
  id?: string;
  _id?: string;
  fieldId?: string;
  data?: Record<string, unknown>;
  createdAt?: string;
  updatedAt?: string;
};

const normalizeId = (id: string | undefined) => id ?? "";

function getErrorMessage(error: unknown, fallback: string) {
  const err = error as { response?: { data?: { message?: string | string[] } } };
  const msg = err?.response?.data?.message;
  return Array.isArray(msg) ? msg[0] : msg ?? fallback;
}

/** GET /api/v1/operations-reporting/types?estateId=... */
export const getCompanyOperationsReportingTypes = createAsyncThunk(
  "company-operations-reporting/getTypes",
  async (estateId: string, { rejectWithValue }) => {
    const estateIdValue = normalizeId(estateId).trim();
    if (!estateIdValue) {
      return rejectWithValue({ message: "Estate is required." });
    }
    try {
      const res = await axiosInstance.get(
        "/api/v1/operations-reporting/types",
        { params: { estateId: estateIdValue } },
      );
      return res.data as {
        success?: boolean;
        message?: string;
        data?: CompanyOperationsReportingType[];
        pagination?: ApiPagination;
      };
    } catch (error: unknown) {
      return rejectWithValue({
        message: getErrorMessage(error, "Failed to fetch reporting types"),
      });
    }
  },
);

/** GET /api/v1/operations-reporting/fields?typeId=... */
export const getCompanyOperationsReportingFields = createAsyncThunk(
  "company-operations-reporting/getFields",
  async (typeId: string, { rejectWithValue }) => {
    const typeIdValue = normalizeId(typeId).trim();
    if (!typeIdValue) {
      return rejectWithValue({ message: "Reporting type is required." });
    }
    try {
      const res = await axiosInstance.get("/api/v1/operations-reporting/fields", {
        params: { typeId: typeIdValue },
      });
      return res.data as {
        success?: boolean;
        message?: string;
        data?: CompanyOperationsReportingField[];
        pagination?: ApiPagination;
      };
    } catch (error: unknown) {
      return rejectWithValue({
        message: getErrorMessage(error, "Failed to fetch reporting fields"),
      });
    }
  },
);

/** GET /api/v1/operations-reporting/fields/{fieldId}/entries */
export const getCompanyOperationsReportingEntries = createAsyncThunk(
  "company-operations-reporting/getEntries",
  async (fieldId: string, { rejectWithValue }) => {
    const fieldIdValue = normalizeId(fieldId).trim();
    if (!fieldIdValue) {
      return rejectWithValue({ message: "Report field is required." });
    }
    try {
      const res = await axiosInstance.get(
        `/api/v1/operations-reporting/fields/${fieldIdValue}/entries`,
      );
      return res.data as {
        success?: boolean;
        message?: string;
        data?: CompanyOperationsReportingEntry[];
        pagination?: ApiPagination;
      };
    } catch (error: unknown) {
      return rejectWithValue({
        message: getErrorMessage(error, "Failed to fetch report entries"),
      });
    }
  },
);
