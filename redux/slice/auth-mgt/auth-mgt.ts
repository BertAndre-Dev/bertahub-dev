import { createAsyncThunk } from '@reduxjs/toolkit';
import axiosInstance from '@/utils/axiosInstance';



interface InvitedUserData {
    estateId: string;
    firstName: string;
    lastName: string;
    addressId?: string;
    role: string;
    email: string;
};


interface VerifyInvitedUserData {
    email: string;
    tempPassword: string;
    newPassword: string;
};



// sign in
export const signIn = createAsyncThunk(
    'auth-mgt/signIn',
    async (data: { email: string; password: string }, { rejectWithValue }) => {
        try {
            const res = await axiosInstance.post('/api/v1/auth-mgt/sign-in', data);
            return res.data;
        } catch (error: any) {
            const apiError = error.response?.data;
            return rejectWithValue(apiError ?? error.message);
        }
    }
);


// verify otp 
export const verifyOtp = createAsyncThunk(
    'auth-mgt/verifyOtp',
    async (data: { email: string, otp: string }, { rejectWithValue }) => {
        try {
            const res = await axiosInstance.post('/api/v1/auth-mgt/verify-otp', data);
            return res.data;
        } catch (error: any) {
            return rejectWithValue(error.res?.data?.message);
        }
    }
);


// resend otp
export const resendOtp = createAsyncThunk(
    'auth-mgt/resendOtp',
    async(data: { email: string }, { rejectWithValue }) => {
        try {
            const res = await axiosInstance.post('/api/v1/auth-mgt/resend-otp', data);
            return res.data;
        } catch (error: any) {
            return rejectWithValue(error.res?.data?.message);
        }
    }
);


// get signed in user
export const getSignedInUser = createAsyncThunk(
    'auth-mgt/getSignedInUser',
    async (_, { rejectWithValue }) => {
        try {
            const res = await axiosInstance.get('/api/v1/auth-mgt/me');
            return res.data;
        } catch (error: any) {
            return rejectWithValue(error.res?.data?.message);
        }
    }
);


// reset password
export const resetPassword = createAsyncThunk(
    'auth-mgt/resetPassword',
    async (data: {email: string, resetToken: string, newPassword: string }, { rejectWithValue}) => {
        try {
            const res = await axiosInstance.post('/api/v1/auth-mgt/reset-password', data);
            return res.data;
        } catch (error: any) {
            return rejectWithValue(error.res?.data?.message);
        }
    }
);


// forgot pasword
export const forgotPassword = createAsyncThunk(
    'auth-mgt/forgotPassword',
    async (data: {email: string }, { rejectWithValue}) => {
        try {
            const res = await axiosInstance.post('/api/v1/auth-mgt/forgot-password', data);
            return res.data;
        } catch (error: any) {
            return rejectWithValue(error.res?.data?.message);
        }
    }
);


// sign out
export const signOut = createAsyncThunk(
    'auth-mgt/signOut',
    async (data: { email: string }, { rejectWithValue }) => {
        try {
            const res = await axiosInstance.post('/api/v1/auth-mgt/sign-out', data, { withCredentials: true});
            return res.data;
        } catch (error: any) {
            return rejectWithValue(error.res?.data?.message);
        }
    }
);


// Invite user
export const iniviteUser = createAsyncThunk(
    'auth-mgt/inviteUser',
    async(data: InvitedUserData, { rejectWithValue }) => {
        try {
            const res = await axiosInstance.post('/api/v1/auth-mgt/invite-user', data);
            return res.data;
        } catch (error: any) {
            return rejectWithValue(error.response?.data);
        }
    }
);


// Invite user
export const verifyInivitedUser = createAsyncThunk(
    'auth-mgt/verifyInivitedUser',
    async(data: VerifyInvitedUserData, { rejectWithValue }) => {
        try {
            const res = await axiosInstance.post('/api/v1/auth-mgt/verify-invited-user', data);
            return res.data;
        } catch (error: any) {
            return rejectWithValue(error.response?.data);
        }
    }
);





