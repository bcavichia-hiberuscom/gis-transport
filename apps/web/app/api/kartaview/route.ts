// app/api/kartaview/route.ts
//
// Thin proxy for the KartaView (OpenStreetCam) public Photos API.
// Avoids CORS issues when calling from the browser.
// No authentication required — this is a public endpoint.
//
// External data is validated with Zod before being trusted.
//
// Design notes — KartaView limitations:
// • No continuous navigation / 360° movement — only discrete photos.
// • KartaView API is slow (3–7 s cold). We use a soft deadline via
//   Promise.race so the route ALWAYS returns within TIME_BUDGET_MS,
//   never throwing a raw TimeoutError.
// • Early-exit: we scan photos linearly and stop at MAX_PHOTOS,
//   keeping the processing O(n) with a small n.
// • The API already returns photos roughly sorted by distance.
//   We apply a lightweight re-rank on at most MAX_PHOTOS items.

import { NextResponse } from "next/server";
import { z } from "zod";
import type { KartaViewPhoto } from "@/lib/types/kartaview";
import { KartaViewPhotoOutputSchema, KartaViewClientResponseSchema } from "@/lib/types/kartaview";

// ── Zod schemas for external KartaView API response ──

const KartaViewPhotoSchema = z.object({
  // Pre-resolved CDN URLs (preferred)
  imageProcUrl: z.string().url().nullish(),
  imageThUrl: z.string().url().nullish(),
  imageLthUrl: z.string().url().nullish(),
  // Fallback direct-storage URLs
  fileurlProc: z.string().url().nullish(),
  fileurlTh: z.string().url().nullish(),
  fileurlLTh: z.string().url().nullish(),
  // Raw template URL (last resort — uses {{sizeprefix}} placeholder)
  fileurl: z.string().nullish(),
  // Identifiers (for viewer deep-links)
  id: z.union([z.string(), z.number()]).nullish(),
  sequenceId: z.union([z.string(), z.number()]).nullish(),
  sequenceIndex: z.union([z.string(), z.number()]).nullish(),
  // Metadata
  heading: z.union([z.string(), z.number()]).nullish(),
  lat: z.union([z.string(), z.number()]).nullish(),
  lng: z.union([z.string(), z.number()]).nullish(),
  shotDate: z.string().nullish(),
  dateAdded: z.string().nullish(),
  projection: z.string().nullish(),
  distance: z.union([z.string(), z.number()]).nullish(),
});

const KartaViewResponseSchema = z.object({
  status: z.object({
    apiCode: z.number(),
    httpCode: z.number(),
  }),
  result: z.object({
    data: z.array(KartaViewPhotoSchema).default([]),
  }),
});

// Output schemas are defined in @/lib/types/kartaview and re-exported here
// for backward-compatible imports.
export { KartaViewPhotoOutputSchema, KartaViewClientResponseSchema };
export type { KartaViewPhoto };

// ── Constants ──

const CACHE_TTL = 300_000; // 5 minutes
const TIME_BUDGET_MS = 7000; // Soft deadline — route returns within this
const MAX_PHOTOS = 5; // Stop scanning after this many valid photos
const API_RADIUS = 100; // metres — smaller = faster KartaView response

// ── In-memory cache ──

const cache = new Map<string, { data: KartaViewPhoto[]; ts: number }>();

// ── Resolve the best image URL from the validated photo object ──

function resolveImageUrl(photo: z.infer<typeof KartaViewPhotoSchema>): {
  imageUrl: string;
  thumbUrl: string;
  fullResUrl: string;
} {
  const imageUrl =
    photo.imageProcUrl ||
    photo.fileurlProc ||
    photo.imageThUrl ||
    photo.fileurlTh ||
    (photo.fileurl
      ? photo.fileurl.replace("{{sizeprefix}}", "proc")
      : "");

  const thumbUrl =
    photo.imageLthUrl ||
    photo.fileurlLTh ||
    photo.imageThUrl ||
    photo.fileurlTh ||
    (photo.fileurl
      ? photo.fileurl.replace("{{sizeprefix}}", "lth")
      : "");

  // Full-resolution: try "orig" size prefix, fall back to processed
  const fullResUrl = photo.fileurl
    ? photo.fileurl.replace("{{sizeprefix}}", "orig")
    : imageUrl || "";

  return {
    imageUrl: imageUrl || "",
    thumbUrl: thumbUrl || "",
    fullResUrl: fullResUrl || imageUrl || "",
  };
}

// ── Scoring: lower = better ──

function scorePhoto(photo: { distanceM: number; heading: number }): number {
  const h = photo.heading % 360;
  const cardinalDelta = Math.min(h % 90, 90 - (h % 90));
  const headingBonus = cardinalDelta <= 20 ? (20 - cardinalDelta) * 0.25 : 0;
  return photo.distanceM - headingBonus;
}

// ── Core fetch logic (runs inside Promise.race) ──

async function fetchKartaView(
  lat: string,
  lng: string,
  signal: AbortSignal,
): Promise<KartaViewPhoto[]> {
  const url =
    `https://api.openstreetcam.org/2.0/photo/` +
    `?lat=${lat}&lng=${lng}&zoomLevel=18&radius=${API_RADIUS}`;

  const res = await fetch(url, {
    headers: { "User-Agent": "GIS-Transport-Logistics/1.0" },
    signal,
  });

  if (!res.ok) return [];

  const rawJson = await res.json();
  const parsed = KartaViewResponseSchema.safeParse(rawJson);
  if (!parsed.success) return [];

  const { data: photos } = parsed.data.result;

  // Early-exit scan: stop as soon as we have MAX_PHOTOS valid entries.
  // KartaView already returns photos roughly sorted by distance,
  // so the first valid photos are the closest ones.
  const result: KartaViewPhoto[] = [];
  for (const p of photos) {
    if (result.length >= MAX_PHOTOS) break;
    const { imageUrl, thumbUrl, fullResUrl } = resolveImageUrl(p);
    if (!imageUrl) continue;

    // Construct a deep-link into the KartaView web viewer.
    const viewerUrl =
      p.sequenceId && p.sequenceIndex != null
        ? `https://kartaview.org/details/${p.sequenceId}/${p.sequenceIndex}`
        : `https://kartaview.org/map/@${Number(p.lat) || 0},${Number(p.lng) || 0},18z`;

    result.push({
      imageUrl,
      thumbUrl: thumbUrl || imageUrl,
      fullResUrl: fullResUrl || imageUrl,
      viewerUrl,
      heading: Number(p.heading) || 0,
      lat: Number(p.lat) || 0,
      lng: Number(p.lng) || 0,
      shotDate: p.shotDate || p.dateAdded || "",
      distanceM: Number(p.distance) || 0,
    });
  }

  // Lightweight re-rank on the small result set (max 5 items)
  result.sort((a, b) => scorePhoto(a) - scorePhoto(b));

  return result;
}

// ── Soft deadline: resolves with [] when time budget is exceeded ──

function softDeadline(
  ms: number,
  controller: AbortController,
): Promise<KartaViewPhoto[]> {
  return new Promise((resolve) => {
    setTimeout(() => {
      controller.abort();
      resolve([]);
    }, ms);
  });
}

// ── Route handler ──

const EMPTY_RESPONSE = NextResponse.json({ data: [] });

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const lat = searchParams.get("lat");
  const lng = searchParams.get("lng");

  if (!lat || !lng) {
    return EMPTY_RESPONSE;
  }

  // Grid-based cache key (~110 m precision)
  const cacheKey = `${parseFloat(lat).toFixed(3)},${parseFloat(lng).toFixed(3)}`;
  const cached = cache.get(cacheKey);
  if (cached && Date.now() - cached.ts < CACHE_TTL) {
    return NextResponse.json({ data: cached.data });
  }

  // Race the actual fetch against a soft deadline.
  // If KartaView is slow, the route returns { data: [] } within
  // TIME_BUDGET_MS instead of throwing a noisy TimeoutError.
  const controller = new AbortController();

  let photos: KartaViewPhoto[];
  try {
    photos = await Promise.race([
      fetchKartaView(lat, lng, controller.signal),
      softDeadline(TIME_BUDGET_MS, controller),
    ]);
  } catch {
    // Any unexpected error → deterministic empty result
    photos = [];
  }

  if (photos.length > 0) {
    cache.set(cacheKey, { data: photos, ts: Date.now() });
  }

  return NextResponse.json({ data: photos });
}
