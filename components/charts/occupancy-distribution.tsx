"use client";

import { PieChart, Pie, Cell, Legend, Tooltip, ResponsiveContainer } from "recharts";

interface OccupancyDistributionProps {
  totalResidents?: number;
  occupiedPercentage?: number;
  vacantPercentage?: number;
  occupiedColor?: string;
  vacantColor?: string;
}

const DEFAULT_OCCUPIED_COLOR = "#0052CC";
const DEFAULT_VACANT_COLOR = "#B3D9FF";

export default function OccupancyDistribution({
  totalResidents = 54765,
  occupiedPercentage = 64,
  vacantPercentage = 24,
  occupiedColor = DEFAULT_OCCUPIED_COLOR,
  vacantColor = DEFAULT_VACANT_COLOR,
}: OccupancyDistributionProps) {
  const data = [
    {
      name: "Occupied",
      value: occupiedPercentage,
      percentage: occupiedPercentage,
    },
    {
      name: "Vacant",
      value: vacantPercentage,
      percentage: vacantPercentage,
    },
  ];

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-2 rounded shadow-lg border border-gray-200">
          <p className="text-sm font-medium">{payload[0].name}</p>
          <p className="text-sm text-gray-600">{payload[0].payload.percentage}%</p>
        </div>
      );
    }
    return null;
  };

  const renderCustomLabel = ({ cx, cy }: any) => {
    return (
      <text
        x={cx}
        y={cy - 10}
        fill="black"
        textAnchor="middle"
        dominantBaseline="central"
        className="text-sm"
      >
        <tspan x={cx} dy="0" className="font-semibold text-xs fill-gray-600">
          Total residents
        </tspan>
        <tspan x={cx} dy="18" className="font-bold text-lg">
          {totalResidents.toLocaleString()}
        </tspan>
      </text>
    );
  };

  return (
    <div className="flex flex-col items-center justify-center w-full h-full">
      <ResponsiveContainer width="100%" height={350}>
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            labelLine={false}
            label={renderCustomLabel}
            innerRadius={80}
            outerRadius={120}
            fill="#8884d8"
            dataKey="value"
          >
            <Cell fill={occupiedColor} />
            <Cell fill={vacantColor} />
          </Pie>
          <Tooltip content={<CustomTooltip />} />
          <Legend
            verticalAlign="bottom"
            height={36}
            formatter={(value, entry) => {
              const item = data.find((d) => d.name === value);
              return `${value} ${item?.percentage}%`;
            }}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
