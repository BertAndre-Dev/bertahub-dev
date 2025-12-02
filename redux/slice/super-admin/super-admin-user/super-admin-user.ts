import { createAsyncThunk } from '@reduxjs/toolkit';
import axiosInstance from '@/utils/axiosInstance';


// get all users by estate (with pagination)
export const getAllUsersByEstate = createAsyncThunk(
  "super-admin-user/getAllUsersByEstate",
  async (
    {
      estateId,
      page = 1,
      limit = 10,
    }: { estateId: string; page?: number; limit?: number },
    { rejectWithValue }
  ) => {
    try {
      const res = await axiosInstance.get(
        `/api/v1/user-mgt/estate/${estateId}?page=${page}&limit=${limit}`
      );
      return res.data;
    } catch (error: any) {
      return rejectWithValue({
        message: error?.response?.data?.message || "Failed to fetch users",
      });
    }
  }
);



// get individual user
export const getUser = createAsyncThunk(
    'super-admin-user/getUser',
    async (id: string, { rejectWithValue }) => {
        try {
            const res = await axiosInstance.get(`/api/v1/user-mgt/${id}`);
            return res.data;
        } catch (error: any) {
            return rejectWithValue({
                message: error.res?.data?.message
            });
        }
    }
);


// delete an user
export const deleteUser = createAsyncThunk(
    'super-admin-user/deleteUser',
    async (id: string, { rejectWithValue }) => {
        try {
            const res = await axiosInstance.delete(`/api/v1/user-mgt/${id}`);
            return res.data;
        } catch (error: any) {
            return rejectWithValue({
                message: error.res?.data?.message
            });
        }
    }
);


// suspend an user
export const suspendUser = createAsyncThunk(
    'super-admin-user/suspendUser',
    async(id: string, { rejectWithValue }) => {
        try {
            const res = await axiosInstance.put(`/api/v1/user-mgt/${id}/suspend-user`);
            return res.data;
        } catch (error: any) {
            return rejectWithValue({
                message: error.res?.data?.message
            });
        }
    }
);


// activate an user
export const activateUser = createAsyncThunk(
    'super-admin-user/activateUser',
    async(id: string, { rejectWithValue }) => {
        try {
            const res = await axiosInstance.put(`/api/v1/user-mgt/${id}/activate-user`);
            return res.data;
        } catch (error: any) {
            return rejectWithValue({
                message: error.res?.data?.message
            });
        }
    }
);

