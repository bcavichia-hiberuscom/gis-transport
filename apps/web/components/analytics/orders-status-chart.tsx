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

  const COLORS = ["#1C1C1C", "#D4F04A", "#6B7280", "#EAEAEA"];

  return (
    <div className="p-8 bg-white border border-[#EAEAEA] rounded-lg animate-in fade-in duration-700">
      <div className="flex items-start justify-between mb-8">
        <div className="flex flex-col gap-0.5">
          <h3 className="text-[12px] font-medium uppercase tracking-wider text-[#1C1C1C] flex items-center gap-2">
            <Package strokeWidth={1.5} className="h-4 w-4 text-[#1C1C1C]" />
            Estado de Operaciones
          </h3>
          <p className="text-[10px] font-normal text-[#6B7280]">
            Distribución de pedidos por status operativo.
          </p>
        </div>
      </div>

      <div className="h-[260px] w-full relative">
        {!hasData ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#F7F8FA] border border-dashed border-[#EAEAEA] rounded-md">
            <Package strokeWidth={1} className="h-10 w-10 text-[#6B7280]/20 mb-3" />
            <h4 className="text-[10px] font-medium text-[#6B7280]/40 uppercase tracking-widest">
              Sin registros
            </h4>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <PieChart margin={{ top: 5, right: 30, left: 5, bottom: 5 }}>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius={65}
                outerRadius={90}
                paddingAngle={4}
                dataKey="value"
                animationDuration={1000}
                stroke="none"
                style={{ filter: "url(#shadowPie)" }}
              >
                {data.map((entry, index) => (
                  <Cell 
                    key={`cell-${index}`} 
                    fill={COLORS[index % COLORS.length]} 
                    stroke="#FFFFFF"
                    strokeWidth={3}
                  />
                ))}
              </Pie>
              <defs>
                <filter id="shadowPie" x="-20%" y="-20%" width="140%" height="140%">
                  <feDropShadow dx="0" dy="4" stdDeviation="6" floodColor="#000" floodOpacity="0.08" />
                </filter>
              </defs>
              <Tooltip
                contentStyle={{
                  backgroundColor: "#fff",
                  border: "1px solid #EAEAEA",
                  borderRadius: "4px",
                  fontSize: "10px",
                  fontWeight: "500",
                  boxShadow: "0 4px 12px rgba(0,0,0,0.05)",
                  textTransform: "uppercase",
                }}
                formatter={(value: number) => `${value} pedidos`}
              />
              <Legend
                iconType="circle"
                wrapperStyle={{
                  fontSize: "9px",
                  fontWeight: 500,
                  textTransform: "uppercase",
                  paddingTop: "20px"
                }}
                verticalAlign="bottom"
              />
            </PieChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}
