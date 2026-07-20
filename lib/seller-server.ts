import { cookies } from "next/headers";

const KEY = "nado_seller_id";

export async function getSellerIdFromCookie(): Promise<string | null> {
  const store = await cookies();
  return store.get(KEY)?.value ?? null;
}
