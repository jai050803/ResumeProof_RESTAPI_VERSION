import { createHmac, timingSafeEqual } from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { updateCandidateByTrackingId, getCandidateByTrackingId } from "@/lib/candidates";
import { VerificationResult } from "@/lib/types";

export const runtime = "nodejs";

function verifySignature(rawBody: string, signature: string, secret: string): boolean {
  const expected = createHmac("sha256", secret).update(rawBody).digest("hex");
  try {
    return timingSafeEqual(Buffer.from(expected), Buffer.from(signature));
  } catch {
    return false;
  }
}

export async function POST(req: NextRequest) {
  const secret = process.env.WEBHOOK_SECRET;
  if (!secret) {
    return NextResponse.json({ error: "Webhook secret not configured" }, { status: 500 });
  }

  const rawBody = await req.text();
  const signature = req.headers.get("x-rp-signature") ?? "";

  if (!verifySignature(rawBody, signature, secret)) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  let body: { event: string; data: Record<string, unknown> };
  try {
    body = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (body.event === "verification.completed") {
    const data = body.data as any;

    // aiAnalysis and rawGithubData may come as JSON strings from ms1 (Prisma String? columns)
    let aiAnalysis = data.aiAnalysis;
    let rawGithubData = data.rawGithubData;
    if (typeof aiAnalysis === "string") {
      try { aiAnalysis = JSON.parse(aiAnalysis); } catch { aiAnalysis = null; }
    }
    if (typeof rawGithubData === "string") {
      try { rawGithubData = JSON.parse(rawGithubData); } catch { rawGithubData = null; }
    }

    const result: VerificationResult = {
      id: data.id as string,
      transactionId: data.transactionId,
      confidenceScore: data.confidenceScore as number,
      status: data.status as VerificationResult["status"],
      githubUsername: data.githubUsername as string,
      reposFound: data.reposFound as number,
      claimedProjects: data.claimedProjects as number,
      verifiedProjects: data.verifiedProjects as number,
      commitAuthorship: data.commitAuthorship as boolean,
      skillAlignment: data.skillAlignment as number,
      matchedSkills: (data.matchedSkills as string[]) ?? [],
      missingSkills: (data.missingSkills as string[]) ?? [],
      flags: (data.flags as string[]) ?? [],
      aiAnalysis: aiAnalysis as VerificationResult["aiAnalysis"],
      rawGithubData: rawGithubData as Record<string, unknown> | null,
      createdAt: data.createdAt as string,
    };

    // Find candidate by transactionId
    const candidate = await getCandidateByTrackingId(data.transactionId);

    if (candidate) {
      await updateCandidateByTrackingId(data.transactionId, {
        verificationStatus: result.status,
        verificationResult: result,
        verifiedAt: new Date().toISOString(),
      });
    }
    // Even if not found locally, we accept the webhook gracefully
  }

  return NextResponse.json({ received: true }, { status: 200 });
}
