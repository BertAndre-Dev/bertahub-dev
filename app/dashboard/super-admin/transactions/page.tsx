"use client"

import { useEffect, useMemo, useState } from "react"
import Table from "@/components/tables/list/page"
import { Card } from "@/components/ui/card"
import axiosInstance from "@/utils/axiosInstance"
import { toast } from "react-toastify"

type Transaction = {
    id: string
    tx_ref: string
    description: string
    amount: number
    paymentStatus: string
    type: string
    createdAt: string
    serviceCharge?: number
}

type PaginationState = {
    total: number
    current: number
    pageSize: number
    totalPages: number
}

const toNumber = (value: number | string | undefined, fallback: number) => {
    const parsed = Number(value)
    return Number.isFinite(parsed) ? parsed : fallback
}

export default function TransactionsPage() {
    const [transactions, setTransactions] = useState<Transaction[]>([])
    const [pagination, setPagination] = useState<PaginationState>({
        total: 0,
        current: 1,
        pageSize: 15,
        totalPages: 1,
    })
    const [loading, setLoading] = useState(false)

    const columns = useMemo(
        () => [
            { key: "tx_ref", header: "Reference" },
            { key: "description", header: "Description" },
            {
                key: "amount",
                header: "Amount (₦)",
                render: (item: Transaction) => `₦${Number(item.amount || 0).toLocaleString()}`,
                align: "right" as const,
            },
            {
                key: "serviceCharge",
                header: "Service Charge (₦)",
                render: (item: Transaction) => `₦${Number(item.serviceCharge || 0).toLocaleString()}`,
                align: "right" as const,
            },
            {
                key: "paymentStatus",
                header: "Payment Status",
                render: (item: Transaction) => (
                    <span
                        className={`px-2 py-1 rounded-full text-xs font-medium ${item.paymentStatus === "paid"
                            ? "bg-green-100 text-green-700"
                            : "bg-amber-100 text-amber-700"
                            }`}
                    >
                        {item.paymentStatus}
                    </span>
                ),
            },
            {
                key: "type",
                header: "Type",
                render: (item: Transaction) => (
                    <span
                        className={`px-2 py-1 rounded-full text-xs font-medium ${item.type === "credit" ? "bg-blue-100 text-blue-700" : "bg-red-100 text-red-700"
                            }`}
                    >
                        {item.type}
                    </span>
                ),
            },
            {
                key: "createdAt",
                header: "Date",
                render: (item: Transaction) =>
                    new Date(item.createdAt).toLocaleString("en-GB", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                    }),
            },
        ],
        []
    )

    const fetchTransactions = async (page = 1) => {
        setLoading(true)
        try {
            const res = await axiosInstance.get("/api/v1/transaction-mgt/transaction-inflow", {
                params: {
                    page,
                    limit: pagination.pageSize,
                },
            })

            const { data, pagination: apiPagination } = res.data || {}
            const normalizedTotal = toNumber(apiPagination?.total, data?.length || 0)
            const normalizedPage = toNumber(apiPagination?.page, page)
            const normalizedLimit = toNumber(apiPagination?.limit, pagination.pageSize)
            const totalPages =
                apiPagination?.pages !== undefined
                    ? toNumber(apiPagination.pages, 1)
                    : Math.max(1, Math.ceil(normalizedTotal / (normalizedLimit || 1)))

            setTransactions(Array.isArray(data) ? data : [])
            setPagination({
                total: normalizedTotal,
                current: normalizedPage,
                pageSize: normalizedLimit,
                totalPages,
            })
        } catch (error: any) {
            const message = error?.response?.data?.message || "Failed to fetch transactions"
            toast.error(message)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchTransactions(1)
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    const handlePageChange = (newPage: number) => {
        if (newPage < 1 || newPage > pagination.totalPages) return
        fetchTransactions(newPage)
    }

    return (
        <div className="space-y-6">
            <div>
                <h1 className="font-heading text-3xl font-bold">Transactions</h1>
                <p className="text-muted-foreground mt-1">All inflow transactions for every estate.</p>
            </div>

            <Card className="p-4">
                <Table
                    columns={columns}
                    data={transactions}
                    emptyMessage={loading ? "Loading transactions..." : "No transactions found"}
                    showPagination={pagination.total > pagination.pageSize}
                    paginationInfo={{
                        total: pagination.total,
                        current: pagination.current,
                        pageSize: pagination.pageSize,
                    }}
                    onPageChange={handlePageChange}
                />
            </Card>
        </div>
    )
}
