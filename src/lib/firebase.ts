import { initializeApp } from 'firebase/app';
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signInWithEmailAndPassword,
  sendEmailVerification,
  signOut,
  User,
} from 'firebase/auth';
import {
  getFirestore,
  doc,
  getDocFromServer,
  collection,
  query,
  where,
  onSnapshot,
  setDoc,
  updateDoc,
  deleteDoc,
  getDocs,
  writeBatch,
  serverTimestamp,
  Timestamp,
  Unsubscribe,
} from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';
import { ClassItem, UserProfile } from '../types/timetable';

// Initialize Firebase App
export const app = initializeApp(firebaseConfig);

// CRITICAL: Must use firestoreDatabaseId
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);

export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: 'select_account' });

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
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(
  error: unknown,
  operationType: OperationType,
  path: string | null
): never {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid || null,
      email: auth.currentUser?.email || null,
      emailVerified: auth.currentUser?.emailVerified || null,
      isAnonymous: auth.currentUser?.isAnonymous || null,
      tenantId: auth.currentUser?.tenantId || null,
      providerInfo:
        auth.currentUser?.providerData?.map((provider) => ({
          providerId: provider.providerId,
          email: provider.email,
        })) || [],
    },
    operationType,
    path,
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

// Connection test mandated by Firebase skill
export async function testFirestoreConnection(): Promise<boolean> {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
    return true;
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.warn('Firebase client is offline. Offline cache will be used.');
    }
    return false;
  }
}

// Authentication helpers (Google Sign-In & Email/Password)
export async function loginWithGoogle(): Promise<User> {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    return result.user;
  } catch (err: unknown) {
    console.error('Google sign-in error:', err);
    throw err;
  }
}

export async function loginWithEmail(email: string, password: string): Promise<User> {
  try {
    const result = await signInWithEmailAndPassword(auth, email.trim(), password);
    return result.user;
  } catch (err: unknown) {
    console.error('Email sign-in error:', err);
    throw err;
  }
}

export async function resendVerificationEmail(): Promise<void> {
  if (auth.currentUser && !auth.currentUser.emailVerified) {
    await sendEmailVerification(auth.currentUser);
  }
}

export async function logoutUser(): Promise<void> {
  await signOut(auth);
}

function toIsoString(val: unknown): string | undefined {
  if (!val) return undefined;
  if (typeof val === 'string') return val;
  if (val instanceof Timestamp) return val.toDate().toISOString();
  if (typeof val === 'object' && val !== null && 'toDate' in val && typeof (val as { toDate: () => Date }).toDate === 'function') {
    return (val as { toDate: () => Date }).toDate().toISOString();
  }
  return undefined;
}

function sanitizeClassPayload(data: Omit<ClassItem, 'id' | 'userId' | 'createdAt' | 'updatedAt'>) {
  return {
    visibility: 'shared' as const,
    courseCode: data.courseCode.trim().toUpperCase().slice(0, 30),
    courseTitle: data.courseTitle.trim().slice(0, 100),
    dayOfWeek: data.dayOfWeek,
    startTime: data.startTime,
    endTime: data.endTime,
    location: (data.location || '').trim().slice(0, 100),
    instructor: (data.instructor || '').trim().slice(0, 80),
    color: (data.color || '#6366f1').trim().slice(0, 30),
    notes: (data.notes || '').trim().slice(0, 500),
  };
}

/**
 * Subscribe to the shared timetable collection (requires signed-in verified user)
 */
export function subscribeToSharedClasses(
  onUpdate: (classes: ClassItem[]) => void,
  onError?: (err: Error) => void
): Unsubscribe {
  const path = 'classes';
  const q = query(collection(db, path), where('visibility', '==', 'shared'));

  return onSnapshot(
    q,
    (snapshot) => {
      const items: ClassItem[] = snapshot.docs.map((docSnap) => {
        const d = docSnap.data();
        return {
          id: docSnap.id,
          userId: String(d.userId || ''),
          visibility: 'shared',
          courseCode: String(d.courseCode || ''),
          courseTitle: String(d.courseTitle || ''),
          dayOfWeek: d.dayOfWeek,
          startTime: String(d.startTime || '09:00'),
          endTime: String(d.endTime || '10:00'),
          location: String(d.location || ''),
          instructor: String(d.instructor || ''),
          color: String(d.color || '#6366f1'),
          notes: d.notes ? String(d.notes) : '',
          createdAt: toIsoString(d.createdAt),
          updatedAt: toIsoString(d.updatedAt),
        };
      });
      onUpdate(items);
    },
    (error) => {
      try {
        handleFirestoreError(error, OperationType.LIST, path);
      } catch (wrapped) {
        if (onError && wrapped instanceof Error) {
          onError(wrapped);
        }
      }
    }
  );
}

/**
 * Create a new class in the shared timetable (Admin only via Firestore rules)
 */
export async function createSharedClass(
  classId: string,
  userId: string,
  data: Omit<ClassItem, 'id' | 'userId' | 'createdAt' | 'updatedAt'>
): Promise<void> {
  const path = `classes/${classId}`;
  try {
    const clean = sanitizeClassPayload(data);
    await setDoc(doc(db, 'classes', classId), {
      id: classId,
      userId,
      ...clean,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

/**
 * Update an existing class in the shared timetable (Admin only via Firestore rules)
 */
export async function updateSharedClass(
  classId: string,
  data: Omit<ClassItem, 'id' | 'userId' | 'createdAt' | 'updatedAt'>
): Promise<void> {
  const path = `classes/${classId}`;
  try {
    const clean = sanitizeClassPayload(data);
    await updateDoc(doc(db, 'classes', classId), {
      ...clean,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

/**
 * Delete a class from the shared timetable (Admin only via Firestore rules)
 */
export async function deleteSharedClass(classId: string): Promise<void> {
  const path = `classes/${classId}`;
  try {
    await deleteDoc(doc(db, 'classes', classId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

/**
 * Replace all shared classes (for applying presets or clearing the schedule - Admin only)
 */
export async function replaceAllSharedClasses(
  newClasses: Omit<ClassItem, 'id' | 'userId' | 'createdAt' | 'updatedAt'>[],
  userId: string
): Promise<void> {
  const path = 'classes';
  try {
    const q = query(collection(db, path), where('visibility', '==', 'shared'));
    const snap = await getDocs(q);
    const batch = writeBatch(db);

    snap.docs.forEach((docSnap) => {
      batch.delete(docSnap.ref);
    });

    const baseTime = Date.now();
    newClasses.forEach((item, idx) => {
      const classId = `cls_${baseTime}_${idx}`;
      const clean = sanitizeClassPayload(item);
      batch.set(doc(db, 'classes', classId), {
        id: classId,
        userId,
        ...clean,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    });

    await batch.commit();
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

/**
 * Subscribe to private user preferences (/users/{userId})
 */
export function subscribeToUserProfile(
  userId: string,
  onUpdate: (profile: UserProfile | null) => void,
  onError?: (err: Error) => void
): Unsubscribe {
  const path = `users/${userId}`;
  return onSnapshot(
    doc(db, 'users', userId),
    (docSnap) => {
      if (!docSnap.exists()) {
        onUpdate(null);
        return;
      }
      const d = docSnap.data();
      onUpdate({
        id: docSnap.id,
        notificationsEnabled: Boolean(d.notificationsEnabled ?? true),
        notificationLeadMinutes: Number(d.notificationLeadMinutes ?? 10),
        soundEnabled: d.soundEnabled !== undefined ? Boolean(d.soundEnabled) : true,
        showWeekends: d.showWeekends !== undefined ? Boolean(d.showWeekends) : false,
        activeSemester: d.activeSemester ? String(d.activeSemester) : undefined,
        createdAt: toIsoString(d.createdAt),
        updatedAt: toIsoString(d.updatedAt),
      });
    },
    (error) => {
      try {
        handleFirestoreError(error, OperationType.GET, path);
      } catch (wrapped) {
        if (onError && wrapped instanceof Error) {
          onError(wrapped);
        }
      }
    }
  );
}

/**
 * Create or update private user preferences in Firestore
 */
export async function saveRemoteUserProfile(
  userId: string,
  profile: UserProfile,
  existsInRemote: boolean
): Promise<void> {
  const path = `users/${userId}`;
  const cleanPayload = {
    notificationsEnabled: Boolean(profile.notificationsEnabled),
    notificationLeadMinutes: Math.max(0, Math.min(120, Number(profile.notificationLeadMinutes) || 10)),
    soundEnabled: Boolean(profile.soundEnabled ?? true),
    showWeekends: Boolean(profile.showWeekends ?? false),
    ...(profile.activeSemester ? { activeSemester: profile.activeSemester.slice(0, 64) } : {}),
  };

  try {
    if (existsInRemote) {
      await updateDoc(doc(db, 'users', userId), {
        ...cleanPayload,
        updatedAt: serverTimestamp(),
      });
    } else {
      await setDoc(doc(db, 'users', userId), {
        id: userId,
        ...cleanPayload,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    }
  } catch (error) {
    handleFirestoreError(error, existsInRemote ? OperationType.UPDATE : OperationType.CREATE, path);
  }
}
