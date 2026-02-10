/**
 * KartaView shared types — Zod-validated schemas for API responses
 * and the client-side street-view state machine.
 *
 * Imported by:
 *  • `app/api/kartaview/route.ts`  — output validation
 *  • `components/vehicle-details-panel.tsx` — UI state
 *  • `components/street-view-lightbox.tsx`  — viewer props
 */

import { z } from "zod";

// ── Photo output — sent from API route to client ──

export const KartaViewPhotoOutputSchema = z.object({
  imageUrl: z.string().min(1),
  thumbUrl: z.string().min(1),
  /** Highest-resolution URL available (orig > proc). Falls back to imageUrl. */
  fullResUrl: z.string().min(1),
  /** Deep-link into the KartaView web viewer for this photo. */
  viewerUrl: z.string().min(1),
  heading: z.number(),
  lat: z.number(),
  lng: z.number(),
  shotDate: z.string(),
  distanceM: z.number(),
});

export type KartaViewPhoto = z.infer<typeof KartaViewPhotoOutputSchema>;

export const KartaViewClientResponseSchema = z.object({
  data: z.array(KartaViewPhotoOutputSchema),
});

export type KartaViewClientResponse = z.infer<
  typeof KartaViewClientResponseSchema
>;

// ── UI state machine — Zod-validated discriminated union ──
//
// Each visual state the street-view card can be in is modelled as a
// discrete Zod schema.  The component stores a single `SvState` value
// instead of spreading status / photos / index across multiple hooks.

export const SvStateIdleSchema = z.object({
  status: z.literal("idle"),
});

export const SvStateSearchingSchema = z.object({
  status: z.literal("searching"),
});

export const SvStateResolvedSchema = z.object({
  status: z.literal("resolved"),
  photos: z.array(KartaViewPhotoOutputSchema).min(1),
  activeIndex: z.number().int().min(0),
  imgLoaded: z.boolean(),
});

export const SvStateEmptySchema = z.object({
  status: z.literal("empty"),
});

export const SvStateErrorSchema = z.object({
  status: z.literal("error"),
});

export const SvStateSchema = z.discriminatedUnion("status", [
  SvStateIdleSchema,
  SvStateSearchingSchema,
  SvStateResolvedSchema,
  SvStateEmptySchema,
  SvStateErrorSchema,
]);

export type SvState = z.infer<typeof SvStateSchema>;
export type SvStateResolved = z.infer<typeof SvStateResolvedSchema>;
