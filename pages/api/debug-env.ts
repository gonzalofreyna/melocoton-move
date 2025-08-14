// pages/api/debug-env.ts
import type { NextApiRequest, NextApiResponse } from "next";

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  res.status(200).json({
    STRIPE_SECRET_KEY: !!process.env.STRIPE_SECRET_KEY,
    RESEND_API_KEY: !!process.env.RESEND_API_KEY,
    STRIPE_COUPON_ID: !!process.env.STRIPE_COUPON_ID,
    NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY:
      !!process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY,
    TO_EMAIL: !!process.env.TO_EMAIL,
    NEXT_PUBLIC_COUPON_CODE: !!process.env.NEXT_PUBLIC_COUPON_CODE,
    NEXT_PUBLIC_COUPON_PERCENT: !!process.env.NEXT_PUBLIC_COUPON_PERCENT,
    NEXT_PUBLIC_CONFIG_URL: !!process.env.NEXT_PUBLIC_CONFIG_URL,
    STRIPE_WEBHOOK_SECRET: !!process.env.STRIPE_WEBHOOK_SECRET, // opcional
  });
}
