import { doc, getDoc, setDoc, updateDoc, arrayUnion } from 'firebase/firestore';
import { db } from '../firebase';
import type { User } from '../types/user';

const COLLECTION_NAME = 'users';

export const userService = {
  async getUserById(uid: string): Promise<User | null> {
    const docRef = doc(db, COLLECTION_NAME, uid);
    const snap = await getDoc(docRef);
    if (snap.exists()) {
      return { id: snap.id, uid: snap.id, ...snap.data() } as User;
    }
    return null;
  },

  async updateXP(uid: string, amount: number) {
    const docRef = doc(db, COLLECTION_NAME, uid);
    await updateDoc(docRef, { xp: amount });
  },

  async addBadge(uid: string, badge: string) {
    const docRef = doc(db, COLLECTION_NAME, uid);
    await updateDoc(docRef, { badges: arrayUnion(badge) });
  },

  async updateStreak(uid: string, count: number, lastDate: string) {
    const docRef = doc(db, COLLECTION_NAME, uid);
    await updateDoc(docRef, { streak: { count, lastDate } });
  },

  async setUserFields(uid: string, fields: Partial<User>) {
    const docRef = doc(db, COLLECTION_NAME, uid);
    await setDoc(docRef, fields, { merge: true });
  }
}; 