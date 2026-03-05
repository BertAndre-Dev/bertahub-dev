"use client";

import { Card } from "@/components/ui/card";
import type { LucideIcon } from "lucide-react";

export interface StatCardItem {
  label: string;
  value: number;
  icon: LucideIcon;
  color: string;
}

export interface AnnouncementsStatsGridProps {
  stats: StatCardItem[];
}

export default function AnnouncementsStatsGrid({
  stats,
}: AnnouncementsStatsGridProps) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-4 gap-4">
      {stats.map((stat, i) => {
        const Icon = stat.icon;
        return (
          <Card key={`${stat.label}-${i}`} className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">{stat.label}</p>
                <p className="font-heading text-2xl font-bold mt-1">
                  {stat.value}
                </p>
              </div>
              <div className={`p-2 rounded-lg ${stat.color}`}>
                <Icon className="w-5 h-5" />
              </div>
            </div>
          </Card>
        );
      })}
    </div>
  );
}
