// src/services/userRepo.js
import { doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../../firebase';

export async function saveStudent(uid, data) {
  return setDoc(doc(db, 'students', uid), {
    uid,
    role: 'student',
    createdAt: serverTimestamp(),
    ...data,
  }, { merge: true });
}

export async function saveAcademic(uid, data) {
  return setDoc(doc(db, 'academics', uid), {
    uid,
    role: 'academic',
    createdAt: serverTimestamp(),
    ...data,
  }, { merge: true });
}

export async function fetchRole(uid) {
  const s = await getDoc(doc(db, 'students', uid));
  if (s.exists()) return 'student';
  const a = await getDoc(doc(db, 'academics', uid));
  if (a.exists()) return 'academic';
  return null;
}
