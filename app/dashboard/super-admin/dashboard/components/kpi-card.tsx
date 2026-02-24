"use client"

import { type LucideIcon, TrendingUp } from "lucide-react"
import { Card } from "@/components/ui/card"
import { cn } from "@/lib/utils"

export interface KpiCardProps {
  readonly label: string
  readonly value: string
  readonly trend?: string
  readonly trendUp?: boolean
  readonly icon: LucideIcon
  readonly iconBgClassName?: string
  readonly className?: string
}

const defaultIconBg = "bg-blue-500/10 text-blue-600"

export function KpiCard({
  label,
  value,
  trend,
  trendUp = true,
  icon: Icon,
  iconBgClassName = defaultIconBg,
  className,
}: KpiCardProps) {
  return (
    <Card
      className={cn(
        "p-4 sm:p-5 md:p-6 transition-shadow hover:shadow-md",
        className
      )}
    >
      <div className="flex flex-col gap-3 sm:gap-4">
         <div
            className={cn(
              "flex h-10 w-10 shrink-0 items-center justify-center rounded-full sm:h-11 sm:w-11",
              iconBgClassName
            )}
          >
            <Icon className="h-5 w-5 sm:h-6 sm:w-6" />
          </div>
        <div className="min-w-0">
          <p className="text-muted-foreground text-sm">{label}</p>
          <p className="mt-1 truncate font-heading text-xl font-bold tabular-nums sm:text-2xl md:text-3xl">
            {value}
          </p>
        </div>
         <div className="flex items-start justify-between gap-2">
         
          {trend != null && (
            <p
              className={cn(
                "inline-flex items-center gap-1 text-sm font-medium",
                trendUp ? "#007a4d" : "text-red-600"
              )} >
                <span className="border border-[#007a4d] p-1 rounded-sm inline-flex">
                  <TrendingUp
                    className={cn("h-4 w-4", !trendUp && "rotate-180")}
                    aria-hidden
                  />
                </span>
            
              {trend}
            </p>
          )}
        </div>
      </div>
    </Card>
  )
}
