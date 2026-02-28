// components/admin/transaction/TransactionStatsBar.tsx
import { Card } from "@/components/ui/card";
import { ArrowRightLeft, TrendingUp } from "lucide-react";

interface StatItem {
  label: string;
  value: string | number;
}

interface TransactionStatsBarProps {
  primary: {
    label: string;
    value: string | number;
    trend?: string;
  };
  stats: StatItem[];
}

export default function TransactionStatsBar({
  primary,
  stats,
}: TransactionStatsBarProps) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
      {/* Primary Card */}
      <Card className="p-6 lg:col-span-1">
        <p className="text-sm text-muted-foreground">{primary.label}</p>
        <p className="font-heading text-2xl md:text-3xl font-bold mt-2">
          {primary.value}
        </p>
        {primary.trend && (
          <div className="flex items-center gap-1 mt-2 text-sm font-medium text-green-600">
            <TrendingUp className="w-4 h-4" />
            <span>{primary.trend}</span>
          </div>
        )}
      </Card>

      {/* Stats Cards */}
      <Card className="p-6 lg:col-span-3">
        <div className="grid grid-cols-3 h-full divide-x divide-border">
          {stats.map((stat, i) => (
            <div key={i} className="px-6 first:pl-0 last:pr-0">
              <p className="text-sm text-muted-foreground">{stat.label}</p>
              <p className="font-heading text-2xl font-bold mt-2">
                {stat.value}
              </p>
            </div>
            
          ))}
           {/* <div className="flex items-center justify-center bg-red-500 rounded-2xl p-4">
         <ArrowRightLeft />
      </div> */}
        </div>
      </Card>
    </div>
  );
}