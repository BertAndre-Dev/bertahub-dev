"use client";

import type React from "react";
import { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { toast } from "react-toastify";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Modal from "@/components/modal/page";
import Table from "@/components/tables/list/page";
import EstateWalletOverviewCard from "@/components/estate-admin/wallet-overview-card/page";
import CompanyWithdrawFundForm from "@/components/company/wallet/CompanyWithdrawFundForm";
import { getSignedInUser } from "@/redux/slice/auth-mgt/auth-mgt";
import { getBanks } from "@/redux/slice/estate-admin/fund-wallet/fund-wallet";
import type { BankItem } from "@/redux/slice/estate-admin/fund-wallet/fund-wallet";
import { verifyCompanyTransaction } from "@/redux/slice/company/transaction/company-transaction";
import {
  createCompanyWallet,
  getCompanyWallet,
  getCompanyCredits,
} from "@/redux/slice/company/wallet-mgt/company-wallet-mgt";
import {
  selectCompanyCredits,
  selectCompanyCreditsLoading,
  selectCompanyCreditsPagination,
  selectCompanyWallet,
} from "@/redux/slice/company/wallet-mgt/company-wallet-mgt-slice";
import { parseCompanyFromUser } from "@/app/dashboard/company/lib/company";
import type { AppDispatch, RootState } from "@/redux/store";
import type { CompanyCreditItem } from "@/redux/slice/company/wallet-mgt/company-wallet-mgt-slice";

const LIMIT = 10;

function dedupeBanksByCode(banks: BankItem[]): BankItem[] {
  const seen = new Set<string>();
  return banks.filter((bank) => {
    if (seen.has(bank.code)) return false;
    seen.add(bank.code);
    return true;
  });
}

interface ExtendedCompanyCreditItem extends CompanyCreditItem {
  serviceCharge?: number;
  source?: string;
}

export default function CompanyWalletPage() {
  const dispatch = useDispatch<AppDispatch>();
  const [open, setOpen] = useState(false);
  const [createWalletModalOpen, setCreateWalletModalOpen] = useState(false);
  const [createWalletAccountNumber, setCreateWalletAccountNumber] =
    useState("");
  const [createWalletBankCode, setCreateWalletBankCode] = useState("");
  const [userId, setUserId] = useState<string | null>(null);
  const [companyId, setCompanyId] = useState<string | null>(null);
  const [companyName, setCompanyName] = useState("Company");
  const [creditsPage, setCreditsPage] = useState(1);

  const wallet = useSelector(selectCompanyWallet);
  const creditsData = useSelector(selectCompanyCredits);
  const creditsPagination = useSelector(selectCompanyCreditsPagination);
  const creditsLoading = useSelector(selectCompanyCreditsLoading);
  const createWalletState = useSelector(
    (state: RootState) => state.companyWallet?.createWalletState ?? "idle",
  );
  const { banks, getBanksState } = useSelector(
    (state: RootState) => state.estateAdminFundWallet,
  );
  const loadingBanks = getBanksState === "isLoading";
  const bankOptions = useMemo(() => dedupeBanksByCode(banks), [banks]);

  const fetchCredits = (page = creditsPage) => {
    if (!companyId) return Promise.resolve();
    return dispatch(
      getCompanyCredits({
        companyId,
        page,
        limit: LIMIT,
      }),
    ).unwrap();
  };

  useEffect(() => {
    (async () => {
      try {
        const userRes = await dispatch(getSignedInUser()).unwrap();
        const data = (userRes?.data ?? userRes) as Record<string, unknown>;
        const id = (data.id as string) || (data._id as string) || null;
        const company = parseCompanyFromUser(data);

        if (id) setUserId(id);
        if (!company?.id) {
          toast.error("No company ID found for this user.");
          return;
        }

        setCompanyId(company.id);
        setCompanyName(company.name);

        await dispatch(getCompanyWallet(company.id))
          .unwrap()
          .catch(() => {});
        await dispatch(
          getCompanyCredits({
            companyId: company.id,
            page: 1,
            limit: LIMIT,
          }),
        )
          .unwrap()
          .catch(() => {});
      } catch {
        // wallet may not exist yet
      }
    })();
  }, [dispatch]);

  useEffect(() => {
    if (!companyId || creditsPage === 1) return;
    fetchCredits(creditsPage).catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [companyId, creditsPage]);

  useEffect(() => {
    dispatch(getBanks("NG"));
  }, [dispatch]);

  const handleCreateWallet = async () => {
    if (!companyId) {
      toast.warning("No company found.");
      return;
    }
    if (!createWalletAccountNumber.trim()) {
      toast.warning("Please enter the account number you want to withdraw to.");
      return;
    }
    if (!createWalletBankCode.trim()) {
      toast.warning("Please select a bank.");
      return;
    }
    try {
      await dispatch(
        createCompanyWallet({
          companyId,
          balance: 0,
          lockedBalance: 0,
          accountNumber: createWalletAccountNumber.trim(),
          bankCode: createWalletBankCode.trim(),
        }),
      ).unwrap();
      toast.success("Wallet created successfully.");
      setCreateWalletModalOpen(false);
      setCreateWalletAccountNumber("");
      setCreateWalletBankCode("");
      await dispatch(getCompanyWallet(companyId));
      await fetchCredits(1);
    } catch (error: unknown) {
      toast.error(
        (error as { message?: string })?.message || "Failed to create wallet.",
      );
    }
  };

  const walletBankName =
    wallet && wallet.bankCode
      ? (bankOptions.find((b) => b.code === wallet.bankCode)?.name ?? "")
      : "";

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const tx_ref = urlParams.get("tx_ref") || urlParams.get("trx_ref");
    if (!tx_ref) return;

    const verifyTransactionAsync = async () => {
      try {
        let currentUserId = userId;
        let currentCompanyId = companyId;

        if (!currentUserId || !currentCompanyId) {
          const userRes = await dispatch(getSignedInUser()).unwrap();
          const data = userRes?.data ?? userRes;
          currentUserId = data?.id;
          const company = parseCompanyFromUser(
            (data ?? {}) as Record<string, unknown>,
          );
          currentCompanyId = company?.id ?? null;
          setUserId(currentUserId ?? null);
          setCompanyId(currentCompanyId);
        }

        if (!currentUserId || !currentCompanyId) {
          throw new Error("User or company not found");
        }

        await dispatch(verifyCompanyTransaction({ tx_ref })).unwrap();
        toast.success("Withdrawal successful!");
        await dispatch(getCompanyWallet(currentCompanyId));
        await fetchCredits(creditsPage);

        const url = new URL(window.location.href);
        ["tx_ref", "trx_ref", "transaction_id", "status"].forEach((key) =>
          url.searchParams.delete(key),
        );
        window.history.replaceState({}, document.title, url.toString());
      } catch (err: unknown) {
        toast.error(
          (err as { message?: string })?.message || "Verification failed",
        );
      }
    };

    const timer = setTimeout(verifyTransactionAsync, 800);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dispatch, userId, companyId, creditsPage]);

  const creditsColumns: Array<{
    key: string;
    header: string;
    render: (item: ExtendedCompanyCreditItem) => React.ReactNode;
  }> = [
    {
      key: "createdAt",
      header: "Date",
      render: (item) =>
        item.createdAt
          ? new Date(item.createdAt).toLocaleString("en-NG", {
              year: "numeric",
              month: "short",
              day: "2-digit",
              hour: "2-digit",
              minute: "2-digit",
            })
          : "—",
    },
    {
      key: "amount",
      header: "Amount (₦)",
      render: (item) =>
        typeof item.amount === "number"
          ? Number(item.amount).toLocaleString()
          : "—",
    },
    {
      key: "tx_ref",
      header: "Transaction Reference",
      render: (item) => (typeof item.tx_ref === "string" ? item.tx_ref : "—"),
    },
    {
      key: "source",
      header: "Source",
      render: (item) => (typeof item.source === "string" ? item.source : "—"),
    },
    {
      key: "description",
      header: "Description",
      render: (item) =>
        typeof item.description === "string" ? item.description : "—",
    },
  ];

  const pag = creditsPagination as
    | { total?: number; page?: number; limit?: number; pages?: number }
    | undefined;
  const total =
    typeof pag?.total === "number" ? pag.total : Number(pag?.total) || 0;
  const pageNum =
    typeof pag?.page === "number" ? pag.page : Number(pag?.page) || creditsPage;
  const pageSize =
    typeof pag?.limit === "number" ? pag.limit : Number(pag?.limit) || LIMIT;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-3xl font-bold">Wallet Management</h1>
        <p className="text-muted-foreground mt-1">
          Welcome back! Here is an overview for{" "}
          <span className="text-[18px] font-bold underline uppercase text-black">
            {companyName}
          </span>
          .
        </p>
      </div>

      <EstateWalletOverviewCard
        wallet={wallet}
        billStats={{
          totalBills: 0,
          paidBills: 0,
          pendingBills: 0,
          serviceFee: 0,
        }}
        onWithdraw={() => setOpen((prev) => !prev)}
        onCreateWallet={() => setCreateWalletModalOpen(true)}
        createWalletLoading={createWalletState === "isLoading"}
      />

      <Card className="p-4">
        <h2 className="font-semibold">Company Credits</h2>
        <p className="text-sm text-muted-foreground">
          Amounts credited to your company wallet.
        </p>
        <Table<ExtendedCompanyCreditItem>
          columns={creditsColumns}
          data={creditsData as ExtendedCompanyCreditItem[]}
          emptyMessage={
            creditsLoading ? "Loading company credits..." : "No credits found."
          }
          showPagination
          paginationInfo={{
            total,
            current: pageNum,
            pageSize,
          }}
          onPageChange={setCreditsPage}
          enableExport
          exportFileName="company-credits"
          onExportRequest={
            companyId
              ? async () => {
                  const res = await dispatch(
                    getCompanyCredits({
                      companyId,
                      page: 1,
                      limit: 50000,
                    }),
                  ).unwrap();
                  return res?.data ?? [];
                }
              : undefined
          }
        />
      </Card>

      <Modal visible={open} onClose={() => setOpen(false)}>
        <div className="bg-white rounded-md shadow-md w-full max-w-md mx-auto">
          {userId && wallet && companyId ? (
            <CompanyWithdrawFundForm
              userId={userId}
              walletId={wallet.id ?? ""}
              companyId={companyId}
              defaultAccountNumber={wallet.accountNumber ?? ""}
              bankCode={wallet.bankCode ?? ""}
              bankName={walletBankName}
              maxWithdrawableAmount={
                wallet.withdrawableBalance ?? wallet.temporaryBalance ?? 0
              }
              creditsPage={creditsPage}
              onClose={() => setOpen(false)}
            />
          ) : (
            <p className="text-center text-gray-500 p-6">Loading form...</p>
          )}
        </div>
      </Modal>

      <Modal
        visible={createWalletModalOpen}
        onClose={() => {
          setCreateWalletModalOpen(false);
          setCreateWalletAccountNumber("");
          setCreateWalletBankCode("");
        }}
      >
        <div className="rounded-md shadow-md w-full max-w-md mx-auto mt-12 pb-8 px-4">
          <h2 className="text-lg font-semibold mb-4">Create Wallet</h2>
          <p className="text-sm text-muted-foreground mb-4">
            Your withdrawal will be sent to this account number. Select the bank
            and enter the account number.
          </p>
          <div className="space-y-4">
            <div>
              <Label htmlFor="create-company-wallet-bank">Bank</Label>
              <select
                id="create-company-wallet-bank"
                value={createWalletBankCode}
                onChange={(e) => setCreateWalletBankCode(e.target.value)}
                className="mt-2 flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                disabled={loadingBanks}
                aria-label="Select bank"
              >
                <option value="">
                  {loadingBanks ? "Loading banks..." : "Select bank"}
                </option>
                {bankOptions.map((bank) => (
                  <option key={bank.id} value={bank.code}>
                    {bank.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <Label htmlFor="create-company-wallet-account">
                Account Number
              </Label>
              <Input
                id="create-company-wallet-account"
                type="text"
                value={createWalletAccountNumber}
                onChange={(e) => setCreateWalletAccountNumber(e.target.value)}
                placeholder="e.g. 0002299900"
                className="mt-2"
              />
            </div>
            <div className="flex gap-2 justify-end">
              <Button
                variant="outline"
                onClick={() => {
                  setCreateWalletModalOpen(false);
                  setCreateWalletAccountNumber("");
                  setCreateWalletBankCode("");
                }}
              >
                Cancel
              </Button>
              <Button
                onClick={handleCreateWallet}
                disabled={
                  createWalletState === "isLoading" ||
                  !createWalletAccountNumber.trim() ||
                  !createWalletBankCode.trim() ||
                  loadingBanks
                }
              >
                {createWalletState === "isLoading"
                  ? "Creating..."
                  : "Create Wallet"}
              </Button>
            </div>
          </div>
        </div>
      </Modal>
    </div>
  );
}
