import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";
import { getDb } from "./firebase";
import type { ResumeData } from "./resume";

/** One resume per user (id = uid). Easy to extend to multiple later. */
export async function saveResume(userId: string, data: ResumeData) {
  await setDoc(
    doc(getDb(), "resumes", userId),
    {
      userId,
      resumeData: data,
      template: data.template,
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
