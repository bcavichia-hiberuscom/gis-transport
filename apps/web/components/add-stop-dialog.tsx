"use client";

import { MAP_CENTER } from "@/lib/config";
import { useState, useEffect, useMemo, useCallback, memo } from "react";
import dynamic from "next/dynamic";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  MapPin,
  Target,
  Loader2,
  ChevronRight,
  ChevronLeft,
  Map as MapIcon,
  RefreshCw,
  Route,
  X,
} from "lucide-react";
import { AddressSearch } from "@/components/address-search";
import type {
  Step1ContentProps,
  Step2ContentProps,
  Step3ContentProps,
} from "@/lib/types";

const MapPreview = dynamic(() => import("@/components/map-preview"), {
  ssr: false,
  loading: () => (
    <div className="h-48 w-full rounded bg-[#F7F8FA] animate-pulse flex items-center justify-center">
      <Loader2 className="h-4 w-4 animate-spin text-[#6B7280]/20" />
    </div>
  ),
});

interface AddStopDialogProps {
  vehicleId: string | number;
  vehicleLabel: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAddStop: (coords: [number, number], label: string, eta?: string) => void;
  onStartPicking?: () => void;
  pickedCoords?: [number, number] | null;
  mapCenter?: [number, number];
  isLoading?: boolean;
}

const Step1Content = memo(
  ({
    latitude,
    longitude,
    isLoading,
    error,
    onLatitudeChange,
    onLongitudeChange,
    onAddressSelect,
    onPickFromMap,
    onCancel,
    onNext,
  }: Step1ContentProps) => (
    <div className="space-y-6 animate-in fade-in slide-in-from-right-2 duration-300">
      <div className="space-y-1.5">
        <Label className="text-[11px] font-medium uppercase tracking-wider text-[#6B7280] ml-1">
          Localización de Parada
        </Label>
        <AddressSearch
          onSelectLocation={onAddressSelect}
          placeholder="Introducir dirección..."
          className="w-full shadow-none border-[#EAEAEA]"
        />
      </div>

      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t border-[#EAEAEA]" />
        </div>
        <div className="relative flex justify-center">
          <span className="bg-white px-3 text-[9px] font-medium uppercase tracking-widest text-[#6B7280]/40">
            Coordenadas GPS
          </span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label className="text-[10px] font-medium uppercase text-[#6B7280]/60 ml-1">
            Latitud
          </Label>
          <Input
            value={latitude}
            onChange={(e) => onLatitudeChange(e.target.value)}
            type="number"
            step="any"
            className="h-10 text-[12px] font-medium border-[#EAEAEA] bg-[#F7F8FA]"
            disabled={isLoading}
          />
        </div>
        <div className="space-y-1.5">
          <Label className="text-[10px] font-medium uppercase text-[#6B7280]/60 ml-1">
            Longitud
          </Label>
          <Input
            value={longitude}
            onChange={(e) => onLongitudeChange(e.target.value)}
            type="number"
            step="any"
            className="h-10 text-[12px] font-medium border-[#EAEAEA] bg-[#F7F8FA]"
            disabled={isLoading}
          />
        </div>
      </div>

      <Button
        type="button"
        variant="outline"
        className="w-full h-11 border-dashed border-[#EAEAEA] hover:border-[#1C1C1C] hover:bg-[#F7F8FA] text-[#1C1C1C] text-[11px] font-medium uppercase tracking-wider"
        onClick={onPickFromMap}
        disabled={isLoading}
      >
        <Target strokeWidth={1.5} className="h-4 w-4 mr-2" />
        Seleccionar en el Mapa
      </Button>

      <div className="flex gap-4 pt-2">
        <Button
          variant="outline"
          onClick={onCancel}
          disabled={isLoading}
          className="flex-1 h-10 border-[#EAEAEA] text-[11px] font-medium uppercase tracking-wider"
        >
          Cancelar
        </Button>
        <Button
          onClick={onNext}
          disabled={isLoading}
          className="flex-1 h-10 bg-[#1C1C1C] text-white hover:bg-[#D4F04A] hover:text-[#1C1C1C] text-[11px] font-medium uppercase tracking-wider transition-all"
        >
          Continuar
          <ChevronRight strokeWidth={1.5} className="h-4 w-4 ml-1" />
        </Button>
      </div>
    </div>
  )
);
Step1Content.displayName = "Step1Content";

const Step2Content = memo(
  ({
    latitude,
    longitude,
    parsedCoords,
    isLoading,
    onBack,
    onNext,
  }: Step2ContentProps) => (
    <div className="space-y-6 animate-in fade-in zoom-in duration-300">
      <div className="relative h-48 w-full rounded overflow-hidden border border-[#EAEAEA] bg-[#F7F8FA]">
        {parsedCoords && <MapPreview coords={parsedCoords} />}
        <div className="absolute top-3 right-3 px-2 py-1 bg-white border border-[#EAEAEA] rounded shadow-sm text-[9px] font-medium uppercase text-[#1C1C1C]">
          Vista Previa
        </div>
      </div>

      <div className="p-4 rounded bg-[#F7F8FA] border border-[#EAEAEA] flex items-center gap-4">
        <div className="h-8 w-8 rounded bg-white border border-[#EAEAEA] flex items-center justify-center">
          <Target strokeWidth={1.5} className="h-4 w-4 text-[#1C1C1C]" />
        </div>
        <div>
          <p className="text-[9px] font-medium uppercase tracking-wider text-[#6B7280]/60">Punto de Entrevisita</p>
          <p className="text-[11px] font-medium text-[#1C1C1C] mt-0.5 tabular-nums">{latitude}, {longitude}</p>
        </div>
      </div>

      <div className="flex gap-4 pt-2">
        <Button
          variant="outline"
          onClick={onBack}
          disabled={isLoading}
          className="flex-1 h-10 border-[#EAEAEA] text-[11px] font-medium uppercase tracking-wider"
        >
          Atrás
        </Button>
        <Button
          onClick={onNext}
          disabled={isLoading}
          className="flex-1 h-10 bg-[#D4F04A] text-[#1C1C1C] hover:bg-[#D4F04A]/90 text-[11px] font-medium uppercase tracking-wider"
        >
          Confirmar
        </Button>
      </div>
    </div>
  )
);
Step2Content.displayName = "Step2Content";

const Step3Content = memo(
  ({
    label,
    eta,
    latitude,
    longitude,
    isLoading,
    onLabelChange,
    onEtaChange,
    onBack,
    onSubmit,
  }: Step3ContentProps & { eta: string; onEtaChange: (val: string) => void }) => (
    <div className="space-y-6 animate-in fade-in slide-in-from-left-2 duration-300">
      <div className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="stop-label" className="text-[11px] font-medium uppercase tracking-wider text-[#6B7280]">
            Referencia de Parada
          </Label>
          <Input
            id="stop-label"
            placeholder="Ej: Cliente Central, Punto de Carga..."
            value={label}
            onChange={(e) => onLabelChange(e.target.value)}
            disabled={isLoading}
            className="h-10 text-[12px] font-medium border-[#EAEAEA] focus-visible:border-[#1C1C1C]"
            autoFocus
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="stop-eta" className="text-[11px] font-medium uppercase tracking-wider text-[#6B7280]">
            ETA Programado
          </Label>
          <Input
            id="stop-eta"
            type="datetime-local"
            value={eta}
            onChange={(e) => onEtaChange(e.target.value)}
            disabled={isLoading}
            className="h-10 text-[12px] font-medium border-[#EAEAEA] focus-visible:border-[#1C1C1C]"
          />
        </div>
      </div>

      <div className="flex gap-4 pt-2">
        <Button
          variant="outline"
          onClick={onBack}
          disabled={isLoading}
          className="flex-1 h-10 border-[#EAEAEA] text-[11px] font-medium uppercase tracking-wider"
        >
          Revisar
        </Button>
        <Button
          onClick={onSubmit}
          disabled={isLoading || !label.trim()}
          className="flex-1 h-10 bg-[#D4F04A] text-[#1C1C1C] hover:bg-[#D4F04A]/90 text-[11px] font-medium uppercase tracking-wider transition-all"
        >
          {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Añadir Parada"}
        </Button>
      </div>
    </div>
  )
);
Step3Content.displayName = "Step3Content";

export const AddStopDialog = memo(function AddStopDialog({
  vehicleLabel,
  open,
  onOpenChange,
  onAddStop,
  onStartPicking,
  pickedCoords,
  mapCenter = MAP_CENTER,
  isLoading = false,
}: AddStopDialogProps) {
  const [step, setStep] = useState(1);
  const [label, setLabel] = useState("");
  const [eta, setEta] = useState("");
  const [latitude, setLatitude] = useState(mapCenter[0].toString());
  const [longitude, setLongitude] = useState(mapCenter[1].toString());
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (pickedCoords && open) {
      setLatitude(pickedCoords[0].toFixed(6));
      setLongitude(pickedCoords[1].toFixed(6));
      setStep(2);
    }
  }, [pickedCoords, open]);

  const parsedCoords = useMemo(() => {
    const lat = parseFloat(latitude);
    const lon = parseFloat(longitude);
    return !isNaN(lat) && !isNaN(lon) ? ([lat, lon] as [number, number]) : null;
  }, [latitude, longitude]);

  const handleSubmit = useCallback(() => {
    if (!parsedCoords) return;
    const isoEta = eta ? new Date(eta).toISOString() : undefined;
    onAddStop(parsedCoords, label.trim(), isoEta);
    setLabel("");
    setEta("");
    setLatitude(mapCenter[0].toString());
    setLongitude(mapCenter[1].toString());
    setStep(1);
    setError(null);
  }, [parsedCoords, label, eta, onAddStop, mapCenter]);

  const handleCloseChange = useCallback(
    (open: boolean) => {
      if (!open) {
        setStep(1);
        setError(null);
      }
      onOpenChange(open);
    },
    [onOpenChange],
  );

  return (
    <Dialog open={open} onOpenChange={handleCloseChange}>
      <DialogContent className="max-w-md p-0 overflow-hidden">
        <div className="bg-white p-8">
          <div className="flex items-center gap-4 mb-8">
            <div className="h-10 w-10 bg-[#F7F8FA] border border-[#EAEAEA] rounded-md flex items-center justify-center">
              <Route strokeWidth={1.5} className="h-5 w-5 text-[#1C1C1C]" />
            </div>
            <div>
              <DialogTitle className="text-[14px] font-medium uppercase tracking-tight text-[#1C1C1C]">Parada Dinámica</DialogTitle>
              <DialogDescription className="text-[10px] uppercase tracking-widest text-[#6B7280]/60 mt-0.5">
                Vehículo: {vehicleLabel}
              </DialogDescription>
            </div>
          </div>

          {step === 1 && (
            <Step1Content
              latitude={latitude}
              longitude={longitude}
              isLoading={isLoading}
              error={error}
              onLatitudeChange={setLatitude}
              onLongitudeChange={setLongitude}
              onAddressSelect={(coords, address) => {
                setLatitude(coords[0].toFixed(6));
                setLongitude(coords[1].toFixed(6));
                setLabel(address);
                setError(null);
              }}
              onPickFromMap={onStartPicking}
              onCancel={() => handleCloseChange(false)}
              onNext={() => setStep(2)}
            />
          )}

          {step === 2 && (
            <Step2Content
              latitude={latitude}
              longitude={longitude}
              parsedCoords={parsedCoords}
              isLoading={isLoading}
              onBack={() => setStep(1)}
              onNext={() => setStep(3)}
            />
          )}

          {step === 3 && (
            <Step3Content
              label={label}
              eta={eta}
              latitude={latitude}
              longitude={longitude}
              isLoading={isLoading}
              onLabelChange={setLabel}
              onEtaChange={setEta}
              onBack={() => setStep(2)}
              onSubmit={handleSubmit}
            />
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
});
