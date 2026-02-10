"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { FleetVehicle, Driver } from "@gis/shared";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Users,
  Truck,
  X,
  Tag,
  Edit2,
  Check,
  MapPin,
  Hash,
  Gauge,
  Copy,
  CheckCircle2,
  Camera,
  ChevronLeft,
  ChevronRight,
  ZoomIn,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { VEHICLE_TYPES } from "@/lib/types";
import type { SvState, KartaViewPhoto } from "@/lib/types/kartaview";
import { KartaViewClientResponseSchema } from "@/lib/types/kartaview";
import { StreetViewLightbox } from "@/components/street-view-lightbox";

interface VehicleDetailSheetProps {
  vehicle: FleetVehicle | null;
  onClose: () => void;
  isOpen?: boolean;
  drivers?: Driver[];
  onAssignDriver?: (vehicleId: string | number, driver: Driver | null) => void;
  onChangeEnvironmentalTag?: (
    vehicleId: string | number,
    tagId: string,
  ) => void;
  onUpdateLabel?: (vehicleId: string | number, label: string) => void;
  onUpdateLicensePlate?: (
    vehicleId: string | number,
    licensePlate: string,
  ) => void;
  onViewDriverProfile?: (driverId: string) => void;
}

const ENVIRONMENTAL_TAGS = VEHICLE_TYPES.map((vehicleType) => {
  const id = vehicleType.id === "noLabel" ? "none" : vehicleType.id || "";
  const label =
    vehicleType.id === "noLabel"
      ? "Sin etiqueta"
      : (vehicleType.id || "").toUpperCase();
  const color = (() => {
    switch (vehicleType.id) {
      case "zero":
        return "bg-green-500";
      case "eco":
        return "bg-blue-500";
      case "c":
        return "bg-yellow-500";
      case "b":
        return "bg-orange-500";
      default:
        return "bg-gray-500";
    }
  })();
  return { id, label, color, description: vehicleType.description };
});

export function VehicleDetailsPanel({
  vehicle,
  onClose,
  isOpen = true,
  drivers = [],
  onAssignDriver,
  onChangeEnvironmentalTag,
  onUpdateLabel,
  onUpdateLicensePlate,
  onViewDriverProfile,
}: VehicleDetailSheetProps) {
  const [editingAlias, setEditingAlias] = useState(false);
  const [aliasValue, setAliasValue] = useState("");
  const [editingLicensePlate, setEditingLicensePlate] = useState(false);
  const [licensePlateValue, setLicensePlateValue] = useState("");
  const [copiedField, setCopiedField] = useState<string | null>(null);

  // ── KartaView street-level imagery (simplified: fetch 1 image) ──
  const [svState, setSvState] = useState<SvState>({ status: "idle" });
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const lastFetchedKeyRef = useRef("");
  const lastFetchTimeRef = useRef(0);

  // Close lightbox when vehicle changes
  useEffect(() => setLightboxOpen(false), [vehicle?.id]);

  // Sync state when vehicle changes
  useEffect(() => {
    if (vehicle) {
      setAliasValue(vehicle.label || "");
      setLicensePlateValue(vehicle.licensePlate || "");
      setEditingAlias(false);
      setEditingLicensePlate(false);
    }
  }, [vehicle?.id, vehicle?.label, vehicle?.licensePlate]);

  // Fetch KartaView image when position changes
  // When moving: throttle to every 30s so user can actually view the image
  // When stopped: fetch immediately on grid change
  useEffect(() => {
    if (!vehicle?.position) {
      setSvState({ status: "idle" });
      return;
    }
    const [vLat, vLon] = vehicle.position;
    // Round to ~100m grid to avoid excessive fetches
    const key = `${vLat.toFixed(3)},${vLon.toFixed(3)}`;
    if (key === lastFetchedKeyRef.current) return;

    // Throttle when vehicle is moving/on_route
    const isMoving =
      vehicle.metrics?.movementState === "moving" ||
      vehicle.metrics?.movementState === "on_route";
    const elapsed = Date.now() - lastFetchTimeRef.current;
    const THROTTLE_MS = 30_000; // 30 seconds when moving

    if (isMoving && elapsed < THROTTLE_MS) {
      // Skip fetch, keep current image stable
      return;
    }

    lastFetchedKeyRef.current = key;
    lastFetchTimeRef.current = Date.now();

    const controller = new AbortController();
    setSvState({ status: "searching" });

    (async () => {
      try {
        const res = await fetch(`/api/kartaview?lat=${vLat}&lng=${vLon}`, {
          signal: controller.signal,
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const json = await res.json();
        const parsed = KartaViewClientResponseSchema.safeParse(json);
        // Take only the first (best) photo
        const photos: KartaViewPhoto[] = parsed.success
          ? parsed.data.data.slice(0, 1)
          : [];
        setSvState(
          photos.length > 0
            ? { status: "resolved", photos, activeIndex: 0, imgLoaded: false }
            : { status: "empty" },
        );
      } catch (err: unknown) {
        if (err instanceof Error && err.name === "AbortError") return;
        setSvState({ status: "empty" });
      }
    })();

    return () => controller.abort();
  }, [vehicle?.position?.[0], vehicle?.position?.[1]]);

  // Navigation for multiple photos (kept for lightbox compatibility)
  const streetViewNav = useCallback((dir: 1 | -1) => {
    setSvState((prev) => {
      if (prev.status !== "resolved") return prev;
      const len = prev.photos.length;
      const next = prev.activeIndex + dir;
      return {
        ...prev,
        activeIndex: next < 0 ? len - 1 : next >= len ? 0 : next,
        imgLoaded: false,
      };
    });
  }, []);

  if (!vehicle) return null;

  const [lat, lon] = vehicle?.position || [0, 0];
  const metrics = vehicle?.metrics;
  const driver = vehicle?.driver;

  const isElectric =
    vehicle.type.id.includes("electric") ||
    vehicle.type.id === "zero" ||
    metrics?.batteryLevel !== undefined;

  // Determine current environmental tag
  const getCurrentTag = () => {
    const typeId = vehicle.type.id?.toLowerCase() || "";
    if (typeId === "nolabel" || typeId === "none") {
      return ENVIRONMENTAL_TAGS.find((tag) => tag.id === "none")!;
    }
    const matchedTag = ENVIRONMENTAL_TAGS.find(
      (tag) =>
        tag.id !== "none" && (typeId === tag.id || typeId.includes(tag.id)),
    );
    return matchedTag || ENVIRONMENTAL_TAGS.find((tag) => tag.id === "none")!;
  };

  const currentTag = getCurrentTag();

  const lastUpdateTime = metrics?.updatedAt
    ? new Date(metrics.updatedAt).toLocaleString("es-ES", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      })
    : null;

  const odometerKm = metrics?.distanceTotal
    ? (metrics.distanceTotal / 1000).toFixed(1)
    : null;

  const handleSaveAlias = () => {
    if (onUpdateLabel && aliasValue !== vehicle.label) {
      onUpdateLabel(vehicle.id, aliasValue);
    }
    setEditingAlias(false);
  };

  const handleSaveLicensePlate = () => {
    if (onUpdateLicensePlate && licensePlateValue !== vehicle.licensePlate) {
      onUpdateLicensePlate(vehicle.id, licensePlateValue);
    }
    setEditingLicensePlate(false);
  };

  const handleUnassignDriver = () => {
    if (onAssignDriver && driver) {
      onAssignDriver(vehicle.id, null);
    }
  };

  const handleAssignDriver = (newDriver: Driver) => {
    if (onAssignDriver) {
      onAssignDriver(vehicle.id, newDriver);
    }
  };

  const copyToClipboard = (text: string, fieldName: string) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopiedField(fieldName);
      setTimeout(() => setCopiedField(null), 1500);
    });
  };

  const availableDrivers = drivers.filter(
    (d: Driver) => d.isAvailable === true && d.id !== driver?.id,
  );

  return (
    <>
      <div
        className={cn(
          "fixed top-3 right-3 bottom-3 w-[360px] max-w-[calc(100vw-100px)] bg-background border border-border/40 rounded-2xl shadow-xl z-40 transition-all duration-200 ease-out transform flex flex-col overflow-hidden",
          isOpen && !lightboxOpen
            ? "translate-x-0 opacity-100"
            : "translate-x-full opacity-0 pointer-events-none",
        )}
      >
        {/* Header */}
        <div className="px-4 py-3 border-b border-border/30 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
              <Truck className="h-4 w-4 text-primary" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-foreground leading-none">
                Ficha del Vehículo
              </h2>
              <p className="text-[9px] text-muted-foreground/60 mt-0.5 font-mono">
                {String(vehicle.id).slice(0, 20)}
              </p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 text-muted-foreground hover:text-foreground"
            onClick={onClose}
          >
            <X className="h-3.5 w-3.5" />
          </Button>
        </div>

        {/* Content - Scrollable */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {/* Identity & Registration */}
          <Card className="bg-card border border-border/30 rounded-lg p-0 overflow-hidden">
            <div className="px-3 py-2 border-b border-border/20 flex items-center gap-1.5">
              <Hash className="h-3 w-3 text-muted-foreground/70" />
              <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide">
                Identificación
              </span>
            </div>
            <div className="p-3 space-y-2.5">
              {/* License Plate */}
              <div className="flex items-center justify-between p-2.5 bg-muted/15 rounded-md group">
                <div className="flex-1">
                  <Label className="text-[9px] font-medium text-muted-foreground/70 uppercase tracking-wide">
                    Matrícula
                  </Label>
                  {editingLicensePlate ? (
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <Input
                        value={licensePlateValue}
                        onChange={(e) =>
                          setLicensePlateValue(e.target.value.toUpperCase())
                        }
                        onKeyDown={(e) => {
                          if (e.key === "Enter") handleSaveLicensePlate();
                          if (e.key === "Escape") {
                            setLicensePlateValue(vehicle.licensePlate || "");
                            setEditingLicensePlate(false);
                          }
                        }}
                        className="h-6 text-xs font-mono uppercase flex-1"
                        placeholder="0000 ABC"
                        autoFocus
                      />
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-6 w-6"
                        onClick={handleSaveLicensePlate}
                      >
                        <Check className="h-3 w-3" />
                      </Button>
                    </div>
                  ) : (
                    <p className="text-xs font-semibold font-mono text-foreground mt-0.5 tracking-wide">
                      {vehicle.licensePlate || "Sin matrícula"}
                    </p>
                  )}
                </div>
                {!editingLicensePlate && (
                  <div className="flex items-center gap-0.5">
                    {vehicle.licensePlate && (
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-6 w-6 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={() =>
                          copyToClipboard(vehicle.licensePlate!, "plate")
                        }
                      >
                        {copiedField === "plate" ? (
                          <CheckCircle2 className="h-2.5 w-2.5 text-emerald-500" />
                        ) : (
                          <Copy className="h-2.5 w-2.5" />
                        )}
                      </Button>
                    )}
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-6 w-6 text-muted-foreground"
                      onClick={() => setEditingLicensePlate(true)}
                    >
                      <Edit2 className="h-3 w-3" />
                    </Button>
                  </div>
                )}
              </div>

              {/* Alias */}
              <div className="flex items-center justify-between p-2.5 bg-muted/15 rounded-md">
                <div className="flex-1">
                  <Label className="text-[9px] font-medium text-muted-foreground/70 uppercase tracking-wide">
                    Alias / Nombre
                  </Label>
                  {editingAlias ? (
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <Input
                        value={aliasValue}
                        onChange={(e) => setAliasValue(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") handleSaveAlias();
                          if (e.key === "Escape") {
                            setAliasValue(vehicle.label || "");
                            setEditingAlias(false);
                          }
                        }}
                        className="h-6 text-xs flex-1"
                        placeholder="Nombre del vehículo..."
                        autoFocus
                      />
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-6 w-6"
                        onClick={handleSaveAlias}
                      >
                        <Check className="h-3 w-3" />
                      </Button>
                    </div>
                  ) : (
                    <p className="text-xs font-semibold text-foreground mt-0.5">
                      {vehicle.label || "Sin alias"}
                    </p>
                  )}
                </div>
                {!editingAlias && (
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-6 w-6 text-muted-foreground"
                    onClick={() => setEditingAlias(true)}
                  >
                    <Edit2 className="h-3 w-3" />
                  </Button>
                )}
              </div>

              {/* Vehicle Type + Powertrain (read-only metadata) */}
              <div className="grid grid-cols-2 gap-1.5">
                <div className="p-2 bg-muted/10 rounded-md border border-border/15">
                  <Label className="text-[8px] font-medium text-muted-foreground/60 uppercase tracking-wide">
                    Categoría
                  </Label>
                  <p className="text-[10px] font-semibold text-foreground mt-0.5">
                    {vehicle.type.label}
                  </p>
                </div>
                <div className="p-2 bg-muted/10 rounded-md border border-border/15">
                  <Label className="text-[8px] font-medium text-muted-foreground/60 uppercase tracking-wide">
                    Propulsión
                  </Label>
                  <p className="text-[10px] font-semibold text-foreground mt-0.5">
                    {isElectric ? "Eléctrico" : "Combustión"}
                  </p>
                </div>
              </div>

              {/* Status + Odometer row */}
              <div className="grid grid-cols-2 gap-1.5">
                <div className="p-2 bg-muted/10 rounded-md border border-border/15">
                  <Label className="text-[8px] font-medium text-muted-foreground/60 uppercase tracking-wide">
                    Estado
                  </Label>
                  <div className="flex items-center gap-1 mt-0.5">
                    <div
                      className={cn(
                        "h-1.5 w-1.5 rounded-full",
                        metrics?.status === "active"
                          ? "bg-emerald-500"
                          : metrics?.status === "maintenance"
                            ? "bg-orange-500"
                            : "bg-zinc-400",
                      )}
                    />
                    <p className="text-[10px] font-semibold text-foreground">
                      {metrics?.status === "active"
                        ? "Activo"
                        : metrics?.status === "maintenance"
                          ? "Mant."
                          : metrics?.status === "offline"
                            ? "Offline"
                            : "Inactivo"}
                    </p>
                  </div>
                </div>
                <div className="p-2 bg-muted/10 rounded-md border border-border/15">
                  <Label className="text-[8px] font-medium text-muted-foreground/60 uppercase tracking-wide">
                    Odómetro
                  </Label>
                  <p className="text-[10px] font-semibold text-foreground mt-0.5 font-mono">
                    {odometerKm ? `${odometerKm} km` : "—"}
                  </p>
                </div>
              </div>
            </div>
          </Card>

          {/* Environmental Label */}
          <Card className="bg-card border border-border/30 rounded-lg p-0 overflow-hidden">
            <div className="px-3 py-2 border-b border-border/20 flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <Tag className="h-3 w-3 text-muted-foreground/70" />
                <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide">
                  Etiqueta Ambiental
                </span>
              </div>
              <Badge
                className={cn(
                  currentTag.color,
                  "text-white font-semibold text-[8px] px-1.5 h-4",
                )}
              >
                {currentTag.label}
              </Badge>
            </div>
            <div className="p-3">
              <div className="grid grid-cols-5 gap-1.5">
                {ENVIRONMENTAL_TAGS.map((tag) => {
                  const isSelected = currentTag.id === tag.id;
                  return (
                    <Button
                      key={tag.id}
                      variant="outline"
                      size="sm"
                      className={cn(
                        "h-7 text-[10px] font-semibold px-1 rounded transition-all",
                        isSelected
                          ? cn(tag.color, "text-black ring-1")
                          : "hover:bg-muted/50",
                      )}
                      onClick={() => {
                        if (onChangeEnvironmentalTag && !isSelected) {
                          onChangeEnvironmentalTag(vehicle.id, tag.id);
                        }
                      }}
                    >
                      {tag.id === "none" ? "—" : tag.label}
                    </Button>
                  );
                })}
              </div>
              <p className="text-[8px] text-muted-foreground/40 mt-1.5 leading-relaxed">
                {currentTag.description ||
                  "Sin clasificación ambiental asignada."}
              </p>
            </div>
          </Card>

          {/* Position & Coordinates */}
          <Card className="bg-card border border-border/30 rounded-lg p-0 overflow-hidden">
            <div className="px-3 py-2 border-b border-border/20 flex items-center gap-1.5">
              <MapPin className="h-3 w-3 text-muted-foreground/70" />
              <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide">
                Posición
              </span>
            </div>
            <div className="p-3">
              <div className="flex items-center justify-between p-2 bg-muted/10 rounded-md border border-border/15 group">
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <div>
                      <Label className="text-[8px] font-medium text-muted-foreground/60 uppercase tracking-wide">
                        Lat
                      </Label>
                      <p className="text-[10px] font-semibold font-mono text-foreground">
                        {lat.toFixed(6)}°
                      </p>
                    </div>
                    <div className="h-5 w-px bg-border/20" />
                    <div>
                      <Label className="text-[8px] font-medium text-muted-foreground/60 uppercase tracking-wide">
                        Lon
                      </Label>
                      <p className="text-[10px] font-semibold font-mono text-foreground">
                        {lon.toFixed(6)}°
                      </p>
                    </div>
                  </div>
                  {lastUpdateTime && (
                    <p className="text-[8px] text-muted-foreground/40 font-mono">
                      Ult: {lastUpdateTime}
                    </p>
                  )}
                </div>
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-6 w-6 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={() =>
                    copyToClipboard(
                      `${lat.toFixed(6)}, ${lon.toFixed(6)}`,
                      "coords",
                    )
                  }
                >
                  {copiedField === "coords" ? (
                    <CheckCircle2 className="h-2.5 w-2.5 text-emerald-500" />
                  ) : (
                    <Copy className="h-2.5 w-2.5" />
                  )}
                </Button>
              </div>

              {/* Street-Level Imagery — KartaView */}
              <div className="mt-2.5">
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-1">
                    <Camera className="h-2.5 w-2.5 text-muted-foreground/50" />
                    <span className="text-[8px] font-semibold text-muted-foreground/50 uppercase tracking-wide">
                      Vista de Calle
                    </span>
                    {svState.status === "resolved" &&
                      svState.photos[svState.activeIndex] && (
                        <span className="text-[6px] font-mono text-muted-foreground/25 ml-0.5">
                          {svState.photos[
                            svState.activeIndex
                          ].distanceM.toFixed(0)}
                          m
                        </span>
                      )}
                  </div>
                  {svState.status === "resolved" &&
                    svState.photos.length > 1 && (
                      <div className="flex items-center gap-0.5">
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-4 w-4 text-muted-foreground/40 hover:text-foreground"
                          onClick={() => streetViewNav(-1)}
                        >
                          <ChevronLeft className="h-2.5 w-2.5" />
                        </Button>
                        <span className="text-[7px] font-mono text-muted-foreground/30 tabular-nums">
                          {svState.activeIndex + 1}/{svState.photos.length}
                        </span>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-4 w-4 text-muted-foreground/40 hover:text-foreground"
                          onClick={() => streetViewNav(1)}
                        >
                          <ChevronRight className="h-2.5 w-2.5" />
                        </Button>
                      </div>
                    )}
                </div>

                <div
                  className={cn(
                    "relative rounded-md overflow-hidden border border-border/15 bg-muted/5 aspect-[16/9]",
                    svState.status === "resolved" && "cursor-pointer group/sv",
                  )}
                  onClick={() =>
                    svState.status === "resolved" && setLightboxOpen(true)
                  }
                >
                  {/* State: Searching — animated placeholder */}
                  {svState.status === "searching" && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center gap-1.5 bg-muted/5">
                      <div className="relative">
                        <Camera className="h-5 w-5 text-muted-foreground/15" />
                      </div>
                      <span className="text-[8px] text-muted-foreground/30 font-medium ">
                        Buscando imagen…
                      </span>
                    </div>
                  )}

                  {/* State: Resolved — show the best (first) image immediately */}
                  {svState.status === "resolved" &&
                    svState.photos[svState.activeIndex] && (
                      <>
                        {!svState.imgLoaded && (
                          <div className="absolute inset-0 flex flex-col items-center justify-center gap-1 z-0">
                            <div className="h-3 w-3 border-2 border-primary/15 border-t-primary/50 rounded-full animate-spin" />
                            <span className="text-[7px] text-muted-foreground/25 font-medium">
                              Cargando…
                            </span>
                          </div>
                        )}
                        <img
                          key={`${svState.activeIndex}-${svState.photos[svState.activeIndex].imageUrl}`}
                          src={svState.photos[svState.activeIndex].imageUrl}
                          alt="Vista de calle"
                          className={cn(
                            "w-full h-full object-cover transition-opacity duration-200",
                            svState.imgLoaded ? "opacity-100" : "opacity-0",
                          )}
                          loading="eager"
                          onLoad={() =>
                            setSvState((prev) =>
                              prev.status === "resolved"
                                ? { ...prev, imgLoaded: true }
                                : prev,
                            )
                          }
                          onError={(e) => {
                            if (svState.status !== "resolved") return;
                            const img = e.currentTarget;
                            const thumb =
                              svState.photos[svState.activeIndex].thumbUrl;
                            if (thumb && img.src !== thumb) {
                              img.src = thumb;
                            } else {
                              setSvState((prev) =>
                                prev.status === "resolved"
                                  ? { ...prev, imgLoaded: true }
                                  : prev,
                              );
                            }
                          }}
                        />
                        {/* Gradient overlay with metadata */}
                        <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/50 to-transparent px-2 pb-1 pt-4">
                          <div className="flex items-center justify-between">
                            <span className="text-[7px] font-semibold text-white/85">
                              {svState.photos[svState.activeIndex].shotDate
                                ? new Date(
                                    svState.photos[svState.activeIndex]
                                      .shotDate,
                                  ).toLocaleDateString("es-ES", {
                                    year: "numeric",
                                    month: "short",
                                    day: "numeric",
                                  })
                                : ""}
                            </span>
                            <span className="text-[7px] font-mono text-white/60">
                              {svState.photos[
                                svState.activeIndex
                              ].heading.toFixed(0)}
                              °
                            </span>
                          </div>
                        </div>
                        {/* Zoom hint on hover */}
                        <div className="absolute inset-0 bg-black/0 group-hover/sv:bg-black/15 transition-colors flex items-center justify-center opacity-0 group-hover/sv:opacity-100 pointer-events-none">
                          <ZoomIn className="h-4 w-4 text-white/75 drop-shadow" />
                        </div>
                      </>
                    )}

                  {/* State: Empty — no images in this area */}
                  {svState.status === "empty" && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center gap-0.5">
                      <Camera className="h-4 w-4 text-muted-foreground/10" />
                      <span className="text-[8px] text-muted-foreground/25 font-medium">
                        Sin imágenes disponibles
                      </span>
                    </div>
                  )}

                  {/* State: Error — fetch failed */}
                  {svState.status === "error" && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center gap-0.5">
                      <Camera className="h-4 w-4 text-red-400/15" />
                      <span className="text-[8px] text-muted-foreground/25 font-medium">
                        Error al obtener imágenes
                      </span>
                    </div>
                  )}

                  {/* State: Idle — panel just opened, no position yet */}
                  {svState.status === "idle" && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center gap-0.5">
                      <Camera className="h-4 w-4 text-muted-foreground/8" />
                      <span className="text-[8px] text-muted-foreground/20 font-medium">
                        Esperando posición
                      </span>
                    </div>
                  )}
                </div>
                <p className="text-[6px] text-muted-foreground/20 mt-0.5 text-right tracking-wide">
                  KartaView
                </p>
              </div>
            </div>
          </Card>

          <div className="h-1" />
        </div>
      </div>

      {/* KartaView lightbox — zoom, pan, full-res, external viewer link */}
      {lightboxOpen && svState.status === "resolved" && (
        <StreetViewLightbox
          photos={svState.photos}
          initialIndex={svState.activeIndex}
          onClose={() => setLightboxOpen(false)}
        />
      )}
    </>
  );
}
