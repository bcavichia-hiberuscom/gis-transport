/**
 * Spatial clustering engine for GIS map props.
 *
 * Design principles:
 *  • Deterministic — same zoom + dataset ⇒ same clusters, always.
 *  • Per-type isolation — vehicles, gas stations, EV stations, etc.
 *    are NEVER mixed inside a single cluster.
 *  • Progressive declustering — grid cell size shrinks as zoom increases,
 *    producing a smooth "cell-division" effect instead of all-at-once popping.
 *  • O(n) scan — each item is assigned to a grid cell via floor division.
 *    No pairwise distance checks.
 *
 * The grid cell size (in degrees) is derived from the zoom level:
 *   cellSize = BASE_CELL_DEG / 2^(zoom - BASE_ZOOM)
 *
 * At BASE_ZOOM (zoom 8) cells are ~22 km wide.
 * Each +1 zoom halves the cell size; each -1 zoom doubles it.
 * This ensures few large clusters at low zoom and smooth declustering.
 *
 * A cluster is emitted only when it contains ≥ 2 items.
 * Single items pass through as individuals even at low zoom.
 */

// ── Public types ──

export interface ClusterableItem {
  id: string | number;
  position: [number, number]; // [lat, lng]
}

export interface Cluster<T extends ClusterableItem> {
  /** Grid cell key — stable & deterministic for React keys. */
  key: string;
  /** Weighted centroid of all members. */
  center: [number, number];
  /** Member count. */
  count: number;
  /** Original items inside this cluster (available for drill-down). */
  items: T[];
}

export interface ClusterResult<T extends ClusterableItem> {
  /** Items that remain individual (cluster of 1). */
  singles: T[];
  /** Groups of ≥ 2 items. */
  clusters: Cluster<T>[];
}

// ── Constants ──

/** Base cell size in degrees at zoom 8 (~22 km at mid-latitudes). */
const BASE_CELL_DEG = 0.2;
const BASE_ZOOM = 8;

// ── Memoization cache ──
// Content-based cache: keyed on a fingerprint of (zoom, count, first/last IDs)
// so callers don't need stable array references.

interface CacheEntry<T extends ClusterableItem> {
  result: ClusterResult<T>;
}

const contentCache = new Map<string, CacheEntry<ClusterableItem>>();
const MAX_CACHE_ENTRIES = 64;

function buildCacheKey(items: readonly ClusterableItem[], zoom: number): string {
  const z = Math.round(zoom);
  const len = items.length;
  if (len === 0) return `z${z}:empty`;
  const first = items[0];
  const last = items[len - 1];
  return `z${z}:n${len}:f${first.id}:l${last.id}`;
}

// ── Core algorithm ──

/**
 * Cluster an array of items using a zoom-dependent spatial grid.
 *
 * @param items   Array of items (must have `id` and `position`).
 * @param zoom    Current map zoom level.
 * @returns       An object with `singles` (unclustered) and `clusters` (grouped).
 */
export function clusterItems<T extends ClusterableItem>(
  items: readonly T[],
  zoom: number,
): ClusterResult<T> {
  // ── Fast path: empty or very small arrays ──
  if (items.length <= 1) {
    return { singles: items as unknown as T[], clusters: [] };
  }

  // ── Memoization: content-based fingerprint → reuse result ──
  const cacheKey = buildCacheKey(items, zoom);
  const cached = contentCache.get(cacheKey) as CacheEntry<T> | undefined;
  if (cached) {
    return cached.result;
  }

  // ── Compute grid cell size for this zoom ──
  // Round to integer — fractional zoom from pinch/animation would produce
  // non-deterministic grids and defeat the cache.
  const intZoom = Math.round(zoom);
  const zoomDelta = intZoom - BASE_ZOOM;
  const cellSize = BASE_CELL_DEG / Math.pow(2, zoomDelta);

  // Assign each item to a grid cell via floor division.
  const buckets = new Map<string, T[]>();

  for (const item of items) {
    const [lat, lng] = item.position;
    const cellX = Math.floor(lng / cellSize);
    const cellY = Math.floor(lat / cellSize);
    const key = `${cellX}:${cellY}`;

    let bucket = buckets.get(key);
    if (!bucket) {
      bucket = [];
      buckets.set(key, bucket);
    }
    bucket.push(item);
  }

  // ── Split buckets into singles / clusters ──
  const singles: T[] = [];
  const clusters: Cluster<T>[] = [];

  for (const [key, bucket] of buckets) {
    if (bucket.length === 1) {
      singles.push(bucket[0]);
    } else {
      // Compute centroid
      let sumLat = 0;
      let sumLng = 0;
      for (const item of bucket) {
        sumLat += item.position[0];
        sumLng += item.position[1];
      }
      clusters.push({
        key,
        center: [sumLat / bucket.length, sumLng / bucket.length],
        count: bucket.length,
        items: bucket,
      });
    }
  }

  const result: ClusterResult<T> = { singles, clusters };

  // ── Cache the result (content-based key with FIFO eviction) ──
  if (contentCache.size >= MAX_CACHE_ENTRIES) {
    // Evict oldest entry
    const firstKey = contentCache.keys().next().value;
    if (firstKey !== undefined) contentCache.delete(firstKey);
  }
  contentCache.set(cacheKey, { result } as CacheEntry<ClusterableItem>);

  return result;
}
