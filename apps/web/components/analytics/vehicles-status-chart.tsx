"use client";

import { useMemo } from "react";
import { PieChart, Pie, Cell, Legend, Tooltip, ResponsiveContainer } from "recharts";

interface VehiclesStatusChartProps {
  data?: Array<{
    name: string;
    value: number;
  }>;
}

const defaultData = [
  { name: "Activos", value: 45 },
  { name: "Inactivos", value: 15 },
  { name: "Mantenimiento", value: 8 },
  { name: "Offline", value: 2 },
];

const COLORS = ["#10b981", "#64748b", "#f59e0b", "#ef4444"];

export function VehiclesStatusChart({ data = defaultData }: VehiclesStatusChartProps) {
  const chartData = useMemo(() => {
    return data && data.length > 0 ? data : defaultData;
  }, [data]);

  return (
    <div className="h-64 w-full border-b border-slate-100 bg-gradient-to-b from-white via-primary/3 to-white rounded-none p-6">
      <div className="flex flex-col gap-2 mb-4">
        <h3 className="text-xs font-black uppercase tracking-widest text-slate-900">Estado de Flota</h3>
        <p className="text-[10px] text-slate-500">Distribución de vehículos por estado</p>
      </div>
      <ResponsiveContainer width="100%" height="85%">
        <PieChart margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
          <Pie
            data={chartData}
            cx="50%"
            cy="50%"
            labelLine={false}
            label={({ name, value }) => `${name}: ${value}`}
            outerRadius={60}
            fill="#8884d8"
            dataKey="value"
          >
            {chartData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip
            contentStyle={{
              backgroundColor: "#fff",
              border: "1px solid #e2e8f0",
              borderRadius: "6px",
              fontSize: "11px",
            }}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
