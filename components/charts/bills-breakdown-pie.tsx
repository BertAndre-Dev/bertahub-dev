"use client";

import { PieChart, Pie, Cell, Legend, Tooltip, ResponsiveContainer } from "recharts";

interface BillsBreakdownData {
  name: string;
  value: number;
  amount?: string;
}

interface BillsBreakdownPieProps {
  data?: BillsBreakdownData[];
  total?: number;
}

const DEFAULT_COLORS = ["#0052CC", "#F5A623", "#2ECC71", "#E74C3C"];

export default function BillsBreakdownPie({ 
  data,
  total = 150000000 
}: BillsBreakdownPieProps) {
  const defaultData = [
    { name: "Service Charge", value: 50000, amount: "N50,000" },
    { name: "Energy Vending", value: 150000, amount: "N150,000" },
    { name: "Wallet Topup", value: 20000, amount: "N20,000" },
    { name: "Others", value: 35, amount: "35%" },
  ];

  const chartData = data || defaultData;

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-2 rounded shadow-lg border border-gray-200">
          <p className="text-sm font-medium">{payload[0].name}</p>
          <p className="text-sm text-gray-600">{payload[0].payload.amount}</p>
        </div>
      );
    }
    return null;
  };

  const renderLabel = ({ name, amount }: any) => {
    return `${amount}`;
  };

  return (
    <div className="flex flex-col items-center justify-center w-full h-full">
      <ResponsiveContainer width="100%" height={400}>
        <PieChart>
          <Pie
            data={chartData}
            cx="50%"
            cy="50%"
            labelLine={false}
            label={renderLabel}
            outerRadius={120}
            fill="#8884d8"
            dataKey="value"
          >
            {chartData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={DEFAULT_COLORS[index % DEFAULT_COLORS.length]} />
            ))}
          </Pie>
          <Tooltip content={<CustomTooltip />} />
          
          <Legend 
            verticalAlign="bottom" 
            height={36}
            formatter={(value, entry) => { 
              const item = chartData.find(d => d.name === value);
              return `${value}`; 
            }}
          />
                  </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
