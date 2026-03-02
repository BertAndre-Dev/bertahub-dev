"use client"

import { useState } from "react"
import { ChevronDown, Download } from "lucide-react"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Select } from "@/components/ui/select"
import { cn } from "@/lib/utils"

export interface TransactionsChartDataPoint {
  label: string
  value: number
  highlighted?: boolean
}

interface TransactionsChartProps {
  readonly title?: string
  readonly subtitle?: string
  readonly data: TransactionsChartDataPoint[]
  readonly estateOptions?: readonly { label: string; value: string }[]
  readonly onExport?: () => void
  readonly className?: string
}

const BAR_COLOR = "#D0DFF2"
const BAR_COLOR_HIGHLIGHT = "#0150AC"

export default function TransactionsChart({
  title = "Transactions",
  subtitle = "This month's comparison",
  data,
  estateOptions = [{ label: "All estates", value: "all" }],
  onExport,
  className,
}: TransactionsChartProps) {
  const [dateRange, setDateRange] = useState<"day" | "month" | "year">("month")
  const [estate, setEstate] = useState(String(estateOptions[0]?.value ?? "all"))

  const formatYAxis = (value: number) => {
    if (value >= 1000) return `N${value / 1000}K`
    return `N${value}`
  }

  const formatTooltip = (value: number) => `N${(value / 1000).toFixed(1)}K`

  const hasData = Array.isArray(data) && data.some((d) => Number(d.value) > 0)

  if (!hasData) {
    return (
      <Card className={cn("flex flex-col gap-4 p-4", className)}>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="space-y-1">
            <h2 className="text-lg font-bold sm:text-xl">{title}</h2>
            <p className="text-[#4C4C4C] text-sm">{subtitle}</p>
          </div>
        </div>
        <div className="flex items-center justify-center text-muted-foreground text-sm min-h-[320px]">
          No data to display
        </div>
      </Card>
    )
  }

  return (
    <Card className={cn("flex flex-col gap-4 p-4", className)}>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-1">
          <h2 className="text-lg font-bold sm:text-xl">{title}</h2>
          <p className="text-[#4C4C4C] text-sm">{subtitle}</p>
        </div>
        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          <div className="relative flex items-center">
            <Select
              options={estateOptions.map((o) => ({ ...o, value: String(o.value) }))}
              value={estate}
              onChange={(e) => setEstate(e.target.value)}
              className="h-9 min-w-[140px] appearance-none pr-8 sm:min-w-[160px]"
            />
            <ChevronDown
              className="pointer-events-none absolute right-2.5 h-4 w-4 text-muted-foreground"
              aria-hidden
            />
          </div>
          <div className="flex rounded-md border border-input bg-transparent p-0.5">
            {(["day", "month", "year"] as const).map((range) => (
              <Button
                key={range}
                variant={dateRange === range ? "default" : "ghost"}
                size="sm"
                onClick={() => setDateRange(range)}
                className="capitalize"
              >
                {range}
                <ChevronDown className="ml-1 h-3.5 w-3.5 opacity-70" />
              </Button>
            ))}
          </div>
          <Button variant="outline" size="sm" onClick={onExport}>
            <Download className="mr-1.5 h-4 w-4" />
            Export
          </Button>
        </div>
      </div>

      <div className="w-full h-[320px]">
  <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
            <XAxis
              dataKey="label"
              tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
              tickLine={false}
              axisLine={false}
            />
            <YAxis
              tickFormatter={formatYAxis}
              tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
              tickLine={false}
              axisLine={false}
              width={36}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "hsl(var(--background))",
                border: "1px solid hsl(var(--border))",
                borderRadius: "8px",
                fontSize: "12px",
              }}
              formatter={(value: number) => [formatTooltip(value), "Amount"]}
              cursor={false}
            />
            <Bar dataKey="value" radius={[4, 4, 0, 0]} maxBarSize={48}>
              {data.map((entry) => (
                <Cell
                  key={`${entry.label}-${entry.value}`}
                  fill={entry.highlighted ? BAR_COLOR_HIGHLIGHT : BAR_COLOR}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </Card>
  )
}
