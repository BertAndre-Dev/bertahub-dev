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

interface TransactionsChartCardProps {
  readonly title?: string
  readonly subtitle?: string
  readonly data?: TransactionsChartDataPoint[]
  readonly estateOptions?: readonly { label: string; value: string }[]
  readonly onExport?: () => void
  readonly className?: string
}

const BAR_COLOR = "hsl(var(--primary) / 0.7)"
const BAR_COLOR_HIGHLIGHT = "hsl(var(--primary))"

export function TransactionsChartCard({
  title = "Transactions",
  subtitle = "This month's comparison",
  data,
  estateOptions = [{ label: "All estates", value: "all" }],
  onExport,
  className,
}: TransactionsChartCardProps) {
  const [dateRange, setDateRange] = useState<"day" | "month" | "year">("month")
  const [estate, setEstate] = useState(String(estateOptions[0]?.value ?? "all"))

  const formatYAxis = (value: number) => {
    if (value >= 1000) return `N${value / 1000}K`
    return `N${value}`
  }

  const formatTooltip = (value: number) => `N${(value / 1000).toFixed(1)}K`

  const defaultData: TransactionsChartDataPoint[] = [
    { label: "JAN 1", value: 1200 },
    { label: "JAN 2", value: 2100 },
    { label: "JAN 3", value: 1800 },
    { label: "JAN 4", value: 2900 },
    { label: "JAN 5", value: 2400 },
    { label: "JAN 6", value: 3100 },
    { label: "JAN 7", value: 4200, highlighted: true },
    { label: "JAN 8", value: 2800 },
    { label: "JAN 9", value: 3500 },
    { label: "JAN 10", value: 2600 },
    { label: "JAN 11", value: 3900 },
    { label: "JAN 12", value: 3200 },
  ]

  const chartData = (data && data.length > 0) ? data : defaultData

  return (
    <Card className={cn("flex flex-col gap-4 p-4 sm:p-5 md:p-6", className)}>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-1">
          <h2 className="text-lg font-bold sm:text-xl">{title}</h2>
          <p className="text-muted-foreground text-sm">{subtitle}</p>
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
      <div className="min-h-[240px] w-full sm:min-h-[280px] md:min-h-[320px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
            <CartesianGrid className="text-black" strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
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
              formatter={([value]: [number]) => [formatTooltip(value), "Amount"]}
            //   cursor={{ fill: "hsl(var(--muted) / 0.3)" }}
            cursor={false}

            />
            <Bar dataKey="value" radius={[4, 4, 0, 0]} maxBarSize={48}>
              {chartData.map((entry) => (
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
