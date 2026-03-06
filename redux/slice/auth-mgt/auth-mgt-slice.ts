'use client';

import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import {
  signIn,
  signOut,
  verifyOtp,
  resendOtp,
  resetPassword,
  getSignedInUser,
  forgotPassword,
  iniviteUser,
  verifyInivitedUser,
} from './auth-mgt';

interface AuthState {
  user: any | null;
  token: string | null;
  signInStatus: 'idle' | 'isLoading' | 'succeeded' | 'failed';
  signOutStatus: 'idle' | 'isLoading' | 'succeeded' | 'failed';
  verifyOtpStatus: 'idle' | 'isLoading' | 'succeeded' | 'failed';
  resndOtpStatus: 'idle' | 'isLoading' | 'succeeded' | 'failed';
  resetPasswordStatus: 'idle' | 'isLoading' | 'succeeded' | 'failed';
  forgotPasswordStatus: 'idle' | 'isLoading' | 'succeeded' | 'failed';
  getSignedInUserStatus: 'idle' | 'isLoading' | 'succeeded' | 'failed';
  iniviteUserStatus: 'idle' | 'isLoading' | 'succeeded' | 'failed';
  verifyInivitedUserStatus: 'idle' | 'isLoading' | 'succeeded' | 'failed';
  error: string | null;
}

const initialState: AuthState = {
  user: null,
  token: null,
  signInStatus: 'idle',
  signOutStatus: 'idle',
  verifyOtpStatus: 'idle',
  resndOtpStatus: 'idle',
  resetPasswordStatus: 'idle',
  forgotPasswordStatus: 'idle',
  getSignedInUserStatus: 'idle',
  iniviteUserStatus: 'idle',
  verifyInivitedUserStatus: 'idle',
  error: null,
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    resetAuthState: (state) => {
      state.signInStatus = 'idle';
      state.signOutStatus = 'idle';
      state.verifyOtpStatus = 'idle';
      state.resndOtpStatus = 'idle';
      state.resetPasswordStatus = 'idle';
      state.forgotPasswordStatus = 'idle';
      state.getSignedInUserStatus = 'idle';
      state.iniviteUserStatus = 'idle';
      state.verifyInivitedUserStatus = 'idle';
      state.error = null;
    },

    hydrateAuthFromStorage: (state) => {
      if (typeof window === 'undefined') return;
      const rawAuth = localStorage.getItem('auth');
      if (!rawAuth) return;
      const parsed = JSON.parse(rawAuth);
      state.user = parsed?.user ?? null;
      state.token = parsed?.token ?? null;
    },

    setToken: (state, action: PayloadAction<string>) => {
      state.token = action.payload;
    },

    logoutLocally: (state) => {
      state.user = null;
      state.token = null;
      if (typeof window !== 'undefined') {
        localStorage.removeItem('auth');
        localStorage.removeItem('user');
        sessionStorage.removeItem('accessToken');
      }
    },
  },

  extraReducers: (builder) => {
    builder
      .addCase(signIn.pending, (state) => {
        state.signInStatus = 'isLoading';
      })
      .addCase(signIn.fulfilled, (state, action) => {
        state.signInStatus = 'succeeded';
        const user = action.payload.data;
        const token = action.payload.accessToken;

        state.user = user;
        state.token = token;

        if (typeof window !== "undefined") {
          localStorage.setItem("auth", JSON.stringify({ user, token }));
        }
      })
      .addCase(signIn.rejected, (state, action) => {
        state.signInStatus = 'failed';
        state.error = action.error?.message ?? 'Sign in failed';
      })

      .addCase(getSignedInUser.fulfilled, (state, action) => {
        state.getSignedInUserStatus = 'succeeded';
        const user = action.payload?.data || null;
        state.user = user;

        if (typeof window !== 'undefined') {
          const rawAuth = localStorage.getItem('auth');
          const parsed = rawAuth ? JSON.parse(rawAuth) : {};
          localStorage.setItem('auth', JSON.stringify({ ...parsed, user }));
        }
      })

      .addCase(getSignedInUser.rejected, (state) => {
        state.getSignedInUserStatus = 'failed';
        state.user = null;
        state.token = null;
        if (typeof window !== 'undefined') localStorage.removeItem('auth');
      })


      // ===== SIGN OUT =====
      .addCase(signOut.fulfilled, (state) => {
        state.user = null;
        state.token = null;
        if (typeof window !== 'undefined') localStorage.removeItem('auth');
      })

      // ✅ INVITE USER
      .addCase(iniviteUser.pending, (state) => {
        state.iniviteUserStatus = 'isLoading';
      })
      .addCase(iniviteUser.fulfilled, (state) => {
        state.iniviteUserStatus = 'succeeded';
      })
      .addCase(iniviteUser.rejected, (state, action) => {
        state.iniviteUserStatus = 'failed';
        state.error = action.payload as string;
      })

      // ✅ VERIFY INVITED USER
      .addCase(verifyInivitedUser.pending, (state) => {
        state.verifyInivitedUserStatus = 'isLoading';
      })
      .addCase(verifyInivitedUser.fulfilled, (state) => {
        state.verifyInivitedUserStatus = 'succeeded';
      })
      .addCase(verifyInivitedUser.rejected, (state, action) => {
        state.verifyInivitedUserStatus = 'failed';
        state.error = action.error.message || "Failed to verify invited user";
      });
  },
});

export const { resetAuthState, logoutLocally, hydrateAuthFromStorage, setToken } = authSlice.actions;
export default authSlice.reducer;
