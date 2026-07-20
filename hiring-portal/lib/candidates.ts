import fs from "fs";
import path from "path";
import { Candidate } from "./types";

const DATA_FILE = path.join(process.cwd(), "data", "candidates.json");

function ensureDataFile() {
  const dir = path.dirname(DATA_FILE);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  if (!fs.existsSync(DATA_FILE)) fs.writeFileSync(DATA_FILE, "[]", "utf-8");
}

export function readCandidates(): Candidate[] {
  ensureDataFile();
  try {
    const raw = fs.readFileSync(DATA_FILE, "utf-8");
    return JSON.parse(raw) as Candidate[];
  } catch {
    return [];
  }
}

export function writeCandidates(candidates: Candidate[]): void {
  ensureDataFile();
  fs.writeFileSync(DATA_FILE, JSON.stringify(candidates, null, 2), "utf-8");
}

export function appendCandidate(candidate: Candidate): void {
  const candidates = readCandidates();
  candidates.push(candidate);
  writeCandidates(candidates);
}

export function updateCandidateByTrackingId(
  trackingId: string,
  updates: Partial<Candidate>
): boolean {
  const candidates = readCandidates();
  const idx = candidates.findIndex((c) => c.trackingId === trackingId);
  if (idx === -1) return false;
  candidates[idx] = { ...candidates[idx], ...updates };
  writeCandidates(candidates);
  return true;
}

export function getCandidateByTrackingId(trackingId: string): Candidate | null {
  return readCandidates().find((c) => c.trackingId === trackingId) ?? null;
}
