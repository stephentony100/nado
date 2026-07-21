"use client";

import Link from "next/link";
import { useRef, useState } from "react";
import { DocumentCard, type DocumentData } from "@/components/document-card";
import { renderAndShare } from "@/lib/document-export";

// Must match LINK_MAX_AGE_MS in app/api/invoices/[id]/link/route.ts — kept
// in sync manually since this is the client-side mirror of that check.
const LINK_MAX_AGE_MS = 30 * 60 * 1000;

async function copyToClipboard(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}

export function CopyLinkAction({
  invoiceId,
  link,
  linkGeneratedAt,
}: {
  invoiceId: string;
  link: string | null;
  linkGeneratedAt: string | null;
}) {
  const [state, setState] = useState<"idle" | "copying" | "copied" | "error">(
    "idle"
  );
  const [manualLink, setManualLink] = useState<string | null>(null);
  const manualInputRef = useRef<HTMLInputElement>(null);

  const isStale =
    !link ||
    !linkGeneratedAt ||
    Date.now() - new Date(linkGeneratedAt).getTime() > LINK_MAX_AGE_MS;

  function showManualFallback(value: string) {
    setManualLink(value);
    // Focus+select on the next tick so the input exists in the DOM first.
    setTimeout(() => manualInputRef.current?.select(), 0);
  }

  async function handleClick() {
    if (state === "copying") return;
    setManualLink(null);

    if (!isStale && link) {
      // Fast path — the link is already known and fresh, so the clipboard
      // write is the very first thing that happens after the click, with
      // no await ahead of it. That's what keeps it inside the browser's
      // "recent user gesture" window; a network round-trip first is what
      // was causing "Couldn't copy" on real phones.
      const ok = await copyToClipboard(link);
      if (ok) {
        setState("copied");
        setTimeout(() => setState("idle"), 2000);
      } else {
        showManualFallback(link);
      }
      return;
    }

    // Slow path — link missing or stale (rare: first tap on an invoice
    // whose link expired from disuse). This necessarily needs a network
    // round-trip before we know what to copy, so the clipboard call here
    // is best-effort; the manual fallback below covers it if the browser
    // refuses the write after the delay.
    setState("copying");
    try {
      const res = await fetch(`/api/invoices/${invoiceId}/link`, {
        method: "POST",
      });
      const data = await res.json();
      if (!res.ok || !data.link) throw new Error(data.error);
      const ok = await copyToClipboard(data.link);
      if (ok) {
        setState("copied");
        setTimeout(() => setState("idle"), 2000);
      } else {
        showManualFallback(data.link);
        setState("idle");
      }
    } catch {
      setState("error");
      setTimeout(() => setState("idle"), 2000);
    }
  }

  const label =
    state === "copying"
      ? "Copying…"
      : state === "copied"
        ? "Copied!"
        : state === "error"
          ? "Couldn't copy"
          : "Copy payment link";

  if (manualLink) {
    return (
      <div className="flex items-center gap-1.5">
        <input
          ref={manualInputRef}
          readOnly
          value={manualLink}
          onFocus={(e) => e.currentTarget.select()}
          className="w-[110px] rounded-md border border-line bg-bg px-1.5 py-1 font-mono text-[10px] text-text outline-none"
        />
        <button
          type="button"
          onClick={() => setManualLink(null)}
          className="text-[11px] font-bold text-muted"
        >
          Done
        </button>
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      className="text-[12.5px] font-bold text-pending"
    >
      {label}
    </button>
  );
}

export function ViewReceiptAction({ invoiceId }: { invoiceId: string }) {
  return (
    <Link href={`/receipt/${invoiceId}`} className="text-[12.5px] font-bold text-paid">
      View receipt
    </Link>
  );
}

// Secondary action on every chat card, regardless of status: always
// downloads the neutral, unstamped invoice document (never the PAID
// stamp/Settled pill) — a seller may want to share a clean reference copy
// of what was ordered without disclosing to a third party that it was
// already paid for. The stamped document is only ever reachable via
// "View receipt" on Paid cards. Renders the exportable document off-screen
// so it never appears in the feed itself.
export function DownloadDocumentAction({
  invoice,
  sellerName,
}: {
  invoice: DocumentData;
  sellerName: string;
}) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [busy, setBusy] = useState(false);

  async function handleClick() {
    if (!cardRef.current || busy) return;
    setBusy(true);
    try {
      const invoiceCode = invoice.id.slice(-6).toUpperCase();
      const filename = `nado-invoice-${invoiceCode}.png`;
      await renderAndShare(cardRef.current, filename, `Nado invoice #${invoiceCode}`);
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={handleClick}
        disabled={busy}
        className="inline-flex items-center gap-1.5 rounded-lg border border-line bg-white px-2.5 py-1.5 text-[11.5px] font-bold text-muted transition-colors hover:border-muted/40 hover:bg-bg active:bg-line disabled:opacity-60"
      >
        <span className="block h-[11px] w-[10px] rounded-b-[3px] border-[1.5px] border-t-0 border-muted" />
        {busy ? "Preparing…" : "Invoice"}
      </button>
      <div className="pointer-events-none fixed left-[-9999px] top-0">
        <DocumentCard ref={cardRef} invoice={invoice} paid={false} sellerName={sellerName} />
      </div>
    </>
  );
}
