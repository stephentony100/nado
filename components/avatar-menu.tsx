"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { clearStoredSellerId } from "@/lib/seller-client";

function initialsFor(name: string): string {
  const words = name.trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return "?";
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase();
  return (words[0][0] + words[1][0]).toUpperCase();
}

export function AvatarMenu({ sellerName }: { sellerName: string }) {
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function onPointerDown(e: MouseEvent) {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", onPointerDown);
    return () => document.removeEventListener("mousedown", onPointerDown);
  }, [open]);

  function handleLogout() {
    clearStoredSellerId();
    router.push("/");
  }

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label="Account menu"
        className="flex h-[34px] w-[34px] items-center justify-center rounded-full bg-surface font-display text-[13px] font-bold text-accent"
      >
        {initialsFor(sellerName)}
      </button>
      {open && (
        <div className="absolute right-0 top-[42px] z-20 w-[172px] overflow-hidden rounded-xl border border-line bg-white shadow-[0_14px_30px_-12px_rgba(14,21,38,0.35)]">
          <div className="border-b border-line px-3.5 py-2.5">
            <span className="block truncate text-[13px] font-semibold text-text">
              {sellerName}
            </span>
          </div>
          <button
            type="button"
            onClick={handleLogout}
            className="flex w-full items-center px-3.5 py-2.5 text-left text-[13.5px] font-semibold text-over transition-colors hover:bg-bg"
          >
            Log out
          </button>
        </div>
      )}
    </div>
  );
}
