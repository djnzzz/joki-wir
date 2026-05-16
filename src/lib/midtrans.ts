import MidtransClient from "midtrans-client";
import crypto from "crypto";

export const snap = new MidtransClient.Snap({
  isProduction: process.env.MIDTRANS_IS_PRODUCTION === "true",
  serverKey: process.env.MIDTRANS_SERVER_KEY!,
  clientKey: process.env.MIDTRANS_CLIENT_KEY!,
});

export function verifyMidtransSignature(
  orderId: string,
  statusCode: string,
  grossAmount: string,
  signatureKey: string,
): boolean {
  const serverKey = process.env.MIDTRANS_SERVER_KEY!;

  const hash = crypto
    .createHash("sha512")
    .update(`${orderId}${statusCode}${grossAmount}${serverKey}`)
    .digest("hex");

  return hash === signatureKey;
}
