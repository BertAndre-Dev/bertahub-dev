import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type { VisitorDetailsData } from "@/app/(platform)/dashboard/security/types";
import { getApiErrorMessage } from "@/lib/api-error";
import { parseGateResponse, type GateResult } from "@/lib/security-gate";
import { VisitorVerificationMode } from "@/redux/slice/super-admin/super-admin-est-mgt/super-admin-est-mgt";
import {
  checkoutVisitor,
  gateVisitor,
  getAllVisitors,
  getVisitorDetailsByCode,
  scanVisitor,
  verifyVisitor,
} from "./visitor";

export interface SecurityVisitorItem {
  id: string;
  visitorCode: string;
  residentId: { id: string; firstName: string; lastName: string } | null;
  estateId: string;
  addressId: { id: string; data: Record<string, string> };
  firstName: string;
  lastName: string;
  phone: string;
  purpose: string;
  isVerified: boolean;
  isCheckedOut?: boolean;
  visitingType?: string;
  visitStartDate?: string | null;
  visitEndDate?: string | null;
  validFrom?: string | null;
  validUntil?: string | null;
  checkinTime?: string | null;
  checkoutTime?: string | null;
  checkedOutBy?: { id: string; firstName: string; lastName: string } | null;
  createdAt: string;
  updatedAt: string;
  viewedBy?: { id: string; firstName: string; lastName: string };
  verifiedBy?: { id: string; firstName: string; lastName: string };
}

export interface SecurityAllVisitorsResponse {
  success: boolean;
  message: string;
  data: SecurityVisitorItem[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

type RequestStatus = "idle" | "isLoading" | "succeeded" | "failed";

export interface SecurityVisitorState {
  getAllVisitorsStatus: RequestStatus;
  gateVisitorStatus: RequestStatus;
  viewDetailsStatus: RequestStatus;
  scanVisitorStatus: RequestStatus;
  verifyVisitorStatus: RequestStatus;
  checkoutVisitorStatus: RequestStatus;
  allVisitors: SecurityAllVisitorsResponse | null;
  activeVisitor: VisitorDetailsData | null;
  lastGateResult: GateResult | null;
  lookupSource: "code" | "scan" | null;
  estateId: string | null;
  visitorVerificationMode: VisitorVerificationMode | null;
  verificationDescription: string | null;
  contextReady: boolean;
  error: string | null;
}

const initialState: SecurityVisitorState = {
  getAllVisitorsStatus: "idle",
  gateVisitorStatus: "idle",
  viewDetailsStatus: "idle",
  scanVisitorStatus: "idle",
  verifyVisitorStatus: "idle",
  checkoutVisitorStatus: "idle",
  allVisitors: null,
  activeVisitor: null,
  lastGateResult: null,
  lookupSource: null,
  estateId: null,
  visitorVerificationMode: null,
  verificationDescription: null,
  contextReady: false,
  error: null,
};

function setRejectedError(
  state: SecurityVisitorState,
  action: { payload?: unknown; error?: { message?: string } },
) {
  state.error =
    getApiErrorMessage(action.payload) ??
    getApiErrorMessage(action.error) ??
    null;
}

function visitorFromPayload(payload: unknown): VisitorDetailsData | null {
  const data =
    (payload as { data?: VisitorDetailsData })?.data ??
    (payload as VisitorDetailsData | null);
  if (!data || typeof data !== "object" || !("visitorCode" in data)) {
    return null;
  }
  return data;
}

const securityVisitorSlice = createSlice({
  name: "securityVisitor",
  initialState,
  reducers: {
    resetSecurityVisitorState: () => ({ ...initialState }),
    setSecurityEstateId: (state, action: PayloadAction<string | null>) => {
      state.estateId = action.payload;
    },
    setSecurityVerificationContext: (
      state,
      action: PayloadAction<{
        mode: VisitorVerificationMode | null;
        description?: string | null;
        ready?: boolean;
      }>,
    ) => {
      state.visitorVerificationMode = action.payload.mode;
      if (action.payload.description !== undefined) {
        state.verificationDescription = action.payload.description;
      }
      if (action.payload.ready !== undefined) {
        state.contextReady = action.payload.ready;
      }
    },
    setActiveVisitor: (
      state,
      action: PayloadAction<VisitorDetailsData | null>,
    ) => {
      state.activeVisitor = action.payload;
      if (!action.payload) {
        state.lookupSource = null;
        state.lastGateResult = null;
      }
    },
    setLookupSource: (
      state,
      action: PayloadAction<"code" | "scan" | null>,
    ) => {
      state.lookupSource = action.payload;
    },
    clearActiveVisitor: (state) => {
      state.activeVisitor = null;
      state.lookupSource = null;
      state.lastGateResult = null;
      state.gateVisitorStatus = "idle";
    },
    clearGateResult: (state) => {
      state.lastGateResult = null;
      state.gateVisitorStatus = "idle";
    },
    clearSecurityVisitorError: (state) => {
      state.error = null;
    },
  },
  extraReducers(builder) {
    builder
      .addCase(getAllVisitors.pending, (state) => {
        state.getAllVisitorsStatus = "isLoading";
        state.error = null;
      })
      .addCase(getAllVisitors.fulfilled, (state, action) => {
        state.getAllVisitorsStatus = "succeeded";
        state.allVisitors = action.payload ?? null;
      })
      .addCase(getAllVisitors.rejected, (state, action) => {
        state.getAllVisitorsStatus = "failed";
        setRejectedError(state, action);
      })

      .addCase(gateVisitor.pending, (state) => {
        state.gateVisitorStatus = "isLoading";
        state.error = null;
      })
      .addCase(gateVisitor.fulfilled, (state, action) => {
        state.gateVisitorStatus = "succeeded";
        const result = parseGateResponse(action.payload);
        state.lastGateResult = result;
        if (result.visitor) state.activeVisitor = result.visitor;
      })
      .addCase(gateVisitor.rejected, (state, action) => {
        state.gateVisitorStatus = "failed";
        state.lastGateResult = null;
        setRejectedError(state, action);
      })

      .addCase(getVisitorDetailsByCode.pending, (state) => {
        state.viewDetailsStatus = "isLoading";
        state.error = null;
      })
      .addCase(getVisitorDetailsByCode.fulfilled, (state, action) => {
        state.viewDetailsStatus = "succeeded";
        const visitor = visitorFromPayload(action.payload);
        if (visitor) state.activeVisitor = visitor;
      })
      .addCase(getVisitorDetailsByCode.rejected, (state, action) => {
        state.viewDetailsStatus = "failed";
        state.activeVisitor = null;
        setRejectedError(state, action);
      })

      .addCase(scanVisitor.pending, (state) => {
        state.scanVisitorStatus = "isLoading";
        state.error = null;
      })
      .addCase(scanVisitor.fulfilled, (state, action) => {
        state.scanVisitorStatus = "succeeded";
        const visitor = visitorFromPayload(action.payload);
        if (visitor) state.activeVisitor = visitor;
      })
      .addCase(scanVisitor.rejected, (state, action) => {
        state.scanVisitorStatus = "failed";
        setRejectedError(state, action);
      })

      .addCase(verifyVisitor.pending, (state) => {
        state.verifyVisitorStatus = "isLoading";
        state.error = null;
      })
      .addCase(verifyVisitor.fulfilled, (state, action) => {
        state.verifyVisitorStatus = "succeeded";
        const visitor = visitorFromPayload(action.payload);
        if (visitor) state.activeVisitor = visitor;
      })
      .addCase(verifyVisitor.rejected, (state, action) => {
        state.verifyVisitorStatus = "failed";
        setRejectedError(state, action);
      })

      .addCase(checkoutVisitor.pending, (state) => {
        state.checkoutVisitorStatus = "isLoading";
        state.error = null;
      })
      .addCase(checkoutVisitor.fulfilled, (state) => {
        state.checkoutVisitorStatus = "succeeded";
      })
      .addCase(checkoutVisitor.rejected, (state, action) => {
        state.checkoutVisitorStatus = "failed";
        setRejectedError(state, action);
      });
  },
});

export const {
  resetSecurityVisitorState,
  setSecurityEstateId,
  setSecurityVerificationContext,
  setActiveVisitor,
  setLookupSource,
  clearActiveVisitor,
  clearGateResult,
  clearSecurityVisitorError,
} = securityVisitorSlice.actions;

export default securityVisitorSlice.reducer;
