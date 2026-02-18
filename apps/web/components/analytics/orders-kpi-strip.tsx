"use client";

import { Activity, Package, CheckCircle2, Zap } from "lucide-react";

interface OrdersKPIStripProps {
  totalJobs?: number;
  completedJobs?: number;
  pendingJobs?: number;
  completionRate?: number;
}

export function OrdersKPIStrip({
  totalJobs = 12,
  completedJobs = 8,
  pendingJobs = 4,
  completionRate = 67,
}: OrdersKPIStripProps) {
  return (
    <div className="px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Pedidos */}
        <div className="flex flex-col gap-4 border-r last:border-r-0 p-6 bg-white rounded-lg border border-slate-100 hover:shadow-sm transition-colors group">
          <div className="flex items-center">
            <div className="h-10 w-10 flex items-center justify-center border rounded-xl shadow-sm transition-colors bg-orange-50 text-orange-600">
              <Package className="h-4 w-4" />
            </div>
          </div>
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] mb-1 text-orange-500">
              Total Pedidos
            </p>
            <h4 className="text-lg md:text-xl font-extrabold tabular-nums tracking-tight text-slate-900">
              {totalJobs}
            </h4>
          </div>
          <div className="h-[1px] w-full mt-1 bg-orange-100" />
        </div>

        {/* Completadas */}
        <div className="flex flex-col gap-4 border-r last:border-r-0 p-6 bg-white rounded-lg border border-slate-100 hover:shadow-sm transition-colors group">
          <div className="flex items-center">
            <div className="h-10 w-10 flex items-center justify-center border rounded-xl shadow-sm transition-colors bg-emerald-50 text-emerald-600">
              <CheckCircle2 className="h-4 w-4" />
            </div>
          </div>
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] mb-1 text-emerald-500">
              Completadas
            </p>
            <h4 className="text-lg md:text-xl font-extrabold tabular-nums tracking-tight text-slate-900">
              {completedJobs}
            </h4>
          </div>
          <div className="h-[1px] w-full mt-1 bg-emerald-100" />
        </div>

        {/* Pendientes */}
        <div className="flex flex-col gap-4 border-r last:border-r-0 p-6 bg-white rounded-lg border border-slate-100 hover:shadow-sm transition-colors group">
          <div className="flex items-center">
            <div className="h-10 w-10 flex items-center justify-center border rounded-xl shadow-sm transition-colors bg-amber-50 text-amber-600">
              <Activity className="h-4 w-4" />
            </div>
          </div>
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] mb-1 text-amber-500">
              Pendientes
            </p>
            <h4 className="text-lg md:text-xl font-extrabold tabular-nums tracking-tight text-slate-900">
              {pendingJobs}
            </h4>
          </div>
          <div className="h-[1px] w-full mt-1 bg-amber-100" />
        </div>

        {/* Tasa Finalización */}
        <div className="flex flex-col gap-4 border-r last:border-r-0 p-6 bg-white rounded-lg border border-slate-100 hover:shadow-sm transition-colors group">
          <div className="flex items-center">
            <div className="h-10 w-10 flex items-center justify-center border rounded-xl shadow-sm transition-colors bg-blue-50 text-blue-600">
              <Zap className="h-4 w-4" />
            </div>
          </div>
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] mb-1 text-blue-500">
              Tasa Finalización
            </p>
            <h4 className="text-lg md:text-xl font-extrabold tabular-nums tracking-tight text-slate-900">
              {completionRate}%
            </h4>
          </div>
          <div className="h-[1px] w-full mt-1 bg-blue-100" />
        </div>
      </div>
    </div>
  );
}
