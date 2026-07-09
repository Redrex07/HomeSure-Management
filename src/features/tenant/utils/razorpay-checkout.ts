import { createRazorpayOrder, verifyRazorpayPayment } from "@/core/api/razorpay.functions";

declare global {
  interface Window {
    Razorpay?: new (options: Record<string, unknown>) => {
      open: () => void;
      on: (event: string, callback: (response: any) => void) => void;
    };
  }
}

function loadRazorpayScript(): Promise<boolean> {
  if (typeof window === "undefined") return Promise.resolve(false);
  if (window.Razorpay) return Promise.resolve(true);

  return new Promise((resolve) => {
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
}

export interface PayRentOptions {
  amountInRupees: number;
  receipt: string;
  tenantName: string;
  tenantEmail: string;
  tenantPhone?: string;
  description?: string;
  onSuccess: (paymentId: string, orderId: string) => void | Promise<void>;
  onFailure?: (message: string) => void;
}

export async function openRazorpayCheckout(options: PayRentOptions) {
  const loaded = await loadRazorpayScript();
  if (!loaded || !window.Razorpay) {
    options.onFailure?.("Unable to load Razorpay checkout.");
    return;
  }

  const amountPaise = Math.round(options.amountInRupees * 100);
  const order = await createRazorpayOrder({
    data: {
      amount: amountPaise,
      currency: "INR",
      receipt: options.receipt.slice(0, 40),
      notes: { description: options.description || "Rent payment" },
    },
  });

  return new Promise<void>((resolve) => {
    const RazorpayCheckout = window.Razorpay;
    if (!RazorpayCheckout) {
      options.onFailure?.("Unable to load Razorpay checkout.");
      resolve();
      return;
    }

    const rzp = new RazorpayCheckout({
      key: order.keyId,
      amount: order.amount,
      currency: order.currency,
      name: "HomeSure",
      description: options.description || "Rent payment",
      order_id: order.orderId,
      prefill: {
        name: options.tenantName,
        email: options.tenantEmail,
        contact: options.tenantPhone || "",
      },
      theme: { color: "#4f46e5" },
      handler: async (response: {
        razorpay_payment_id: string;
        razorpay_order_id: string;
        razorpay_signature: string;
      }) => {
        try {
          await verifyRazorpayPayment({
            data: {
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
            },
          });
          await options.onSuccess(response.razorpay_payment_id, response.razorpay_order_id);
        } catch (err) {
          const message = err instanceof Error ? err.message : "Payment verification failed.";
          options.onFailure?.(message);
        } finally {
          resolve();
        }
      },
      modal: {
        ondismiss: () => resolve(),
      },
    });

    rzp.open();
  });
}
