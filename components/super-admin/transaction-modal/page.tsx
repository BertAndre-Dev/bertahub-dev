"use client"

import * as React from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog" 
import { Badge } from "@/components/badge/page"


interface Transaction {
  id?: string
  _id?: string
  tx_ref?: string
  type?: string
  amount?: number
  paymentStatus?: string
  description?: string
  createdAt?: string
}

interface TransactionDetailsDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  transaction: Transaction | null
  loading?: boolean
}

export function TransactionDetailsDialog({
  open,
  onOpenChange,
  transaction,
  loading = false,
}: TransactionDetailsDialogProps) {
  const formatCurrency = (amount?: number) =>
    new Intl.NumberFormat("en-NG", {
      style: "currency",
      currency: "NGN",
    }).format(amount ?? 0)

  const formatDate = (date?: string) =>
    date ? new Date(date).toLocaleString() : "-"

  const getStatusVariant = (
    status?: string
  ): "default" | "secondary" | "destructive" | "outline" => {
    switch (status?.toLowerCase()) {
      case "success":
      case "completed":
        return "default"
      case "pending":
        return "secondary"
      case "failed":
        return "destructive"
      default:
        return "outline"
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle  >
            Transaction Details
          </DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className="py-8 text-center text-sm text-muted-foreground">
            Loading transaction details...
          </div>
        ) : transaction ? (
          <div className="space-y-4 text-sm">
            <div className="space-y-3">
              <DetailItem
                label="Transaction ID"
                value={transaction.id || transaction._id}
              />

              <DetailItem
                label="Reference"
                value={transaction.tx_ref}
              />

              <DetailItem
                label="Type"
                value={transaction.type}
              />

              <DetailItem
                label="Amount"
                value={formatCurrency(transaction.amount)}
              />

              <DetailItem
                label="Status"
                value={
                  <Badge variant={getStatusVariant(transaction.paymentStatus)}>
                    {transaction.paymentStatus || "Unknown"}
                  </Badge>
                }
              />

              <DetailItem
                label="Description"
                value={transaction.description || "-"}
              />

              <DetailItem
                label="Created At"
                value={formatDate(transaction.createdAt)}
              />
            </div>
          </div>
        ) : (
          <div className="py-8 text-center text-sm text-muted-foreground">
            No transaction data available
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}

function DetailItem({
  label,
  value,
}: {
  label: string
  value?: React.ReactNode
}) {
  return (
    <div className="flex items-start justify-between gap-4 border-b pb-2 last:border-0">
      <span className="text-muted-foreground">{label}</span>
      <span className="text-right font-medium break-all">
        {value ?? "-"}
      </span>
    </div>
  )
}