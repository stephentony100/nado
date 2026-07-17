// Phase 1 proof-of-concept: confirms Monnify can reach this deployment and
// that webhook payloads show up in Vercel's function logs. Signature
// verification and DB updates land in Phase 3.

export async function POST(request: Request) {
  const rawBody = await request.text();

  let payload: unknown = rawBody;
  try {
    payload = JSON.parse(rawBody);
  } catch {
    // Not JSON — log the raw text as-is.
  }

  console.log(
    "[monnify-webhook] received at",
    new Date().toISOString(),
    JSON.stringify(payload, null, 2)
  );

  return new Response("OK", { status: 200 });
}
