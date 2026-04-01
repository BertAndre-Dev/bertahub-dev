import { createAsyncThunk } from '@reduxjs/toolkit';
import axiosInstance from '@/utils/axiosInstance';


export interface EstateData {
    name: string;
    address: string;
    city: string;
    state: string;
    country: string;
    isActive?: boolean;
    modules: string[];
}



export const fetchAvailableModules = createAsyncThunk(
    'super-admin-est-mgt/fetchAvailableModules',
    async (_, { rejectWithValue }) => {
        try {
            const res = await axiosInstance.get<{ data: string[] }>('/api/v1/estate-mgt/modules');
            return res.data;
        } catch (error: any) {
            return rejectWithValue(error.response?.data ?? { message: error?.message ?? 'Failed to load modules' });
        }
    }
);


// create estate
export const createEstate = createAsyncThunk(
    'super-admin-est-mgt/createEstate',
    async(data: EstateData, { rejectWithValue }) => {
        try {
            const res = await axiosInstance.post('/api/v1/estate-mgt', data);
            return res.data;
        } catch (error: any) {
            return rejectWithValue({
                message: error.res?.data?.message
            });
        }
    }
);


// get all estate
export const getAllEstates = createAsyncThunk(
    'super-admin-est-mgt/getAllEstates',
    async (
        {
            limit = 10,
            page = 1,
            search,
            startDate,
            endDate,
        }: { page?: number; limit?: number; search?: string; startDate?: string; endDate?: string },
        { rejectWithValue }
    ) => {
        try {
            const params = new URLSearchParams();
            if (page != null) params.set("page", String(page));
            if (limit != null) params.set("limit", String(limit));
            if (search?.trim()) params.set("search", search.trim());
            if (startDate) params.set("startDate", startDate);
            if (endDate) params.set("endDate", endDate);
            const query = params.toString();
            const suffix = query ? "?" + query : "";
            const res = await axiosInstance.get(`/api/v1/estate-mgt` + suffix);
            return res.data;
        } catch (error: any) {
            return rejectWithValue(error.response?.data);;
        }
    }
);


// get individual estate
export const getEstate = createAsyncThunk(
    'super-admin-est-mgt/getEstate',
    async (id: string, { rejectWithValue }) => {
        try {
            const res = await axiosInstance.get(`/api/v1/estate-mgt/${id}`);
            return res.data;
        } catch (error: any) {
            return rejectWithValue({
                message: error.res?.data?.message
            });
        }
    }
);


// delete an estate
export const deleteEstate = createAsyncThunk(
    'super-admin-est-mgt/deleteEstate',
    async (id: string, { rejectWithValue }) => {
        try {
            const res = await axiosInstance.delete(`/api/v1/estate-mgt/${id}`);
            return res.data;
        } catch (error: any) {
            return rejectWithValue({
                message: error.res?.data?.message
            });
        }
    }
);



// update an estate
export const updateEstate = createAsyncThunk(
    'super-admin-est-mgt/updateEstate',
    async({id, data}: {id: string, data: EstateData}, { rejectWithValue }) => {
        try {
            const res = await axiosInstance.put(`/api/v1/estate-mgt/${id}`, data);
            return res.data;
        } catch (error: any) {
            return rejectWithValue({
                message: error.res?.data?.message
            });
        }
    }
);


// suspend an estate
export const suspendEstate = createAsyncThunk(
    'super-admin-est-mgt/suspendEstate',
    async(id: string, { rejectWithValue }) => {
        try {
            const res = await axiosInstance.put(`/api/v1/estate-mgt/${id}/suspend-estate`);
            return res.data;
        } catch (error: any) {
            return rejectWithValue({
                message: error.res?.data?.message
            });
        }
    }
);


// activate an estate
export const activateEstate = createAsyncThunk(
    'super-admin-est-mgt/activateEstate',
    async(id: string, { rejectWithValue }) => {
        try {
            const res = await axiosInstance.put(`/api/v1/estate-mgt/${id}/activate-estate`);
            return res.data;
        } catch (error: any) {
            return rejectWithValue({
                message: error.res?.data?.message
            });
        }
    }
);