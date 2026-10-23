"use client";

import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { useDispatch } from "react-redux";
import { Building2 } from "lucide-react";
import { toast } from "react-toastify";
import { Card } from "@/components/ui/card";
import Loader from "@/components/ui/Loader";
import Table from "@/components/tables/list/page";
import { formatDateTime } from "@/lib/format-date";
import { getApiErrorMessage } from "@/lib/api-error";
import { labelForEstateModule, parseEstateModulesResponse } from "@/lib/estate-module-labels";
import { formatVendAmount, labelForPlan } from "@/lib/plans";
import type { AppDispatch } from "@/redux/store";
import {
  fetchEstateModules,
  getEstate,
} from "@/redux/slice/super-admin/super-admin-est-mgt/super-admin-est-mgt";
import { getWallet, getEstateCredits } from "@/redux/slice/estate-admin/wallet-mgt/wallet-mgt";
import { getAllUsersByEstate } from "@/redux/slice/super-admin/super-admin-user/super-admin-user";
import { EstateRatesTab } from "./EstateRatesTab";
import { EstateBillsTab } from "./EstateBillsTab";
import {
  DEFAULT_ESTATE_USER_ROLE,
  ESTATE_SCOPE_ROLE_FILTER_OPTIONS,
  type EstateUserRoleFilter,
} from "@/lib/estate-user-roles";
import {
  SuperAdminWalletPanel,
  type SuperAdminWalletCreditRow,
  type SuperAdminWalletSummary,
} from "@/components/super-admin/SuperAdminWalletPanel";

type EstateDetailData = {
  id?: string;
  _id?: string;
  name?: string;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  isActive?: boolean;
  modules?: string[];
  plan?: string;
  minVendAmount?: number;
  maxVendAmount?: number;
  visitorVerificationMode?: string;
  companyId?: string;
  createdAt?: string | number | Date;
  updatedAt?: string | number | Date;
};

type DetailTab = "overview" | "rates" | "bills" | "wallet" | "users";

type EstateUserRow = {
  id: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  phoneNumber?: string;
  role?: string;
  isActive?: boolean;
  createdAt?: string;
};

const TABS: { id: DetailTab; label: string }[] = [
  { id: "overview", label: "Overview" },
  { id: "rates", label: "Rates" },
  { id: "bills", label: "Bills" },
  { id: "wallet", label: "Wallet" },
  { id: "users", label: "Users" },
];

type Props = Readonly<{
  estateId: string;
  listPath?: string;
}>;

function formatDateValue(value?: string | number | Date | null) {
  if (value == null || value === "") return "—";
  if (value instanceof Date) return formatDateTime(value.toISOString());
  return formatDateTime(String(value));
}

function formatVerificationMode(mode?: string | null) {
  if (mode === "VIEW_AND_VERIFY") return "View and verify";
  if (mode === "VERIFY_ONLY") return "Verify only";
  if (mode === "VIEW_ONLY") return "View only";
  return mode?.trim() || "—";
}

function asRecord(value: unknown): Record<string, unknown> | null {
  if (value == null || typeof value !== "object" || Array.isArray(value)) {
    return null;
  }
  return value as Record<string, unknown>;
}

function toOptionalNumber(value: unknown): number | undefined {
  if (value == null || value === "") return undefined;
  const amount = typeof value === "number" ? value : Number(value);
  return Number.isFinite(amount) ? amount : undefined;
}

function unwrapEstatePayload(payload: unknown): EstateDetailData | null {
  const root = asRecord(payload);
  if (!root) return null;
  const nested = asRecord(root.data);
  const source =
    nested &&
    (nested.name != null ||
      nested.minVendAmount != null ||
      nested.maxVendAmount != null ||
      nested.id != null)
      ? nested
      : root;

  return {
    id: source.id != null ? String(source.id) : undefined,
    _id: source._id != null ? String(source._id) : undefined,
    name: source.name != null ? String(source.name) : undefined,
    address: source.address != null ? String(source.address) : undefined,
    city: source.city != null ? String(source.city) : undefined,
    state: source.state != null ? String(source.state) : undefined,
    country: source.country != null ? String(source.country) : undefined,
    isActive: Boolean(source.isActive),
    modules: Array.isArray(source.modules)
      ? (source.modules as string[])
      : undefined,
    plan: source.plan != null ? String(source.plan) : undefined,
    minVendAmount: toOptionalNumber(
      source.minVendAmount ?? source.min_vend_amount,
    ),
    maxVendAmount: toOptionalNumber(
      source.maxVendAmount ?? source.max_vend_amount,
    ),
    visitorVerificationMode:
      source.visitorVerificationMode != null
        ? String(source.visitorVerificationMode)
        : undefined,
    companyId:
      source.companyId != null && source.companyId !== ""
        ? String(source.companyId)
        : undefined,
    createdAt: source.createdAt as string | number | Date | undefined,
    updatedAt: source.updatedAt as string | number | Date | undefined,
  };
}

function DetailRow({
  label,
  value,
}: Readonly<{ label: string; value: ReactNode }>) {
  return (
    <div>
      <p className="text-sm text-muted-foreground">{label}</p>
      <div className="mt-0.5 text-sm wrap-break-word">{value}</div>
    </div>
  );
}

export function SuperAdminEstateDetailView({
  estateId,
  listPath = "/dashboard/super-admin/estate",
}: Props) {
  const dispatch = useDispatch<AppDispatch>();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<DetailTab>("overview");
  const [estate, setEstate] = useState<EstateDetailData | null>(null);
  const [modules, setModules] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [wallet, setWallet] = useState<SuperAdminWalletSummary | null>(null);
  const [walletLoading, setWalletLoading] = useState(false);
  const [walletError, setWalletError] = useState<string | null>(null);
  const [credits, setCredits] = useState<SuperAdminWalletCreditRow[]>([]);
  const [creditsLoading, setCreditsLoading] = useState(false);
  const [creditsPage, setCreditsPage] = useState(1);
  const [creditsPageSize, setCreditsPageSize] = useState(10);
  const [creditsPagination, setCreditsPagination] = useState<{
    total: number;
    page: number;
    limit: number;
    pages?: number;
  } | null>(null);

  const [users, setUsers] = useState<EstateUserRow[]>([]);
  const [usersLoading, setUsersLoading] = useState(false);
  const [usersPage, setUsersPage] = useState(1);
  const [usersPageSize, setUsersPageSize] = useState(10);
  const [usersRoleFilter, setUsersRoleFilter] =
    useState<EstateUserRoleFilter>(DEFAULT_ESTATE_USER_ROLE);
  const [usersPagination, setUsersPagination] = useState<{
    total: number;
    page: number;
    limit: number;
    pages?: number;
  } | null>(null);

  const fetchEstateDetails = useCallback(async () => {
    if (!estateId) return;
    setLoading(true);
    setError(null);
    try {
      const [estateRes, modulesRes] = await Promise.all([
        dispatch(getEstate(estateId)).unwrap(),
        dispatch(fetchEstateModules(estateId)).unwrap(),
      ]);
      const details = unwrapEstatePayload(estateRes);
      setEstate(details);
      const fromApi = parseEstateModulesResponse(
        modulesRes?.data ?? modulesRes,
      );
      const fromDetails =
        details && Array.isArray(details.modules) ? details.modules : [];
      setModules(fromApi.length > 0 ? fromApi : fromDetails);
    } catch (err: unknown) {
      const message = getApiErrorMessage(err);
      setError(message ?? "Failed to load estate.");
      if (message) toast.error(message);
    } finally {
      setLoading(false);
    }
  }, [dispatch, estateId]);

  const fetchWalletData = useCallback(
    async (page = 1, limit = creditsPageSize) => {
      if (!estateId) return;
      setWalletLoading(page === 1);
      setCreditsLoading(true);
      setWalletError(null);
      try {
        const [walletRes, creditsRes] = await Promise.all([
          dispatch(getWallet(estateId)).unwrap(),
          dispatch(
            getEstateCredits({ estateId, page, limit }),
          ).unwrap(),
        ]);

        const walletData = (walletRes?.data ?? walletRes) as Record<
          string,
          unknown
        > | null;
        setWallet(
          walletData
            ? {
                balance: Number(walletData.balance ?? 0),
                availableBalance: Number(walletData.availableBalance ?? 0),
                withdrawableBalance: Number(
                  walletData.withdrawableBalance ?? 0,
                ),
                temporaryBalance: Number(walletData.temporaryBalance ?? 0),
                lockedBalance: Number(walletData.lockedBalance ?? 0),
                accountNumber: String(walletData.accountNumber ?? "").trim(),
                bankCode: String(walletData.bankCode ?? "").trim(),
                autoSettlementEnabled: Boolean(walletData.autoSettlementEnabled),
              }
            : null,
        );

        const creditRows = Array.isArray(creditsRes?.data)
          ? creditsRes.data
          : [];
        setCredits(
          creditRows.map((item: Record<string, unknown>, index: number) => ({
            id: String(item.id ?? item._id ?? index),
            amount: Number(item.amount ?? 0),
            description: String(item.description ?? ""),
            source: String(item.source ?? ""),
            tx_ref: String(item.tx_ref ?? ""),
            createdAt: String(item.createdAt ?? ""),
          })),
        );
        setCreditsPagination(creditsRes?.pagination ?? null);
        setCreditsPage(page);
      } catch (err: unknown) {
        const message = getApiErrorMessage(err);
        setWallet(null);
        setCredits([]);
        setWalletError(message ?? "Wallet not available.");
      } finally {
        setWalletLoading(false);
        setCreditsLoading(false);
      }
    },
    [dispatch, estateId, creditsPageSize],
  );

  const fetchUsers = useCallback(
    async (
      page = 1,
      role: EstateUserRoleFilter = usersRoleFilter,
      limit = usersPageSize,
    ) => {
      if (!estateId) return;
      setUsersLoading(true);
      try {
        const res = await dispatch(
          getAllUsersByEstate({
            estateId,
            page,
            limit,
            role,
          }),
        ).unwrap();
        const rows = Array.isArray(res?.data) ? res.data : [];
        setUsers(
          rows.map((item: Record<string, unknown>, index: number) => ({
            id: String(item.id ?? item._id ?? index),
            firstName: String(item.firstName ?? ""),
            lastName: String(item.lastName ?? ""),
            email: String(item.email ?? ""),
            phoneNumber: String(item.phoneNumber ?? ""),
            role: String(item.role ?? ""),
            isActive: Boolean(item.isActive),
            createdAt: String(item.createdAt ?? ""),
          })),
        );
        setUsersPagination(res?.pagination ?? null);
        setUsersPage(page);
      } catch (err: unknown) {
        const message = getApiErrorMessage(err);
        setUsers([]);
        if (message) toast.error(message);
      } finally {
        setUsersLoading(false);
      }
    },
    [dispatch, estateId, usersRoleFilter, usersPageSize],
  );

  useEffect(() => {
    fetchEstateDetails().catch(() => {});
  }, [fetchEstateDetails]);

  useEffect(() => {
    if (activeTab === "wallet") {
      fetchWalletData(1).catch(() => {});
    }
    if (activeTab === "users") {
      fetchUsers(1, usersRoleFilter).catch(() => {});
    }
  }, [activeTab, fetchWalletData, fetchUsers, usersRoleFilter]);

  const userColumns = useMemo(
    () => [
      {
        key: "name",
        header: "Name",
        render: (item: EstateUserRow) =>
          `${item.firstName ?? ""} ${item.lastName ?? ""}`.trim() || "—",
      },
      {
        key: "email",
        header: "Email",
        render: (item: EstateUserRow) => item.email || "—",
      },
      {
        key: "phoneNumber",
        header: "Phone",
        render: (item: EstateUserRow) => item.phoneNumber || "—",
      },
      {
        key: "role",
        header: "Role",
        render: (item: EstateUserRow) => item.role || "—",
      },
      {
        key: "status",
        header: "Status",
        render: (item: EstateUserRow) => (
          <span
            className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${
              item.isActive
                ? "bg-green-100 text-green-700"
                : "bg-red-100 text-red-700"
            }`}
          >
            {item.isActive ? "Active" : "Inactive"}
          </span>
        ),
      },
      {
        key: "createdAt",
        header: "Joined",
        render: (item: EstateUserRow) => formatDateTime(item.createdAt),
      },
    ],
    [],
  );

  const pageLoading = loading && !estate;

  return (
    <div className="relative space-y-6">
      {pageLoading && <Loader fullScreen label="Loading estate..." />}

      <div className={pageLoading ? "pointer-events-none select-none" : ""}>
        <Card className="p-4 sm:p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:gap-3">
            <button
              type="button"
              aria-label="Back to estate management"
              onClick={() => router.push(listPath)}
              className="grid h-10 w-10 shrink-0 cursor-pointer place-items-center self-start rounded-full bg-[#F2F2F2] hover:opacity-80"
            >
              <Image src="/arrow.svg" alt="" width={20} height={20} />
            </button>

            <div className="flex min-w-0 flex-1 flex-col gap-3">
              <div className="flex min-w-0 items-start gap-3">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-blue-500/10 text-blue-600">
                  <Building2 className="h-6 w-6" aria-hidden />
                </div>
                <div className="min-w-0 flex-1">
                  <h1 className="font-heading text-lg font-bold break-words sm:text-xl lg:text-2xl">
                    {estate?.name || "Estate details"}
                  </h1>
                  <p className="mt-0.5 text-sm text-muted-foreground break-words">
                    {[estate?.city, estate?.state, estate?.country]
                      .filter(Boolean)
                      .join(", ") || "—"}
                  </p>
                  {estate ? (
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      <span
                        className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                          estate.isActive
                            ? "bg-green-100 text-green-700"
                            : "bg-red-100 text-red-700"
                        }`}
                      >
                        {estate.isActive ? "Active" : "Inactive"}
                      </span>
                      <span className="inline-flex items-center rounded-full bg-[#0150AC]/10 px-2.5 py-0.5 text-xs font-medium text-[#0150AC]">
                        Min vend {formatVendAmount(estate.minVendAmount)}
                      </span>
                      <span className="inline-flex items-center rounded-full bg-[#0150AC]/10 px-2.5 py-0.5 text-xs font-medium text-[#0150AC]">
                        Max vend {formatVendAmount(estate.maxVendAmount)}
                      </span>
                    </div>
                  ) : null}
                </div>
              </div>
            </div>
          </div>
        </Card>

        <div className="flex gap-1 overflow-x-auto border-b border-border">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={[
                "cursor-pointer whitespace-nowrap border-b-2 px-4 py-2.5 text-sm font-medium transition-colors",
                activeTab === tab.id
                  ? "border-primary text-primary"
                  : "border-transparent text-muted-foreground hover:text-foreground",
              ].join(" ")}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {error && !estate ? (
          <Card className="p-6 text-center text-sm text-red-600">{error}</Card>
        ) : null}

        {activeTab === "overview" && estate ? (
          <Card className="space-y-4 p-4 sm:p-6">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <DetailRow label="Estate name" value={estate.name || "—"} />
              <DetailRow
                label="Status"
                value={estate.isActive ? "Active" : "Inactive"}
              />
              <DetailRow label="Address" value={estate.address || "—"} />
              <DetailRow label="City" value={estate.city || "—"} />
              <DetailRow label="State" value={estate.state || "—"} />
              <DetailRow label="Country" value={estate.country || "—"} />
              <DetailRow label="Plan" value={labelForPlan(estate.plan)} />
              <DetailRow
                label="Min vend amount"
                value={formatVendAmount(estate.minVendAmount)}
              />
              <DetailRow
                label="Max vend amount"
                value={formatVendAmount(estate.maxVendAmount)}
              />
              <DetailRow
                label="Visitor verification"
                value={formatVerificationMode(estate.visitorVerificationMode)}
              />
              <DetailRow
                label="Company ID"
                value={estate.companyId || "—"}
              />
              <DetailRow
                label="Created at"
                value={formatDateValue(estate.createdAt)}
              />
              <DetailRow
                label="Updated at"
                value={formatDateValue(estate.updatedAt)}
              />
            </div>

            <div>
              <p className="mb-2 text-sm text-muted-foreground">Modules</p>
              {modules.length === 0 ? (
                <p className="text-sm">—</p>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {modules.map((mod) => (
                    <span
                      key={mod}
                      className="inline-flex items-center rounded-md bg-[#D0DFF280] px-2.5 py-1 text-xs font-medium text-foreground"
                    >
                      {labelForEstateModule(mod)}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </Card>
        ) : null}

        {activeTab === "rates" && estateId ? (
          <Card className="p-4 sm:p-6">
            <EstateRatesTab estateId={estateId} estateName={estate?.name} />
          </Card>
        ) : null}

        {activeTab === "bills" && estateId ? (
          <Card className="p-4 sm:p-6">
            <EstateBillsTab estateId={estateId} />
          </Card>
        ) : null}

        {activeTab === "wallet" ? (
          <Card className="p-4 sm:p-6">
            <SuperAdminWalletPanel
              wallet={wallet}
              credits={credits}
              walletLoading={walletLoading}
              walletError={walletError}
              creditsLoading={creditsLoading}
              creditsPagination={creditsPagination}
              creditsPageSize={creditsPageSize}
              onCreditsPageChange={(page) => {
                fetchWalletData(page).catch(() => {});
              }}
              onCreditsPageSizeChange={(size) => {
                setCreditsPageSize(size);
              }}
            />
          </Card>
        ) : null}

        {activeTab === "users" ? (
          <Card className="gap-0 overflow-hidden rounded-xl border border-border p-0 shadow-sm">
            <div className="border-b border-border px-5 py-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h3 className="font-heading text-base font-bold text-foreground">
                    Estate users
                  </h3>
                  <p className="mt-0.5 text-sm text-muted-foreground">
                    Users linked to this estate
                  </p>
                </div>
                <div className="w-full sm:w-44">
                  <label
                    htmlFor="estate-users-role-filter"
                    className="sr-only"
                  >
                    Filter by role
                  </label>
                  <select
                    id="estate-users-role-filter"
                    aria-label="Filter users by role"
                    className="w-full rounded-md border border-border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#0150AC]"
                    value={usersRoleFilter}
                    onChange={(e) => {
                      const role = e.target.value as EstateUserRoleFilter;
                      setUsersRoleFilter(role);
                      setUsersPage(1);
                    }}
                  >
                    {ESTATE_SCOPE_ROLE_FILTER_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
            <div className="p-4">
              {usersLoading && users.length === 0 ? (
                <p className="py-6 text-center text-sm text-muted-foreground">
                  Loading users...
                </p>
              ) : (
                <Table
                  columns={userColumns}
                  data={users}
                  emptyMessage="No users found for this estate."
                  showPagination={Boolean(
                    usersPagination && usersPagination.total > 0,
                  )}
                  paginationInfo={
                    usersPagination
                      ? {
                          total: usersPagination.total,
                          current: usersPage,
                          pageSize: usersPageSize,
                        }
                      : undefined
                  }
                  onPageChange={(page) => {
                    fetchUsers(page, usersRoleFilter).catch(() => {});
                  }}
                  onPageSizeChange={(size) => {
                    setUsersPageSize(size);
                  }}
                />
              )}
            </div>
          </Card>
        ) : null}
      </div>
    </div>
  );
}

export default SuperAdminEstateDetailView;
