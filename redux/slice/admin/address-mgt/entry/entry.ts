import { createAsyncThunk } from "@reduxjs/toolkit";
import axiosInstance from "@/utils/axiosInstance";


interface EntryData {
  estateId: string | { id?: string; _id?: string };
  fieldId: string;
  data: Record<string, any>;
}

function normalizeEstateId(
  estateId: string | { id?: string; _id?: string } | undefined
): string {
  if (typeof estateId === "string") return estateId;
  return estateId?._id || estateId?.id || "";
}

// create address entry
export const createEntry = createAsyncThunk(
  "entry/createEntry",
  async (data: EntryData, { rejectWithValue }) => {
    try {
      const payload = {
        ...data,
        estateId: normalizeEstateId(data.estateId),
      };
      const res = await axiosInstance.post("/api/v1/address-mgt/entry", payload);
      return res.data;
    } catch (error: any) {
      return rejectWithValue({
        message: error.res?.data?.message,
      });
    }
  }
);


// update address entry
export const updateEntry = createAsyncThunk(
  "entry/updateEntry",
  async (
    { entryId, data }: { entryId: string; data: EntryData },
    { rejectWithValue }
  ) => {
    try {
      const payload = {
        ...data,
        estateId: normalizeEstateId(data.estateId),
      };
      const res = await axiosInstance.put(
        `/api/v1/address-mgt/entry/${entryId}`,
        payload
      );
      return res.data;
    } catch (error: any) {
      return rejectWithValue({
        message: error.res?.data?.message,
      });
    }
  }
);


// delete address entry
export const deleteEntry = createAsyncThunk(
    'entry/deleteEntry',
    async (entryId: string, { rejectWithValue }) => {
        try {
            const res = await axiosInstance.delete(`/api/v1/address-mgt/entry/${entryId}`);
            return res.data;
        } catch (error: any) {
            return rejectWithValue({
                message: error.res?.data?.message
            });
        }
    }
);


// get address entry
export const getEntry = createAsyncThunk(
    'entry/getEntry',
    async (entryId: string, { rejectWithValue }) => {
        try {
            const res = await axiosInstance.get(`/api/v1/address-mgt/entry/${entryId}`);
            return res.data;
        } catch (error: any) {
            return rejectWithValue({
                message: error.res?.data?.message
            });
        }
    }
);


// get all addres field entries with pagination
export const getEntriesByField = createAsyncThunk(
  'entry/getEntriesByField',
  async (
    { fieldId, page, limit }: { fieldId: string; page: number; limit: number },
    { rejectWithValue }
  ) => {
    try {
      const res = await axiosInstance.get(
        `/api/v1/address-mgt/field-entries?fieldId=${fieldId}&page=${page}&limit=${limit}`
      );
      return res.data;
    } catch (error: any) {
      return rejectWithValue({
        message: error.response?.data?.message || error.message,
      });
    }
  }
);


// entries dynamic stats
export const getEntryStats = createAsyncThunk(
    'entry/getEntryStats',
    async (fieldId: string, { rejectWithValue }) => {
        try {
            const res = await axiosInstance.get(`/api/v1/address-mgt/entry/${fieldId}/stats/`);
            return res.data;
        } catch (error: any) {
            return rejectWithValue({
                message: error.res?.data?.message
            });
        }
    }
);



