import Anthropic from "@anthropic-ai/sdk";
import { parseOrderText } from "@/lib/parser";

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const text = body?.text;

  if (typeof text !== "string" || !text.trim()) {
    return Response.json({ error: "Missing order text" }, { status: 400 });
  }
  if (text.length > 2000) {
    return Response.json({ error: "Order text is too long" }, { status: 400 });
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return Response.json({ error: "Missing ANTHROPIC_API_KEY" }, { status: 500 });
  }

  try {
    const client = new Anthropic({ apiKey });
    const parsed = await parseOrderText(client, text.trim());
    return Response.json(parsed);
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}
