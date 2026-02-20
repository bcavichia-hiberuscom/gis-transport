"use client";

import React from "react";
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
  Tooltip,
} from "recharts";
import { Package } from "lucide-react";

interface OrdersStatusChartProps {
  data: any[];
}

export function OrdersStatusChart({ data }: OrdersStatusChartProps) {
  const hasData = data && data.length > 0 && data.some((d) => d.value > 0);

  const COLORS = ["#10b981", "#f59e0b", "#3b82f6"];

  return (
    <div className="p-10 bg-gradient-to-b from-white via-primary/3 to-white group">
      <div className="flex items-start justify-between mb-10">
        <div className="flex flex-col gap-1.5">
          <h3 className="text-sm font-black italic uppercase tracking-tighter text-slate-900 flex items-center gap-2">
            <Package className="h-4 w-4 text-orange-500" />
            Estado de Pedidos
          </h3>
          <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-1">
            Distribución por Status
          </p>
        </div>
      </div>

      <div className="h-[280px] w-full relative">
        {!hasData ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-50 border border-dashed border-slate-100 rounded-xl">
            <Package className="h-10 w-10 text-slate-200 mb-3 opacity-30" />
            <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
              Sin Pedidos
            </h4>
            <p className="text-[9px] font-bold text-slate-300/50 uppercase mt-1">
              No hay datos disponibles
            </p>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <PieChart margin={{ top: 5, right: 30, left: 5, bottom: 5 }}>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={90}
                paddingAngle={2}
                dataKey="value"
                animationDuration={1000}
              >
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  backgroundColor: "#fff",
                  border: "1px solid #e2e8f0",
                  borderRadius: "8px",
                  fontSize: "10px",
                  fontWeight: "900",
                  boxShadow: "0 4px 6px -1px rgba(0,0,0,0.1)",
                  textTransform: "uppercase",
                }}
                formatter={(value: number) => `${value} pedidos`}
              />
              <Legend
                wrapperStyle={{
                  fontSize: "10px",
                  fontWeight: 900,
                  textTransform: "uppercase",
                }}
                verticalAlign="bottom"
                height={36}
              />
            </PieChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}
