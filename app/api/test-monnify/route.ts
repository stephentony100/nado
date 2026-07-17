// Phase 1 proof-of-concept: exercises the real Monnify sandbox auth + payment
// flow end to end. Not wired into the invoice UI yet — that's Phase 3.

const MONNIFY_BASE_URL = process.env.MONNIFY_BASE_URL;
const MONNIFY_API_KEY = process.env.MONNIFY_API_KEY;
const MONNIFY_SECRET_KEY = process.env.MONNIFY_SECRET_KEY;
const MONNIFY_CONTRACT_CODE = process.env.MONNIFY_CONTRACT_CODE;

async function getAccessToken(): Promise<string> {
  const credentials = Buffer.from(
    `${MONNIFY_API_KEY}:${MONNIFY_SECRET_KEY}`
  ).toString("base64");

  const res = await fetch(`${MONNIFY_BASE_URL}/api/v1/auth/login`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${credentials}`,
      "Content-Type": "application/json",
    },
  });

  const data = await res.json();

  if (!res.ok || !data?.responseBody?.accessToken) {
    throw new Error(
      `Monnify auth failed: ${res.status} ${JSON.stringify(data)}`
    );
  }

  return data.responseBody.accessToken as string;
}

export async function GET() {
  if (
    !MONNIFY_BASE_URL ||
    !MONNIFY_API_KEY ||
    !MONNIFY_SECRET_KEY ||
    !MONNIFY_CONTRACT_CODE
  ) {
    return Response.json(
      {
        error:
          "Missing one or more Monnify env vars: MONNIFY_BASE_URL, MONNIFY_API_KEY, MONNIFY_SECRET_KEY, MONNIFY_CONTRACT_CODE",
      },
      { status: 500 }
    );
  }

  try {
    const accessToken = await getAccessToken();

    const paymentReference = `oja-test-${Date.now()}`;

    const initRes = await fetch(
      `${MONNIFY_BASE_URL}/api/v1/merchant/transactions/init-transaction`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          amount: 5000,
          customerName: "Test Buyer",
          customerEmail: "test-buyer@example.com",
          paymentReference,
          paymentDescription: "1 carton of Indomie (test invoice)",
          currencyCode: "NGN",
          contractCode: MONNIFY_CONTRACT_CODE,
          redirectUrl: `${process.env.NEXT_PUBLIC_APP_URL}/`,
          paymentMethods: ["CARD", "ACCOUNT_TRANSFER"],
        }),
      }
    );

    const initData = await initRes.json();

    return Response.json({
      ok: initRes.ok && initData?.requestSuccessful === true,
      paymentLink: initData?.responseBody?.checkoutUrl ?? null,
      monnifyResponse: initData,
    });
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}
