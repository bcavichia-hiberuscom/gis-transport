"use client";

import { useMemo } from "react";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";

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

// Monochrome palette
const COLORS = ["#1C1C1C", "#D4F04A", "#6B7280", "#EAEAEA"];

const TOOLTIP_STYLE = {
  backgroundColor: "#fff",
  border: "1px solid #EAEAEA",
  borderRadius: "2px",
  fontSize: "10px",
  fontWeight: "500",
  boxShadow: "0 4px 12px rgba(0,0,0,0.06)",
  textTransform: "uppercase" as const,
};

export function VehiclesStatusChart({ data = defaultData }: VehiclesStatusChartProps) {
  const chartData = useMemo(() => {
    return data && data.length > 0 ? data : defaultData;
  }, [data]);

  return (
    <div className="chart-container">
      <div className="mb-4">
        <p className="chart-title">Estado de Flota</p>
        <p className="chart-subtitle">Distribución de vehículos por estado</p>
      </div>
      <ResponsiveContainer width="100%" height={220}>
        <PieChart>
          <Pie
            data={chartData}
            cx="50%"
            cy="50%"
            innerRadius={50}
            outerRadius={80}
            paddingAngle={2}
            dataKey="value"
          >
            {chartData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip contentStyle={TOOLTIP_STYLE} formatter={(value, name) => [`${value}`, name]} />
        </PieChart>
      </ResponsiveContainer>
      {/* Custom legend */}
      <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2">
        {chartData.map((entry, index) => (
          <div key={entry.name} className="flex items-center gap-1.5">
            <div className="h-2 w-2 rounded-sm" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
            <span className="text-[9px] font-medium text-[#6B7280] uppercase tracking-wide">{entry.name}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
