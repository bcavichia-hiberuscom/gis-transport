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
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Package,
  Target,
  MapPin,
  Loader2,
  ChevronRight,
  ChevronLeft,
  Map as MapIcon,
  RefreshCw,
  X,
} from "lucide-react";
import { AddressSearch } from "@/components/address-search";
import {
  Step1ContentProps,
  Step2ContentProps,
  Step3ContentProps,
} from "@/lib/types";

// Lazy load map preview
const MapPreview = dynamic(() => import("@/components/map-preview"), {
  ssr: false,
  loading: () => (
    <div className="h-48 w-full rounded-md bg-[#F7F8FA] animate-pulse flex items-center justify-center">
      <Loader2 className="h-6 w-6 animate-spin text-[#6B7280]/20" />
    </div>
  ),
});

interface AddJobDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (coords: [number, number], label: string, eta?: string) => void;
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
          Búsqueda de Dirección
        </Label>
        <AddressSearch
          onSelectLocation={onAddressSelect}
          placeholder="Calle, Ciudad, Punto de Interés..."
          className="w-full shadow-none border-[#EAEAEA]"
        />
      </div>

      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t border-[#EAEAEA]" />
        </div>
        <div className="relative flex justify-center">
          <span className="bg-white px-3 text-[9px] font-medium uppercase tracking-widest text-[#6B7280]/40">
            Coordenadas Manuales
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
            className="h-10 text-[12px] font-medium border-[#EAEAEA] bg-[#F7F8FA] focus:bg-white transition-all"
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
            className="h-10 text-[12px] font-medium border-[#EAEAEA] bg-[#F7F8FA] focus:bg-white transition-all"
            disabled={isLoading}
          />
        </div>
      </div>

      <Button
        type="button"
        variant="outline"
        className="w-full h-11 border-dashed border-[#EAEAEA] hover:border-[#1C1C1C] hover:bg-[#F7F8FA] text-[#1C1C1C] text-[11px] font-medium uppercase tracking-wider transition-all"
        onClick={onPickFromMap}
        disabled={isLoading}
      >
        <Target strokeWidth={1.5} className="h-4 w-4 mr-2" />
        Seleccionar en el Mapa
      </Button>

      {error && (
        <div className="p-3 rounded bg-red-50 border border-red-100 text-[10px] text-red-700 font-medium flex items-center gap-2">
          <Loader2 className="h-3 w-3 animate-spin" />
          {error}
        </div>
      )}

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
          className="flex-1 h-10 bg-[#1C1C1C] hover:bg-[#D4F04A] hover:text-[#1C1C1C] text-white text-[11px] font-medium uppercase tracking-wider transition-all"
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
      <div className="relative h-48 w-full rounded-lg overflow-hidden border border-[#EAEAEA] bg-[#F7F8FA] shadow-inner group">
        {parsedCoords && <MapPreview coords={parsedCoords} />}
        <div className="absolute top-3 right-3">
          <div className="px-2 py-1 bg-white border border-[#EAEAEA] rounded shadow-sm">
            <span className="text-[9px] font-medium uppercase tracking-wider text-[#1C1C1C]">Vista Previa</span>
          </div>
        </div>
      </div>

      <div className="p-4 rounded-lg bg-[#F7F8FA] border border-[#EAEAEA] flex items-center gap-4">
        <div className="h-8 w-8 rounded bg-white border border-[#EAEAEA] flex items-center justify-center shadow-sm">
          <Target strokeWidth={1.5} className="h-4 w-4 text-[#1C1C1C]" />
        </div>
        <div>
          <p className="text-[9px] font-medium uppercase tracking-wider text-[#6B7280]/60 leading-none">
            Coordenadas Confirmadas
          </p>
          <p className="text-[11px] font-medium text-[#1C1C1C] mt-1 tabular-nums">
            {latitude}, {longitude}
          </p>
        </div>
      </div>

      <div className="flex gap-4 pt-2">
        <Button
          variant="outline"
          onClick={onBack}
          disabled={isLoading}
          className="flex-1 h-10 border-[#EAEAEA] text-[11px] font-medium uppercase tracking-wider"
        >
          <ChevronLeft strokeWidth={1.5} className="h-4 w-4 mr-1" />
          Atrás
        </Button>
        <Button
          onClick={onNext}
          disabled={isLoading}
          className="flex-1 h-10 bg-[#D4F04A] text-[#1C1C1C] hover:bg-[#D4F04A]/90 text-[11px] font-medium uppercase tracking-wider transition-all"
        >
          Confirmar
          <ChevronRight strokeWidth={1.5} className="h-4 w-4 ml-1" />
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
          <Label htmlFor="job-label" className="text-[11px] font-medium uppercase tracking-wider text-[#6B7280]">
            Referencia del Pedido
          </Label>
          <Input
            id="job-label"
            placeholder="Ej. Entrega Cliente A, Zona 4..."
            value={label}
            onChange={(e) => onLabelChange(e.target.value)}
            disabled={isLoading}
            className="h-10 text-[12px] font-medium border-[#EAEAEA] focus-visible:border-[#1C1C1C]"
            autoFocus
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="job-eta" className="text-[11px] font-medium uppercase tracking-wider text-[#6B7280]">
            Fecha / Hora Estimada (ETA)
          </Label>
          <Input
            id="job-eta"
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
          Atrás
        </Button>
        <Button
          onClick={onSubmit}
          disabled={isLoading}
          className="flex-1 h-10 bg-[#D4F04A] text-[#1C1C1C] hover:bg-[#D4F04A]/90 text-[11px] font-medium uppercase tracking-wider transition-all"
        >
          {isLoading ? (
            <Loader2 className="h-4 w-4 animate-spin text-[#1C1C1C]" />
          ) : (
            "Crear Pedido"
          )}
        </Button>
      </div>
    </div>
  )
);
Step3Content.displayName = "Step3Content";

export const AddJobDialog = memo(function AddJobDialog({
  isOpen,
  onOpenChange,
  onSubmit,
  onStartPicking,
  pickedCoords,
  mapCenter = MAP_CENTER,
  isLoading = false,
}: AddJobDialogProps) {
  const [step, setStep] = useState(1);
  const [label, setLabel] = useState("");
  const [eta, setEta] = useState("");
  const [latitude, setLatitude] = useState(mapCenter[0].toString());
  const [longitude, setLongitude] = useState(mapCenter[1].toString());
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (pickedCoords && isOpen) {
      setLatitude(pickedCoords[0].toFixed(6));
      setLongitude(pickedCoords[1].toFixed(6));
      setStep(2);
    }
  }, [pickedCoords, isOpen]);

  const parsedCoords = useMemo(() => {
    const lat = parseFloat(latitude);
    const lon = parseFloat(longitude);
    return !isNaN(lat) && !isNaN(lon) ? ([lat, lon] as [number, number]) : null;
  }, [latitude, longitude]);

  const handleToPreview = useCallback(() => {
    if (!parsedCoords) {
      setError("Coordenadas no válidas");
      return;
    }
    setError(null);
    setStep(2);
  }, [parsedCoords]);

  const handleConfirmLocation = useCallback(() => {
    setStep(3);
  }, []);

  const handleSubmit = useCallback(() => {
    if (!parsedCoords) return;

    const isoEta = eta ? new Date(eta).toISOString() : undefined;
    onSubmit(parsedCoords, label.trim() || "PEDIDO NUEVO", isoEta);

    // Reset only after successful submission
    setLabel("");
    setEta("");
    setLatitude(mapCenter[0].toString());
    setLongitude(mapCenter[1].toString());
    setStep(1);
    setError(null);
  }, [parsedCoords, label, eta, onSubmit, mapCenter]);

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

  const handleCancel = useCallback(() => handleCloseChange(false), [handleCloseChange]);
  
  return (
    <Dialog open={isOpen} onOpenChange={handleCloseChange}>
      <DialogContent className="sm:max-w-[450px] p-0 overflow-hidden">
        <div className="bg-white p-8">
          <div className="flex items-center gap-4 mb-10">
            <div className="h-10 w-10 bg-[#F7F8FA] border border-[#EAEAEA] rounded-md flex items-center justify-center">
              <Package strokeWidth={1.5} className="h-5 w-5 text-[#1C1C1C]" />
            </div>
            <div>
              <DialogTitle className="text-[14px] font-medium uppercase tracking-tight text-[#1C1C1C]">Nuevo Pedido</DialogTitle>
              <DialogDescription className="text-[10px] uppercase tracking-widest text-[#6B7280]/60 mt-0.5">
                Paso {step}: {step === 1 ? "Ubicación" : step === 2 ? "Confirmación" : "Detalles"}
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
              onCancel={handleCancel}
              onNext={handleToPreview}
            />
          )}

          {step === 2 && (
            <Step2Content
              latitude={latitude}
              longitude={longitude}
              parsedCoords={parsedCoords}
              isLoading={isLoading}
              onBack={() => setStep(1)}
              onNext={handleConfirmLocation}
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
