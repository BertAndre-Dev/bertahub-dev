"use client";

import React from "react";
import Image from "next/image";
import { Eye, Pencil, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";

import { Card } from "@/components/ui/card";
import type { ExpenseHead } from "@/redux/slice/admin/expense-head/expense-head";
import { slugify } from "@/lib/slug";

export interface ExpenseHeadCardProps {
  item: ExpenseHead;
  onView: (item: ExpenseHead) => void;
  onEdit: (item: ExpenseHead) => void;
  onDelete: (item: ExpenseHead) => void;
}

export function ExpenseHeadCard({
  item,
  onView,
  onEdit,
  onDelete,
}: Readonly<ExpenseHeadCardProps>) {
  const router = useRouter();
  const slug = slugify(item.name ?? "");

  return (
    <Card
      role="button"
      tabIndex={0}
      className="relative overflow-hidden p-6 hover:shadow-md transition-shadow cursor-pointer"
      onClick={() => router.push(`/dashboard/admin/expenses/${slug}`)}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          router.push(`/dashboard/admin/expenses/${slug}`);
        }
      }}
    >
      <div className="absolute right-4 top-4 flex items-center gap-2">
        <button
          type="button"
          className="h-10 w-10 rounded-full bg-white/90 shadow-sm grid place-items-center hover:bg-muted cursor-pointer"
          aria-label="View expense head"
          onClick={(e) => {
            e.stopPropagation();
            onView(item);
          }}
        >
          <Eye className="h-4 w-4" />
        </button>
        <button
          type="button"
          className="h-10 w-10 rounded-full bg-white/90 shadow-sm grid place-items-center hover:bg-muted cursor-pointer"
          aria-label="Edit expense head"
          onClick={(e) => {
            e.stopPropagation();
            onEdit(item);
          }}
        >
          <Pencil className="h-4 w-4 text-blue-600" />
        </button>
        <button
          type="button"
          className="h-10 w-10 rounded-full bg-white/90 shadow-sm grid place-items-center hover:bg-muted cursor-pointer"
          aria-label="Delete expense head"
          onClick={(e) => {
            e.stopPropagation();
            onDelete(item);
          }}
        >
          <Trash2 className="h-4 w-4 text-red-600" />
        </button>
      </div>

      <div className="flex items-start gap-4 pr-16">
        <div className="h-12 w-12 rounded-full bg-emerald-50 grid place-items-center">
          <Image src="/money.svg" alt="" width={24} height={24} />
        </div>
        <div className="min-w-0">
          <p className="font-heading text-4xl font-bold tracking-tight truncate">
            {item.name}
          </p>
          {item.description ? (
            <p className="text-sm text-muted-foreground mt-2 line-clamp-2">
              {item.description}
            </p>
          ) : null}
        </div>
      </div>
    </Card>
  );
}

