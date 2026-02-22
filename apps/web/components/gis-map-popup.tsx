"use client";
import React from "react";

interface VehiclePopupData {
  vehicleId: string;
  vehicleName: string;
  licensePlate: string;
  status: string;
  speed: number;
  vehicleType: string;
  driverName: string | null;
  pixelPosition: { x: number; y: number };
}

interface GISMapPopupProps {
  vehiclePopupData: VehiclePopupData | null;
  onMouseEnter: () => void;
  onMouseLeave: () => void;
  onOpenVehiclePanel: () => void;
}

export function GISMapPopup({
  vehiclePopupData,
  onMouseEnter,
  onMouseLeave,
  onOpenVehiclePanel,
}: GISMapPopupProps) {
  if (!vehiclePopupData) return null;

  return (
    <div
      className="fixed z-50 pointer-events-auto animate-in fade-in-0 zoom-in-95 duration-100"
      style={{
        left: `${vehiclePopupData.pixelPosition.x}px`,
        top: `${vehiclePopupData.pixelPosition.y - 8}px`,
        transform: "translate(-50%, -100%)",
      }}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
    >
      <div className="bg-white/95 backdrop-blur-md rounded-md shadow-[0_8px_30px_rgb(0,0,0,0.12)] border border-[#EAEAEA] border-l-2 border-l-[#D4F04A] overflow-hidden min-w-[160px] max-w-[200px]">
        {/* Header */}
        <div className="px-3 py-2 flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <p className="text-[11px] font-semibold text-[#1C1C1C] truncate leading-tight tracking-wide">
              {vehiclePopupData.vehicleName}
            </p>
            {vehiclePopupData.licensePlate && (
              <p className="text-[9px] font-mono text-[#6B7280] uppercase tracking-widest mt-0.5">
                {vehiclePopupData.licensePlate}
              </p>
            )}
          </div>
          <div
            className={`shrink-0 px-1.5 py-0.5 rounded text-[8px] font-bold uppercase tracking-wider ${
              vehiclePopupData.status === "on_route" || vehiclePopupData.status === "moving"
                ? "bg-[#D4F04A] text-[#1C1C1C]"
                : "bg-[#F7F8FA] text-[#6B7280]"
            }`}
          >
            {vehiclePopupData.status === "on_route" || vehiclePopupData.status === "moving"
              ? "En Ruta"
              : "Standby"}
          </div>
        </div>

        {/* Compact info row */}
        <div className="px-3 py-2 border-t border-[#EAEAEA] flex flex-col gap-1.5 bg-[#F7F8FA]">
          <span className="text-[9px] font-bold text-[#6B7280] uppercase tracking-widest flex justify-between">
            <span>TIPO</span>
            <span className="text-[#1C1C1C]">{vehiclePopupData.vehicleType === "EV" ? "ELÉCTRICO" : "COMBUSTIÓN"}</span>
          </span>
          {vehiclePopupData.driverName && (
            <span className="text-[9px] font-bold text-[#6B7280] uppercase tracking-widest flex justify-between">
              <span>OPERADOR</span>
              <span className="truncate max-w-[80px] text-[#1C1C1C]">
                {vehiclePopupData.driverName.split(" ")[0]}
              </span>
            </span>
          )}
        </div>

        {/* Action */}
        <button
          onClick={onOpenVehiclePanel}
          className="w-full px-3 py-2 text-[9px] font-bold text-[#1C1C1C] hover:bg-[#D4F04A] transition-colors text-center uppercase tracking-widest flex items-center justify-center gap-1 border-t border-[#EAEAEA]"
        >
          Ver Telemetría <span className="text-[11px] leading-none">→</span>
        </button>
      </div>

      {/* Pointer triangle */}
      <div className="flex justify-center -mt-[1px]">
        <div className="w-2 h-2 bg-white/95 border-b border-r border-[#EAEAEA] rotate-45 -translate-y-0.5" />
      </div>
    </div>
  );
}
