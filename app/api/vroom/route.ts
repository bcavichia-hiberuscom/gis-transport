// src/app/api/vroom/route.ts
export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    const body = await req.json();

    console.log("📤 Enviando a VROOM:", JSON.stringify(body, null, 2));

    // Conecta al puerto 3001 que Docker mapea al contenedor

    const vroomRes = await fetch("http://localhost:3002", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    if (!vroomRes.ok) {
      const errorText = await vroomRes.text();
      console.error("❌ VROOM error:", vroomRes.status, errorText);
      return new Response(JSON.stringify({ error: errorText }), {
        status: vroomRes.status,
      });
    }

    const text = await vroomRes.text();
    console.log("✅ VROOM respuesta:", text);

    return new Response(text, {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("💥 [/api/vroom] proxy error:", err);
    return new Response(
      JSON.stringify({
        error: "Failed to connect to VROOM service",
        details: String(err),
      }),
      { status: 500 }
    );
  }
}
