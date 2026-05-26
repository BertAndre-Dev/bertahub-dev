"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { Briefcase } from "lucide-react";
import { Card } from "@/components/ui/card";
import { slugify } from "@/lib/slug";
import type { AssetCategory } from "@/redux/slice/admin/asset-mgt/admin-asset";

function getId(v: { id?: string; _id?: string } | undefined) {
  return v?.id || v?._id || "";
}

type Props = {
  category: AssetCategory;
  count?: number;
};

export default function AssetCategoryCard({ category, count }: Readonly<Props>) {
  const router = useRouter();
  const id = getId(category);
  const slug = slugify(category.name ?? "");
  const href = `/dashboard/admin/asset/${id || slug}`;

  return (
    <Card
      role="button"
      tabIndex={0}
      onClick={() => router.push(href)}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          router.push(href);
        }
      }}
      className="p-5 mt-0 cursor-pointer hover:shadow-md transition-shadow min-h-[150px] flex justify-between"
    >
      <div className="flex flex-col justify-between h-full gap-6">
        <div className="h-9 w-9 rounded-md bg-[#F1F4F9] grid place-items-center">
          <Briefcase className="w-5 h-5 text-muted-foreground" />
        </div>
        <div className="min-w-0">
          <p className="font-heading text-2xl font-bold leading-tight wrap-break-word">
            {category.name}
          </p>
          {typeof count === "number" ? (
            <p className="text-xs text-muted-foreground mt-2">
              {count} {count === 1 ? "asset" : "assets"}
            </p>
          ) : null}
        </div>
      </div>
    </Card>
  );
}
