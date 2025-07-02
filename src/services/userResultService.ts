import { collection, addDoc, getDocs, query, where } from 'firebase/firestore';
import { db } from '../firebase';
import type { UserResult } from '../types/userResult';

const COLLECTION_NAME = 'userResults';
const userResultsRef = collection(db, COLLECTION_NAME);

export const userResultService = {
  async addResult(result: Omit<UserResult, 'id'>): Promise<string> {
    const docRef = await addDoc(userResultsRef, {
      ...result,
      timestamp: new Date().toISOString()
    });
    return docRef.id;
  },

  async getResultsByUser(userId: string): Promise<UserResult[]> {
    const q = query(userResultsRef, where("userId", "==", userId));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as UserResult));
  },

  async getResultsByQuiz(quizId: string): Promise<UserResult[]> {
    const q = query(userResultsRef, where("quizId", "==", quizId));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as UserResult));
  },

  async getAllResults(): Promise<UserResult[]> {
    const snapshot = await getDocs(userResultsRef);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as UserResult));
  }
}; 