"use client";

import { useMemo } from "react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";

interface VehiclesUtilizationChartProps {
  data?: Array<{
    name: string;
    utilization?: number;
    goal?: number;
  }>;
}

const defaultData = [
  { name: "Semana 1", utilization: 72, goal: 85 },
  { name: "Semana 2", utilization: 78, goal: 85 },
  { name: "Semana 3", utilization: 81, goal: 85 },
  { name: "Semana Actual", utilization: 84, goal: 85 },
];

export function VehiclesUtilizationChart({ data = defaultData }: VehiclesUtilizationChartProps) {
  const chartData = useMemo(() => {
    return data && data.length > 0 ? data : defaultData;
  }, [data]);

  return (
    <div className="border-r border-b border-slate-100 p-6 bg-white">
      <div className="flex flex-col gap-2 mb-6">
        <h3 className="text-sm font-black uppercase tracking-tight text-slate-900">
          Tendencia de Utilización
        </h3>
        <p className="text-[10px] text-slate-500">Análisis semanal de disponibilidad</p>
      </div>

      <ResponsiveContainer width="100%" height={280}>
        <LineChart data={chartData} margin={{ top: 5, right: 30, left: 0, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
          <XAxis dataKey="name" stroke="#94a3b8" style={{ fontSize: "11px" }} />
          <YAxis stroke="#94a3b8" style={{ fontSize: "11px" }} />
          <Tooltip
            contentStyle={{
              backgroundColor: "#fff",
              border: "1px solid #e2e8f0",
              borderRadius: "6px",
              fontSize: "11px",
            }}
          />
          <Legend wrapperStyle={{ fontSize: "11px" }} />
          <Line
            type="monotone"
            dataKey="utilization"
            stroke="#10b981"
            strokeWidth={2}
            name="Utilización %"
            dot={{ fill: "#10b981", r: 3 }}
          />
          <Line
            type="monotone"
            dataKey="goal"
            stroke="#94a3b8"
            strokeWidth={2}
            strokeDasharray="5 5"
            name="Meta"
            dot={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
