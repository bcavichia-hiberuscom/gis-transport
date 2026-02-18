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
import { Zap, CheckCircle2 } from "lucide-react";

interface DriversFactorsChartProps {
  data: any[];
}

export function DriversFactorsChart({ data }: DriversFactorsChartProps) {
  const hasData = data && data.length > 0;

  return (
    <div className="p-10 bg-white group">
      <div className="flex items-start justify-between mb-10">
        <div className="flex flex-col gap-1.5">
          <h3 className="text-sm font-black italic uppercase tracking-tighter text-slate-900 flex items-center gap-2">
            <Zap className="h-4 w-4 text-slate-400" />
            Distribución de Incidencias
          </h3>
          <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-1">
            Frecuencia de factores críticos en el periodo
          </p>
        </div>
      </div>

      <div className="h-[280px] w-full relative">
        {!hasData ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-emerald-50/10 border border-dashed border-emerald-100 rounded-xl">
            <CheckCircle2 className="h-10 w-10 text-emerald-500 mb-3 opacity-30" />
            <h4 className="text-[10px] font-black text-emerald-700 uppercase tracking-widest">
              Estado Nominal
            </h4>
            <p className="text-[9px] font-bold text-emerald-600/50 uppercase mt-1">
              Sin factores de riesgo detectados
            </p>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={data}
              layout="vertical"
              margin={{ top: 5, right: 30, left: 40, bottom: 5 }}
            >
              <CartesianGrid
                strokeDasharray="4 4"
                horizontal={false}
                stroke="rgba(0,0,0,0.04)"
              />
              <XAxis type="number" hide />
              <YAxis
                dataKey="name"
                type="category"
                axisLine={false}
                tickLine={false}
                width={120}
                tick={{
                  fontSize: 8,
                  fontWeight: 900,
                  fill: "#64748b",
                  width: 100,
                }}
              />
              <Tooltip
                cursor={{ fill: "rgba(0,0,0,0.02)" }}
                contentStyle={{
                  backgroundColor: "#fff",
                  border: "1px solid #e2e8f0",
                  borderRadius: "8px",
                  fontSize: "10px",
                  fontWeight: "900",
                  boxShadow: "0 4px 6px -1px rgba(0,0,0,0.1)",
                  textTransform: "uppercase",
                }}
              />
              <Bar
                dataKey="impact"
                name="Eventos"
                radius={[0, 4, 4, 0]}
                barSize={24}
                animationDuration={1000}
                label={{
                  position: "right",
                  fill: "#0f172a",
                  fontSize: 10,
                  fontWeight: 900,
                  formatter: (val: number) => `${val} total`,
                }}
              >
                {data.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={"#ffdb87"}
                    fillOpacity={1 - index * 0.15}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}
