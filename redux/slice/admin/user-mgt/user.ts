import { createAsyncThunk } from '@reduxjs/toolkit';
import axiosInstance from '@/utils/axiosInstance';


// get all users by estate (with search)
export const getAllUsersByEstate = createAsyncThunk(
  'admin-user/getAllUsersByEstate',
  async (
    {
      estateId,
      page = 1,
      limit = 10,
      search,
    }: {
      estateId: string;
      page?: number;
      limit?: number;
      search?: string;
    },
    { rejectWithValue }
  ) => {
    try {
      const params = new URLSearchParams({
        page: String(page),
        limit: String(limit),
      });

      if (search && search.trim()) {
        params.append('search', search.trim());
      }

      const res = await axiosInstance.get(
        `/api/v1/user-mgt/estate/${estateId}?${params.toString()}`
      );

      return res.data;
    } catch (error: any) {
      return rejectWithValue({
        message: error?.response?.data?.message || 'Unable to fetch users',
      });
    }
  }
);




// get individual user
export const getUser = createAsyncThunk(
    'admin-user/getUser',
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
    'admin-user/deleteUser',
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
    'admin-user/suspendUser',
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
    'admin-user/activateUser',
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

