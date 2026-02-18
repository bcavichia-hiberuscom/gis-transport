"use client";

import {
  useState,
  useEffect,
  useCallback,
  FormEvent,
} from "react";
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
  Pentagon,
  Settings2,
  AlertCircle
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
      <DialogContent className="sm:max-w-[450px] p-0 overflow-hidden border-none shadow-2xl bg-background/95 backdrop-blur-xl max-h-[90vh]">
        <div className="bg-gradient-to-br from-primary/10 via-background to-background">
          <DialogHeader className="p-6 pb-2">
            <div className="flex items-center gap-3 mb-1">
              <div className="p-2 bg-primary/10 rounded-xl">
                <Pentagon className="h-5 w-5 text-primary" />
              </div>
              <div>
                <DialogTitle className="text-xl font-black tracking-tight uppercase italic text-primary/90">
                  {editingZoneData ? "Editar Zona" : "Finalizar Nueva Zona"}
                </DialogTitle>
                <DialogDescription className="text-[10px] uppercase tracking-[0.2em] font-bold text-muted-foreground/40">
                  Configuración de Reglas y Acceso
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <form onSubmit={handleSubmitZone} className="p-6 pt-2 space-y-6">
            <div className="space-y-4">
              <div className="space-y-1.5">
                <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60 ml-1">
                  Nombre de la Zona
                </Label>
                <Input
                  value={label}
                  onChange={(e) => setLabel(e.target.value)}
                  placeholder="Ej: Zona Restringida, LEZ Madrid..."
                  className="h-11 bg-muted/30 border-border/50 focus:bg-background transition-all font-bold"
                  required
                  autoFocus
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60 ml-1">
                  Descripción (Opcional)
                </Label>
                <Textarea
                  value={description}
                  onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                    setDescription(e.target.value)
                  }
                  placeholder="Detalles sobre las restricciones de esta zona..."
                  className="min-h-[80px] bg-muted/30 border-border/50 focus:bg-background transition-all text-xs"
                />
              </div>

              <div className="space-y-3">
                <div className="flex items-center gap-2 mb-1">
                  <Settings2 className="h-3 w-3 text-primary/60" />
                  <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">
                    Etiquetas Ambientales Permitidas
                  </Label>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  {(() => {
                    const TAG_LABELS: Record<string, string> = {
                      "0": "Zero Emisiones (0)",
                      eco: "ECO",
                      zero: "ZERO",
                      b: "Etiqueta B",
                      c: "Etiqueta C",
                    };
                    const uniqueTags = Array.from(
                      new Set(VEHICLE_TYPES.flatMap((v) => v.tags)),
                    );
                    return uniqueTags.map((tag) => (
                      <button
                        key={tag}
                        type="button"
                        onClick={() => handleToggleTag(tag)}
                        className={`h-9 px-3 rounded-lg border text-[10px] font-black uppercase tracking-tight transition-all ${requiredTags.includes(tag)
                          ? "bg-primary text-white border-primary shadow-lg shadow-primary/20"
                          : "bg-muted/30 border-border/40 text-muted-foreground/60 hover:bg-muted/50 hover:text-foreground"
                          }`}
                      >
                        {TAG_LABELS[tag] || tag}
                      </button>
                    ));
                  })()}
                </div>
              </div>
            </div>

            {error && (
              <div className="p-3 rounded-xl bg-red-500/5 border border-red-500/20 text-[10px] text-red-600 font-black uppercase tracking-tight flex items-center gap-2 animate-in fade-in zoom-in-95">
                <AlertCircle className="h-3 w-3" />
                {error}
              </div>
            )}

            <DialogFooter className="pt-2 gap-2">
              <Button
                type="button"
                variant="ghost"
                onClick={handleCancel}
                className="flex-1 h-11 text-[10px] font-black uppercase tracking-widest text-muted-foreground/40 hover:text-foreground hover:bg-muted/50 transition-all"
              >
                Descartar
              </Button>
              <Button
                type="submit"
                disabled={isLoading || zonePoints.length < 3}
                className="flex-1 h-11 text-[10px] font-black uppercase tracking-widest shadow-xl shadow-primary/20 bg-primary hover:bg-primary/90 hover:scale-[1.02] active:scale-[0.98] transition-all"
              >
                {isLoading ? "Procesando..." : (editingZoneData ? "Actualizar Zona" : "Confirmar y Guardar")}
              </Button>
            </DialogFooter>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  );
}
