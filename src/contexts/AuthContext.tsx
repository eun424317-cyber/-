import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { onAuthStateChanged, signInWithPopup, signOut, User } from 'firebase/auth';
import { auth, googleAuthProvider } from '../lib/firebase.ts';
import { CertificateRecord, EnrollmentItem, UserProfile } from '../types/platform.ts';

interface AuthContextValue {
  firebaseUser: User | null;
  profile: UserProfile | null;
  enrollments: EnrollmentItem[];
  certificates: CertificateRecord[];
  authLoading: boolean;
  authError: string | null;
  getToken: () => Promise<string | null>;
  signInWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
  refreshDashboard: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [firebaseUser, setFirebaseUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [enrollments, setEnrollments] = useState<EnrollmentItem[]>([]);
  const [certificates, setCertificates] = useState<CertificateRecord[]>([]);
  const [authLoading, setAuthLoading] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);

  const fetchDashboard = useCallback(async (user: User) => {
    try {
      const token = await user.getIdToken();
      const res = await fetch('/api/me', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) {
        const errBody = await res.json().catch(() => ({}));
        throw new Error(errBody.error || '회원 정보를 불러오지 못했습니다.');
      }
      const data = await res.json();
      setProfile(data.user);
      setEnrollments(data.enrollments ?? []);
      setCertificates(data.certificates ?? []);
      setAuthError(null);
    } catch (err: any) {
      console.error('Failed to sync user dashboard:', err);
      setAuthError(err.message || '회원 정보 동기화 중 오류가 발생했습니다.');
    }
  }, []);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      setFirebaseUser(user);
      if (user) {
        await fetchDashboard(user);
      } else {
        setProfile(null);
        setEnrollments([]);
        setCertificates([]);
      }
      setAuthLoading(false);
    });
    return () => unsub();
  }, [fetchDashboard]);

  const getToken = useCallback(async () => {
    if (!auth.currentUser) return null;
    return await auth.currentUser.getIdToken();
  }, []);

  const signInWithGoogle = useCallback(async () => {
    try {
      setAuthError(null);
      const cred = await signInWithPopup(auth, googleAuthProvider);
      await fetchDashboard(cred.user);
    } catch (err: any) {
      console.error('Google Sign-In failed:', err);
      setAuthError('로그인 창이 닫혔거나 인증에 실패했습니다. 다시 시도해 주세요.');
    }
  }, [fetchDashboard]);

  const logout = useCallback(async () => {
    await signOut(auth);
    setProfile(null);
    setEnrollments([]);
    setCertificates([]);
  }, []);

  const refreshDashboard = useCallback(async () => {
    if (auth.currentUser) {
      await fetchDashboard(auth.currentUser);
    }
  }, [fetchDashboard]);

  return (
    <AuthContext.Provider
      value={{
        firebaseUser,
        profile,
        enrollments,
        certificates,
        authLoading,
        authError,
        getToken,
        signInWithGoogle,
        logout,
        refreshDashboard,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}
