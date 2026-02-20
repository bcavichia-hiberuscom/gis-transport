import { useReducer } from "react";
import type {
  LayerVisibility,
  POI,
  VehicleType,
  WeatherData,
  Zone,
  Driver,
} from "@gis/shared";
import { VEHICLE_TYPES } from "@/lib/types";
import { MAP_CENTER } from "@/lib/config";

interface GISState {
  layers: LayerVisibility;
  weather: WeatherData | null;
  dynamicEVStations: POI[];
  dynamicGasStations: POI[];
  mapCenter: [number, number];
  selectedVehicle: VehicleType;
  fleetMode: boolean;
  showCustomPOIs: boolean;
  interactionMode: string | null;
  isAddCustomPOIOpen: boolean;
  pickedJobCoords: [number, number] | null;
  pickedStopCoords: [number, number] | null;
  isAddJobOpen: boolean;
  isAddStopOpen: boolean;
  activeZones: Zone[];
  selectedDriver: Driver | null;
  isDriverDetailsOpen: boolean;
  isFuelDetailsOpen: boolean;
  isVehicleDetailsOpen: boolean;
  showVehiclePropertiesPanel: boolean;
  zonePoints: [number, number][]; // For custom zone creation
  driversExpandedGroups: Record<string, boolean>;
  hiddenZones: string[]; // IDs of zones that are hidden
  isAssignDriverOpen: boolean;
  assigningVehicleId: string | number | null;
}

type GISAction =
  | { type: "SET_LAYERS"; payload: LayerVisibility }
  | { type: "SET_WEATHER"; payload: WeatherData | null }
  | { type: "SET_DYNAMIC_EV_STATIONS"; payload: POI[] }
  | { type: "SET_DYNAMIC_GAS_STATIONS"; payload: POI[] }
  | { type: "SET_MAP_CENTER"; payload: [number, number] }
  | { type: "SET_SELECTED_VEHICLE"; payload: VehicleType }
  | { type: "SET_FLEET_MODE"; payload: boolean }
  | { type: "SET_SHOW_CUSTOM_POIS"; payload: boolean }
  | { type: "SET_INTERACTION_MODE"; payload: string | null }
  | { type: "SET_IS_ADD_CUSTOM_POI_OPEN"; payload: boolean }
  | { type: "SET_PICKED_JOB_COORDS"; payload: [number, number] | null }
  | { type: "SET_PICKED_STOP_COORDS"; payload: [number, number] | null }
  | { type: "SET_IS_ADD_JOB_OPEN"; payload: boolean }
  | { type: "SET_IS_ADD_STOP_OPEN"; payload: boolean }
  | { type: "SET_ACTIVE_ZONES"; payload: Zone[] }
  | { type: "SET_SELECTED_DRIVER"; payload: Driver | null }
  | { type: "SET_IS_DRIVER_DETAILS_OPEN"; payload: boolean }
  | { type: "SET_IS_FUEL_DETAILS_OPEN"; payload: boolean }
  | { type: "SET_IS_VEHICLE_DETAILS_OPEN"; payload: boolean }
  | { type: "SET_SHOW_VEHICLE_PROPERTIES_PANEL"; payload: boolean }
  | { type: "ADD_ZONE_POINT"; payload: [number, number] }
  | { type: "CLEAR_ZONE_POINTS" }
  | { type: "TOGGLE_ZONE_VISIBILITY"; payload: string }
  | { type: "SET_DRIVERS_EXPANDED_GROUPS"; payload: Record<string, boolean> }
  | { type: "SET_IS_ASSIGN_DRIVER_OPEN"; payload: boolean }
  | { type: "SET_ASSIGNING_VEHICLE_ID"; payload: string | number | null };

const initialState: GISState = {
  layers: {
    gasStations: false,
    evStations: false,
    cityZones: true,
    route: true,
    customZones: false,
  },
  weather: null,
  dynamicEVStations: [],
  dynamicGasStations: [],
  mapCenter: MAP_CENTER, // Default MAP_CENTER
  selectedVehicle: VEHICLE_TYPES[0],
  fleetMode: false,
  showCustomPOIs: true,
  interactionMode: null,
  isAddCustomPOIOpen: false,
  pickedJobCoords: null,
  pickedStopCoords: null,
  isAddJobOpen: false,
  isAddStopOpen: false,
  activeZones: [],
  selectedDriver: null,
  isDriverDetailsOpen: false,
  isFuelDetailsOpen: false,
  isVehicleDetailsOpen: false,
  showVehiclePropertiesPanel: false,
  zonePoints: [],
  driversExpandedGroups: { available: false, assigned: false },
  hiddenZones: [],
  isAssignDriverOpen: false,
  assigningVehicleId: null,
};

// Maximum accumulated stations per type to prevent unbounded growth
const MAX_POI_STATIONS = 2000;

function gisReducer(state: GISState, action: GISAction): GISState {
  switch (action.type) {
    case "SET_LAYERS":
      return { ...state, layers: action.payload };
    case "SET_WEATHER":
      return { ...state, weather: action.payload };
    case "SET_DYNAMIC_EV_STATIONS": {
      // Empty payload = explicit clear (layer toggled off)
      if (action.payload.length === 0) {
        return { ...state, dynamicEVStations: [] };
      }
      // Merge new stations into existing, deduplicating by ID
      const evMap = new Map(state.dynamicEVStations.map(s => [s.id, s]));
      for (const s of action.payload) evMap.set(s.id, s);
      let evMerged = Array.from(evMap.values());
      if (evMerged.length > MAX_POI_STATIONS) {
        evMerged = evMerged.slice(-MAX_POI_STATIONS);
      }
      return { ...state, dynamicEVStations: evMerged };
    }
    case "SET_DYNAMIC_GAS_STATIONS": {
      if (action.payload.length === 0) {
        return { ...state, dynamicGasStations: [] };
      }
      const gasMap = new Map(state.dynamicGasStations.map(s => [s.id, s]));
      for (const s of action.payload) gasMap.set(s.id, s);
      let gasMerged = Array.from(gasMap.values());
      if (gasMerged.length > MAX_POI_STATIONS) {
        gasMerged = gasMerged.slice(-MAX_POI_STATIONS);
      }
      return { ...state, dynamicGasStations: gasMerged };
    }
    case "SET_MAP_CENTER":
      return { ...state, mapCenter: action.payload };
    case "SET_SELECTED_VEHICLE":
      return { ...state, selectedVehicle: action.payload };
    case "SET_FLEET_MODE":
      return { ...state, fleetMode: action.payload };
    case "SET_SHOW_CUSTOM_POIS":
      return { ...state, showCustomPOIs: action.payload };
    case "SET_INTERACTION_MODE":
      return { ...state, interactionMode: action.payload };
    case "SET_IS_ADD_CUSTOM_POI_OPEN":
      return { ...state, isAddCustomPOIOpen: action.payload };
    case "SET_PICKED_JOB_COORDS":
      return { ...state, pickedJobCoords: action.payload };
    case "SET_PICKED_STOP_COORDS":
      return { ...state, pickedStopCoords: action.payload };
    case "SET_IS_ADD_JOB_OPEN":
      return { ...state, isAddJobOpen: action.payload };
    case "SET_IS_ADD_STOP_OPEN":
      return { ...state, isAddStopOpen: action.payload };
    case "SET_ACTIVE_ZONES":
      return { ...state, activeZones: action.payload };
    case "SET_SELECTED_DRIVER":
      return { ...state, selectedDriver: action.payload };
    case "SET_IS_DRIVER_DETAILS_OPEN":
      return { ...state, isDriverDetailsOpen: action.payload };
    case "SET_IS_FUEL_DETAILS_OPEN":
      return { ...state, isFuelDetailsOpen: action.payload };
    case "SET_IS_VEHICLE_DETAILS_OPEN":
      return { ...state, isVehicleDetailsOpen: action.payload };
    case "SET_SHOW_VEHICLE_PROPERTIES_PANEL":
      return { ...state, showVehiclePropertiesPanel: action.payload };
    case "ADD_ZONE_POINT":
      return { ...state, zonePoints: [...state.zonePoints, action.payload] };
    case "CLEAR_ZONE_POINTS":
      return { ...state, zonePoints: [] };
    case "SET_DRIVERS_EXPANDED_GROUPS":
      return { ...state, driversExpandedGroups: action.payload };
    case "SET_IS_ASSIGN_DRIVER_OPEN":
      return { ...state, isAssignDriverOpen: action.payload };
    case "SET_ASSIGNING_VEHICLE_ID":
      return { ...state, assigningVehicleId: action.payload };
    case "TOGGLE_ZONE_VISIBILITY": {
      const isHidden = state.hiddenZones.includes(action.payload);
      return {
        ...state,
        hiddenZones: isHidden
          ? state.hiddenZones.filter((id) => id !== action.payload)
          : [...state.hiddenZones, action.payload],
      };
    }
    default:
      return state;
  }
}

export function useGISState() {
  const [state, dispatch] = useReducer(gisReducer, initialState);

  return { state, dispatch };
}
