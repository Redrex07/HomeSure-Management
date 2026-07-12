import { createHmac, timingSafeEqual } from "node:crypto";
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const orderSchema = z.object({
  amount: z.number().positive(),
  currency: z.string().length(3).default("INR"),
  receipt: z.string().min(1).max(40),
  notes: z.record(z.string()).optional(),
});

const verifySchema = z.object({
  razorpay_order_id: z.string().min(1),
  razorpay_payment_id: z.string().min(1),
  razorpay_signature: z.string().min(1),
});

function getRazorpayCredentials() {
  const keyId = process.env.RAZORPAY_KEY_ID || process.env.VITE_RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_KEY_SECRET;

  if (!keyId || !keySecret) {
    throw new Error("Missing Razorpay credentials. Set RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET on the server.");
  }

  return { keyId, keySecret };
}

export const createRazorpayOrder = createServerFn({ method: "POST" })
  .inputValidator(orderSchema)
  .handler(async ({ data }) => {
    const { keyId, keySecret } = getRazorpayCredentials();
    const response = await fetch("https://api.razorpay.com/v1/orders", {
      method: "POST",
      headers: {
        authorization: `Basic ${Buffer.from(`${keyId}:${keySecret}`).toString("base64")}`,
        "content-type": "application/json",
      },
      body: JSON.stringify({
        amount: Math.round(data.amount),
        currency: data.currency,
        receipt: data.receipt,
        notes: data.notes || {},
      }),
    });

    const body = await response.json();
    if (!response.ok) {
      throw new Error(body?.error?.description || "Unable to create Razorpay order.");
    }

    return {
      keyId,
      orderId: body.id as string,
      amount: body.amount as number,
      currency: body.currency as string,
    };
  });

export const verifyRazorpayPayment = createServerFn({ method: "POST" })
  .inputValidator(verifySchema)
  .handler(async ({ data }) => {
    const { keySecret } = getRazorpayCredentials();
    const expected = createHmac("sha256", keySecret)
      .update(`${data.razorpay_order_id}|${data.razorpay_payment_id}`)
      .digest("hex");

    const expectedBuffer = Buffer.from(expected);
    const actualBuffer = Buffer.from(data.razorpay_signature);
    const valid =
      expectedBuffer.length === actualBuffer.length &&
      timingSafeEqual(expectedBuffer, actualBuffer);

    if (!valid) {
      throw new Error("Razorpay signature verification failed.");
    }

    return { success: true };
  });
