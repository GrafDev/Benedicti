import React, { createContext, useContext, useEffect, useState } from 'react';
import {
    onAuthStateChanged,
    signInWithPopup,
    signInWithRedirect,
    getRedirectResult,
    GoogleAuthProvider,
    OAuthProvider,
    signOut,
    signInWithEmailAndPassword,
    createUserWithEmailAndPassword,
    updateProfile,
    sendPasswordResetEmail,
    verifyPasswordResetCode,
    confirmPasswordReset
} from 'firebase/auth';
import type { User } from 'firebase/auth';
import { auth } from '../firebase';

interface AuthContextType {
    currentUser: User | null;
    loading: boolean;
    signInWithGoogle: () => Promise<void>;
    signInWithApple: () => Promise<void>;
    loginWithEmail: (email: string, password: string) => Promise<void>;
    signupWithEmail: (email: string, password: string) => Promise<void>;
    updateProfileName: (name: string) => Promise<void>;
    resetPassword: (email: string) => Promise<void>;
    verifyResetCode: (code: string) => Promise<string>;
    confirmReset: (code: string, newPass: string) => Promise<void>;
    logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [currentUser, setCurrentUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Safety timeout — if Firebase doesn't respond in 2s, unblock the app
        const timeout = setTimeout(() => setLoading(false), 2000);

        const unsubscribe = onAuthStateChanged(auth, (user) => {
            clearTimeout(timeout);
            setCurrentUser(user);
            setLoading(false);
        });

        // Handle redirect result for mobile logins
        getRedirectResult(auth).then((result) => {
            if (result?.user) {
                console.log('Successfully logged in via redirect:', result.user.email);
                setCurrentUser(result.user);
            }
        }).catch((error) => {
            console.error('Error handling redirect result', error);
            // On iOS/Safari standalone, this sometimes fails due to non-persistent session
            if (error.code === 'auth/internal-error') {
                console.warn('Possible PWA session loss detected. Ensure authDomain is correct.');
            }
        });

        return () => {
            clearTimeout(timeout);
            unsubscribe();
        };
    }, []);

    const isStandaloneContext = () => {
        return (window.matchMedia('(display-mode: standalone)').matches) || (window.navigator as any).standalone;
    };

    const signInWithGoogle = async () => {
        const provider = new GoogleAuthProvider();
        try {
            // Use redirect ONLY for PWA standalone mode
            if (isStandaloneContext()) {
                await signInWithRedirect(auth, provider);
            } else {
                // Popups work fine in mobile Chrome/Safari browsers
                await signInWithPopup(auth, provider);
            }
        } catch (error) {
            console.error('Error signing in with Google', error);
            throw error;
        }
    };

    const signInWithApple = async () => {
        const provider = new OAuthProvider('apple.com');
        try {
            if (isStandaloneContext()) {
                await signInWithRedirect(auth, provider);
            } else {
                await signInWithPopup(auth, provider);
            }
        } catch (error) {
            console.error('Error signing in with Apple', error);
            throw error;
        }
    };

    const loginWithEmail = async (email: string, password: string) => {
        try {
            await signInWithEmailAndPassword(auth, email, password);
        } catch (error) {
            console.error('Error signing in with email and password', error);
            throw error;
        }
    };

    const signupWithEmail = async (email: string, password: string) => {
        try {
            await createUserWithEmailAndPassword(auth, email, password);
        } catch (error) {
            console.error('Error signing up with email and password', error);
            throw error;
        }
    };

    const updateProfileName = async (name: string) => {
        if (!auth.currentUser) return;
        try {
            await updateProfile(auth.currentUser, { displayName: name });
            // Refresh local user state to reflect changes
            setCurrentUser({ ...auth.currentUser });
        } catch (error) {
            console.error('Error updating profile name', error);
            throw error;
        }
    };

    const resetPassword = async (email: string) => {
        try {
            // Get language from localStorage or context directly
            const currentLang = localStorage.getItem('app_lang') || 'en';
            auth.languageCode = currentLang;
            await sendPasswordResetEmail(auth, email);
        } catch (error) {
            console.error('Error sending password reset email', error);
            throw error;
        }
    };

    const verifyResetCode = (code: string) => verifyPasswordResetCode(auth, code);
    
    const confirmReset = (code: string, newPass: string) => confirmPasswordReset(auth, code, newPass);

    const logout = () => signOut(auth);

    const value = {
        currentUser,
        loading,
        signInWithGoogle,
        signInWithApple,
        loginWithEmail,
        signupWithEmail,
        updateProfileName,
        resetPassword,
        verifyResetCode,
        confirmReset,
        logout
    };

    if (loading) {
        return (
            <AuthContext.Provider value={value}>
                <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    height: '100vh',
                    flexDirection: 'column',
                    gap: '1rem',
                    color: '#6b7280'
                }}>
                    <svg
                        style={{ animation: 'spin 1s linear infinite', width: 40, height: 40, color: '#2563eb' }}
                        xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"
                    >
                        <circle style={{ opacity: 0.25 }} cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path style={{ opacity: 0.75 }} fill="currentColor"
                            d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
                    </svg>
                    <span style={{ fontSize: '0.9rem' }}>Loading…</span>
                </div>
            </AuthContext.Provider>
        );
    }

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};
