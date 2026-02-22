"use client";

import React from "react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts";

interface FuelTrendDataPoint {
  date: string;
  declared: number;
  expected: number;
  discrepancy: number;
}

interface FuelTrendChartProps {
  data: FuelTrendDataPoint[];
  className?: string;
  title?: string; // Kept for compatibility but not used for rendering header
}

export function FuelTrendChart({
  data,
}: FuelTrendChartProps) {
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  const hasData = data && data.length > 0;

  if (!mounted) return <div className="h-full w-full bg-slate-50/50 animate-pulse rounded-lg" />;

  return (
    <div className="h-full w-full flex flex-col" style={{ transform: 'translateZ(0)' }}>
      <div className="flex-1 w-full relative">
        {!hasData ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-50 border border-dashed border-slate-200 rounded-xl">
            <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest">
              Sin datos operativos
            </p>
          </div>
        ) : (
          <div className="absolute inset-0" style={{ backfaceVisibility: 'hidden' }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={data}
                margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                style={{ 
                  transform: 'translateZ(0)',
                  shapeRendering: 'geometricPrecision'
                }}
              >
                <defs>
                  <filter id="shadowLine1" x="-20%" y="-20%" width="140%" height="140%">
                    <feDropShadow dx="0" dy="6" stdDeviation="6" floodColor="#1C1C1C" floodOpacity="0.2" />
                  </filter>
                  <filter id="shadowLine2" x="-20%" y="-20%" width="140%" height="140%">
                    <feDropShadow dx="0" dy="6" stdDeviation="6" floodColor="#D4F04A" floodOpacity="0.3" />
                  </filter>
                </defs>
                <CartesianGrid
                  strokeDasharray="3 3"
                  vertical={false}
                  stroke="#f1f5f9"
                  shapeRendering="crispEdges"
                />
                <XAxis
                  dataKey="date"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 9, fontWeight: 600, fill: "#1e293b" }}
                  dy={10}
                  shapeRendering="crispEdges"
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 9, fontWeight: 600, fill: "#1e293b" }}
                  shapeRendering="crispEdges"
                />
                <Tooltip
                  cursor={{ stroke: "#f1f5f9", strokeWidth: 1 }}
                  contentStyle={{
                    backgroundColor: "#fff",
                    border: "1px solid #f1f5f9",
                    borderRadius: "12px",
                    fontSize: "11px",
                    boxShadow: "0 10px 15px -3px rgba(0,0,0,0.1)",
                    fontWeight: 600
                  }}
                />
                <Legend
                  verticalAlign="top"
                  align="right"
                  iconType="circle"
                  wrapperStyle={{
                    fontSize: "10px",
                    fontWeight: 700,
                    textTransform: "uppercase",
                    letterSpacing: "0.05em",
                    paddingBottom: "25px",
                  }}
                />
                <Line
                  type="linear"
                  dataKey="declared"
                  name="Auditado"
                  stroke="#1C1C1C"
                  strokeWidth={4}
                  dot={{ r: 4, fill: "#1C1C1C", strokeWidth: 2, stroke: "#fff" }}
                  activeDot={{ r: 6, strokeWidth: 0 }}
                  isAnimationActive={false}
                  style={{ filter: "url(#shadowLine1)" }}
                />
                <Line
                  type="linear"
                  dataKey="expected"
                  name="Telemetría"
                  stroke="#D4F04A"
                  strokeWidth={4}
                  strokeDasharray="6 6"
                  dot={{ r: 4, fill: "#D4F04A", strokeWidth: 2, stroke: "#1C1C1C" }}
                  activeDot={{ r: 6, strokeWidth: 0 }}
                  isAnimationActive={false}
                  style={{ filter: "url(#shadowLine2)" }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>
    </div>
  );
}
