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

export function VehiclesFleetHealthChart({ data = defaultData }: VehiclesFleetHealthChartProps) {
  const chartData = useMemo(() => {
    return data && data.length > 0 ? data : defaultData;
  }, [data]);

  return (
    <div className="border-l border-b border-slate-100 p-6 bg-gradient-to-b from-white via-primary/3 to-white">
      <div className="flex flex-col gap-2 mb-6">
        <h3 className="text-sm font-black uppercase tracking-tight text-slate-900">
          Salud de Flota
        </h3>
        <p className="text-[10px] text-slate-500">Estado operativo y mantenimiento</p>
      </div>

      <ResponsiveContainer width="100%" height={280}>
        <BarChart data={chartData} margin={{ top: 5, right: 30, left: 0, bottom: 5 }}>
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
          <Bar dataKey="health" fill="#10b981" name="Salud %" />
          <Bar dataKey="maintenance" fill="#f59e0b" name="Mantenimiento %" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
