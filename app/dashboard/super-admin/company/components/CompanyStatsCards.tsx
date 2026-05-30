"use client";

import { Building2, Home, PowerOff } from "lucide-react";
import { Card } from "@/components/ui/card";
import type { CompanyItem } from "@/redux/slice/super-admin/company-mgt/company";

export function CompanyStatsCards({
  companies,
  total: totalFromApi,
}: {
  readonly companies: CompanyItem[];
  readonly total?: number;
}) {
  const total = totalFromApi ?? 0;
  const active = companies.filter((c) => c.isActive).length;
  const inactive = companies.filter((c) => !c.isActive).length;

  const stats = [
    { label: "Total Companies", value: total, icon: Building2, color: "bg-[#D0DFF280]" },
    { label: "Active Companies", value: active, icon: Home, color: "bg-[#CCE4DB80]" },
    { label: "Inactive Companies", value: inactive, icon: PowerOff, color: "bg-[#FEE6D480]" },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {stats.map((stat) => {
        const Icon = stat.icon;
        return (
          <Card key={stat.label} className="p-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-muted-foreground">{stat.label}</p>
                <p className="font-heading text-2xl font-bold mt-2">{stat.value}</p>
              </div>
              <div className={`p-3 rounded-lg ${stat.color}`}>
                <Icon className="w-6 h-6" />
              </div>
            </div>
          </Card>
        );
      })}
    </div>
  );
}

