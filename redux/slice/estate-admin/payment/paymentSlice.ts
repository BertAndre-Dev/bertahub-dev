import { createSlice } from "@reduxjs/toolkit";
import { generateTxRef } from "./payment";

interface PaymentState {
  txRef: string | null;
  timestamp: string | null;
  loading: boolean;
  error: string | null;
}

const initialState: PaymentState = {
  txRef: null,
  timestamp: null,
  loading: false,
  error: null,
};

const paymentSlice = createSlice({
  name: "estate-admin-payment",
  initialState,
  reducers: {
    resetTxRef(state) {
      state.txRef = null;
      state.timestamp = null;
      state.error = null;
      state.loading = false;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(generateTxRef.pending, (state) => {
        state.loading = true;
        state.error = null;
      })

      .addCase(generateTxRef.fulfilled, (state, action) => {
        state.loading = false;
        state.txRef = action.payload.tx_ref;
        state.timestamp = action.payload.timestamp;
      })

      .addCase(generateTxRef.rejected, (state, action) => {
        state.loading = false;
        const payload = action.payload;
        state.error =
          typeof payload === "string"
            ? payload
            : "Failed to generate transaction reference";
      });
  },
});

export const { resetTxRef } = paymentSlice.actions;
export default paymentSlice.reducer;
