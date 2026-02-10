// src/app/api/vroom/route.ts
export const runtime = "nodejs";

const VROOM_LOCAL = process.env.VROOM_URL || "http://localhost:3002";
const VROOM_PUBLIC = "https://solver.vroom-project.org";

export async function POST(req: Request) {
  try {
    const body = await req.json();

    // Try local VROOM first
    try {
      const localRes = await fetch(VROOM_LOCAL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
        signal: AbortSignal.timeout(10000),
      });

      if (localRes.ok) {
        const text = await localRes.text();
        console.log("[VROOM] Using local instance");
        return new Response(text, {
          status: 200,
          headers: { "Content-Type": "application/json" },
        });
      }
      throw new Error(`Local VROOM returned ${localRes.status}`);
    } catch (localErr) {
      console.warn("[VROOM] Local unavailable, falling back to public API:", String(localErr));
    }

    // Fallback to public VROOM
    const publicRes = await fetch(VROOM_PUBLIC, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(30000),
    });

    if (!publicRes.ok) {
      const errorText = await publicRes.text();
      console.error("[VROOM] Public API error:", publicRes.status, errorText);
      return new Response(JSON.stringify({ error: errorText }), {
        status: publicRes.status,
      });
    }

    const text = await publicRes.text();
    console.log("[VROOM] Using public API (fallback)");
    return new Response(text, {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("[/api/vroom] proxy error:", err);
    return new Response(
      JSON.stringify({
        error: "Failed to connect to VROOM service (local and public)",
        details: String(err),
      }),
      { status: 500 }
    );
  }
}
