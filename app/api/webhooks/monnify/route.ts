import { prisma } from "@/lib/prisma";
import { verifyWebhookSignature } from "@/lib/monnify";
import { toNaira } from "@/lib/invoice";

interface MonnifyWebhookPayload {
  eventType?: string;
  eventData?: {
    paymentReference?: string;
    transactionReference?: string;
    paymentStatus?: string;
    paidOn?: string;
    amountPaid?: number;
    totalPayable?: number;
  };
}

export async function POST(request: Request) {
  const rawBody = await request.text();
  const signature = request.headers.get("monnify-signature");

  // Log raw evidence before any verification/parsing decision, so a rejected
  // or mismatched request still leaves a trace to debug from. The explicit
  // present/absent line exists to answer, from real sandbox traffic, whether
  // Monnify actually sends this header at all — verifyWebhookSignature
  // hard-rejects (401, no invoice update) whenever it's missing, so if the
  // sandbox never sends it, every webhook silently fails closed and the app
  // only ever gets Paid status via the client-side polling fallback.
  console.log(
    "[monnify-webhook] monnify-signature header present:",
    signature !== null,
    "| all header names received:",
    Array.from(request.headers.keys())
  );
  console.log(
    "[monnify-webhook] raw body:",
    rawBody,
    "| monnify-signature header:",
    signature
  );

  if (!verifyWebhookSignature(rawBody, signature)) {
    console.warn("[monnify-webhook] rejected: missing or invalid signature");
    return new Response("Invalid signature", { status: 401 });
  }

  let payload: MonnifyWebhookPayload;
  try {
    payload = JSON.parse(rawBody);
  } catch {
    return new Response("Invalid payload", { status: 400 });
  }

  console.log(
    "[monnify-webhook] verified event",
    payload.eventType,
    "at",
    new Date().toISOString()
  );

  const eventData = payload.eventData;
  if (
    payload.eventType === "SUCCESSFUL_TRANSACTION" &&
    eventData?.paymentStatus === "PAID" &&
    eventData.paymentReference
  ) {
    const reference = eventData.paymentReference;

    // Match on the current reference, or one superseded by a silent link
    // refresh — a buyer can complete payment on an old link in the window
    // before/during a refresh, and that reference is still legitimately ours.
    const invoice = await prisma.invoice.findFirst({
      where: {
        OR: [
          { monnifyReference: reference },
          { previousMonnifyReferences: { has: reference } },
        ],
      },
    });

    if (!invoice) {
      console.warn("[monnify-webhook] no invoice matched reference", reference);
      return new Response("OK", { status: 200 });
    }

    const paidAmount = eventData.amountPaid ?? eventData.totalPayable;
    const expectedAmount = toNaira(invoice.total);
    if (paidAmount == null || Math.abs(paidAmount - expectedAmount) > 0.01) {
      console.warn(
        "[monnify-webhook] amount mismatch for invoice",
        invoice.id,
        "expected",
        expectedAmount,
        "got",
        paidAmount
      );
      return new Response("OK", { status: 200 });
    }

    const paidOn = eventData.paidOn ? new Date(eventData.paidOn) : new Date();

    await prisma.invoice.update({
      where: { id: invoice.id },
      data: {
        status: "PAID",
        paidAt: isNaN(paidOn.getTime()) ? new Date() : paidOn,
      },
    });

    console.log("[monnify-webhook] marked invoice", invoice.id, "as Paid");
  }

  return new Response("OK", { status: 200 });
}
