import { createAsyncThunk } from "@reduxjs/toolkit";
import axiosInstance from "@/utils/axiosInstance";

export type StaffContactRequestPayload = {
  name: string;
  email: string;
  message: string;
  userId: string;
  estateId?: string;
};

export const submitStaffContactRequest = createAsyncThunk(
  "staffSupport/submitContactRequest",
  async (payload: StaffContactRequestPayload, { rejectWithValue }) => {
    if (!payload.userId || !/^[a-f\d]{24}$/i.test(payload.userId.trim())) {
      return rejectWithValue({ message: "Invalid user ID — cannot submit request" });
    }
    if (!payload.name?.trim() || !payload.email?.trim() || !payload.message?.trim()) {
      return rejectWithValue({ message: "Name, email, and message are required." });
    }
    if (!payload.email.includes("@")) {
      return rejectWithValue({ message: "Please enter a valid email address." });
    }

    try {
      const res = await axiosInstance.post("/api/v1/chat-mgt/create", {
        userId: payload.userId.trim(),
        estateId: payload.estateId?.trim() || undefined,
        subject: `Staff support request from ${payload.name.trim()}`,
        description: `From: ${payload.name.trim()} (${payload.email.trim()})\n\n${payload.message.trim()}`,
      });
      return res.data;
    } catch (error: any) {
      return rejectWithValue({
        message:
          error?.response?.data?.message || "Failed to submit contact request",
      });
    }
  },
);
