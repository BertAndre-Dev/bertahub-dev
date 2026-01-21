import { createAsyncThunk } from "@reduxjs/toolkit";
import axiosInstance from "@/utils/axiosInstance";



interface TransactionData {
  walletId: string;
  type: string;
  amount: number;
  description: string;
  userId: string;
}


interface VerifyTransactionPayload {
  tx_ref: string;
  paymentType: string;
}

interface PaymentCustomer {
  email: string;
}

interface PaymentCustomizations {
  title: string;
  description: string;
}

interface PaymentPayload {
  tx_ref: string;
  amount: number;
  country: string;
  currency: string;
  redirect_url: string;
  payment_options: string; // e.g., "card"
  customer: PaymentCustomer;
  customizations: PaymentCustomizations;
}


export const createTransaction = createAsyncThunk(
    "estate-admin-transaction/createTransaction",
    async (data: TransactionData, { rejectWithValue }) => {
        try {
            const res = await axiosInstance.post("/api/v1/transaction-mgt", data);
            return res.data; 
        } catch (error: any) {
            return rejectWithValue({
                message: error.res?.data?.message || "Transaction created successfully."
            })
        }
    }
);


export const initializePayment = createAsyncThunk(
    "estate-admin-transaction/initializePayment",
    async (data: PaymentPayload, { rejectWithValue }) => {
        try {
            const res = await axiosInstance.post("/api/v1/payment-mgt/initialize", data);
            return res.data; 
        } catch (error: any) {
            return rejectWithValue({
                message: error.res?.data?.message || "Payment initialized successfully."
            })
        }
    }
);


// ✅ Get paginated transaction history
export const getTransactionHistory = createAsyncThunk(
  "estate-admin-transaction/getTransactionHistory",
  async (
    {
      userId,
      page = 1,
      limit = 10,
    }: { userId: string; page?: number; limit?: number },
    { rejectWithValue }
  ) => {
    try {
      // Corrected: userId is sent as a query param
      const res = await axiosInstance.get(
        `/api/v1/transaction-mgt/history`,
        {
          params: {
            userId,
            page,
            limit,
          },
        }
      );
      return res.data;
    } catch (error: any) {
      return rejectWithValue({
        message:
          error?.response?.data?.message || "Failed to fetch transactions",
      });
    }
  }
);



export const getTransaction = createAsyncThunk(
  'estate-admin-transaction/getTransaction',
  async (transId: string, { rejectWithValue }) => {
    try {
      const res = await axiosInstance.get(`/api/v1/transaction-mgt/history/${transId}?transId=${transId}`);
      return res.data;
    } catch (error: any) {
      return rejectWithValue({
        message: error.res?.data?.message || "Failed to fetch transactions",
      });
    }
  }
);


export const verifyTransaction = createAsyncThunk(
  'estate-admin-transaction/verifyTransaction',
  async ({ tx_ref }: VerifyTransactionPayload, { rejectWithValue }) => {
    try {
      if (!tx_ref ) {
        throw new Error("Missing required fields for verification");
      }

      console.log("📦 Verifying transaction:", { tx_ref });

      // ✅ POST request, but parameters go in the query string
      const response = await axiosInstance.post(
        `/api/v1/transaction-mgt/verify?tx_ref=${encodeURIComponent(tx_ref)}`,
        {} // empty request body
      );

      return response.data;
    } catch (error: any) {
      console.error("❌ Verify transaction error:", error.response?.data || error.message);
      return rejectWithValue(error.response?.data || { message: error.message });
    }
  }
);
