"use client";

import { useMemo } from "react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ReferenceLine, ResponsiveContainer } from "recharts";

interface VehiclesUtilizationChartProps {
  data?: Array<{
    name: string;
    utilization?: number;
    goal?: number;
  }>;
}

const defaultData = [
  { name: "Sem. 1", utilization: 72, goal: 85 },
  { name: "Sem. 2", utilization: 78, goal: 85 },
  { name: "Sem. 3", utilization: 81, goal: 85 },
  { name: "Actual", utilization: 84, goal: 85 },
];

const TOOLTIP_STYLE = {
  backgroundColor: "#fff",
  border: "1px solid #EAEAEA",
  borderRadius: "2px",
  fontSize: "10px",
  fontWeight: "500",
  boxShadow: "0 4px 12px rgba(0,0,0,0.06)",
  textTransform: "uppercase" as const,
  padding: "8px 12px",
};

export function VehiclesUtilizationChart({ data = defaultData }: VehiclesUtilizationChartProps) {
  const chartData = useMemo(() => {
    return data && data.length > 0 ? data : defaultData;
  }, [data]);

  return (
    <div className="chart-container">
      <div className="mb-6">
        <p className="chart-title">Tendencia de Utilización</p>
        <p className="chart-subtitle">Análisis semanal de disponibilidad</p>
      </div>

      <ResponsiveContainer width="100%" height={260}>
        <LineChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F0F0F0" />
          <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 9, fontWeight: 500, fill: "#6B7280" }} />
          <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 9, fontWeight: 500, fill: "#6B7280" }} domain={[60, 100]} />
          <Tooltip contentStyle={TOOLTIP_STYLE} />
          <ReferenceLine y={85} stroke="#D4F04A" strokeDasharray="5 5" label={{ position: 'right', value: 'OBJ', fill: '#5D6B1A', fontSize: 8, fontWeight: 600 }} />
          <Line type="monotone" dataKey="utilization" stroke="#1C1C1C" strokeWidth={2} name="Utilización %" dot={{ fill: "#1C1C1C", r: 3, strokeWidth: 0 }} animationDuration={800} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
