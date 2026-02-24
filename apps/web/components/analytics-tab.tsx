'use client'

import { useState, useEffect } from 'react'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  Clock,
  DollarSign,
  Leaf,
  Zap,
  ChevronRight,
  Activity
} from 'lucide-react'
import { cn } from '@/lib/utils'
import type { VehicleRoute, FleetVehicle } from '@gis/shared'
import {
  AnalyticsService,
  type PredictiveKPIs
} from '@/lib/services/analytics-service'

// ─── KPI Strip ────────────────────────────────────────────────────────────────

interface KPIItemProps {
  label: string
  value: string | number
  icon: React.ElementType
  trend?: { value: string; positive: boolean }
}

function KPIItem({ label, value, icon: Icon, trend }: KPIItemProps) {
  return (
    <div className="kpi-card group">
      <div className="flex items-center justify-between">
        <div className="h-9 w-9 flex items-center justify-center bg-[#F7F8FA] border border-[#EAEAEA] text-[#6B7280] group-hover:bg-[#1C1C1C] group-hover:text-[#D4F04A] group-hover:border-[#1C1C1C] transition-all">
          <Icon strokeWidth={1.5} className="h-4 w-4" />
        </div>
        {trend && (
          <span className={cn(trend.positive ? 'trend-up' : 'trend-down')}>
            {trend.positive ? '+' : ''}
            {trend.value}
          </span>
        )}
      </div>

      <div className="flex flex-col gap-0.5">
        <span className="text-[10px] font-medium text-[#6B7280] uppercase tracking-[0.1em]">
          {label}
        </span>
        <h4 className="text-[32px] font-medium tracking-tight text-[#1C1C1C] leading-none tabular-nums">
          {value}
        </h4>
      </div>
    </div>
  )
}

function AnalyticsKPIStripInline({
  timeSaved,
  fuelCostSaved,
  emissionsSaved,
  routeCount
}: {
  timeSaved: string
  fuelCostSaved: string
  emissionsSaved: string
  routeCount: number
}) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      <KPIItem
        label="Tiempo Ahorrado"
        value={timeSaved}
        icon={Clock}
        trend={{ value: '15%', positive: true }}
      />
      <KPIItem
        label="Ahorro Económico"
        value={fuelCostSaved}
        icon={DollarSign}
        trend={{ value: '15%', positive: true }}
      />
      <KPIItem
        label="Emisiones Reducidas"
        value={emissionsSaved}
        icon={Leaf}
        trend={{ value: '15%', positive: true }}
      />
      <KPIItem
        label="Rutas Optimizadas"
        value={routeCount}
        icon={Zap}
        trend={{ value: '3', positive: true }}
      />
    </div>
  )
}

// ─── Main View ────────────────────────────────────────────────────────────────

interface AnalyticsTabProps {
  routeData?: {
    vehicleRoutes?: VehicleRoute[]
  }
  fleetVehicles?: FleetVehicle[]
}

export function AnalyticsTab({
  routeData,
  fleetVehicles = []
}: AnalyticsTabProps) {
  const [aggregatedKPIs, setAggregatedKPIs] = useState<PredictiveKPIs | null>(
    null
  )
  const [routeAnalyses, setRouteAnalyses] = useState<any[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (routeData?.vehicleRoutes && routeData.vehicleRoutes.length > 0) {
      setLoading(true)
      console.log(
        '[AnalyticsTab] Total vehicle routes in routeData:',
        routeData.vehicleRoutes.length
      )
      console.log(
        '[AnalyticsTab] Detailed routes:',
        routeData.vehicleRoutes.map((r, i) => ({
          index: i,
          vehicleId: r.vehicleId,
          distance: r.distance
        }))
      )
      // Calcula análisis de múltiples rutas
      const analyses = AnalyticsService.calculateMultipleRoutesAnalysis(
        routeData?.vehicleRoutes || [],
        fleetVehicles
      )
      console.log(
        '[AnalyticsTab] Routes processed:',
        analyses.length,
        'analyses'
      )
      console.log(
        '[AnalyticsTab] Individual analyses:',
        analyses.map(a => ({
          vehicleLabel: a.vehicleLabel,
          optimizedDistance: a.optimizedDistance,
          originalDistance: a.originalDistance,
          distanceSaved: a.kpis.distanceSavedKm,
          fuelCostSaved: a.kpis.fuelCostSaved,
          timeSavedHours: a.kpis.timeSavedHours,
          fuelSavedLiters: a.kpis.fuelSavedLiters
        }))
      )
      setRouteAnalyses(analyses)

      // Agrega los KPIs
      const aggregated = AnalyticsService.aggregateKPIs(analyses)
      console.log(
        '[AnalyticsTab] Aggregated KPIs from',
        analyses.length,
        'routes:',
        aggregated
      )
      setAggregatedKPIs(aggregated)
      setLoading(false)
    } else {
      console.log('[AnalyticsTab] No vehicle routes available')
      setRouteAnalyses([])
      setAggregatedKPIs(null)
      setLoading(false)
    }
  }, [routeData, fleetVehicles])

  const hasData = routeAnalyses.length > 0 && aggregatedKPIs

  return (
    <div className="flex flex-col grow h-full bg-white animate-in fade-in duration-500">
      {/* Premium Operational Header */}
      <div className="shrink-0 border-b border-[#EAEAEA]">
        <div className="px-10 py-10 flex items-center justify-between gap-10">
          <div className="flex flex-col gap-1">
            <h2 className="text-base font-semibold tracking-tight text-[#1C1C1C] flex items-center gap-3">
              <Zap strokeWidth={1.5} className="h-5 w-5" />
              Análisis Predictivo
            </h2>
            <p className="text-[13px] text-[#6B7280] font-normal mt-1">
              Estimaciones de ahorros en tiempo, combustible y emisiones basadas
              en rutas optimizadas.
            </p>
          </div>
        </div>
      </div>

      <ScrollArea className="flex-1 min-h-0 bg-white">
        <div className="p-10 space-y-10">
          {hasData ? (
            <>
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-[11px] font-medium uppercase tracking-wider text-[#6B7280]">
                  KPIs Agregados{' '}
                  {routeAnalyses.length > 1
                    ? `(${routeAnalyses.length} rutas)`
                    : ''}
                </h3>
              </div>
              <AnalyticsKPIStripInline
                timeSaved={`${aggregatedKPIs.timeSavedHours}h ${aggregatedKPIs.timeSavedMinutes}m`}
                fuelCostSaved={`€${aggregatedKPIs.fuelCostSaved.toFixed(2)}`}
                emissionsSaved={`${aggregatedKPIs.emissionsSavedKg}kg CO₂`}
                routeCount={routeAnalyses.length}
              />

              {/* Ranking */}
              <div className="p-8 premium-card border-[#EAEAEA] bg-white rounded-lg animate-in fade-in duration-500 mb-10">
                <div className="flex items-center justify-between mb-8 pb-4 border-b border-[#EAEAEA]">
                  <div className="flex flex-col gap-0.5">
                    <h3 className="text-[12px] font-medium uppercase tracking-wider text-[#1C1C1C] flex items-center gap-3">
                      <div className="h-3 w-1 bg-emerald-600 rounded-full" />
                      Análisis de Rutas Optimizadas
                    </h3>
                    <p className="text-[10px] font-normal text-[#6B7280] uppercase tracking-wider ml-4">
                      Detalles de ahorro por vehículo
                    </p>
                  </div>
                  <div className="px-3 py-1 bg-emerald-50 border border-emerald-100 rounded">
                    <span className="text-[10px] font-medium text-emerald-600 uppercase tracking-wider">
                      {routeAnalyses.length} Ruta
                      {routeAnalyses.length !== 1 ? 's' : ''} (Agregado)
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-2">
                  {loading ? (
                    <div className="col-span-2 py-20 flex flex-col items-center justify-center gap-4 bg-[#F7F8FA] rounded-lg border border-dashed border-[#EAEAEA]">
                      <Activity
                        strokeWidth={1.5}
                        className="h-8 w-8 text-[#6B7280]/20 animate-pulse"
                      />
                      <span className="text-[10px] font-medium text-[#6B7280] uppercase tracking-wider">
                        Sincronizando Sistema...
                      </span>
                    </div>
                  ) : (
                    routeAnalyses.map((analysis, index) => {
                      const kpis = analysis.kpis as PredictiveKPIs
                      return (
                        <div
                          key={`route-${analysis.vehicleId}-${index}`}
                          className="p-4 bg-white border-b border-[#EAEAEA] hover:bg-[#F7F8FA] transition-all cursor-pointer group flex items-center justify-between"
                        >
                          <div className="flex items-center gap-5">
                            <div className="h-8 w-8 bg-[#1C1C1C] flex items-center justify-center text-[#D4F04A] font-medium text-[11px] rounded">
                              {String(index + 1).padStart(2, '0')}
                            </div>
                            <div>
                              <h4 className="text-[13px] font-medium text-[#1C1C1C] uppercase group-hover:text-[#1C1C1C]">
                                {analysis.vehicleLabel}
                              </h4>
                              <div className="flex items-center gap-3 mt-1">
                                <span className="text-[9px] font-medium text-[#6B7280]/40 uppercase">
                                  ID: {analysis.vehicleId.substring(0, 8)}
                                </span>
                                <span className="text-[9px] font-medium text-emerald-600 uppercase bg-emerald-50 px-1.5 rounded">
                                  {kpis.fuelPercentage}% Ahorro
                                </span>
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-6">
                            <div className="flex flex-col items-end">
                              <div className="text-xl font-medium text-[#1C1C1C] tabular-nums">
                                €{kpis.fuelCostSaved.toFixed(2)}
                              </div>
                              <span className="text-[9px] font-medium text-[#6B7280]/40 uppercase">
                                Economía
                              </span>
                            </div>
                            <ChevronRight
                              strokeWidth={1.5}
                              className="h-4 w-4 text-[#6B7280]/40 group-hover:text-[#1C1C1C] group-hover:translate-x-0.5 transition-all"
                            />
                          </div>
                        </div>
                      )
                    })
                  )}
                </div>
              </div>
            </>
          ) : (
            <div className="flex flex-col items-center justify-center py-16 opacity-50">
              <Zap className="h-8 w-8 mb-3 text-[#6B7280]" />
              <p className="text-sm font-medium text-[#6B7280] text-center">
                Sin datos. Optimiza rutas para ver análisis predictivo
              </p>
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  )
}
