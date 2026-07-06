import { initializeApp, getApps, getApp } from 'firebase/app';
import { 
  getAuth, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut as fbSignOut, 
  updateProfile,
  GoogleAuthProvider,
  signInWithPopup
} from 'firebase/auth';
import { 
  getFirestore, 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  setDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  orderBy,
  onSnapshot
} from 'firebase/firestore';
import { getStorage, ref as sRef, uploadBytes, getDownloadURL } from 'firebase/storage';
import { AdminRateOverride, CrowdsourcedRate, UserProfile, RateAlert, CommunityTransferVerification, UserFirstImpressionFeedback, RreSurveyFeedback } from '../types';
import { 
  DeviceSession, 
  ContributorReputation, 
  AuditLog, 
  SecurityPolicyConfig 
} from '../utils/securityTrustEngine';
import {
  CommunityRateSubmission,
  CommunityRateConsensus,
  MarketReferenceRate,
  ResolvedRate,
  ResolvedRateAuditHistory
} from '../utils/rateIntelligenceEngine';
import firebaseConfig from '../../firebase-applet-config.json';

// Initialize Firebase App
let firebaseApp: any = null;
let auth: any = null;
let db: any = null;
let storage: any = null;

try {
  firebaseApp = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
  auth = getAuth(firebaseApp);
  db = firebaseConfig.firestoreDatabaseId 
    ? getFirestore(firebaseApp, firebaseConfig.firestoreDatabaseId)
    : getFirestore(firebaseApp);
  storage = getStorage(firebaseApp);
  console.log('⚡ Connected to Firebase & Firestore successfully.');
} catch (err) {
  console.error('❌ Error initializing Firebase:', err);
}

export { firebaseApp, auth, db, storage };

export async function uploadScreenshot(file: File, path: string): Promise<string> {
  if (!storage) {
    console.warn("Storage not initialized, using local URL as fallback");
    return URL.createObjectURL(file);
  }
  try {
    const fileRef = sRef(storage, path);
    await uploadBytes(fileRef, file);
    const downloadUrl = await getDownloadURL(fileRef);
    return downloadUrl;
  } catch (err) {
    console.warn("Firebase Storage uploadScreenshot error:", err);
    return URL.createObjectURL(file);
  }
}

// Auth User interface for the app
export interface AuthUser {
  id?: string;
  name: string;
  email: string;
  homeCountry: any;
  role?: string;
}

// =========================================================================
// AUTHENTICATION OPERATIONS
// =========================================================================

export async function signUpUser(
  email: string, 
  password: string, 
  name: string, 
  homeCountry: string
): Promise<{ user: AuthUser | null; error: string | null }> {
  if (auth) {
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      
      // Update the user displayName in Auth
      await updateProfile(user, { displayName: name });
      
      const authUser: AuthUser = {
        id: user.uid,
        name: name,
        email: email,
        homeCountry: homeCountry
      };

      // Save user profile to Firestore
      const initialProfile: UserProfile = {
        name,
        phone: '',
        preferredLanguage: 'en',
        homeCountry: homeCountry as any,
        favoriteProviders: [],
        savingsTargetSar: 100,
        totalSavedSar: 0,
        joinedDate: new Date().toISOString()
      };
      await updateFirebaseUserProfile(user.uid, initialProfile);

      return { user: authUser, error: null };
    } catch (err: any) {
      console.error('Firebase signUpUser error:', err);
      // Map error codes for more helpful messages
      let message = err.message || 'Error signing up with Firebase.';
      if (err.code === 'auth/email-already-in-use') {
        message = 'An account with this email already exists.';
      } else if (err.code === 'auth/weak-password') {
        message = 'The password is too weak. Please choose a stronger password.';
      } else if (err.code === 'auth/invalid-email') {
        message = 'Please enter a valid email address.';
      } else if (err.code === 'auth/operation-not-allowed') {
        message = 'Email/Password registration is disabled in your Firebase Console. Go to Firebase Console > Authentication > Sign-in method, click "Add new provider", and enable "Email/Password". Alternatively, use the test credentials above.';
      }
      return { user: null, error: message };
    }
  }

  // Fallback to local storage simulation
  const storedUsersRaw = localStorage.getItem('sariremit_users');
  const usersList = storedUsersRaw ? JSON.parse(storedUsersRaw) : [];
  const exists = usersList.some((u: any) => u.email.toLowerCase() === email.toLowerCase());
  if (exists) {
    return { user: null, error: 'An account with this email already exists.' };
  }
  const newUser = { id: `local-${Date.now()}`, name, email, password, homeCountry };
  usersList.push(newUser);
  localStorage.setItem('sariremit_users', JSON.stringify(usersList));
  return {
    user: { id: newUser.id, name, email, homeCountry },
    error: null
  };
}

export async function signInUser(
  email: string, 
  password: string
): Promise<{ user: AuthUser | null; error: string | null }> {
  // Check static Admin first
  if (email.toLowerCase() === 'admin@sariremit.com' && password === 'adminpassword') {
    return {
      user: {
        id: 'admin-static-id',
        name: 'SariRemit Admin',
        email: 'admin@sariremit.com',
        homeCountry: 'KE',
        role: 'admin'
      },
      error: null
    };
  }

  if (auth) {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      
      // Load user profile to check home country
      const profile = await getFirebaseUserProfile(user.uid);
      
      return {
        user: {
          id: user.uid,
          name: profile?.name || user.displayName || 'Sari Expat',
          email: user.email || email,
          homeCountry: profile?.homeCountry || 'KE',
          role: (user.email && user.email.toLowerCase() === 'hassan.gaturu20@gmail.com') ? 'admin' : undefined
        },
        error: null
      };
    } catch (err: any) {
      console.error('Firebase signInUser error:', err);
      let message = err.message || 'Invalid email or password.';
      if (err.code === 'auth/wrong-password' || err.code === 'auth/user-not-found' || err.code === 'auth/invalid-credential') {
        message = 'Invalid email or password.';
      } else if (err.code === 'auth/operation-not-allowed') {
        message = 'Email/Password sign-in is disabled in your Firebase Console. Go to Firebase Console > Authentication > Sign-in method, click "Add new provider", and enable "Email/Password". Alternatively, use the test credentials above.';
      }
      return { user: null, error: message };
    }
  }

  // Fallback to local storage simulation
  const storedUsersRaw = localStorage.getItem('sariremit_users');
  const usersList = storedUsersRaw ? JSON.parse(storedUsersRaw) : [];
  const matchedUser = usersList.find(
    (u: any) => u.email.toLowerCase() === email.toLowerCase() && u.password === password
  );

  if (matchedUser) {
    return {
      user: {
        id: matchedUser.id || `local-${matchedUser.email}`,
        name: matchedUser.name,
        email: matchedUser.email,
        homeCountry: matchedUser.homeCountry || 'KE'
      },
      error: null
    };
  }

  if (email.toLowerCase() === 'expat@sariremit.com' && password === '123456') {
    return {
      user: {
        id: 'expat-static-id',
        name: 'Sari Expat',
        email: 'expat@sariremit.com',
        homeCountry: 'KE'
      },
      error: null
    };
  }

  return { user: null, error: 'Invalid email or password.' };
}

export async function signInWithGoogle(): Promise<{ user: AuthUser | null; error: string | null }> {
  if (auth) {
    try {
      const provider = new GoogleAuthProvider();
      const userCredential = await signInWithPopup(auth, provider);
      const user = userCredential.user;
      
      // Load user profile to check home country or create a default one
      let profile = await getFirebaseUserProfile(user.uid);
      if (!profile) {
        profile = {
          name: user.displayName || 'Sari Expat',
          phone: '',
          preferredLanguage: 'en',
          homeCountry: 'KE',
          favoriteProviders: [],
          savingsTargetSar: 100,
          totalSavedSar: 0,
          joinedDate: new Date().toISOString()
        };
        await updateFirebaseUserProfile(user.uid, profile);
      }
      
      return {
        user: {
          id: user.uid,
          name: profile.name || user.displayName || 'Sari Expat',
          email: user.email || '',
          homeCountry: profile.homeCountry || 'KE',
          role: (user.email && user.email.toLowerCase() === 'hassan.gaturu20@gmail.com') ? 'admin' : undefined
        },
        error: null
      };
    } catch (err: any) {
      console.error('Firebase signInWithGoogle error:', err);
      let message = err.message || 'Error signing in with Google.';
      if (err.code === 'auth/popup-blocked') {
        message = 'Sign-in popup was blocked by your browser. Please allow popups for this site or open the app in a new tab.';
      } else if (err.code === 'auth/operation-not-allowed') {
        message = 'Google sign-in is disabled in your Firebase Console. Go to Firebase Console > Authentication > Sign-in method, and enable "Google".';
      }
      return { user: null, error: message };
    }
  }
  
  // Local storage fallback
  return {
    user: {
      id: 'google-mock-id',
      name: 'Google Expat',
      email: 'google@sariremit.com',
      homeCountry: 'KE'
    },
    error: null
  };
}

export async function signOutUser(): Promise<void> {
  if (auth) {
    try {
      await fbSignOut(auth);
    } catch (err) {
      console.error('Firebase signOutUser error:', err);
    }
  }
}

// =========================================================================
// USER PROFILE DB OPERATIONS
// =========================================================================

export async function getFirebaseUserProfile(userId: string): Promise<UserProfile | null> {
  if (!db) return null;
  try {
    const profileRef = doc(db, 'profiles', userId);
    const profileSnap = await getDoc(profileRef);
    if (profileSnap.exists()) {
      const data = profileSnap.data();
      return {
        name: data.name || 'Sari Expat',
        phone: data.phone || '',
        preferredLanguage: (data.preferredLanguage as 'en' | 'ar') || 'en',
        homeCountry: data.homeCountry || 'KE',
        favoriteProviders: data.favoriteProviders || [],
        savingsTargetSar: Number(data.savingsTargetSar || 100),
        totalSavedSar: Number(data.totalSavedSar || 0),
        joinedDate: data.joinedDate || new Date().toISOString()
      };
    }
    return null;
  } catch (err) {
    console.warn('Firebase getFirebaseUserProfile error:', err);
    return null;
  }
}

export async function updateFirebaseUserProfile(userId: string, profile: UserProfile): Promise<boolean> {
  if (!db) return false;
  try {
    const profileRef = doc(db, 'profiles', userId);
    await setDoc(profileRef, {
      name: profile.name,
      phone: profile.phone,
      preferredLanguage: profile.preferredLanguage,
      homeCountry: profile.homeCountry,
      favoriteProviders: profile.favoriteProviders,
      savingsTargetSar: profile.savingsTargetSar,
      totalSavedSar: profile.totalSavedSar,
      joinedDate: profile.joinedDate,
      updatedAt: new Date().toISOString()
    }, { merge: true });
    return true;
  } catch (err) {
    console.warn('Firebase updateFirebaseUserProfile error:', err);
    return false;
  }
}

// =========================================================================
// ADMIN OVERRIDES DB OPERATIONS
// =========================================================================

export async function getFirebaseOverrides(): Promise<AdminRateOverride[] | null> {
  if (!db) return null;
  try {
    const overridesCol = collection(db, 'admin_rate_overrides');
    const q = query(overridesCol);
    const querySnapshot = await getDocs(q);
    const overrides: AdminRateOverride[] = [];
    querySnapshot.forEach((docSnap) => {
      const o = docSnap.data();
      overrides.push({
        id: docSnap.id,
        providerId: o.providerId ?? o.provider_id,
        providerName: o.providerName ?? o.provider_name,
        transferPartner: o.transferPartner ?? o.transfer_partner ?? undefined,
        corridor: o.corridor,
        sendAmountMin: Number(o.sendAmountMin ?? o.send_amount_min ?? 0),
        sendAmountMax: Number(o.sendAmountMax ?? o.send_amount_max ?? 100000),
        receiveMethod: o.receiveMethod ?? o.receive_method ?? 'all',
        exchangeRate: Number(o.exchangeRate ?? o.exchange_rate ?? 0),
        transferFee: Number(o.transferFee ?? o.transfer_fee ?? 0),
        vatAmount: Number(o.vatAmount ?? o.vat_amount ?? 0),
        additionalCharges: Number(o.additionalCharges ?? o.additional_charges ?? 0),
        totalCost: (o.totalCost ?? o.total_cost) !== undefined ? Number(o.totalCost ?? o.total_cost) : undefined,
        startDate: o.startDate ?? o.start_date ?? undefined,
        endDate: o.endDate ?? o.end_date ?? undefined,
        overrideReason: o.overrideReason ?? o.override_reason ?? '',
        active: o.active !== undefined ? o.active : true,
        createdBy: o.createdBy ?? o.created_by ?? 'Admin',
        createdAt: o.createdAt ?? o.created_at,
        updatedAt: o.updatedAt ?? o.updated_at
      });
    });
    return overrides;
  } catch (err) {
    console.warn('Firebase getFirebaseOverrides error:', err);
    return null;
  }
}

export function subscribeFirebaseOverrides(callback: (overrides: AdminRateOverride[]) => void): (() => void) | null {
  if (!db) return null;
  try {
    const overridesCol = collection(db, 'admin_rate_overrides');
    const q = query(overridesCol);
    return onSnapshot(q, (querySnapshot) => {
      const overrides: AdminRateOverride[] = [];
      querySnapshot.forEach((docSnap) => {
        const o = docSnap.data();
        overrides.push({
          id: docSnap.id,
          providerId: o.providerId ?? o.provider_id,
          providerName: o.providerName ?? o.provider_name,
          transferPartner: o.transferPartner ?? o.transfer_partner ?? undefined,
          corridor: o.corridor,
          sendAmountMin: Number(o.sendAmountMin ?? o.send_amount_min ?? 0),
          sendAmountMax: Number(o.sendAmountMax ?? o.send_amount_max ?? 100000),
          receiveMethod: o.receiveMethod ?? o.receive_method ?? 'all',
          exchangeRate: Number(o.exchangeRate ?? o.exchange_rate ?? 0),
          transferFee: Number(o.transferFee ?? o.transfer_fee ?? 0),
          vatAmount: Number(o.vatAmount ?? o.vat_amount ?? 0),
          additionalCharges: Number(o.additionalCharges ?? o.additional_charges ?? 0),
          totalCost: (o.totalCost ?? o.total_cost) !== undefined ? Number(o.totalCost ?? o.total_cost) : undefined,
          startDate: o.startDate ?? o.start_date ?? undefined,
          endDate: o.endDate ?? o.end_date ?? undefined,
          overrideReason: o.overrideReason ?? o.override_reason ?? '',
          active: o.active !== undefined ? o.active : true,
          createdBy: o.createdBy ?? o.created_by ?? 'Admin',
          createdAt: o.createdAt ?? o.created_at,
          updatedAt: o.updatedAt ?? o.updated_at
        });
      });
      callback(overrides);
    }, (err) => {
      console.warn('Firebase subscribeFirebaseOverrides error:', err);
    });
  } catch (err) {
    console.warn('Firebase subscribeFirebaseOverrides error:', err);
    return null;
  }
}

export async function upsertFirebaseOverride(override: AdminRateOverride): Promise<boolean> {
  if (!db) return false;
  try {
    const overrideRef = doc(db, 'admin_rate_overrides', override.id);
    await setDoc(overrideRef, {
      id: override.id,
      providerId: override.providerId,
      provider_id: override.providerId,
      providerName: override.providerName,
      provider_name: override.providerName,
      transferPartner: override.transferPartner || null,
      transfer_partner: override.transferPartner || null,
      corridor: override.corridor,
      sendAmountMin: override.sendAmountMin,
      send_amount_min: override.sendAmountMin,
      sendAmountMax: override.sendAmountMax,
      send_amount_max: override.sendAmountMax,
      receiveMethod: override.receiveMethod,
      receive_method: override.receiveMethod,
      exchangeRate: override.exchangeRate,
      exchange_rate: override.exchangeRate,
      transferFee: override.transferFee,
      transfer_fee: override.transferFee,
      vatAmount: override.vatAmount,
      vat_amount: override.vatAmount,
      additionalCharges: override.additionalCharges,
      additional_charges: override.additionalCharges,
      totalCost: override.totalCost || null,
      total_cost: override.totalCost || null,
      startDate: override.startDate || null,
      start_date: override.startDate || null,
      endDate: override.endDate || null,
      end_date: override.endDate || null,
      overrideReason: override.overrideReason,
      override_reason: override.overrideReason,
      active: override.active,
      createdBy: override.createdBy,
      created_by: override.createdBy,
      createdAt: override.createdAt,
      created_at: override.createdAt,
      updatedAt: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }, { merge: true });
    return true;
  } catch (err) {
    console.warn('Firebase upsertFirebaseOverride error:', err);
    return false;
  }
}

export async function deleteFirebaseOverride(id: string): Promise<boolean> {
  if (!db) return false;
  try {
    const overrideRef = doc(db, 'admin_rate_overrides', id);
    await deleteDoc(overrideRef);
    return true;
  } catch (err) {
    console.warn('Firebase deleteFirebaseOverride error:', err);
    return false;
  }
}

// =========================================================================
// CROWDSOURCED RATES DB OPERATIONS
// =========================================================================

export async function getFirebaseCrowdsourcedRates(): Promise<CrowdsourcedRate[] | null> {
  if (!db) return null;
  try {
    const ratesCol = collection(db, 'crowdsourced_rates');
    const querySnapshot = await getDocs(ratesCol);
    const rates: CrowdsourcedRate[] = [];
    querySnapshot.forEach((docSnap) => {
      const r = docSnap.data();
      rates.push({
        id: docSnap.id,
        corridorId: r.corridorId as any,
        providerId: r.providerId as any,
        exchangeRate: Number(r.exchangeRate),
        fee: Number(r.fee),
        amountSar: Number(r.amountSar || 1000),
        recipientAmount: Number(r.recipientAmount),
        submittedBy: r.submittedBy,
        timestamp: r.timestamp,
        votes: r.votes,
        isVerified: r.isVerified,
        screenshotUrl: r.screenshotUrl || undefined
      });
    });
    return rates;
  } catch (err) {
    console.warn('Firebase getFirebaseCrowdsourcedRates error:', err);
    return null;
  }
}

export async function upsertFirebaseCrowdsourcedRate(rate: CrowdsourcedRate): Promise<boolean> {
  if (!db) return false;
  try {
    const rateRef = doc(db, 'crowdsourced_rates', rate.id);
    await setDoc(rateRef, {
      corridorId: rate.corridorId,
      providerId: rate.providerId,
      exchangeRate: rate.exchangeRate,
      fee: rate.fee,
      amountSar: rate.amountSar,
      recipientAmount: rate.recipientAmount,
      submittedBy: rate.submittedBy,
      timestamp: rate.timestamp,
      votes: rate.votes,
      isVerified: rate.isVerified,
      screenshotUrl: rate.screenshotUrl || null,
      createdAt: new Date().toISOString()
    }, { merge: true });
    return true;
  } catch (err) {
    console.warn('Firebase upsertFirebaseCrowdsourcedRate error:', err);
    return false;
  }
}

export async function upvoteFirebaseCrowdsourcedRate(id: string, currentVotes: number): Promise<boolean> {
  if (!db) return false;
  try {
    const rateRef = doc(db, 'crowdsourced_rates', id);
    await updateDoc(rateRef, { votes: currentVotes + 1 });
    return true;
  } catch (err) {
    console.warn('Firebase upvoteFirebaseCrowdsourcedRate error:', err);
    return false;
  }
}

// =========================================================================
// COMMUNITY TRANSFER VERIFICATIONS (VERIFY A TRANSFER) OPERATIONS
// =========================================================================

export async function submitCommunityTransferVerification(ver: CommunityTransferVerification): Promise<boolean> {
  // Always update local storage first
  const localSaved = localStorage.getItem('sariremit_transfer_verifications') || '[]';
  const localVers = JSON.parse(localSaved);
  
  // Replace if exists, else append
  const idx = localVers.findIndex((v: any) => v.id === ver.id);
  if (idx > -1) {
    localVers[idx] = ver;
  } else {
    localVers.push(ver);
  }
  localStorage.setItem('sariremit_transfer_verifications', JSON.stringify(localVers));

  if (!db) return true;

  try {
    const verRef = doc(db, 'community_transfer_verifications', ver.id);
    await setDoc(verRef, ver, { merge: true });
    return true;
  } catch (err) {
    console.warn('Firebase submitCommunityTransferVerification error:', err);
    return false;
  }
}

export async function getFirebaseCommunityTransferVerifications(userId?: string): Promise<CommunityTransferVerification[]> {
  const localSaved = localStorage.getItem('sariremit_transfer_verifications');
  const localVers: CommunityTransferVerification[] = localSaved ? JSON.parse(localSaved) : [];

  if (!db) {
    if (userId) {
      return localVers.filter(v => v.user_id === userId);
    }
    return localVers;
  }

  try {
    const colRef = collection(db, 'community_transfer_verifications');
    const snapshot = await getDocs(colRef);
    const fbVers: CommunityTransferVerification[] = [];
    snapshot.forEach(docSnap => {
      fbVers.push(docSnap.data() as CommunityTransferVerification);
    });

    // Merge with local changes
    const combined = [...fbVers];
    localVers.forEach((lv: any) => {
      if (!combined.some(fv => fv.id === lv.id)) {
        combined.push(lv);
      }
    });

    const sorted = combined.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    if (userId) {
      return sorted.filter(v => v.user_id === userId);
    }
    return sorted;
  } catch (err) {
    console.warn('Firebase getFirebaseCommunityTransferVerifications error:', err);
    if (userId) {
      return localVers.filter(v => v.user_id === userId).sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    }
    return localVers.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }
}

export async function updateCommunityTransferVerificationStatus(
  id: string,
  newVerificationStatus: 'approved' | 'rejected',
  newSubmissionStatus: 'verified' | 'rejected',
  reviewedBy: string | null,
  reviewNotes: string
): Promise<boolean> {
  const localSaved = localStorage.getItem('sariremit_transfer_verifications');
  let localVers: CommunityTransferVerification[] = localSaved ? JSON.parse(localSaved) : [];
  const nowStr = new Date().toISOString();
  
  localVers = localVers.map((v: any) => {
    if (v.id === id) {
      return {
        ...v,
        // New camelCase fields
        verificationStatus: newVerificationStatus,
        submissionStatus: newSubmissionStatus,
        reviewedBy: reviewedBy,
        reviewedAt: nowStr,
        reviewNotes: reviewNotes,
        updatedAt: nowStr,
        
        // Old snake_case compatibility fields
        verification_status: newVerificationStatus,
        submission_status: newSubmissionStatus === 'verified' ? 'Verified' : 'Rejected',
        reviewed_by: reviewedBy || 'Admin',
        review_notes: reviewNotes,
        updated_at: nowStr
      };
    }
    return v;
  });
  localStorage.setItem('sariremit_transfer_verifications', JSON.stringify(localVers));

  if (!db) return true;

  try {
    const verRef = doc(db, 'community_transfer_verifications', id);
    const updatePayload: Record<string, any> = {
      verificationStatus: newVerificationStatus,
      submissionStatus: newSubmissionStatus,
      reviewedBy: reviewedBy,
      reviewedAt: nowStr,
      reviewNotes: reviewNotes,
      updatedAt: nowStr,
      
      // Old snake_case compatibility fields
      verification_status: newVerificationStatus,
      submission_status: newSubmissionStatus === 'verified' ? 'Verified' : 'Rejected',
      reviewed_by: reviewedBy || 'Admin',
      review_notes: reviewNotes,
      updated_at: nowStr
    };
    await updateDoc(verRef, updatePayload);
    return true;
  } catch (err) {
    console.warn('Firebase updateCommunityTransferVerificationStatus error:', err);
    return false;
  }
}

// =========================================================================
// APP CONFIG DB OPERATIONS
// =========================================================================

export async function getFirebaseConfig(key: string): Promise<any | null> {
  if (!db) return null;
  try {
    const configRef = doc(db, 'app_config', key);
    const configSnap = await getDoc(configRef);
    if (configSnap.exists()) {
      return configSnap.data().value || null;
    }
    return null;
  } catch (err) {
    console.warn(`Firebase getFirebaseConfig for ${key} error:`, err);
    return null;
  }
}

export async function setFirebaseConfig(key: string, value: any): Promise<boolean> {
  if (!db) return false;
  try {
    const configRef = doc(db, 'app_config', key);
    await setDoc(configRef, {
      value,
      updatedAt: new Date().toISOString()
    }, { merge: true });
    return true;
  } catch (err) {
    console.warn(`Firebase setFirebaseConfig for ${key} error:`, err);
    return false;
  }
}

export async function deleteFirebaseConfig(key: string): Promise<boolean> {
  if (!db) return false;
  try {
    const configRef = doc(db, 'app_config', key);
    await deleteDoc(configRef);
    return true;
  } catch (err) {
    console.warn(`Firebase deleteFirebaseConfig for ${key} error:`, err);
    return false;
  }
}

export interface ReportedIssue {
  id: string;
  category: string;
  description: string;
  email?: string;
  timestamp: string;
  status: 'pending' | 'resolved';
}

export async function submitReportedIssue(issue: ReportedIssue): Promise<boolean> {
  if (!db) {
    const saved = localStorage.getItem('sariremit_reported_issues');
    const issues = saved ? JSON.parse(saved) : [];
    issues.push(issue);
    localStorage.setItem('sariremit_reported_issues', JSON.stringify(issues));
    return true;
  }
  try {
    const issueRef = doc(db, 'reported_issues', issue.id);
    await setDoc(issueRef, issue);
    return true;
  } catch (err) {
    console.error('Firebase submitReportedIssue error:', err);
    const saved = localStorage.getItem('sariremit_reported_issues');
    const issues = saved ? JSON.parse(saved) : [];
    issues.push(issue);
    localStorage.setItem('sariremit_reported_issues', JSON.stringify(issues));
    return true;
  }
}

export async function getReportedIssues(): Promise<ReportedIssue[]> {
  const localSaved = localStorage.getItem('sariremit_reported_issues');
  const localIssues: ReportedIssue[] = localSaved ? JSON.parse(localSaved) : [];

  if (!db) {
    return localIssues;
  }

  try {
    const issuesCol = collection(db, 'reported_issues');
    const snapshot = await getDocs(issuesCol);
    const fbIssues: ReportedIssue[] = [];
    snapshot.forEach(docSnap => {
      fbIssues.push(docSnap.data() as ReportedIssue);
    });

    // Merge them together by ID to avoid duplicates
    const combined = [...fbIssues];
    localIssues.forEach(li => {
      if (!combined.some(fi => fi.id === li.id)) {
        combined.push(li);
      }
    });

    return combined.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  } catch (err: any) {
    if (err && (err.message?.includes('permission') || err.code?.includes('permission'))) {
      console.warn('Firebase getReportedIssues (offline/local fallback active due to permissions/rules):', err.message || err);
    } else {
      console.error('Firebase getReportedIssues error:', err);
    }
    return localIssues.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }
}

export async function updateReportedIssueStatus(id: string, status: 'pending' | 'resolved'): Promise<boolean> {
  // Update local storage first
  const localSaved = localStorage.getItem('sariremit_reported_issues');
  let localIssues: ReportedIssue[] = localSaved ? JSON.parse(localSaved) : [];
  localIssues = localIssues.map(issue => {
    if (issue.id === id) {
      return { ...issue, status };
    }
    return issue;
  });
  localStorage.setItem('sariremit_reported_issues', JSON.stringify(localIssues));

  if (!db) return true;

  try {
    const issueRef = doc(db, 'reported_issues', id);
    await updateDoc(issueRef, { status });
    return true;
  } catch (err: any) {
    if (err && (err.message?.includes('permission') || err.code?.includes('permission'))) {
      console.warn('Firebase updateReportedIssueStatus (offline/local fallback active due to permissions/rules):', err.message || err);
    } else {
      console.error('Firebase updateReportedIssueStatus error:', err);
    }
    return true; // Return true because local updated successfully
  }
}

// =========================================================================
// USER ISSUE REPORTS (FIREBASE POWERED DEEP ENGINE)
// =========================================================================
export interface UserIssueReport {
  id: string;
  user_id: string | null;
  session_id: string;
  page: string;
  issue_type: string;
  issue_title: string;
  issue_description: string;
  screenshot_url?: string;
  provider?: string;
  corridor?: string;
  status: 'new' | 'open' | 'in_progress' | 'resolved' | 'archived';
  priority: 'low' | 'medium' | 'high' | 'critical';
  created_at: string;
  reviewed_at?: string;
  reviewed_by?: string;
  admin_notes?: string;
}

export async function submitUserIssueReport(report: UserIssueReport): Promise<boolean> {
  const localSaved = localStorage.getItem('sariremit_user_issue_reports') || '[]';
  const localReports = JSON.parse(localSaved);
  localReports.push(report);
  localStorage.setItem('sariremit_user_issue_reports', JSON.stringify(localReports));

  if (!db) return true;

  try {
    const reportRef = doc(db, 'user_issue_reports', report.id);
    await setDoc(reportRef, report);
    return true;
  } catch (err) {
    console.error('Firebase submitUserIssueReport error:', err);
    return false;
  }
}

export async function getFirebaseUserIssueReports(): Promise<UserIssueReport[]> {
  const localSaved = localStorage.getItem('sariremit_user_issue_reports');
  const localReports = localSaved ? JSON.parse(localSaved) : [];

  if (!db) {
    return localReports;
  }

  try {
    const colRef = collection(db, 'user_issue_reports');
    const snapshot = await getDocs(colRef);
    const fbReports: UserIssueReport[] = [];
    snapshot.forEach(docSnap => {
      fbReports.push(docSnap.data() as UserIssueReport);
    });

    const combined = [...fbReports];
    localReports.forEach((lr: any) => {
      if (!combined.some(fr => fr.id === lr.id)) {
        combined.push(lr);
      }
    });

    return combined.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  } catch (err) {
    console.warn('Firebase getFirebaseUserIssueReports error:', err);
    return localReports.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }
}

export async function updateUserIssueReportStatus(
  id: string,
  status: 'new' | 'open' | 'in_progress' | 'resolved' | 'archived',
  adminNotes?: string,
  priority?: 'low' | 'medium' | 'high' | 'critical',
  adminUser?: string
 ): Promise<boolean> {
  const localSaved = localStorage.getItem('sariremit_user_issue_reports');
  let localReports = localSaved ? JSON.parse(localSaved) : [];
  localReports = localReports.map((r: any) => {
    if (r.id === id) {
      return {
        ...r,
        status,
        admin_notes: adminNotes !== undefined ? adminNotes : r.admin_notes,
        priority: priority !== undefined ? priority : r.priority,
        reviewed_at: new Date().toISOString(),
        reviewed_by: adminUser || 'Admin'
      };
    }
    return r;
  });
  localStorage.setItem('sariremit_user_issue_reports', JSON.stringify(localReports));

  if (!db) return true;

  try {
    const reportRef = doc(db, 'user_issue_reports', id);
    const updatePayload: Record<string, any> = {
      status,
      reviewed_at: new Date().toISOString(),
      reviewed_by: adminUser || 'Admin'
    };
    if (adminNotes !== undefined) {
      updatePayload.admin_notes = adminNotes;
    }
    if (priority !== undefined) {
      updatePayload.priority = priority;
    }
    await updateDoc(reportRef, updatePayload);
    return true;
  } catch (err) {
    console.error('Firebase updateUserIssueReportStatus error:', err);
    return false;
  }
}

// =========================================================================
// ERROR HANDLERS & RATE ALERTS (PRICE WATCH) DB OPERATIONS
// =========================================================================

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
  }
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth?.currentUser?.uid,
      email: auth?.currentUser?.email,
      emailVerified: auth?.currentUser?.emailVerified,
      isAnonymous: auth?.currentUser?.isAnonymous
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

export async function submitFirebaseRateAlert(alert: RateAlert): Promise<boolean> {
  const userKey = alert.userId || 'guest';
  const saved = localStorage.getItem(`sariremit_alerts_${userKey}`);
  const alerts = saved ? JSON.parse(saved) : [];
  if (!alerts.some((a: any) => a.id === alert.id)) {
    alerts.push(alert);
  } else {
    const idx = alerts.findIndex((a: any) => a.id === alert.id);
    alerts[idx] = alert;
  }
  localStorage.setItem(`sariremit_alerts_${userKey}`, JSON.stringify(alerts));

  if (!db) return true;

  try {
    const alertRef = doc(db, 'rate_alerts', alert.id);
    await setDoc(alertRef, alert);
    return true;
  } catch (err) {
    console.error('Firebase submitFirebaseRateAlert error:', err);
    try {
      handleFirestoreError(err, OperationType.WRITE, `rate_alerts/${alert.id}`);
    } catch (e) {
      // Catching throw to ensure app functions gracefully offline/fallback
    }
    return true;
  }
}

export async function getFirebaseRateAlerts(userId: string): Promise<RateAlert[]> {
  const userKey = userId || 'guest';
  const localSaved = localStorage.getItem(`sariremit_alerts_${userKey}`);
  const localAlerts: RateAlert[] = localSaved ? JSON.parse(localSaved) : [];

  if (!db) {
    return localAlerts;
  }

  try {
    const alertsCol = collection(db, 'rate_alerts');
    const snapshot = await getDocs(alertsCol);
    const fbAlerts: RateAlert[] = [];
    snapshot.forEach(docSnap => {
      const data = docSnap.data();
      if (data.userId === userId) {
        fbAlerts.push(data as RateAlert);
      }
    });

    const combined = [...fbAlerts];
    localAlerts.forEach(la => {
      if (!combined.some(fa => fa.id === la.id)) {
        combined.push(la);
      }
    });

    return combined.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  } catch (err) {
    console.error('Firebase getFirebaseRateAlerts error:', err);
    try {
      handleFirestoreError(err, OperationType.LIST, 'rate_alerts');
    } catch (e) {
      // Fallback
    }
    return localAlerts.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }
}

export async function updateFirebaseRateAlertStatus(id: string, userId: string, isActive: boolean): Promise<boolean> {
  const userKey = userId || 'guest';
  const localSaved = localStorage.getItem(`sariremit_alerts_${userKey}`);
  let localAlerts: RateAlert[] = localSaved ? JSON.parse(localSaved) : [];
  localAlerts = localAlerts.map(alert => {
    if (alert.id === id) {
      return { ...alert, isActive };
    }
    return alert;
  });
  localStorage.setItem(`sariremit_alerts_${userKey}`, JSON.stringify(localAlerts));

  if (!db) return true;

  try {
    const alertRef = doc(db, 'rate_alerts', id);
    await updateDoc(alertRef, { isActive });
    return true;
  } catch (err) {
    console.error('Firebase updateFirebaseRateAlertStatus error:', err);
    try {
      handleFirestoreError(err, OperationType.UPDATE, `rate_alerts/${id}`);
    } catch (e) {
      // Fallback
    }
    return true;
  }
}

export async function deleteFirebaseRateAlert(id: string, userId: string): Promise<boolean> {
  const userKey = userId || 'guest';
  const localSaved = localStorage.getItem(`sariremit_alerts_${userKey}`);
  let localAlerts: RateAlert[] = localSaved ? JSON.parse(localSaved) : [];
  localAlerts = localAlerts.filter(alert => alert.id !== id);
  localStorage.setItem(`sariremit_alerts_${userKey}`, JSON.stringify(localAlerts));

  if (!db) return true;

  try {
    const alertRef = doc(db, 'rate_alerts', id);
    await deleteDoc(alertRef);
    return true;
  } catch (err) {
    console.error('Firebase deleteFirebaseRateAlert error:', err);
    try {
      handleFirestoreError(err, OperationType.DELETE, `rate_alerts/${id}`);
    } catch (e) {
      // Fallback
    }
    return true;
  }
}

// =========================================================================
// SECURITY CONTROL CENTER & HANDSHAKE OPERATIONS
// =========================================================================

export async function getFirebaseSecurityPolicy(): Promise<SecurityPolicyConfig | null> {
  if (!db) return null;
  try {
    const policyRef = doc(db, 'app_config', 'security_policy');
    const policySnap = await getDoc(policyRef);
    if (policySnap.exists()) {
      return policySnap.data().value as SecurityPolicyConfig;
    }
    return null;
  } catch (err) {
    console.warn('Firebase getFirebaseSecurityPolicy error:', err);
    return null;
  }
}

export async function setFirebaseSecurityPolicy(policy: SecurityPolicyConfig): Promise<boolean> {
  if (!db) return false;
  try {
    const policyRef = doc(db, 'app_config', 'security_policy');
    await setDoc(policyRef, {
      value: policy,
      updatedAt: new Date().toISOString()
    }, { merge: true });
    return true;
  } catch (err) {
    console.warn('Firebase setFirebaseSecurityPolicy error:', err);
    return false;
  }
}

export async function getFirebaseDeviceSessions(): Promise<DeviceSession[] | null> {
  if (!db) return null;
  try {
    const sessionsCol = collection(db, 'device_sessions');
    const querySnapshot = await getDocs(sessionsCol);
    const sessions: DeviceSession[] = [];
    querySnapshot.forEach((docSnap) => {
      sessions.push(docSnap.data() as DeviceSession);
    });
    return sessions;
  } catch (err) {
    console.warn('Firebase getFirebaseDeviceSessions error:', err);
    return null;
  }
}

export async function upsertFirebaseDeviceSession(session: DeviceSession): Promise<boolean> {
  if (!db) return false;
  try {
    const sessionRef = doc(db, 'device_sessions', session.id);
    await setDoc(sessionRef, session, { merge: true });
    return true;
  } catch (err) {
    console.warn('Firebase upsertFirebaseDeviceSession error:', err);
    return false;
  }
}

export async function getFirebaseContributorReputations(): Promise<ContributorReputation[] | null> {
  if (!db) return null;
  try {
    const repsCol = collection(db, 'contributor_reputations');
    const querySnapshot = await getDocs(repsCol);
    const reputations: ContributorReputation[] = [];
    querySnapshot.forEach((docSnap) => {
      reputations.push(docSnap.data() as ContributorReputation);
    });
    return reputations;
  } catch (err) {
    console.warn('Firebase getFirebaseContributorReputations error:', err);
    return null;
  }
}

export async function upsertFirebaseContributorReputation(rep: ContributorReputation): Promise<boolean> {
  if (!db) return false;
  try {
    const docId = rep.email.replace(/[.@]/g, '_');
    const repRef = doc(db, 'contributor_reputations', docId);
    await setDoc(repRef, rep, { merge: true });
    return true;
  } catch (err) {
    console.warn('Firebase upsertFirebaseContributorReputation error:', err);
    return false;
  }
}

export async function getFirebaseAuditLogs(): Promise<AuditLog[] | null> {
  if (!db) return null;
  try {
    const logsCol = collection(db, 'security_audit_logs');
    const querySnapshot = await getDocs(logsCol);
    const logs: AuditLog[] = [];
    querySnapshot.forEach((docSnap) => {
      logs.push(docSnap.data() as AuditLog);
    });
    return logs.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  } catch (err) {
    console.warn('Firebase getFirebaseAuditLogs error:', err);
    return null;
  }
}

export async function addFirebaseAuditLog(log: AuditLog): Promise<boolean> {
  if (!db) return false;
  try {
    const logRef = doc(db, 'security_audit_logs', log.id);
    await setDoc(logRef, log);
    return true;
  } catch (err) {
    console.warn('Firebase addFirebaseAuditLog error:', err);
    return false;
  }
}

// =========================================================================
// RATE CONFIDENCE & FRESHNESS ENGINE FIRESTORE SYNC
// =========================================================================

// 1. Official Provider / API Rates
export async function getFirebaseProviderRates(): Promise<any[] | null> {
  if (!db) return null;
  try {
    const ratesCol = collection(db, 'provider_rates');
    const snapshot = await getDocs(ratesCol);
    const rates: any[] = [];
    snapshot.forEach(docSnap => {
      rates.push({ id: docSnap.id, ...docSnap.data() });
    });
    return rates;
  } catch (err) {
    console.warn('Firebase getFirebaseProviderRates error:', err);
    return null;
  }
}

export async function upsertFirebaseProviderRate(rate: any): Promise<boolean> {
  if (!db) return false;
  try {
    const rateRef = doc(db, 'provider_rates', rate.id);
    await setDoc(rateRef, rate, { merge: true });
    return true;
  } catch (err) {
    console.warn('Firebase upsertFirebaseProviderRate error:', err);
    return false;
  }
}

// 2. Community Rate Submissions
export async function getFirebaseCommunitySubmissions(): Promise<CommunityRateSubmission[] | null> {
  if (!db) return null;
  try {
    const subsCol = collection(db, 'community_rate_submissions');
    const snapshot = await getDocs(subsCol);
    const subs: CommunityRateSubmission[] = [];
    snapshot.forEach(docSnap => {
      subs.push(docSnap.data() as CommunityRateSubmission);
    });
    return subs;
  } catch (err) {
    console.warn('Firebase getFirebaseCommunitySubmissions error:', err);
    return null;
  }
}

export async function upsertFirebaseCommunitySubmission(sub: CommunityRateSubmission): Promise<boolean> {
  if (!db) return false;
  try {
    const subRef = doc(db, 'community_rate_submissions', sub.submission_id);
    await setDoc(subRef, sub, { merge: true });
    return true;
  } catch (err) {
    console.warn('Firebase upsertFirebaseCommunitySubmission error:', err);
    return false;
  }
}

// 3. Community Rate Consensus
export async function getFirebaseCommunityConsensuses(): Promise<CommunityRateConsensus[] | null> {
  if (!db) return null;
  try {
    const consensusCol = collection(db, 'community_rate_consensus');
    const snapshot = await getDocs(consensusCol);
    const consensuses: CommunityRateConsensus[] = [];
    snapshot.forEach(docSnap => {
      consensuses.push(docSnap.data() as CommunityRateConsensus);
    });
    return consensuses;
  } catch (err) {
    console.warn('Firebase getFirebaseCommunityConsensuses error:', err);
    return null;
  }
}

export async function upsertFirebaseCommunityConsensus(consensus: CommunityRateConsensus): Promise<boolean> {
  if (!db) return false;
  try {
    const id = `${consensus.provider}_${consensus.corridor}`.replace(/\s+/g, '_');
    const docRef = doc(db, 'community_rate_consensus', id);
    await setDoc(docRef, consensus, { merge: true });
    return true;
  } catch (err) {
    console.warn('Firebase upsertFirebaseCommunityConsensus error:', err);
    return false;
  }
}

// 4. Market Reference Rates
export async function getFirebaseMarketReferenceRates(): Promise<MarketReferenceRate[] | null> {
  if (!db) return null;
  try {
    const refCol = collection(db, 'market_reference_rates');
    const snapshot = await getDocs(refCol);
    const rates: MarketReferenceRate[] = [];
    snapshot.forEach(docSnap => {
      rates.push(docSnap.data() as MarketReferenceRate);
    });
    return rates;
  } catch (err) {
    console.warn('Firebase getFirebaseMarketReferenceRates error:', err);
    return null;
  }
}

export async function upsertFirebaseMarketReferenceRate(rate: MarketReferenceRate): Promise<boolean> {
  if (!db) return false;
  try {
    const rateRef = doc(db, 'market_reference_rates', rate.id);
    await setDoc(rateRef, rate, { merge: true });
    return true;
  } catch (err) {
    console.warn('Firebase upsertFirebaseMarketReferenceRate error:', err);
    return false;
  }
}

// 5. Resolved Rates
export async function getFirebaseResolvedRates(): Promise<ResolvedRate[] | null> {
  if (!db) return null;
  try {
    const colRef = collection(db, 'resolved_rates');
    const snapshot = await getDocs(colRef);
    const rates: ResolvedRate[] = [];
    snapshot.forEach(docSnap => {
      rates.push(docSnap.data() as ResolvedRate);
    });
    return rates;
  } catch (err) {
    console.warn('Firebase getFirebaseResolvedRates error:', err);
    return null;
  }
}

export async function upsertFirebaseResolvedRate(resolved: ResolvedRate): Promise<boolean> {
  if (!db) return false;
  try {
    const id = `${resolved.provider_id}_${resolved.corridor_id}`.replace(/\s+/g, '_');
    const docRef = doc(db, 'resolved_rates', id);
    await setDoc(docRef, resolved, { merge: true });
    return true;
  } catch (err) {
    console.warn('Firebase upsertFirebaseResolvedRate error:', err);
    return false;
  }
}

// 6. Resolved Rates Audit History Log
export async function getFirebaseResolvedRateAuditHistory(): Promise<ResolvedRateAuditHistory[] | null> {
  if (!db) return null;
  try {
    const colRef = collection(db, 'resolved_rates_audit_history');
    const snapshot = await getDocs(colRef);
    const history: ResolvedRateAuditHistory[] = [];
    snapshot.forEach(docSnap => {
      history.push(docSnap.data() as ResolvedRateAuditHistory);
    });
    return history.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  } catch (err) {
    console.warn('Firebase getFirebaseResolvedRateAuditHistory error:', err);
    return null;
  }
}

export async function addFirebaseResolvedRateAuditLog(log: ResolvedRateAuditHistory): Promise<boolean> {
  if (!db) return false;
  try {
    const docRef = doc(db, 'resolved_rates_audit_history', log.id);
    await setDoc(docRef, log);
    return true;
  } catch (err) {
    console.warn('Firebase addFirebaseResolvedRateAuditLog error:', err);
    return false;
  }
}

// =========================================================================
// SIMPLE EVENT TRACKING & ANALYTICS SERVICE
// =========================================================================

export async function trackEvent(
  eventName: string,
  metadata: Record<string, any> = {}
): Promise<boolean> {
  const currentAuthUser = auth?.currentUser;
  
  // Get or create session ID in sessionStorage
  let sessionId = sessionStorage.getItem('sariremit_session_id');
  if (!sessionId) {
    sessionId = 'sess_' + Math.random().toString(36).substring(2, 15);
    sessionStorage.setItem('sariremit_session_id', sessionId);
  }

  const id = `evt_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const eventPayload = {
    id,
    user_id: currentAuthUser?.uid || null,
    session_id: sessionId,
    is_authenticated: !!currentAuthUser,
    event_type: metadata.event_type || 'interaction',
    event_name: eventName,
    page: metadata.page || window.location.pathname || 'home',
    corridor: metadata.corridor || null,
    provider: metadata.provider || null,
    amount: metadata.amount !== undefined ? Number(metadata.amount) : null,
    metadata: metadata,
    created_at: new Date().toISOString()
  };

  // Log locally for debugging
  console.log('📊 Track Event:', eventPayload);

  // Write to local storage for local fallbacks
  try {
    const localEventsRaw = localStorage.getItem('sariremit_analytics_events') || '[]';
    const localEvents = JSON.parse(localEventsRaw);
    localEvents.push(eventPayload);
    localStorage.setItem('sariremit_analytics_events', JSON.stringify(localEvents));
  } catch (e) {
    console.warn('Error saving event to localStorage:', e);
  }

  if (!db) return true;

  try {
    const eventRef = doc(db, 'analytics_events', id);
    await setDoc(eventRef, eventPayload);
    return true;
  } catch (err) {
    console.warn('Firebase trackEvent error:', err);
    return false;
  }
}

export async function getFirebaseAnalyticsEvents(): Promise<any[]> {
  const localSaved = localStorage.getItem('sariremit_analytics_events');
  const localEvents = localSaved ? JSON.parse(localSaved) : [];

  if (!db) {
    return localEvents;
  }

  try {
    const colRef = collection(db, 'analytics_events');
    const snapshot = await getDocs(colRef);
    const fbEvents: any[] = [];
    snapshot.forEach(docSnap => {
      fbEvents.push(docSnap.data());
    });

    const combined = [...fbEvents];
    localEvents.forEach((le: any) => {
      if (!combined.some(fe => fe.id === le.id)) {
        combined.push(le);
      }
    });

    return combined.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  } catch (err) {
    console.warn('Firebase getFirebaseAnalyticsEvents error:', err);
    return localEvents.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }
}

// =========================================================================
// USER FEEDBACK DB OPERATIONS
// =========================================================================

export interface UserFeedback {
  id: string;
  user_id: string | null;
  transfer_record_id?: string;
  recommendation_id?: string;
  provider: string;
  corridor: string;
  helpfulness_rating: 'Very helpful' | 'Helpful' | 'Not sure' | 'Not helpful';
  amount_accuracy: 'Yes, it matched' | 'Almost matched' | 'No, it was different';
  transfer_completed: boolean;
  issue_type?: string;
  comment: string;
  status: 'pending' | 'reviewed' | 'archived';
  admin_notes?: string;
  created_at: string;
  reviewed_at?: string;
  reviewed_by?: string;
}

export async function submitUserFeedback(feedback: UserFeedback): Promise<boolean> {
  const id = feedback.id || `fdb_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const feedbackWithId = { ...feedback, id };

  const localSaved = localStorage.getItem('sariremit_user_feedback') || '[]';
  const localFeedback = JSON.parse(localSaved);
  localFeedback.push(feedbackWithId);
  localStorage.setItem('sariremit_user_feedback', JSON.stringify(localFeedback));

  if (!db) return true;

  try {
    const feedbackRef = doc(db, 'user_feedback', id);
    await setDoc(feedbackRef, feedbackWithId);
    return true;
  } catch (err) {
    console.error('Firebase submitUserFeedback error:', err);
    return false;
  }
}

export async function getFirebaseUserFeedback(): Promise<UserFeedback[]> {
  const localSaved = localStorage.getItem('sariremit_user_feedback');
  const localFeedback = localSaved ? JSON.parse(localSaved) : [];

  if (!db) {
    return localFeedback;
  }

  try {
    const colRef = collection(db, 'user_feedback');
    const snapshot = await getDocs(colRef);
    const fbFeedback: UserFeedback[] = [];
    snapshot.forEach(docSnap => {
      fbFeedback.push(docSnap.data() as UserFeedback);
    });

    const combined = [...fbFeedback];
    localFeedback.forEach((lf: any) => {
      if (!combined.some(ff => ff.id === lf.id)) {
        combined.push(lf);
      }
    });

    return combined.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  } catch (err) {
    console.warn('Firebase getFirebaseUserFeedback error:', err);
    return localFeedback.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }
}

export async function updateUserFeedbackStatus(
  id: string,
  status: 'pending' | 'reviewed' | 'archived',
  adminNotes?: string,
  adminUser?: string
): Promise<boolean> {
  const localSaved = localStorage.getItem('sariremit_user_feedback');
  let localFeedback = localSaved ? JSON.parse(localSaved) : [];
  localFeedback = localFeedback.map((f: any) => {
    if (f.id === id) {
      return {
        ...f,
        status,
        admin_notes: adminNotes !== undefined ? adminNotes : f.admin_notes,
        reviewed_at: new Date().toISOString(),
        reviewed_by: adminUser || 'Admin'
      };
    }
    return f;
  });
  localStorage.setItem('sariremit_user_feedback', JSON.stringify(localFeedback));

  if (!db) return true;

  try {
    const feedbackRef = doc(db, 'user_feedback', id);
    const updatePayload: Record<string, any> = {
      status,
      reviewed_at: new Date().toISOString(),
      reviewed_by: adminUser || 'Admin'
    };
    if (adminNotes !== undefined) {
      updatePayload.admin_notes = adminNotes;
    }
    await updateDoc(feedbackRef, updatePayload);
    return true;
  } catch (err) {
    console.error('Firebase updateUserFeedbackStatus error:', err);
    return false;
  }
}

// =========================================================================
// ADMIN ACTIONS & ACTIVITY LOGS
// =========================================================================

export interface AdminActivityLog {
  id: string;
  admin_user_id: string;
  admin_email: string;
  action_type: string;
  target_collection?: string;
  target_id?: string;
  details: string;
  created_at: string;
}

export async function logAdminActivity(
  actionType: string,
  details: string,
  targetCollection?: string,
  targetId?: string
): Promise<boolean> {
  const currentAuthUser = auth?.currentUser;
  const adminEmail = currentAuthUser?.email || 'admin@sariremit.com';
  const adminUserId = currentAuthUser?.uid || 'admin-static-id';

  const id = `act_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const logPayload: AdminActivityLog = {
    id,
    admin_user_id: adminUserId,
    admin_email: adminEmail,
    action_type: actionType,
    target_collection: targetCollection || undefined,
    target_id: targetId || undefined,
    details,
    created_at: new Date().toISOString()
  };

  const localSaved = localStorage.getItem('sariremit_admin_activity_logs') || '[]';
  const localLogs = JSON.parse(localSaved);
  localLogs.push(logPayload);
  localStorage.setItem('sariremit_admin_activity_logs', JSON.stringify(localLogs));

  if (!db) return true;

  try {
    const logRef = doc(db, 'admin_activity_logs', id);
    await setDoc(logRef, logPayload);
    return true;
  } catch (err) {
    console.error('Firebase logAdminActivity error:', err);
    return false;
  }
}

export async function getFirebaseAdminActivityLogs(): Promise<AdminActivityLog[]> {
  const localSaved = localStorage.getItem('sariremit_admin_activity_logs');
  const localLogs = localSaved ? JSON.parse(localSaved) : [];

  if (!db) {
    return localLogs;
  }

  try {
    const colRef = collection(db, 'admin_activity_logs');
    const snapshot = await getDocs(colRef);
    const fbLogs: AdminActivityLog[] = [];
    snapshot.forEach(docSnap => {
      fbLogs.push(docSnap.data() as AdminActivityLog);
    });

    const combined = [...fbLogs];
    localLogs.forEach((le: any) => {
      if (!combined.some(fe => fe.id === le.id)) {
        combined.push(le);
      }
    });

    return combined.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  } catch (err) {
    console.warn('Firebase getFirebaseAdminActivityLogs error:', err);
    return localLogs.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }
}

// =========================================================================
// REGISTERED USER PROFILES LIST
// =========================================================================

export async function getFirebaseProfiles(): Promise<UserProfile[]> {
  const localSaved = localStorage.getItem('sariremit_profiles');
  const localProfiles = localSaved ? JSON.parse(localSaved) : [];

  if (!db) {
    return localProfiles;
  }

  try {
    const colRef = collection(db, 'profiles');
    const snapshot = await getDocs(colRef);
    const fbProfiles: UserProfile[] = [];
    snapshot.forEach(docSnap => {
      const data = docSnap.data() as UserProfile;
      fbProfiles.push({ ...data, userId: docSnap.id });
    });

    const combined = [...fbProfiles];
    localProfiles.forEach((lp: any) => {
      if (!combined.some(fp => fp.name === lp.name && fp.joinedDate === lp.joinedDate)) {
        combined.push(lp);
      }
    });

    return combined;
  } catch (err) {
    console.warn('Firebase getFirebaseProfiles error:', err);
    return localProfiles;
  }
}

// 6. Post-Onboarding Trust Survey
export interface TrustSurvey {
  id: string;
  user_id: string;
  confidence_rating: number;
  used_recommended_provider: string; // 'Yes' or 'No'
  comment: string;
  timestamp: string;
  created_at: string;
}

export async function submitTrustSurvey(survey: TrustSurvey): Promise<boolean> {
  const id = survey.id || `srv_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const surveyWithId = { ...survey, id };

  // Save to local fallback first
  const localSaved = localStorage.getItem('sariremit_trust_surveys') || '[]';
  const localSurveys = JSON.parse(localSaved);
  localSurveys.push(surveyWithId);
  localStorage.setItem('sariremit_trust_surveys', JSON.stringify(localSurveys));

  if (!db) {
    return true;
  }

  try {
    const docRef = doc(db, 'trust_surveys', id);
    await setDoc(docRef, surveyWithId);
    return true;
  } catch (err) {
    console.warn('Firebase submitTrustSurvey error:', err);
    return false;
  }
}

export async function getTrustSurveys(): Promise<TrustSurvey[]> {
  const localSaved = localStorage.getItem('sariremit_trust_surveys') || '[]';
  const localSurveys = JSON.parse(localSaved);

  if (!db) {
    return localSurveys;
  }

  try {
    const colRef = collection(db, 'trust_surveys');
    const snapshot = await getDocs(colRef);
    const fbSurveys: TrustSurvey[] = [];
    snapshot.forEach(docSnap => {
      fbSurveys.push(docSnap.data() as TrustSurvey);
    });
    return fbSurveys;
  } catch (err) {
    console.warn('Firebase getTrustSurveys error:', err);
    return localSurveys;
  }
}

// 6b. Post-Onboarding User First Impression Trust & Confidence Survey
export async function submitUserFirstImpressionFeedback(feedback: UserFirstImpressionFeedback): Promise<boolean> {
  const id = feedback.id || `fdb_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const feedbackWithId = { ...feedback, id };

  // Save to local fallback first
  const localSaved = localStorage.getItem('sariremit_user_first_impression_feedback') || '[]';
  const localFeedback = JSON.parse(localSaved);
  localFeedback.push(feedbackWithId);
  localStorage.setItem('sariremit_user_first_impression_feedback', JSON.stringify(localFeedback));

  if (!db) {
    return true;
  }

  try {
    const docRef = doc(db, 'user_first_impression_feedback', id);
    await setDoc(docRef, feedbackWithId);
    return true;
  } catch (err) {
    console.warn('Firebase submitUserFirstImpressionFeedback error:', err);
    return false;
  }
}

export async function getUserFirstImpressionFeedbackList(): Promise<UserFirstImpressionFeedback[]> {
  const localSaved = localStorage.getItem('sariremit_user_first_impression_feedback') || '[]';
  const localFeedback = JSON.parse(localSaved);

  if (!db) {
    return localFeedback;
  }

  try {
    const colRef = collection(db, 'user_first_impression_feedback');
    const snapshot = await getDocs(colRef);
    const fbFeedback: UserFirstImpressionFeedback[] = [];
    snapshot.forEach(docSnap => {
      fbFeedback.push(docSnap.data() as UserFirstImpressionFeedback);
    });
    return fbFeedback;
  } catch (err) {
    console.warn('Firebase getUserFirstImpressionFeedbackList error:', err);
    return localFeedback;
  }
}

// 7. Market API Health Status
export interface MarketApiHealth {
  id: string;
  provider_name: string;
  status: 'Healthy' | 'Needs Review' | 'Stale' | 'Critical';
  last_attempt_at: string;
  last_success_at: string;
  consecutive_failures: number;
  error_message: string;
  response_time_ms: number;
}

export async function updateMarketApiHealth(health: MarketApiHealth): Promise<boolean> {
  const localSaved = localStorage.getItem('sariremit_market_api_health') || '[]';
  const localHealth: MarketApiHealth[] = JSON.parse(localSaved);
  const existingIdx = localHealth.findIndex(h => h.id === health.id);
  if (existingIdx !== -1) {
    localHealth[existingIdx] = health;
  } else {
    localHealth.push(health);
  }
  localStorage.setItem('sariremit_market_api_health', JSON.stringify(localHealth));

  if (!db) {
    return true;
  }

  try {
    const docRef = doc(db, 'market_api_health', health.id);
    await setDoc(docRef, health, { merge: true });
    return true;
  } catch (err) {
    console.warn('Firebase updateMarketApiHealth error:', err);
    return false;
  }
}

export async function getMarketApiHealth(): Promise<MarketApiHealth[]> {
  const localSaved = localStorage.getItem('sariremit_market_api_health') || '[]';
  const localHealth = JSON.parse(localSaved);

  if (!db) {
    return localHealth;
  }

  try {
    const colRef = collection(db, 'market_api_health');
    const snapshot = await getDocs(colRef);
    const fbHealth: MarketApiHealth[] = [];
    snapshot.forEach(docSnap => {
      fbHealth.push(docSnap.data() as MarketApiHealth);
    });
    return fbHealth;
  } catch (err) {
    console.warn('Firebase getMarketApiHealth error:', err);
    return localHealth;
  }
}

// 8. Market Reference Audit
export interface MarketReferenceAudit {
  id: string;
  timestamp: string;
  action_type: 'API Fetch' | 'Manual Refresh' | 'Failover Triggered' | 'All Providers Failed';
  details: string;
  actor: string;
}

export async function addMarketReferenceAudit(audit: MarketReferenceAudit): Promise<boolean> {
  const localSaved = localStorage.getItem('sariremit_market_reference_audit') || '[]';
  const localAudits: MarketReferenceAudit[] = JSON.parse(localSaved);
  localAudits.unshift(audit);
  localStorage.setItem('sariremit_market_reference_audit', JSON.stringify(localAudits.slice(0, 100)));

  if (!db) {
    return true;
  }

  try {
    const docRef = doc(db, 'market_reference_audit', audit.id);
    await setDoc(docRef, audit);
    return true;
  } catch (err) {
    console.warn('Firebase addMarketReferenceAudit error:', err);
    return false;
  }
}

export async function getMarketReferenceAudits(): Promise<MarketReferenceAudit[]> {
  const localSaved = localStorage.getItem('sariremit_market_reference_audit') || '[]';
  const localAudits = JSON.parse(localSaved);

  if (!db) {
    return localAudits;
  }

  try {
    const colRef = collection(db, 'market_reference_audit');
    const snapshot = await getDocs(colRef);
    const fbAudits: MarketReferenceAudit[] = [];
    snapshot.forEach(docSnap => {
      fbAudits.push(docSnap.data() as MarketReferenceAudit);
    });
    return fbAudits.sort((a,b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  } catch (err) {
    console.warn('Firebase getMarketReferenceAudits error:', err);
    return localAudits;
  }
}

export async function submitRreSurveyFeedback(feedback: RreSurveyFeedback): Promise<boolean> {
  const id = feedback.id || `fdb_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const feedbackWithId = { ...feedback, id };

  const localSaved = localStorage.getItem('sariremit_rre_survey_feedback') || '[]';
  const localFeedback = JSON.parse(localSaved);
  localFeedback.push(feedbackWithId);
  localStorage.setItem('sariremit_rre_survey_feedback', JSON.stringify(localFeedback));

  if (!db) return true;

  try {
    const feedbackRef = doc(db, 'user_feedback', id);
    await setDoc(feedbackRef, feedbackWithId);
    return true;
  } catch (err) {
    console.error('Firebase submitRreSurveyFeedback error:', err);
    return false;
  }
}

export async function getRreSurveyFeedbackList(): Promise<RreSurveyFeedback[]> {
  const localSaved = localStorage.getItem('sariremit_rre_survey_feedback');
  const localFeedback = localSaved ? JSON.parse(localSaved) : [];

  if (!db) {
    return localFeedback;
  }

  try {
    const colRef = collection(db, 'user_feedback');
    const snapshot = await getDocs(colRef);
    const fbFeedback: RreSurveyFeedback[] = [];
    snapshot.forEach(docSnap => {
      const data = docSnap.data();
      if (data && data.recommendationRating) {
        fbFeedback.push(data as RreSurveyFeedback);
      }
    });

    const combined = [...fbFeedback];
    localFeedback.forEach((lf: any) => {
      if (!combined.some(ff => ff.id === lf.id)) {
        combined.push(lf);
      }
    });

    return combined.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  } catch (err) {
    console.warn('Firebase getRreSurveyFeedbackList error:', err);
    return localFeedback.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }
}


