"use client";

import { useState, useMemo } from "react";
import { Gauge, Zap, AlertTriangle, Activity, Fuel, TrendingUp, Medal, Filter, Trophy, Target } from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine
} from "recharts";

interface VehicleLeaderboardItem {
  id: string | number;
  label: string;
  value: number;
  mileage?: number;
  metric: "consumption" | "health" | "utilization" | "maintenance";
  status?: "good" | "warning" | "critical";
}

interface VehiclesLeaderboardProps {
  vehicles?: VehicleLeaderboardItem[];
  trendData?: any[];
  title?: string;
  subtitle?: string;
}

const defaultVehicles: VehicleLeaderboardItem[] = [
  { id: "vh-001", label: "MAD-1001", value: 7.2, mileage: 12500, metric: "consumption", status: "good" },
  { id: "vh-002", label: "MAD-1002", value: 8.5, mileage: 8400, metric: "consumption", status: "warning" },
  { id: "vh-003", label: "MAD-1003", value: 12.5, mileage: 15600, metric: "consumption", status: "warning" },
  { id: "vh-004", label: "MAD-1004", value: 6.8, mileage: 2100, metric: "consumption", status: "good" },
  { id: "vh-005", label: "MAD-1005", value: 10.2, mileage: 500, metric: "consumption", status: "warning" },
];

const defaultTrendData = [
  { name: "Lun", consumption: 7.8, goal: 7.5 },
  { name: "Mar", consumption: 8.2, goal: 7.5 },
  { name: "Mie", consumption: 7.4, goal: 7.5 },
  { name: "Jue", consumption: 9.1, goal: 7.5 },
  { name: "Vie", consumption: 8.5, goal: 7.5 },
  { name: "Sab", consumption: 7.9, goal: 7.5 },
  { name: "Dom", consumption: 7.2, goal: 7.5 },
];

export function VehiclesLeaderboard({
  vehicles = defaultVehicles,
  trendData = defaultTrendData,
  title = "Rendimiento de Flota",
  subtitle = "Métricas avanzadas de eficiencia",
}: VehiclesLeaderboardProps) {
  const [riskThreshold, setRiskThreshold] = useState(15);
  const [excellenceMinKm, setExcellenceMinKm] = useState(5000);

  const riskVehicles = useMemo(() => {
    return [...vehicles]
      .filter(v => v.value >= riskThreshold)
      .sort((a, b) => b.value - a.value)
      .slice(0, 3);
  }, [vehicles, riskThreshold]);

  const excellenceVehicles = useMemo(() => {
    return [...vehicles]
      .filter(v => (v.mileage || 0) >= excellenceMinKm)
      .filter(v => !riskVehicles.some(r => r.id === v.id))
      .sort((a, b) => a.value - b.value)
      .slice(0, 3);
  }, [vehicles, excellenceMinKm, riskVehicles]);

  const hasTrendData = trendData && trendData.length > 0;

  return (
    <div className="bg-white border-t border-[#EAEAEA] overflow-hidden animate-in fade-in duration-500">
      <div className="grid grid-cols-1 lg:grid-cols-2 divide-x divide-[#EAEAEA]">
        {/* Left Side: Trend Chart */}
        <div className="p-10 bg-white">
          <div className="flex flex-col gap-1 mb-10">
            <h3 className="text-[12px] font-medium uppercase tracking-wider text-[#1C1C1C] flex items-center gap-3">
              <Activity strokeWidth={1.5} className="h-5 w-5 text-[#1C1C1C]" />
              Consumo Medio Estándar
            </h3>
            <p className="text-[10px] font-normal text-[#6B7280] uppercase tracking-wider">
              Evolución L/100 acumulada.
            </p>
          </div>

          <div className="h-[320px] w-full relative">
            {!hasTrendData ? (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#F7F8FA] border border-dashed border-[#EAEAEA] rounded-md">
                <p className="text-[10px] font-medium text-[#6B7280]/40 uppercase tracking-widest">Sin datos disponibles</p>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={trendData} margin={{ top: 10, right: 30, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorConsumo" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#D4F04A" stopOpacity={0.25} />
                      <stop offset="95%" stopColor="#D4F04A" stopOpacity={0} />
                    </linearGradient>
                    <filter id="shadowConsumo" x="-20%" y="-20%" width="140%" height="140%">
                      <feDropShadow dx="0" dy="4" stdDeviation="4" floodColor="#1C1C1C" floodOpacity="0.08" />
                    </filter>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F0F0F0" />
                  <XAxis
                    dataKey="name"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 9, fontWeight: 500, fill: "#806b6bff" }}
                    dy={16}
                  />
                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 9, fontWeight: 500, fill: "#6B7280" }}
                    domain={['auto', 'auto']}
                  />
                  <Tooltip
                    cursor={{ stroke: '#1C1C1C', strokeWidth: 1 }}
                    contentStyle={{
                      backgroundColor: "#fff",
                      border: "1px solid #EAEAEA",
                      borderRadius: "4px",
                      fontSize: "10px",
                      fontWeight: "500",
                      boxShadow: "0 4px 12px rgba(0,0,0,0.05)",
                      textTransform: 'uppercase'
                    }}
                  />
                  <ReferenceLine
                    y={7.5}
                    stroke="#D4F04A"
                    strokeDasharray="6 6"
                    strokeWidth={1.5}
                    label={{ position: 'right', value: 'TARGET', fill: '#5D6B1A', fontSize: 8, fontWeight: 500 }}
                  />
                  <Area
                    type="monotone"
                    dataKey="consumption"
                    name="L/100"
                    stroke="#1C1C1C"
                    strokeWidth={3}
                    strokeDasharray="6 6"
                    fillOpacity={1}
                    fill="url(#colorConsumo)"
                    animationDuration={1500}
                    style={{ filter: "url(#shadowConsumo)" }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Right Side: Dual Audit with Local Filters */}
        <div className="p-10 flex flex-col gap-12 bg-white">
          {/* RISK SECTION */}
          <div className="space-y-6">
            <div className="flex flex-col gap-4 border-b border-[#EAEAEA] pb-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-1.5 w-1.5 rounded-full bg-red-600 shadow-[0_0_8px_rgba(220,38,38,0.4)]" />
                  <span className="text-[12px] font-medium uppercase tracking-wider text-[#1C1C1C]">Activos Críticos</span>
                </div>
                <div className="px-2 py-0.5 bg-red-50 border border-red-100 rounded">
                  <span className="text-[9px] font-medium text-red-700 uppercase tracking-wider">AUDIT</span>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <span className="text-[9px] font-medium text-[#6B7280]/60 uppercase tracking-wider">Umbral:</span>
                <div className="flex items-center gap-1.5 bg-[#F7F8FA] p-1 rounded-md border border-[#EAEAEA]">
                  {[10, 15, 20].map((val) => (
                    <button
                      key={val}
                      onClick={() => setRiskThreshold(val)}
                      className={cn(
                        "px-3 py-1 text-[9px] font-medium uppercase rounded transition-all",
                        riskThreshold === val
                          ? "bg-[#1C1C1C] text-white shadow-sm"
                          : "text-[#6B7280] hover:text-[#1C1C1C] hover:bg-white"
                      )}
                    >
                      {`>${val} L`}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="space-y-2">
              {riskVehicles.length > 0 ? riskVehicles.map((v, i) => (
                  <div
                    key={`risk-${v.id}`}
                    className="group flex items-center justify-between p-4 bg-white border border-[#EAEAEA] hover:border-red-600/40 rounded-lg transition-all"
                  >
                    <div className="flex items-center gap-4">
                      <div className="h-9 w-9 bg-[#F7F8FA] border border-[#EAEAEA] flex items-center justify-center text-[10px] font-medium text-[#1C1C1C] rounded">
                        {v.label.substring(0, 2)}
                      </div>
                      <div>
                        <h4 className="text-[13px] font-medium text-[#1C1C1C] uppercase group-hover:text-red-700 transition-colors">
                          {v.label}
                        </h4>
                        <div className="flex items-center gap-3 mt-0.5">
                          <span className="text-[9px] font-medium text-[#6B7280]/40 uppercase tracking-wider">Km: {(v.mileage || 0).toLocaleString()}</span>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-medium text-red-600 tabular-nums">
                        {v.value.toFixed(1)}
                      </div>
                      <div className="text-[9px] font-medium text-[#6B7280]/40 uppercase tracking-wider">L/100</div>
                    </div>
                  </div>
              )) : (
                <div className="py-10 text-center bg-[#F7F8FA] border border-dashed border-[#EAEAEA] rounded-md">
                  <p className="text-[#6B7280]/40 text-[10px] font-medium uppercase tracking-wider">Sin anomalías críticas</p>
                </div>
              )}
            </div>
          </div>

          {/* EXCELLENCE SECTION */}
          <div className="space-y-6">
            <div className="flex flex-col gap-4 border-b border-[#EAEAEA] pb-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-1.5 w-1.5 rounded-full bg-[#D4F04A] shadow-[0_0_8px_rgba(212,240,74,0.4)]" />
                  <span className="text-[12px] font-medium uppercase tracking-wider text-[#1C1C1C]">Eficiencia Operativa</span>
                </div>
                <div className="px-2 py-0.5 bg-[#D4F04A]/10 border border-[#D4F04A]/20 rounded">
                  <span className="text-[9px] font-medium text-[#5D6B1A] uppercase tracking-wider">ELITE</span>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <span className="text-[9px] font-medium text-[#6B7280]/60 uppercase tracking-wider">Referencia:</span>
                <div className="flex items-center gap-1.5 bg-[#F7F8FA] p-1 rounded-md border border-[#EAEAEA]">
                  {[0, 5000, 10000, 50000].map((km) => (
                    <button
                      key={km}
                      onClick={() => setExcellenceMinKm(km)}
                      className={cn(
                        "px-3 py-1 text-[9px] font-medium uppercase rounded transition-all",
                        excellenceMinKm === km
                          ? "bg-[#1C1C1C] text-white shadow-sm"
                          : "text-[#6B7280] hover:text-[#1C1C1C] hover:bg-white"
                      )}
                    >
                      {km === 0 ? 'ALL' : `>${(km / 1000).toFixed(0)}K`}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="space-y-2">
              {excellenceVehicles.length > 0 ? excellenceVehicles.map((v, i) => (
                <div
                  key={`top-${v.id}`}
                  className="group flex items-center justify-between p-4 bg-white border border-[#EAEAEA] hover:border-[#D4F04A]/60 rounded-lg transition-all"
                >
                  <div className="flex items-center gap-4">
                    <div className="h-9 w-9 bg-[#F7F8FA] border border-[#EAEAEA] flex items-center justify-center text-[10px] font-medium text-[#1C1C1C] rounded">
                      {v.label.substring(0, 2)}
                    </div>
                    <div>
                      <h4 className="text-[13px] font-medium text-[#1C1C1C] uppercase group-hover:text-[#1C1C1C]">
                        {v.label}
                      </h4>
                      <span className="text-[9px] font-medium text-[#6B7280]/40 uppercase tracking-wider">{(v.mileage || 0).toLocaleString()} Km totales</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-medium text-[#1C1C1C] tabular-nums">
                      {v.value.toFixed(1)}
                    </div>
                    <div className="text-[9px] font-medium text-[#6B7280]/40 uppercase tracking-wider">L/100</div>
                  </div>
                </div>
              )) : (
                <div className="py-10 text-center bg-[#F7F8FA] border border-dashed border-[#EAEAEA] rounded-md">
                  <p className="text-[#6B7280]/40 text-[10px] font-medium uppercase tracking-wider">Sin datos de excelencia</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
