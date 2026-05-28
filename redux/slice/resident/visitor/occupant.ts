import { createAsyncThunk } from "@reduxjs/toolkit";
import axiosInstance from "@/utils/axiosInstance";

export interface CreateOccupantData {
  firstName: string;
  lastName: string;
  relationship: string;
  addressId: string;
}

export interface CreateOccupantBulkData {
  occupants: CreateOccupantData[];
}

export const createOccupant = createAsyncThunk(
  "residentOccupant/createOccupant",
  async (data: CreateOccupantData, { rejectWithValue }) => {
    try {
      const res = await axiosInstance.post(
        "/api/v1/visitor-mgt/occupant/create",
        data,
      );
      return res.data;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data || { message: "Failed to create occupant" },
      );
    }
  },
);

export const createOccupantBulk = createAsyncThunk(
  "residentOccupant/createOccupantBulk",
  async (data: CreateOccupantBulkData, { rejectWithValue }) => {
    try {
      const res = await axiosInstance.post(
        "/api/v1/visitor-mgt/occupant/create-bulk",
        data,
      );
      return res.data;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data || { message: "Failed to create occupants" },
      );
    }
  },
);

export const getOccupantsByEstate = createAsyncThunk(
  "residentOccupant/getOccupantsByEstate",
  async (estateId: string, { rejectWithValue }) => {
    try {
      const res = await axiosInstance.get(
        `/api/v1/visitor-mgt/occupant/all/${estateId}`,
      );
      return res.data;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data || { message: "Failed to fetch occupants" },
      );
    }
  },
);

export const getOccupantById = createAsyncThunk(
  "residentOccupant/getOccupantById",
  async (occupantId: string, { rejectWithValue }) => {
    try {
      const res = await axiosInstance.get(
        `/api/v1/visitor-mgt/occupant/${occupantId}`,
      );
      return res.data;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data || { message: "Failed to fetch occupant" },
      );
    }
  },
);

export const deleteOccupant = createAsyncThunk(
  "residentOccupant/deleteOccupant",
  async (occupantId: string, { rejectWithValue }) => {
    try {
      const res = await axiosInstance.delete(
        `/api/v1/visitor-mgt/occupant/${occupantId}`,
      );
      return res.data;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data || { message: "Failed to delete occupant" },
      );
    }
  },
);

