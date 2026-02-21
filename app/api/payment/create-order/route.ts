import { NextResponse } from 'next/server';
import Razorpay from 'razorpay';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

const razorpay = new Razorpay({
  key_id: process.env.RAZORRPAY_ID!,
  key_secret: process.env.RAZORRPAY_SECRET!,
});

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { tier, promoCode } = await req.json();
    
    // Validate Tier
    if (tier !== 'pro') {
        return NextResponse.json({ error: 'Only Pro tier is available for online checkout' }, { status: 400 });
    }

    // Pro is $9, which is roughly 750 INR. Amount is in paise, so 75000 paise.
    let amount = 75000; 
    let promoMessage = "";

    // Apply promo code logic
    if (promoCode) {
        if (promoCode === "XTRA100" || promoCode === "FREEPRO") {
            // 100% off
            amount = 0;
            promoMessage = "100% discount applied! Plan is now free.";
        } else if (promoCode === "XTRA50") {
            // 50% off of 75000 paise
            amount = 37500;
            promoMessage = "50% discount applied! Proceeding with discounted price ($4.50).";
        } else {
             promoMessage = "Invalid promo code. Proceeding with original price.";
        }
    }

    if (amount === 0) {
        return NextResponse.json({ isFree: true, promoMessage }, { status: 200 });
    }

    const options = {
      amount,
      currency: 'INR',
      receipt: `receipt_${Date.now()}_${tier}`,
    };

    const order = await razorpay.orders.create(options);

    return NextResponse.json({ order, isFree: false, promoMessage }, { status: 200 });
  } catch (error) {
    console.error('Error creating Razorpay order:', error);
    return NextResponse.json({ error: 'Failed to create order' }, { status: 500 });
  }
}
