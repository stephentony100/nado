const KEY = "nado_seller_id";

// localStorage is the source of truth for the seller's identity on this
// device. We also mirror it into a cookie purely so Server Components can
// read it on the initial request (localStorage isn't available server-side)
// — invoices themselves are never stored here, only this id.
export function getStoredSellerId(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(KEY);
}

export function setStoredSellerId(id: string) {
  localStorage.setItem(KEY, id);
  document.cookie = `${KEY}=${id}; path=/; max-age=31536000; samesite=lax`;
}

export function clearStoredSellerId() {
  localStorage.removeItem(KEY);
  document.cookie = `${KEY}=; path=/; max-age=0`;
}
