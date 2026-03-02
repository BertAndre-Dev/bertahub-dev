import { createAsyncThunk } from "@reduxjs/toolkit";
import axiosInstance from "@/utils/axiosInstance";

export interface MeterSummary {
  totalMeters: number;
  activeMeters: number;
  assignedMeters: number;
  unassignedMeters: number;
}

export interface MeterAssignmentStatus {
  assigned: number;
  unassigned: number;
}

export interface MeterActiveStatus {
  active: number;
  inactive: number;
}

export interface MeterReadingStats {
  totalReadings: number;
  uniqueMeterCount: number;
}

export interface MeterAverageCreditMetrics {
  averageCredit: number;
  totalCredit: number;
  maxCredit: number;
  minCredit: number;
  meterCount: number;
}

export interface MeterEfficiencyData {
  meterMetrics: MeterSummary;
  statusMetrics: {
    assignmentRate: number;
    activeRate: number;
    readingRate: number;
  };
  creditMetrics: Omit<MeterAverageCreditMetrics, "meterCount">;
  readingMetrics: {
    totalReadings: number;
    uniqueMeters: number;
    averageReadingsPerMeter: number;
  };
}

export interface MeterAnalyticsDashboardData {
  summary: MeterSummary;
  assignmentStatus: MeterAssignmentStatus;
  activeStatus: MeterActiveStatus;
  readingStats: MeterReadingStats;
  lastSeenTrend: Array<Record<string, unknown>>;
  metersWithHighestCredit: Array<Record<string, unknown>>;
  metersWithLowestCredit: Array<Record<string, unknown>>;
  averageCreditMetrics: MeterAverageCreditMetrics;
  readingsBySource: Array<Record<string, unknown>>;
  readingTrend: Array<Record<string, unknown>>;
}

export interface MeterAnalyticsResponse {
  success: boolean;
  message: string;
  data: MeterAnalyticsDashboardData;
}

export const getMeterAnalyticsDashboard = createAsyncThunk(
  "estate-admin-meter-analytics/getDashboard",
  async (
    { estateId }: { estateId: string },
    { rejectWithValue }
  ) => {
    try {
      const res = await axiosInstance.get<MeterAnalyticsResponse>(
        "/analytics/meters/dashboard",
        { params: { estateId } }
      );
      return res.data;
    } catch (error: any) {
      return rejectWithValue({
        message:
          error?.response?.data?.message ||
          "Failed to fetch meter analytics.",
      });
    }
  }
);
