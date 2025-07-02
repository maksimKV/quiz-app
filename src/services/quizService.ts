import { collection, addDoc, updateDoc, deleteDoc, doc, getDocs, getDoc, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';
import type { Quiz } from '../types/quiz';

const COLLECTION_NAME = 'quizzes';
const quizzesRef = collection(db, COLLECTION_NAME);

export const quizService = {
  async getAllQuizzes(): Promise<Quiz[]> {
    const snapshot = await getDocs(quizzesRef);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Quiz));
  },

  async getPublishedQuizzes(): Promise<Quiz[]> {
    const q = query(quizzesRef, where("published", "==", true));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Quiz));
  },

  async getQuizById(id: string): Promise<Quiz | null> {
    const docRef = doc(db, COLLECTION_NAME, id);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return { id: docSnap.id, ...docSnap.data() } as Quiz;
    }
    return null;
  },

  async createQuiz(quiz: Omit<Quiz, 'id'>): Promise<string> {
    const docRef = await addDoc(quizzesRef, quiz);
    return docRef.id;
  },

  async updateQuiz(id: string, quiz: Partial<Quiz>): Promise<void> {
    const docRef = doc(db, COLLECTION_NAME, id);
    await updateDoc(docRef, quiz);
  },

  async deleteQuiz(id: string): Promise<void> {
    const docRef = doc(db, COLLECTION_NAME, id);
    await deleteDoc(docRef);
  },

  subscribeToQuiz(quizId: string, callback: (quiz: Quiz | null) => void) {
    const docRef = doc(db, COLLECTION_NAME, quizId);
    return onSnapshot(docRef, (snapshot) => {
      if (snapshot.exists()) {
        callback({ id: snapshot.id, ...snapshot.data() } as Quiz);
      } else {
        callback(null);
      }
    });
  },

  subscribeToPublishedQuizzes(callback: (quizzes: Quiz[]) => void) {
    const q = query(quizzesRef, where("published", "==", true));
    return onSnapshot(q, (snapshot) => {
      const quizzes = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Quiz));
      callback(quizzes);
    });
  }
}; 