import crypto from "crypto";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const name = typeof body?.name === "string" ? body.name.trim() : "";
  const phoneInput = typeof body?.phone === "string" ? body.phone.trim() : "";

  if (!name) {
    return Response.json({ error: "Store name is required" }, { status: 400 });
  }

  // phone is unique in the schema; generate a placeholder when the seller
  // skips it rather than requiring one.
  const phone = phoneInput || `unset-${crypto.randomUUID()}`;

  const seller = await prisma.seller.create({
    data: { name, phone },
  });

  return Response.json({
    ok: true,
    seller: { id: seller.id, name: seller.name },
  });
}
