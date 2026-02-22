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
  X,
} from "lucide-react";
import { AddressSearch } from "@/components/address-search";
import {
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

interface AddCustomPOIDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (
    label: string,
    coords: [number, number],
    description?: string,
  ) => void;
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
        <Label className="text-[11px] font-medium uppercase tracking-wider text-[#6B7280]">
          Punto de Interés
        </Label>
        <AddressSearch
          onSelectLocation={onAddressSelect}
          placeholder="Buscar dirección..."
          className="w-full shadow-none border-[#EAEAEA]"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label className="text-[10px] font-medium uppercase text-[#6B7280]/60">Latitud</Label>
          <Input
            value={latitude}
            onChange={(e) => onLatitudeChange(e.target.value)}
            type="number"
            className="h-10 text-[12px] font-medium border-[#EAEAEA] bg-[#F7F8FA]"
            disabled={isLoading}
          />
        </div>
        <div className="space-y-1.5">
          <Label className="text-[10px] font-medium uppercase text-[#6B7280]/60">Longitud</Label>
          <Input
            value={longitude}
            onChange={(e) => onLongitudeChange(e.target.value)}
            type="number"
            className="h-10 text-[12px] font-medium border-[#EAEAEA] bg-[#F7F8FA]"
            disabled={isLoading}
          />
        </div>
      </div>

      <Button
        type="button"
        variant="outline"
        className="w-full h-11 border-dashed border-[#EAEAEA] hover:border-[#1C1C1C] text-[#1C1C1C] text-[11px] font-medium uppercase tracking-wider"
        onClick={onPickFromMap}
        disabled={isLoading}
      >
        <Target strokeWidth={1.5} className="h-4 w-4 mr-2" />
        Señalar en Mapa
      </Button>

      <div className="flex gap-4 pt-2">
        <Button
          variant="outline"
          onClick={onCancel}
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
      </div>

      <div className="flex gap-4 pt-2">
        <Button
          variant="outline"
          onClick={onBack}
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
    description,
    latitude,
    longitude,
    isLoading,
    onLabelChange,
    onDescriptionChange,
    onBack,
    onSubmit,
  }: Step3ContentProps) => (
    <div className="space-y-6 animate-in fade-in slide-in-from-left-2 duration-300">
      <div className="space-y-4">
        <div className="space-y-1.5">
          <Label className="text-[11px] font-medium uppercase tracking-wider text-[#6B7280]">Etiqueta POI</Label>
          <Input
            placeholder="Ej. Sede Central, Almacén A..."
            value={label}
            onChange={(e) => onLabelChange(e.target.value)}
            className="h-10 text-[12px] font-medium border-[#EAEAEA] focus-visible:border-[#1C1C1C]"
            autoFocus
          />
        </div>
        <div className="space-y-1.5">
          <Label className="text-[11px] font-medium uppercase tracking-wider text-[#6B7280]">Descripción</Label>
          <Input
            placeholder="Opcional..."
            value={description}
            onChange={(e) => onDescriptionChange?.(e.target.value)}
            className="h-10 text-[12px] font-medium border-[#EAEAEA] focus-visible:border-[#1C1C1C]"
          />
        </div>
      </div>

      <div className="flex gap-4 pt-2">
        <Button
          variant="outline"
          onClick={onBack}
          className="flex-1 h-10 border-[#EAEAEA] text-[11px] font-medium uppercase tracking-wider"
        >
          Atrás
        </Button>
        <Button
          onClick={onSubmit}
          disabled={isLoading || !label.trim()}
          className="flex-1 h-10 bg-[#D4F04A] text-[#1C1C1C] hover:bg-[#D4F04A]/90 text-[11px] font-medium uppercase tracking-wider"
        >
          Finalizar
        </Button>
      </div>
    </div>
  )
);
Step3Content.displayName = "Step3Content";

export const AddCustomPOIDialog = memo(function AddCustomPOIDialog({
  isOpen,
  onOpenChange,
  onSubmit,
  onStartPicking,
  pickedCoords,
  mapCenter = MAP_CENTER,
  isLoading = false,
}: AddCustomPOIDialogProps) {
  const [step, setStep] = useState(1);
  const [label, setLabel] = useState("");
  const [description, setDescription] = useState("");
  const [latitude, setLatitude] = useState(mapCenter[0].toString());
  const [longitude, setLongitude] = useState(mapCenter[1].toString());

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

  const handleSubmit = useCallback(() => {
    if (!parsedCoords) return;
    onSubmit(label.trim(), parsedCoords, description.trim());
    setLabel("");
    setDescription("");
    setLatitude(mapCenter[0].toString());
    setLongitude(mapCenter[1].toString());
    setStep(1);
  }, [parsedCoords, label, description, onSubmit, mapCenter]);

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md p-0 overflow-hidden">
        <div className="bg-white p-8">
          <div className="flex items-center gap-4 mb-8">
            <div className="h-10 w-10 bg-[#F7F8FA] border border-[#EAEAEA] rounded-md flex items-center justify-center">
              <MapPin strokeWidth={1.5} className="h-5 w-5 text-[#1C1C1C]" />
            </div>
            <div>
              <DialogTitle className="text-[14px] font-medium uppercase tracking-tight text-[#1C1C1C]">Punto de Interés</DialogTitle>
              <DialogDescription className="text-[10px] uppercase tracking-widest text-[#6B7280]/60 mt-0.5">Gestión de Nodos Logísticos</DialogDescription>
            </div>
          </div>

          {step === 1 && (
            <Step1Content
              latitude={latitude}
              longitude={longitude}
              isLoading={isLoading}
              onLatitudeChange={setLatitude}
              onLongitudeChange={setLongitude}
              onAddressSelect={(coords) => {
                setLatitude(coords[0].toFixed(6));
                setLongitude(coords[1].toFixed(6));
              }}
              onPickFromMap={onStartPicking}
              onCancel={() => onOpenChange(false)}
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
              description={description}
              latitude={latitude}
              longitude={longitude}
              isLoading={isLoading}
              onLabelChange={setLabel}
              onDescriptionChange={setDescription}
              onBack={() => setStep(2)}
              onSubmit={handleSubmit}
            />
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
});
