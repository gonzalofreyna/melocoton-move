import type { NextApiRequest, NextApiResponse } from "next";

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  res.status(200).json({
    STRIPE_SECRET_KEY: !!process.env.STRIPE_SECRET_KEY,
    RESEND_API_KEY: !!process.env.RESEND_API_KEY,
    STRIPE_COUPON_ID: !!process.env.STRIPE_COUPON_ID,
    NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY:
      !!process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY,
  });
}
