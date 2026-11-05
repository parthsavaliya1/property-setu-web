import { useEffect, useRef, useState } from "react";
import { productRequest, topUpWallet, type PaymentResult } from "@/lib/explorer";
import { useProduct } from "./context";
/** Retain successful gateway callbacks until the server confirms the wallet credit. */
export function useWalletTopUp() {
  const app = useProduct();
  const key = `propertysetu_pending_payment:${app.session?.user.id}`;
  const [pending, setPending] = useState<PaymentResult | null>(null);
  const proofRef = useRef<PaymentResult | null>(null);
  const locked = useRef(false);
  useEffect(() => {
    let proof: PaymentResult | null = null;
    try {
      const raw = sessionStorage.getItem(key);
      if (raw) {
        const next = JSON.parse(raw) as PaymentResult;
        if (next.razorpay_payment_id && next.razorpay_order_id && next.razorpay_signature)
          proof = next;
      }
    } catch {
      /* Keep a new callback in memory if storage is unavailable. */
    }
    proofRef.current = proof;
    setPending(proof);
  }, [key]);
  function remember(proof: PaymentResult) {
    proofRef.current = proof;
    setPending(proof);
    try {
      sessionStorage.setItem(key, JSON.stringify(proof));
    } catch {
      /* The current session can still retry verification. */
    }
  }
  async function topUp(amount: number) {
    if (!app.token) throw new Error("Sign in to add money to your wallet.");
    if (locked.current) throw new Error("A wallet payment is already in progress.");
    locked.current = true;
    try {
      const result = proofRef.current
        ? await productRequest<{ ok: boolean; balance: number }>(
            "/wallet/verify",
            app.token,
            "POST",
            proofRef.current,
          )
        : await topUpWallet(amount, app.token, remember);
      if (result.ok !== true || !Number.isFinite(Number(result.balance)))
        throw new Error(
          "Payment verification is incomplete. Retry verification before paying again.",
        );
      proofRef.current = null;
      setPending(null);
      try {
        sessionStorage.removeItem(key);
      } catch {
        /* The verified in-memory state is already cleared. */
      }
      app.changed();
      return { balance: Number(result.balance) };
    } finally {
      locked.current = false;
    }
  }
  return { pending, topUp };
}
