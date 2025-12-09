import { createAsyncThunk } from "@reduxjs/toolkit";
import axiosInstance from "@/utils/axiosInstance";

interface VisitorData {
    visitorCode: string;
};


export const verifyVisitor = createAsyncThunk(
    "visitor/verifyVisitor",
    async (data: VisitorData, { rejectWithValue }) => {
        try {
            const res  = await axiosInstance.put("/api/v1/visitor-mgt/verify-code", data);
            return res.data;
        } catch (error: any) {
            return rejectWithValue(error.response?.data);
        }
    }
);


export const getVisitorsByEstate = createAsyncThunk(
    "visitor/getVisitorsByEstate",
    async ({ estateId, page = 1, limit = 10}: { estateId: string; page: number; limit: number}, { rejectWithValue}) => {
        try {
            const res = await axiosInstance.get(`/api/v1/visitor-mgt/all-visitors/${estateId}?page=${page}&limit=${limit}`);

            return res.data;
        } catch (error: any) {
            return rejectWithValue(error.response?.data);
        }
    }
)
