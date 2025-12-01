import { createAsyncThunk } from '@reduxjs/toolkit';
import axiosInstance from '@/utils/axiosInstance';


// get all users by estate
export const getAllUsersByEstate = createAsyncThunk(
    'super-admin-user/getAllUsersByEstate',
    async (estateId: string, { rejectWithValue }) => {
        try {
            const res = await axiosInstance.get(`/api/v1/user-mgt/estate/${estateId}`);
            return res.data;
        } catch (error: any) {
            return rejectWithValue({
                message: error.res?.data?.message
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

