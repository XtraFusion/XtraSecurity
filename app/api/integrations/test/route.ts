import { NextRequest, NextResponse } from "next/server";
import { verifyAuth } from "@/lib/server-auth";

export async function POST(req: Request) {
  try {
    const auth = await verifyAuth(req);
    if (!auth?.userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const { provider, config } = body;

    if (provider === "github") {
      const token = config?.token;
      if (!token) return NextResponse.json({ ok: false, error: "token required" }, { status: 400 });

      const resp = await fetch("https://api.github.com/user", {
        headers: { Authorization: `token ${token}`, Accept: "application/vnd.github.v3+json" },
      });
      if (resp.status === 200) return NextResponse.json({ ok: true });
      const text = await resp.text();
      return NextResponse.json({ ok: false, status: resp.status, text }, { status: 200 });
    }

    if (provider === "aws") {
      // Simple validation: ensure accessKeyId and secretAccessKey provided. Deep validation would call AWS STS.
      const { accessKeyId, secretAccessKey } = config || {};
      if (!accessKeyId || !secretAccessKey) return NextResponse.json({ ok: false, error: "credentials required" }, { status: 400 });
      // Optionally, we could call STS GetCallerIdentity here if AWS SDK available.
      return NextResponse.json({ ok: true });
    }

    return NextResponse.json({ ok: false, error: "unknown provider" }, { status: 400 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ ok: false, error: "test failed" }, { status: 500 });
  }
}
