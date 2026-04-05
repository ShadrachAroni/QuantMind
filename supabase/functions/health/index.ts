import "jsr:@supabase/functions-js/edge-runtime.d.ts";

Deno.serve((_req: Request) => {
  return new Response(
    JSON.stringify({ status: "ok", timestamp: new Date().toISOString() }),
    { 
      headers: { "Content-Type": "application/json" },
      status: 200 
    },
  );
});
