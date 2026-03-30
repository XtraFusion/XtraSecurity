import { NextRequest, NextResponse } from "next/server";
import { verifyAuth } from "@/lib/server-auth";
import { getDailyUsageCount } from "@/lib/usage";

export async function GET(req: NextRequest) {
  try {
    const auth = await verifyAuth(req);
    if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const dailyEvents = await getDailyUsageCount(auth.userId);

    return NextResponse.json({
        dailyEvents,
        totalEvents: 0, // Deprecated in favor of dailyEvents for extension display
        criticalEvents: 0,
        failedActions: 0,
        activeUsers: 1
    });

  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Failed to fetch stats' }, { status: 500 });
  }
}
