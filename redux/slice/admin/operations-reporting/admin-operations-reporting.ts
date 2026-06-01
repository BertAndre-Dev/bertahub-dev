import { createAsyncThunk } from "@reduxjs/toolkit";
import axiosInstance from "@/utils/axiosInstance";
import { labelToReportingFieldKey } from "@/lib/operations-reporting-field-key";

export type ApiPagination = {
  total?: number;
  page?: number;
  limit?: number;
  pages?: number;
};

export type OperationsReportingType = {
  id?: string;
  _id?: string;
  estateId?: string;
  name: string;
  description?: string;
  createdAt?: string;
  updatedAt?: string;
};

export type OperationsReportingField = {
  id?: string;
  _id?: string;
  estateId?: string;
  typeId?: string;
  label: string;
  key: string;
  createdAt?: string;
  updatedAt?: string;
};

export type OperationsReportingEntry = {
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

/** POST /api/v1/operations-reporting/types */
export const createOperationsReportingType = createAsyncThunk(
  "admin-operations-reporting/createType",
  async (
    payload: { estateId: string; name: string; description?: string },
    { rejectWithValue },
  ) => {
    try {
      const res = await axiosInstance.post(
        "/api/v1/operations-reporting/types",
        payload,
      );
      return res.data as {
        success?: boolean;
        message?: string;
        data?: OperationsReportingType;
      };
    } catch (error: unknown) {
      return rejectWithValue({
        message: getErrorMessage(error, "Failed to create reporting type"),
      });
    }
  },
);

export type GetOperationsReportingTypesParams = {
  estateId: string;
  page?: number;
  limit?: number;
};

/** GET /api/v1/operations-reporting/types?estateId=... */
export const getOperationsReportingTypes = createAsyncThunk(
  "admin-operations-reporting/getTypes",
  async (
    { estateId, page = 1, limit = 10 }: GetOperationsReportingTypesParams,
    { rejectWithValue },
  ) => {
    try {
      const res = await axiosInstance.get(
        "/api/v1/operations-reporting/types",
        {
          params: {
            estateId: normalizeId(estateId).trim(),
            page,
            limit,
          },
        },
      );
      return res.data as {
        success?: boolean;
        message?: string;
        data?: OperationsReportingType[];
        pagination?: ApiPagination;
      };
    } catch (error: unknown) {
      return rejectWithValue({
        message: getErrorMessage(error, "Failed to fetch reporting types"),
      });
    }
  },
);

/** GET /api/v1/operations-reporting/types/{typeId}?estateId=... */
export const getOperationsReportingTypeById = createAsyncThunk(
  "admin-operations-reporting/getTypeById",
  async (
    { typeId, estateId }: { typeId: string; estateId: string },
    { rejectWithValue },
  ) => {
    try {
      const res = await axiosInstance.get(
        `/api/v1/operations-reporting/types/${normalizeId(typeId)}`,
        { params: { estateId: normalizeId(estateId).trim() } },
      );
      return res.data as {
        success?: boolean;
        message?: string;
        data?: OperationsReportingType;
      };
    } catch (error: unknown) {
      return rejectWithValue({
        message: getErrorMessage(error, "Failed to fetch reporting type"),
      });
    }
  },
);

/** PUT /api/v1/operations-reporting/types/{typeId} */
export const updateOperationsReportingType = createAsyncThunk(
  "admin-operations-reporting/updateType",
  async (
    {
      typeId,
      name,
      description,
    }: { typeId: string; name: string; description?: string },
    { rejectWithValue },
  ) => {
    try {
      const res = await axiosInstance.put(
        `/api/v1/operations-reporting/types/${normalizeId(typeId)}`,
        { name, description },
      );
      return {
        ...(res.data as object),
        typeId,
      };
    } catch (error: unknown) {
      return rejectWithValue({
        message: getErrorMessage(error, "Failed to update reporting type"),
      });
    }
  },
);

/** DELETE /api/v1/operations-reporting/types/{typeId} */
export const deleteOperationsReportingType = createAsyncThunk(
  "admin-operations-reporting/deleteType",
  async (typeId: string, { rejectWithValue }) => {
    try {
      const res = await axiosInstance.delete(
        `/api/v1/operations-reporting/types/${normalizeId(typeId)}`,
      );
      return { ...(res.data as object), deletedTypeId: typeId };
    } catch (error: unknown) {
      return rejectWithValue({
        message: getErrorMessage(error, "Failed to delete reporting type"),
      });
    }
  },
);

/** POST /api/v1/operations-reporting/fields */
export const createOperationsReportingField = createAsyncThunk(
  "admin-operations-reporting/createField",
  async (
    payload: {
      estateId: string;
      typeId: string;
      label: string;
      key?: string;
    },
    { rejectWithValue },
  ) => {
    const estateIdValue = normalizeId(payload.estateId).trim();
    const typeIdValue = normalizeId(payload.typeId).trim();
    const label = payload.label.trim();
    const key = payload.key?.trim() || labelToReportingFieldKey(label);
    if (!estateIdValue || !typeIdValue) {
      return rejectWithValue({
        message: "Estate and reporting type are required.",
      });
    }
    if (!label || !key) {
      return rejectWithValue({
        message: "Field label is required.",
      });
    }
    try {
      const res = await axiosInstance.post(
        "/api/v1/operations-reporting/fields",
        {
          estateId: estateIdValue,
          typeId: typeIdValue,
          label,
          key,
        },
      );
      return res.data as {
        success?: boolean;
        message?: string;
        data?: OperationsReportingField;
      };
    } catch (error: unknown) {
      return rejectWithValue({
        message: getErrorMessage(error, "Failed to create reporting field"),
      });
    }
  },
);

export type GetOperationsReportingFieldsParams = {
  typeId: string;
  page?: number;
  limit?: number;
};

/** GET /api/v1/operations-reporting/fields?typeId=... */
export const getOperationsReportingFields = createAsyncThunk(
  "admin-operations-reporting/getFields",
  async (
    { typeId, page = 1, limit = 50 }: GetOperationsReportingFieldsParams,
    { rejectWithValue },
  ) => {
    const typeIdValue = normalizeId(typeId).trim();
    if (!typeIdValue) {
      return rejectWithValue({ message: "Reporting type is required." });
    }
    try {
      const res = await axiosInstance.get("/api/v1/operations-reporting/fields", {
        params: { typeId: typeIdValue, page, limit },
      });
      return res.data as {
        success?: boolean;
        message?: string;
        data?: OperationsReportingField[];
        pagination?: ApiPagination;
      };
    } catch (error: unknown) {
      return rejectWithValue({
        message: getErrorMessage(error, "Failed to fetch reporting fields"),
      });
    }
  },
);

/** GET /api/v1/operations-reporting/fields/{fieldId} */
export const getOperationsReportingFieldById = createAsyncThunk(
  "admin-operations-reporting/getFieldById",
  async (fieldId: string, { rejectWithValue }) => {
    try {
      const res = await axiosInstance.get(
        `/api/v1/operations-reporting/fields/${normalizeId(fieldId)}`,
      );
      return res.data as {
        success?: boolean;
        message?: string;
        data?: OperationsReportingField;
      };
    } catch (error: unknown) {
      return rejectWithValue({
        message: getErrorMessage(error, "Failed to fetch reporting field"),
      });
    }
  },
);

/** PUT /api/v1/operations-reporting/fields/{fieldId} */
export const updateOperationsReportingField = createAsyncThunk(
  "admin-operations-reporting/updateField",
  async (
    {
      fieldId,
      label,
      key,
    }: { fieldId: string; label: string; key: string },
    { rejectWithValue },
  ) => {
    try {
      const res = await axiosInstance.put(
        `/api/v1/operations-reporting/fields/${normalizeId(fieldId)}`,
        { label, key },
      );
      return { ...(res.data as object), fieldId };
    } catch (error: unknown) {
      return rejectWithValue({
        message: getErrorMessage(error, "Failed to update reporting field"),
      });
    }
  },
);

/** DELETE /api/v1/operations-reporting/fields/{fieldId} */
export const deleteOperationsReportingField = createAsyncThunk(
  "admin-operations-reporting/deleteField",
  async (fieldId: string, { rejectWithValue }) => {
    try {
      const res = await axiosInstance.delete(
        `/api/v1/operations-reporting/fields/${normalizeId(fieldId)}`,
      );
      return { ...(res.data as object), deletedFieldId: fieldId };
    } catch (error: unknown) {
      return rejectWithValue({
        message: getErrorMessage(error, "Failed to delete reporting field"),
      });
    }
  },
);

/** POST /api/v1/operations-reporting/entries */
export const createOperationsReportingEntry = createAsyncThunk(
  "admin-operations-reporting/createEntry",
  async (
    payload: { fieldId: string; data: Record<string, unknown> },
    { rejectWithValue },
  ) => {
    try {
      const res = await axiosInstance.post(
        "/api/v1/operations-reporting/entries",
        payload,
      );
      return res.data as {
        success?: boolean;
        message?: string;
        data?: OperationsReportingEntry;
      };
    } catch (error: unknown) {
      return rejectWithValue({
        message: getErrorMessage(error, "Failed to create report entry"),
      });
    }
  },
);

export type GetOperationsReportingEntriesParams = {
  fieldId: string;
  page?: number;
  limit?: number;
};

/** GET /api/v1/operations-reporting/fields/{fieldId}/entries */
export const getOperationsReportingEntries = createAsyncThunk(
  "admin-operations-reporting/getEntries",
  async (
    { fieldId, page = 1, limit = 10 }: GetOperationsReportingEntriesParams,
    { rejectWithValue },
  ) => {
    try {
      const res = await axiosInstance.get(
        `/api/v1/operations-reporting/fields/${normalizeId(fieldId)}/entries`,
        { params: { page, limit } },
      );
      return res.data as {
        success?: boolean;
        message?: string;
        data?: OperationsReportingEntry[];
        pagination?: ApiPagination;
      };
    } catch (error: unknown) {
      return rejectWithValue({
        message: getErrorMessage(error, "Failed to fetch report entries"),
      });
    }
  },
);

/** GET /api/v1/operations-reporting/entries/{entryId} */
export const getOperationsReportingEntryById = createAsyncThunk(
  "admin-operations-reporting/getEntryById",
  async (entryId: string, { rejectWithValue }) => {
    try {
      const res = await axiosInstance.get(
        `/api/v1/operations-reporting/entries/${normalizeId(entryId)}`,
      );
      return res.data as {
        success?: boolean;
        message?: string;
        data?: OperationsReportingEntry;
      };
    } catch (error: unknown) {
      return rejectWithValue({
        message: getErrorMessage(error, "Failed to fetch report entry"),
      });
    }
  },
);

/** PUT /api/v1/operations-reporting/entries/{entryId} */
export const updateOperationsReportingEntry = createAsyncThunk(
  "admin-operations-reporting/updateEntry",
  async (
    {
      entryId,
      data,
    }: { entryId: string; data: Record<string, unknown> },
    { rejectWithValue },
  ) => {
    try {
      const res = await axiosInstance.put(
        `/api/v1/operations-reporting/entries/${normalizeId(entryId)}`,
        { data },
      );
      return { ...(res.data as object), entryId };
    } catch (error: unknown) {
      return rejectWithValue({
        message: getErrorMessage(error, "Failed to update report entry"),
      });
    }
  },
);

/** DELETE /api/v1/operations-reporting/entries/{entryId} */
export const deleteOperationsReportingEntry = createAsyncThunk(
  "admin-operations-reporting/deleteEntry",
  async (entryId: string, { rejectWithValue }) => {
    try {
      const res = await axiosInstance.delete(
        `/api/v1/operations-reporting/entries/${normalizeId(entryId)}`,
      );
      return { ...(res.data as object), deletedEntryId: entryId };
    } catch (error: unknown) {
      return rejectWithValue({
        message: getErrorMessage(error, "Failed to delete report entry"),
      });
    }
  },
);
