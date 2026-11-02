import { initializeApp, getApps } from 'firebase/app';
import { 
  getAuth, 
  GoogleAuthProvider, 
  signInWithPopup, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut,
  onAuthStateChanged,
  User
} from 'firebase/auth';
import { 
  getFirestore, 
  doc, 
  setDoc, 
  getDocs, 
  collection, 
  deleteDoc, 
  query, 
  orderBy, 
  getDocFromServer
} from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';
import { AnalysisResult } from '../types';

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
export const auth = getAuth(app);
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
  };
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null): never {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
    },
    operationType,
    path
  };
  console.warn('Firestore Operation Notice:', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

// Test connection on boot defensively
export async function testConnection(): Promise<boolean> {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
    return true;
  } catch (error) {
    // Non-blocking connection check
    return false;
  }
}
testConnection().catch(() => {});

export const googleProvider = new GoogleAuthProvider();

export async function loginWithGoogle() {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    return result.user;
  } catch (error) {
    console.error("Google sign-in error:", error);
    throw error;
  }
}

export async function logoutUser() {
  await signOut(auth);
}

// Firestore operations for user analyses
export async function saveAnalysisDocument(
  userId: string, 
  analysis: AnalysisResult, 
  saveContractText: boolean
): Promise<void> {
  const cleanId = (analysis.id || `analysis_${Date.now()}`).replace(/[^a-zA-Z0-9_-]/g, '_');
  const path = `users/${userId}/analyses/${cleanId}`;
  
  const payload: Record<string, any> = {
    userId,
    contractTitle: (analysis.contractTitle || 'Untitled Contract').slice(0, 190),
    role: (analysis.role || 'Tenant').slice(0, 45),
    worry: (analysis.worry || 'Everything').slice(0, 95),
    tone: (analysis.tone || 'Firm').slice(0, 45),
    language: (analysis.language || 'English').slice(0, 25),
    riskScore: typeof analysis.riskScore === 'number' ? Math.max(0, Math.min(100, Math.round(analysis.riskScore))) : 50,
    verdict: (analysis.verdict || 'Negotiate').slice(0, 45),
    justification: (analysis.justification || '').slice(0, 1000),
    counts: analysis.counts || { high: 0, medium: 0, low: 0 },
    clauses: analysis.clauses || [],
    villains: analysis.villains || [],
    counterOffers: analysis.counterOffers || [],
    autoRenewalHero: analysis.autoRenewalHero || {
      hasTrap: false,
      title: 'Trap Spotlight',
      finePrintLine: '',
      financialTrap: '',
      deadline: '',
      replacementSentence: ''
    },
    negotiationEmail: analysis.negotiationEmail ? analysis.negotiationEmail.slice(0, 8000) : '',
    checklist: analysis.checklist || [],
    savedContractText: saveContractText,
    createdAt: analysis.createdAt || new Date().toISOString()
  };

  if (saveContractText && analysis.contractText) {
    payload.contractText = analysis.contractText.slice(0, 95000);
  }

  try {
    await setDoc(doc(db, 'users', userId, 'analyses', cleanId), payload);
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, path);
  }
}

export async function fetchUserAnalyses(userId: string): Promise<AnalysisResult[]> {
  const collectionPath = `users/${userId}/analyses`;
  try {
    const colRef = collection(db, 'users', userId, 'analyses');
    const q = query(colRef, orderBy('createdAt', 'desc'));
    const snapshot = await getDocs(q);
    const results: AnalysisResult[] = [];
    snapshot.forEach(docSnap => {
      const data = docSnap.data();
      results.push({
        id: docSnap.id,
        contractTitle: data.contractTitle,
        role: data.role,
        worry: data.worry,
        tone: data.tone,
        language: data.language || 'English',
        riskScore: data.riskScore,
        verdict: data.verdict,
        justification: data.justification,
        counts: data.counts || { high: 0, medium: 0, low: 0 },
        clauses: data.clauses || [],
        villains: data.villains || [],
        counterOffers: data.counterOffers || [],
        autoRenewalHero: data.autoRenewalHero || {
          hasTrap: false,
          title: 'Auto-Renewal Notice',
          finePrintLine: '',
          financialTrap: '',
          deadline: '',
          replacementSentence: ''
        },
        negotiationEmail: data.negotiationEmail || '',
        checklist: data.checklist || [],
        contractText: data.contractText,
        savedContractText: data.savedContractText,
        createdAt: data.createdAt
      });
    });
    return results;
  } catch (err) {
    handleFirestoreError(err, OperationType.LIST, collectionPath);
  }
}

export async function deleteUserAnalysis(userId: string, analysisId: string): Promise<void> {
  const path = `users/${userId}/analyses/${analysisId}`;
  try {
    await deleteDoc(doc(db, 'users', userId, 'analyses', analysisId));
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, path);
  }
}

export async function deleteAllUserAnalyses(userId: string): Promise<number> {
  const collectionPath = `users/${userId}/analyses`;
  try {
    const colRef = collection(db, 'users', userId, 'analyses');
    const snapshot = await getDocs(colRef);
    let count = 0;
    for (const docSnap of snapshot.docs) {
      await deleteDoc(doc(db, 'users', userId, 'analyses', docSnap.id));
      count++;
    }
    return count;
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, collectionPath);
  }
}

export { onAuthStateChanged, signInWithEmailAndPassword, createUserWithEmailAndPassword };
export type { User };
