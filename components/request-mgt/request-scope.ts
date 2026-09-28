import type { RootState } from "@/redux/store";
import {
  cancelCompanyRequest,
  decideCompanyRequest,
  deleteCompanyRequest,
  getCompanyRequestById,
  getCompanyRequests,
  COMPANY_REQUEST_STATUS_OPTIONS,
  type CompanyRequestItem,
  type CompanyRequestStatus,
} from "@/redux/slice/company/request/company-request";
import {
  clearCompanyRequestSelected,
  resetCompanyRequestUi,
  setCompanyRequestPage,
  setCompanyRequestSearch,
  setCompanyRequestStatusFilter,
  setCompanyRequestPageSize,
} from "@/redux/slice/company/request/company-request-slice";
import {
  cancelEstateAdminRequest,
  decideEstateAdminRequest,
  deleteEstateAdminRequest,
  getEstateAdminRequestById,
  getEstateAdminRequests,
  ESTATE_ADMIN_REQUEST_STATUS_OPTIONS,
  type EstateAdminRequestItem,
  type EstateAdminRequestStatus,
} from "@/redux/slice/estate-admin/request/estate-admin-request";
import {
  clearEstateAdminRequestSelected,
  resetEstateAdminRequestUi,
  setEstateAdminRequestPage,
  setEstateAdminRequestSearch,
  setEstateAdminRequestStatusFilter,
  setEstateAdminRequestPageSize,
} from "@/redux/slice/estate-admin/request/estate-admin-request-slice";

export type RequestScope = "company" | "estateAdmin";

export type ScopedRequestItem = CompanyRequestItem | EstateAdminRequestItem;
export type ScopedRequestStatus =
  | CompanyRequestStatus
  | EstateAdminRequestStatus;

export interface RequestSliceViewState {
  list: ScopedRequestItem[];
  selected: ScopedRequestItem | null;
  pagination: {
    total: number;
    page: number;
    limit: number;
    pages?: number;
  } | null;
  ui: {
    page: number;
    pageSize: number;
    search: string;
    statusFilter: ScopedRequestStatus | "";
  };
  getListStatus: string;
  getByIdStatus: string;
  decideStatus: string;
  cancelStatus: string;
  deleteStatus: string;
}

export interface RequestScopeApi {
  selectState: (state: RootState) => RequestSliceViewState;
  statusOptions: { value: ScopedRequestStatus | ""; label: string }[];
  getList: typeof getCompanyRequests;
  getById: typeof getCompanyRequestById;
  decide: typeof decideCompanyRequest;
  cancel: typeof cancelCompanyRequest;
  delete: typeof deleteCompanyRequest;
  setSearch: (value: string) => { type: string; payload: string };
  setStatusFilter: (value: ScopedRequestStatus | "") => {
    type: string;
    payload: ScopedRequestStatus | "";
  };
  setPage: (value: number) => { type: string; payload: number };
  setPageSize: (value: number) => { type: string; payload: number };
  clearSelected: () => { type: string };
  resetUi: () => { type: string };
}

const companyScope: RequestScopeApi = {
  selectState: (state) => state.companyRequest as RequestSliceViewState,
  statusOptions: COMPANY_REQUEST_STATUS_OPTIONS,
  getList: getCompanyRequests,
  getById: getCompanyRequestById,
  decide: decideCompanyRequest,
  cancel: cancelCompanyRequest,
  delete: deleteCompanyRequest,
  setSearch: setCompanyRequestSearch,
  setStatusFilter: setCompanyRequestStatusFilter as RequestScopeApi["setStatusFilter"],
  setPage: setCompanyRequestPage,
  setPageSize: setCompanyRequestPageSize,
  clearSelected: clearCompanyRequestSelected,
  resetUi: resetCompanyRequestUi,
};

const estateAdminScope: RequestScopeApi = {
  selectState: (state) => state.estateAdminRequest as RequestSliceViewState,
  statusOptions: ESTATE_ADMIN_REQUEST_STATUS_OPTIONS,
  getList: getEstateAdminRequests as RequestScopeApi["getList"],
  getById: getEstateAdminRequestById as RequestScopeApi["getById"],
  decide: decideEstateAdminRequest as RequestScopeApi["decide"],
  cancel: cancelEstateAdminRequest as RequestScopeApi["cancel"],
  delete: deleteEstateAdminRequest as RequestScopeApi["delete"],
  setSearch: setEstateAdminRequestSearch,
  setStatusFilter:
    setEstateAdminRequestStatusFilter as RequestScopeApi["setStatusFilter"],
  setPage: setEstateAdminRequestPage,
  setPageSize: setEstateAdminRequestPageSize,
  clearSelected: clearEstateAdminRequestSelected,
  resetUi: resetEstateAdminRequestUi,
};

export function getRequestScopeApi(scope: RequestScope): RequestScopeApi {
  return scope === "company" ? companyScope : estateAdminScope;
}
