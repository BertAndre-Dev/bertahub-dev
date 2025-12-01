import { createAsyncThunk } from "@reduxjs/toolkit";
import axiosInstance from "@/utils/axiosInstance";


interface FieldData {
  estateId: string;
  label: string;
  key: string;
}



// create address field
export const createField = createAsyncThunk(
    'field/createField',
    async(data: FieldData, { rejectWithValue }) => {
        try {
            const res = await axiosInstance.post('/api/v1/address-mgt/field', data);
            return res.data;
        } catch (error: any) {
            return rejectWithValue({
                message: error.res?.data?.message
            });
        }
    }
);


// get address field
export const getField = createAsyncThunk(
    'field/getField',
    async (fieldId: string, { rejectWithValue }) => {
        try {
            const res = await axiosInstance.get(`/api/v1/address-mgt/field/${fieldId}`);
            return res.data;
        } catch (error: any) {
            return rejectWithValue({
                message: error.res?.data?.message
            });
        }
    }
);


// get address field by estate
export const getFieldByEstate = createAsyncThunk(
    'field/getFieldByEstate',
    async (estateId: string, { rejectWithValue }) => {
        try {
            const res = await axiosInstance.get(`/api/v1/address-mgt/estate/${estateId}/fields`);
            return res.data;
        } catch (error: any) {
            return rejectWithValue({
                message: error.res?.data?.message
            });
        }
    }
);


// update address field
export const updateField = createAsyncThunk(
    'field/updateField',
    async ({fieldId, data}: {fieldId: string, data: FieldData}, { rejectWithValue }) => {
        try {
            const res = await axiosInstance.put(`/api/v1/address-mgt/field/${fieldId}`, data);
            return res.data;
        } catch (error: any) {
            return rejectWithValue({
                message: error.res?.data?.message
            });
        }
    }
);



// delete address field
export const deleteField = createAsyncThunk(
    'field/deleteField',
    async (fieldId: string, { rejectWithValue }) => {
        try {
            const res = await axiosInstance.delete(`/api/v1/address-mgt/field/${fieldId}`);
            return res.data;
        } catch (error: any) {
            return rejectWithValue({
                message: error.res?.data?.message
            });
        }
    }
);

