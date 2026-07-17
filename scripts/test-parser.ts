// Phase 1 proof-of-concept: exercises the Claude API's ability to parse raw,
// informal order text into structured line items. Standalone script, not
// wired into the chat UI yet — that's Phase 2. Run with:
//   pnpm exec tsx scripts/test-parser.ts

import "dotenv/config";
import Anthropic from "@anthropic-ai/sdk";

export const PARSER_SYSTEM_PROMPT = `You parse informal Nigerian seller order text into structured invoice line items.

Input is a single raw message a seller typed describing an order (items, quantities, prices, sometimes delivery). Prices may be written as "5k" (5,000), "45k" (45,000), "1k" (1,000), or plain numbers. Quantities may be words ("half bag") or numbers. Not every item has a stated price or quantity unit.

Respond with ONLY a JSON object matching this exact shape, no prose:

{
  "items": [
    {
      "name": string,           // the item name, cleaned up (e.g. "Indomie", "rice")
      "quantity": number,       // best-guess numeric quantity; use 1 if not stated
      "unit": string | null,    // e.g. "carton", "bag", "crate", "sachet", "bottle", "gallon", "pack", "tin"; null if not applicable
      "unit_price": number | null,   // price per unit in naira; null if not stated
      "line_total": number | null    // unit_price * quantity if computable, or a stated flat price for the line; null if unknown
    }
  ],
  "subtotal_known": boolean,       // true only if every item has a computable line_total
  "items_missing_price": string[]  // names of items with no price information at all
}

Rules:
- "delivery" or "transport" charges are their own line item with name "Delivery" or "Transport", quantity 1, unit null.
- If a price applies to multiple items jointly (e.g. "2 indomie carton" with no price after an earlier priced item), leave unit_price and line_total null for that item and add it to items_missing_price.
- Never invent a price that was not stated or cannot be derived from the text.
- "k" suffix means multiply by 1000 (e.g. "8k" = 8000, "45k" = 45000).
- Output must be valid JSON and nothing else.`;

interface ParsedLineItem {
  name: string;
  quantity: number;
  unit: string | null;
  unit_price: number | null;
  line_total: number | null;
}

interface ParsedInvoice {
  items: ParsedLineItem[];
  subtotal_known: boolean;
  items_missing_price: string[];
}

const TEST_ORDERS: string[] = [
  "5 cartons of Indomie, 2 bags of rice, delivery 5,000",
  "3 crates eggs 2500 each, transport 1k",
  "1 bag rice 45k, 2 indomie carton",
  "2 bottles groundnut oil 3500, 1 bag beans",
  "10 sachets pure water 50 each",
  "small rice for 3, big rice for 2, delivery 2k",
  "1 carton milo, half bag sugar 8000",
  "5kg tomatoes 4000, pepper 1500, onions",
  "2 gallons palm oil 6000 each plus delivery",
  "1 bag cement 8500",
  "3 packs spaghetti 500 each, 2 tin tomato paste",
  "assorted drinks worth 15000, cups 1000",
];

const OUTPUT_SCHEMA = {
  type: "object",
  properties: {
    items: {
      type: "array",
      items: {
        type: "object",
        properties: {
          name: { type: "string" },
          quantity: { type: "number" },
          unit: { type: ["string", "null"] },
          unit_price: { type: ["number", "null"] },
          line_total: { type: ["number", "null"] },
        },
        required: ["name", "quantity", "unit", "unit_price", "line_total"],
        additionalProperties: false,
      },
    },
    subtotal_known: { type: "boolean" },
    items_missing_price: { type: "array", items: { type: "string" } },
  },
  required: ["items", "subtotal_known", "items_missing_price"],
  additionalProperties: false,
} as const;

async function parseOrder(
  client: Anthropic,
  rawInput: string
): Promise<ParsedInvoice> {
  const response = await client.messages.create({
    model: "claude-opus-4-8",
    max_tokens: 2048,
    thinking: { type: "adaptive" },
    system: PARSER_SYSTEM_PROMPT,
    messages: [{ role: "user", content: rawInput }],
    output_config: {
      format: { type: "json_schema", schema: OUTPUT_SCHEMA },
    },
  });

  const textBlock = response.content.find((b) => b.type === "text");
  if (!textBlock || textBlock.type !== "text") {
    throw new Error("No text content in response");
  }

  return JSON.parse(textBlock.text) as ParsedInvoice;
}

async function main() {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    console.error("Missing ANTHROPIC_API_KEY in environment.");
    process.exit(1);
  }

  const client = new Anthropic({ apiKey });

  let fullyResolved = 0;
  let missingPrices = 0;
  const flagged: string[] = [];

  for (let i = 0; i < TEST_ORDERS.length; i++) {
    const rawInput = TEST_ORDERS[i];
    console.log(`\n${"=".repeat(70)}`);
    console.log(`[${i + 1}/${TEST_ORDERS.length}] RAW INPUT: ${rawInput}`);
    console.log("-".repeat(70));

    try {
      const parsed = await parseOrder(client, rawInput);
      console.log("PARSED:", JSON.stringify(parsed, null, 2));

      if (parsed.subtotal_known) {
        fullyResolved++;
      }
      if (parsed.items_missing_price.length > 0) {
        missingPrices++;
      }

      // Heuristic sanity flags — not exhaustive, just surfaces obvious misses.
      if (parsed.items.length === 0) {
        flagged.push(`#${i + 1}: parsed zero items`);
      }
      for (const item of parsed.items) {
        if (item.quantity <= 0) {
          flagged.push(`#${i + 1}: "${item.name}" has non-positive quantity`);
        }
        if (
          item.unit_price !== null &&
          item.quantity !== null &&
          item.line_total !== null &&
          Math.abs(item.unit_price * item.quantity - item.line_total) > 1
        ) {
          flagged.push(
            `#${i + 1}: "${item.name}" line_total doesn't match unit_price * quantity`
          );
        }
      }
    } catch (error) {
      console.error("ERROR:", error instanceof Error ? error.message : error);
      flagged.push(
        `#${i + 1}: threw an error — ${
          error instanceof Error ? error.message : String(error)
        }`
      );
    }
  }

  console.log(`\n${"=".repeat(70)}`);
  console.log("ACCURACY SUMMARY");
  console.log("=".repeat(70));
  console.log(
    `Fully resolved to a total: ${fullyResolved}/${TEST_ORDERS.length}`
  );
  console.log(
    `Left items with missing prices: ${missingPrices}/${TEST_ORDERS.length}`
  );
  if (flagged.length > 0) {
    console.log(`\nFlagged as possibly wrong (${flagged.length}):`);
    for (const f of flagged) console.log(`  - ${f}`);
  } else {
    console.log("\nNo automatic flags raised — manually review the parses above.");
  }
}

main();
