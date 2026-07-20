import { NextRequest, NextResponse } from "next/server";
import { v4 as uuidv4 } from "uuid";
import { appendCandidate } from "@/lib/candidates";

export const runtime = "nodejs";

const ROLES = [
  "Software Engineer",
  "Backend Engineer",
  "Frontend Engineer",
  "Full Stack Engineer",
  "Data Engineer",
];

export async function POST(req: NextRequest) {
  const apiKey = process.env.RESUMEPROOF_API_KEY;
  const apiUrl = process.env.RESUMEPROOF_API_URL ?? "https://api.resumeproof.online";
  const appUrl = process.env.NEXT_PUBLIC_APP_URL;

  if (!apiKey) {
    return NextResponse.json({ error: "API key not configured" }, { status: 500 });
  }

  let formData: FormData;
  try {
    formData = await req.formData();
  } catch {
    return NextResponse.json({ error: "Invalid form data" }, { status: 400 });
  }

  const name = formData.get("name") as string;
  const email = formData.get("email") as string;
  const phone = (formData.get("phone") as string) || undefined;
  const role = formData.get("role") as string;
  const githubUsername = formData.get("githubUsername") as string;
  const linkedinUrl = (formData.get("linkedinUrl") as string) || undefined;
  const resumeFile = formData.get("resume") as File | null;
  const coverNote = (formData.get("coverNote") as string) || undefined;

  // Validation
  if (!name || !email || !role || !githubUsername || !resumeFile) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }
  if (!ROLES.includes(role)) {
    return NextResponse.json({ error: "Invalid role" }, { status: 400 });
  }
  if (resumeFile.size > 5 * 1024 * 1024) {
    return NextResponse.json({ error: "Resume too large (max 5MB)" }, { status: 400 });
  }

  // Forward to ResumeProof API
  const rpFormData = new FormData();
  rpFormData.append("resume", resumeFile);
  rpFormData.append("githubUsername", githubUsername);
  if (linkedinUrl) rpFormData.append("linkedinUrl", linkedinUrl);
  if (appUrl) rpFormData.append("webhookUrl", `${appUrl}/api/webhook`);

  let trackingId: string;
  try {
    const rpRes = await fetch(`${apiUrl}/v1/verify`, {
      method: "POST",
      headers: { "x-api-key": apiKey },
      body: rpFormData,
    });

    if (!rpRes.ok) {
      const errText = await rpRes.text();
      console.error("ResumeProof API error:", errText);
      return NextResponse.json(
        { error: "Verification service error", detail: errText },
        { status: 502 }
      );
    }

    const rpJson = await rpRes.json();
    trackingId = rpJson.trackingId ?? rpJson.transactionId ?? uuidv4();
  } catch (e) {
    console.error("Failed to call ResumeProof API:", e);
    return NextResponse.json({ error: "Could not reach verification service" }, { status: 502 });
  }

  // Persist candidate locally
  appendCandidate({
    id: uuidv4(),
    name,
    email,
    phone,
    role,
    githubUsername,
    linkedinUrl,
    trackingId,
    verificationStatus: "pending",
    verificationResult: null,
    verifiedAt: null,
    appliedAt: new Date().toISOString(),
  });

  return NextResponse.json({ success: true, trackingId });
}
