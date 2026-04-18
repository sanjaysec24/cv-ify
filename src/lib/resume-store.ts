import {
  doc,
  getDoc,
  setDoc,
  deleteDoc,
  collection,
  query,
  where,
  getDocs,
  serverTimestamp,
  type Timestamp,
} from "firebase/firestore";
import { getDb } from "./firebase";
import type { ResumeData } from "./resume";

/** Recursively strip undefined values — Firestore rejects them. */
function stripUndefined<T>(value: T): T {
  if (Array.isArray(value)) {
    return value
      .filter((v) => v !== undefined)
      .map((v) => stripUndefined(v)) as unknown as T;
  }
  if (value && typeof value === "object") {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
      if (v === undefined) continue;
      out[k] = stripUndefined(v);
    }
    return out as T;
  }
  return value;
}

/** One resume per user (id = uid). Easy to extend to multiple later. */
export async function saveResume(userId: string, data: ResumeData) {
  const clean = stripUndefined(data);
  await setDoc(
    doc(getDb(), "resumes", userId),
    {
      userId,
      resumeData: clean,
      template: clean.template ?? "modern",
      title: clean.name?.trim() ? `${clean.name}'s Resume` : "Untitled Resume",
      updatedAt: serverTimestamp(),
      createdAt: serverTimestamp(),
    },
    { merge: true }
  );
}

export async function loadResume(userId: string): Promise<ResumeData | null> {
  const snap = await getDoc(doc(getDb(), "resumes", userId));
  if (!snap.exists()) return null;
  const d = snap.data() as { resumeData?: ResumeData };
  return d.resumeData ?? null;
}

export type ResumeListItem = {
  id: string;
  title: string;
  template: string;
  updatedAt: Date | null;
  createdAt: Date | null;
  resumeData: ResumeData;
};

function toDate(t: unknown): Date | null {
  if (!t) return null;
  const v = t as Timestamp;
  if (typeof v?.toDate === "function") return v.toDate();
  return null;
}

export async function listResumes(userId: string): Promise<ResumeListItem[]> {
  const q = query(collection(getDb(), "resumes"), where("userId", "==", userId));
  const snap = await getDocs(q);
  const items: ResumeListItem[] = [];
  snap.forEach((d) => {
    const x = d.data() as {
      title?: string;
      template?: string;
      updatedAt?: unknown;
      createdAt?: unknown;
      resumeData?: ResumeData;
    };
    if (!x.resumeData) return;
    items.push({
      id: d.id,
      title: x.title ?? (x.resumeData.name ? `${x.resumeData.name}'s Resume` : "Untitled Resume"),
      template: x.template ?? x.resumeData.template ?? "modern",
      updatedAt: toDate(x.updatedAt),
      createdAt: toDate(x.createdAt),
      resumeData: x.resumeData,
    });
  });
  // newest first
  items.sort((a, b) => (b.updatedAt?.getTime() ?? 0) - (a.updatedAt?.getTime() ?? 0));
  return items;
}

export async function deleteResumeById(resumeId: string) {
  await deleteDoc(doc(getDb(), "resumes", resumeId));
}

export async function submitFeedback(input: {
  userId: string;
  name: string;
  email: string;
  message: string;
}) {
  // Use a deterministic-ish id per submission to avoid extra deps; doc auto via setDoc + random id
  const id = `${input.userId}_${Date.now()}`;
  await setDoc(doc(getDb(), "feedback", id), {
    userId: input.userId,
    name: input.name,
    email: input.email,
    message: input.message,
    createdAt: serverTimestamp(),
  });
}
