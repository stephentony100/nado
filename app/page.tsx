import { redirect } from "next/navigation";
import { LandingPage } from "@/components/landing-page";
import { getSellerIdFromCookie } from "@/lib/seller-server";

export const dynamic = "force-dynamic";

export default async function RootPage() {
  const sellerId = await getSellerIdFromCookie();
  if (sellerId) {
    redirect("/chat");
  }
  return <LandingPage />;
}
