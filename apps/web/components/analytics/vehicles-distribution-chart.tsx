"use client";

import { useMemo } from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";

interface VehiclesDistributionChartProps {
  data?: Array<{
    name: string;
    orders?: number;
    deliveries?: number;
  }>;
}

const defaultData = [
  { name: "Veh 1", orders: 12, deliveries: 10 },
  { name: "Veh 2", orders: 8, deliveries: 8 },
  { name: "Veh 3", orders: 15, deliveries: 12 },
  { name: "Veh 4", orders: 10, deliveries: 9 },
  { name: "Veh 5", orders: 14, deliveries: 13 },
];

const TOOLTIP_STYLE = {
  backgroundColor: "#fff",
  border: "1px solid #EAEAEA",
  borderRadius: "2px",
  fontSize: "10px",
  fontWeight: "500",
  boxShadow: "0 4px 12px rgba(0,0,0,0.06)",
  textTransform: "uppercase" as const,
};

export function VehiclesDistributionChart({ data = defaultData }: VehiclesDistributionChartProps) {
  const chartData = useMemo(() => {
    return data && data.length > 0 ? data : defaultData;
  }, [data]);

  return (
    <div className="chart-container">
      <div className="mb-6">
        <p className="chart-title">Distribución de Entregas</p>
        <p className="chart-subtitle">Órdenes y entregas por vehículo</p>
      </div>
      <ResponsiveContainer width="100%" height={220}>
        <BarChart data={chartData} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F0F0F0" />
          <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 9, fontWeight: 500, fill: "#6B7280" }} />
          <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 9, fontWeight: 500, fill: "#6B7280" }} />
          <Tooltip contentStyle={TOOLTIP_STYLE} />
          <Legend wrapperStyle={{ fontSize: "9px", fontWeight: 500, textTransform: "uppercase" }} />
          <Bar dataKey="orders" fill="#1C1C1C" name="Órdenes" radius={[2, 2, 0, 0]} barSize={10} animationDuration={800} />
          <Bar dataKey="deliveries" fill="#D4F04A" name="Entregas" radius={[2, 2, 0, 0]} barSize={10} animationDuration={800} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
