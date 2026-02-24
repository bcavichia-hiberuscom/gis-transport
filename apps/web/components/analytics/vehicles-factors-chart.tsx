"use client";

import React from "react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Cell,
} from "recharts";

const CHART_TOOLTIP_STYLE = {
    backgroundColor: "#fff",
    border: "1px solid #EAEAEA",
    borderRadius: "2px",
    fontSize: "10px",
    fontWeight: "500",
    boxShadow: "0 4px 12px rgba(0,0,0,0.06)",
    textTransform: "uppercase" as const,
    padding: "8px 12px",
};

// Strict adherence to global palette
const BAR_FILLS = ["#1C1C1C", "#D4F04A", "#6B7280", "#EF4444", "#EAEAEA"];

interface VehiclesFactorsChartProps {
  data: any[];
}

export function VehiclesFactorsChart({ data }: VehiclesFactorsChartProps) {
  const hasData = data && data.length > 0;

  return (
    <div className="chart-container">
      <div className="flex items-start justify-between mb-8">
        <div>
          <p className="chart-title">Análisis de Consumo</p>
          <p className="chart-subtitle">Distribución de combustible por factor en el periodo</p>
        </div>
      </div>

      <div className="h-[260px] w-full relative">
        {!hasData ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#F7F8FA] border border-dashed border-[#EAEAEA]">
            <p className="text-[10px] font-medium text-[#6B7280]/40 uppercase tracking-widest">Sin datos de consumo</p>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} layout="vertical" margin={{ top: 5, right: 40, left: 40, bottom: 5 }}>
              <defs>
                <filter id="shadowBar2" x="-20%" y="-20%" width="140%" height="140%">
                  <feDropShadow dx="2" dy="4" stdDeviation="4" floodColor="#000" floodOpacity="0.1" />
                </filter>
              </defs>
              <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#E5E7EB" />
              <XAxis type="number" hide />
              <YAxis
                dataKey="name"
                type="category"
                axisLine={false}
                tickLine={false}
                width={120}
                tick={{ fontSize: 9, fontWeight: 500, fill: "#6B7280" }}
              />
              <Tooltip cursor={{ fill: "rgba(0,0,0,0.02)" }} contentStyle={CHART_TOOLTIP_STYLE} />
              <Bar
                dataKey="impact"
                name="L/100km"
                radius={[0, 4, 4, 0]}
                barSize={24}
                animationDuration={800}
                style={{ filter: "url(#shadowBar2)" }}
                label={{
                  position: "right",
                  fill: "#6B7280",
                  fontSize: 9,
                  fontWeight: 500,
                  formatter: (val: number) => `${val}L`,
                }}
              >
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={BAR_FILLS[index % BAR_FILLS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}
