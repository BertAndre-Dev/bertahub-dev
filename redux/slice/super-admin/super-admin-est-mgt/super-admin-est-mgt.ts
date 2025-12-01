import { createAsyncThunk } from '@reduxjs/toolkit';
import axiosInstance from '@/utils/axiosInstance';


interface EstateData {
    name: string;
    address: string;
    city: string;
    state: string;
    country: string;
};



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
    async (_, { rejectWithValue }) => {
        try {
            const res = await axiosInstance.get('/api/v1/estate-mgt');
            return res.data;
        } catch (error: any) {
            return rejectWithValue({
                message: error.res?.data?.message
            });
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