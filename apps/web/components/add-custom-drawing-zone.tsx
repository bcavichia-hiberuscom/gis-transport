"use client";

import {
  useState,
  useEffect,
  useCallback,
  FormEvent,
} from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
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
  Pentagon,
  Settings2,
  AlertCircle,
  X,
  Loader2,
} from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { VEHICLE_TYPES } from "@/lib/types";

interface AddCustomZoneDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmitZone: (
    label: string,
    coordinates: any,
    description?: string,
    zoneType?: string,
    requiredTags?: string[],
  ) => void;
  zonePoints?: [number, number][];
  isLoading?: boolean;
  isDrawingZone?: boolean;
  isEditingZone?: boolean;
  editingZoneData?: {
    id: string;
    name: string;
    description?: string;
    zoneType?: string;
    requiredTags?: string[];
  } | null;
}

export function AddCustomZoneDialog({
  isOpen,
  onOpenChange,
  onSubmitZone,
  zonePoints = [],
  isLoading = false,
  isDrawingZone = false,
  isEditingZone = false,
  editingZoneData = null,
}: AddCustomZoneDialogProps) {
  // Zone fields
  const [zoneType] = useState("CUSTOM");
  const [requiredTags, setRequiredTags] = useState<string[]>([]);

  // Common fields
  const [label, setLabel] = useState("");
  const [description, setDescription] = useState("");
  const [error, setError] = useState("");

  // Pre-fill form when editing a zone or opening new
  useEffect(() => {
    if (isOpen) {
      if (editingZoneData) {
        setLabel(editingZoneData.name);
        setDescription(editingZoneData.description || "");
        setRequiredTags(editingZoneData.requiredTags || []);
      } else {
        setLabel("");
        setDescription("");
        setRequiredTags([]);
        setError("");
      }
    }
  }, [isOpen, editingZoneData]);

  const handleReset = useCallback(() => {
    setLabel("");
    setDescription("");
    setError("");
    setRequiredTags([]);
  }, []);

  const handleCancel = useCallback(() => {
    handleReset();
    onOpenChange(false);
  }, [handleReset, onOpenChange]);

  const handleSubmitZone = useCallback(
    (e: FormEvent<HTMLFormElement>) => {
      e.preventDefault();

      if (zonePoints.length < 3) {
        setError("Una zona requiere al menos 3 puntos.");
        return;
      }

      if (!label.trim()) {
        setError("El nombre de la zona es obligatorio.");
        return;
      }

      // Convert points to Leaflet polygon format [[lat, lon], ...]
      const coordinates = zonePoints.map((point) => [point[0], point[1]]);

      // Close the polygon by adding first point at the end if not already closed
      const firstPoint = coordinates[0];
      const lastPoint = coordinates[coordinates.length - 1];
      if (firstPoint[0] !== lastPoint[0] || firstPoint[1] !== lastPoint[1]) {
        coordinates.push([...firstPoint]);
      }

      onSubmitZone(
        label,
        [[coordinates]], // Wrap in double array for MultiPolygon 4D format (matches API zones)
        description,
        zoneType,
        requiredTags.length > 0 ? requiredTags : undefined,
      );

      handleReset();
      onOpenChange(false);
    },
    [
      zonePoints,
      label,
      description,
      zoneType,
      requiredTags,
      onSubmitZone,
      handleReset,
      onOpenChange,
    ],
  );

  const handleToggleTag = useCallback((tag: string) => {
    setRequiredTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag],
    );
  }, []);

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[450px] p-0 overflow-hidden">
        <div className="bg-white p-8">
          <div className="flex items-center gap-4 mb-8">
            <div className="h-10 w-10 bg-[#F7F8FA] border border-[#EAEAEA] rounded-md flex items-center justify-center">
              <Pentagon strokeWidth={1.5} className="h-5 w-5 text-[#1C1C1C]" />
            </div>
            <div>
              <DialogTitle className="text-[14px] font-medium uppercase tracking-tight text-[#1C1C1C]">
                {editingZoneData ? "Editar Zona" : "Nueva Zona"}
              </DialogTitle>
              <DialogDescription className="text-[10px] uppercase tracking-widest text-[#6B7280]/60 mt-0.5">
                Geocerca y Restricciones de Acceso
              </DialogDescription>
            </div>
          </div>

          <form onSubmit={handleSubmitZone} className="space-y-6">
            <div className="space-y-1.5">
              <Label className="text-[10px] font-medium uppercase tracking-wider text-[#6B7280]">
                Nombre de la Zona
              </Label>
              <Input
                value={label}
                onChange={(e) => setLabel(e.target.value)}
                placeholder="Ej. Zona Restringida Centro, MAD-LEZ..."
                className="h-10 text-[12px] font-medium border-[#EAEAEA] focus-visible:border-[#1C1C1C] rounded transition-all"
                required
                autoFocus
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-[10px] font-medium uppercase tracking-wider text-[#6B7280]">
                Observaciones
              </Label>
              <Textarea
                value={description}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                  setDescription(e.target.value)
                }
                placeholder="Detalles operativos..."
                className="min-h-[80px] text-[12px] border-[#EAEAEA] focus-visible:border-[#1C1C1C] rounded transition-all resize-none"
              />
            </div>

            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Settings2 strokeWidth={1.5} className="h-3.5 w-3.5 text-[#6B7280]" />
                <Label className="text-[10px] font-medium uppercase tracking-wider text-[#6B7280]">
                  Etiquetas Permitidas
                </Label>
              </div>

              <div className="grid grid-cols-2 gap-2">
                {(() => {
                  const TAG_LABELS: Record<string, string> = {
                    "0": "Zero (0)",
                    eco: "ECO",
                    zero: "ZERO",
                    b: "Etiqueta B",
                    c: "Etiqueta C",
                  };
                  const uniqueTags = Array.from(
                    new Set(VEHICLE_TYPES.flatMap((v) => v.tags)),
                  );
                  return uniqueTags.map((tag) => {
                    const isActive = requiredTags.includes(tag);
                    return (
                      <button
                        key={tag}
                        type="button"
                        onClick={() => handleToggleTag(tag)}
                        className={cn(
                          "h-9 px-3 rounded border text-[10px] font-medium uppercase tracking-tight transition-all",
                          isActive
                            ? "bg-[#1C1C1C] text-[#D4F04A] border-[#1C1C1C]"
                            : "bg-[#F7F8FA] border-[#EAEAEA] text-[#6B7280] hover:border-[#1C1C1C]/40"
                        )}
                      >
                        {TAG_LABELS[tag] || tag}
                      </button>
                    );
                  });
                })()}
              </div>
            </div>

            {error && (
              <div className="p-3 rounded bg-red-50 border border-red-100 text-[10px] text-red-700 font-medium flex items-center gap-2">
                <AlertCircle className="h-3 w-3" />
                {error}
              </div>
            )}

            <div className="flex gap-4 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={handleCancel}
                className="flex-1 h-10 text-[11px] font-medium uppercase tracking-wider border-[#EAEAEA]"
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={isLoading || zonePoints.length < 3}
                className="flex-1 h-10 bg-[#D4F04A] text-[#1C1C1C] hover:bg-[#D4F04A]/90 text-[11px] font-medium uppercase tracking-wider transition-all"
              >
                {isLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  editingZoneData ? "Actualizar" : "Guardar Zona"
                )}
              </Button>
            </div>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  );
}
