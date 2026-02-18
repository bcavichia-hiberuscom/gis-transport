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

export function VehiclesDistributionChart({
  data = defaultData,
}: VehiclesDistributionChartProps) {
  const chartData = useMemo(() => {
    return data && data.length > 0 ? data : defaultData;
  }, [data]);

  return (
    <div className="h-64 w-full border-l border-b border-slate-100 bg-white rounded-none p-6">
      <div className="flex flex-col gap-2 mb-4">
        <h3 className="text-xs font-black uppercase tracking-widest text-slate-900">Distribución de Entregas</h3>
        <p className="text-[10px] text-slate-500">Órdenes y entregas por vehículo</p>
      </div>
      <ResponsiveContainer width="100%" height="85%">
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
          <Bar dataKey="orders" fill="#0ea5e9" name="Órdenes" />
          <Bar dataKey="deliveries" fill="#10b981" name="Entregas" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
