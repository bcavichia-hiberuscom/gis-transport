"use client";

import { useMemo } from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";

interface VehiclesFleetHealthChartProps {
  data?: Array<{
    name: string;
    health?: number;
    maintenance?: number;
  }>;
}

const defaultData = [
  { name: "Flota A", health: 88, maintenance: 12 },
  { name: "Flota B", health: 92, maintenance: 8 },
  { name: "Flota C", health: 85, maintenance: 15 },
  { name: "Flota D", health: 95, maintenance: 5 },
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

export function VehiclesFleetHealthChart({ data = defaultData }: VehiclesFleetHealthChartProps) {
  const chartData = useMemo(() => {
    return data && data.length > 0 ? data : defaultData;
  }, [data]);

  return (
    <div className="chart-container">
      <div className="mb-6">
        <p className="chart-title">Salud de Flota</p>
        <p className="chart-subtitle">Estado operativo y mantenimiento</p>
      </div>

      <ResponsiveContainer width="100%" height={260}>
        <BarChart data={chartData} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F0F0F0" />
          <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 9, fontWeight: 500, fill: "#6B7280" }} />
          <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 9, fontWeight: 500, fill: "#6B7280" }} />
          <Tooltip contentStyle={TOOLTIP_STYLE} />
          <Legend wrapperStyle={{ fontSize: "9px", fontWeight: 500, textTransform: "uppercase" }} />
          <Bar dataKey="health" fill="#1C1C1C" name="Salud %" radius={[2, 2, 0, 0]} barSize={12} animationDuration={800} />
          <Bar dataKey="maintenance" fill="#D4F04A" name="Mantenimiento %" radius={[2, 2, 0, 0]} barSize={12} animationDuration={800} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
