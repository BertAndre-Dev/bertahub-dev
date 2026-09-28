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
import { labelForEstateModule } from "@/lib/estate-module-labels";
import { labelForPlan } from "@/lib/plans";
import type { AppDispatch } from "@/redux/store";
import { getCompanyById } from "@/redux/slice/super-admin/company-mgt/company";
import {
  getCompanyCredits,
  getCompanyWallet,
} from "@/redux/slice/company/wallet-mgt/company-wallet-mgt";
import { getAllUsersByCompany } from "@/redux/slice/super-admin/super-admin-user/super-admin-user";
import {
  SuperAdminWalletPanel,
  type SuperAdminWalletCreditRow,
  type SuperAdminWalletSummary,
} from "@/components/super-admin/SuperAdminWalletPanel";
import {
  DEFAULT_ESTATE_USER_ROLE,
  ESTATE_USER_ROLE_FILTER_OPTIONS,
  type EstateUserRoleFilter,
} from "@/lib/estate-user-roles";

type CompanyDetailData = {
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
  createdAt?: string;
  updatedAt?: string;
};

type DetailTab = "overview" | "wallet" | "users";

type CompanyUserRow = {
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
  { id: "wallet", label: "Wallet" },
  { id: "users", label: "Users" },
];

type Props = Readonly<{
  companyId: string;
  listPath?: string;
}>;

function formatDateValue(value?: string | null) {
  if (!value) return "—";
  return formatDateTime(value);
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

export function SuperAdminCompanyDetailView({
  companyId,
  listPath = "/dashboard/super-admin/company",
}: Props) {
  const dispatch = useDispatch<AppDispatch>();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<DetailTab>("overview");
  const [company, setCompany] = useState<CompanyDetailData | null>(null);
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

  const [users, setUsers] = useState<CompanyUserRow[]>([]);
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

  const fetchCompanyDetails = useCallback(async () => {
    if (!companyId) return;
    setLoading(true);
    setError(null);
    try {
      const res = await dispatch(getCompanyById(companyId)).unwrap();
      const details = (res?.data ?? res) as CompanyDetailData | null;
      setCompany(details);
    } catch (err: unknown) {
      const message = getApiErrorMessage(err);
      setError(message ?? "Failed to load company.");
      if (message) toast.error(message);
    } finally {
      setLoading(false);
    }
  }, [dispatch, companyId]);

  const fetchWalletData = useCallback(
    async (page = 1, limit = creditsPageSize) => {
      if (!companyId) return;
      setWalletLoading(page === 1);
      setCreditsLoading(true);
      setWalletError(null);
      try {
        const [walletRes, creditsRes] = await Promise.all([
          dispatch(getCompanyWallet(companyId)).unwrap(),
          dispatch(
            getCompanyCredits({ companyId, page, limit }),
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
    [dispatch, companyId, creditsPageSize],
  );

  const fetchUsers = useCallback(
    async (
      page = 1,
      role: EstateUserRoleFilter = usersRoleFilter,
      limit = usersPageSize,
    ) => {
      if (!companyId) return;
      setUsersLoading(true);
      try {
        const res = await dispatch(
          getAllUsersByCompany({
            companyId,
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
    [dispatch, companyId, usersRoleFilter, usersPageSize],
  );

  useEffect(() => {
    fetchCompanyDetails().catch(() => {});
  }, [fetchCompanyDetails]);

  useEffect(() => {
    if (activeTab === "wallet") {
      fetchWalletData(1).catch(() => {});
    }
    if (activeTab === "users") {
      fetchUsers(1, usersRoleFilter).catch(() => {});
    }
  }, [activeTab, fetchWalletData, fetchUsers, usersRoleFilter]);

  const modules = Array.isArray(company?.modules) ? company.modules : [];

  const userColumns = useMemo(
    () => [
      {
        key: "name",
        header: "Name",
        render: (item: CompanyUserRow) =>
          `${item.firstName ?? ""} ${item.lastName ?? ""}`.trim() || "—",
      },
      {
        key: "email",
        header: "Email",
        render: (item: CompanyUserRow) => item.email || "—",
      },
      {
        key: "phoneNumber",
        header: "Phone",
        render: (item: CompanyUserRow) => item.phoneNumber || "—",
      },
      {
        key: "role",
        header: "Role",
        render: (item: CompanyUserRow) => item.role || "—",
      },
      {
        key: "status",
        header: "Status",
        render: (item: CompanyUserRow) => (
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
        render: (item: CompanyUserRow) => formatDateTime(item.createdAt),
      },
    ],
    [],
  );

  const pageLoading = loading && !company;

  return (
    <div className="relative space-y-6">
      {pageLoading && <Loader fullScreen label="Loading company..." />}

      <div className={pageLoading ? "pointer-events-none select-none" : ""}>
        <Card className="p-4 sm:p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:gap-3">
            <button
              type="button"
              aria-label="Back to company management"
              onClick={() => router.push(listPath)}
              className="grid h-10 w-10 shrink-0 cursor-pointer place-items-center self-start rounded-full bg-[#F2F2F2] hover:opacity-80"
            >
              <Image src="/arrow.svg" alt="" width={20} height={20} />
            </button>

            <div className="flex min-w-0 flex-1 flex-col gap-3">
              <div className="flex min-w-0 items-start gap-3">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-violet-500/10 text-violet-600">
                  <Building2 className="h-6 w-6" aria-hidden />
                </div>
                <div className="min-w-0 flex-1">
                  <h1 className="font-heading text-lg font-bold break-words sm:text-xl lg:text-2xl">
                    {company?.name || "Company details"}
                  </h1>
                  <p className="mt-0.5 text-sm text-muted-foreground break-words">
                    {[company?.city, company?.state, company?.country]
                      .filter(Boolean)
                      .join(", ") || "—"}
                  </p>
                  {company ? (
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      <span
                        className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                          company.isActive
                            ? "bg-green-100 text-green-700"
                            : "bg-red-100 text-red-700"
                        }`}
                      >
                        {company.isActive ? "Active" : "Inactive"}
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

        {error && !company ? (
          <Card className="p-6 text-center text-sm text-red-600">{error}</Card>
        ) : null}

        {activeTab === "overview" && company ? (
          <Card className="space-y-4 p-4 sm:p-6">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <DetailRow label="Company name" value={company.name || "—"} />
              <DetailRow
                label="Status"
                value={company.isActive ? "Active" : "Inactive"}
              />
              <DetailRow label="Plan" value={labelForPlan(company.plan)} />
              <DetailRow label="Address" value={company.address || "—"} />
              <DetailRow label="City" value={company.city || "—"} />
              <DetailRow label="State" value={company.state || "—"} />
              <DetailRow label="Country" value={company.country || "—"} />
              <DetailRow
                label="Created at"
                value={formatDateValue(company.createdAt)}
              />
              <DetailRow
                label="Updated at"
                value={formatDateValue(company.updatedAt)}
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
                    Company users
                  </h3>
                  <p className="mt-0.5 text-sm text-muted-foreground">
                    Users linked to this company
                  </p>
                </div>
                <div className="w-full sm:w-44">
                  <label
                    htmlFor="company-users-role-filter"
                    className="sr-only"
                  >
                    Filter by role
                  </label>
                  <select
                    id="company-users-role-filter"
                    aria-label="Filter users by role"
                    className="w-full rounded-md border border-border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#0150AC]"
                    value={usersRoleFilter}
                    onChange={(e) => {
                      const role = e.target.value as EstateUserRoleFilter;
                      setUsersRoleFilter(role);
                      setUsersPage(1);
                    }}
                  >
                    {ESTATE_USER_ROLE_FILTER_OPTIONS.map((option) => (
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
                  emptyMessage="No users found for this company."
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

export default SuperAdminCompanyDetailView;
