import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { X, Mail } from 'lucide-react';
import styles from './AuthModal.module.css';

interface AuthModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export default function AuthModal({ isOpen, onClose }: AuthModalProps) {
    const [isLogin, setIsLogin] = useState(true);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const { signInWithGoogle, loginWithEmail, signupWithEmail } = useAuth();

    if (!isOpen) return null;

    const getErrorMessage = (error: any) => {
        switch (error.code) {
            case 'auth/invalid-credential':
                return 'Incorrect email or password.';
            case 'auth/user-not-found':
                return 'No account found with this email.';
            case 'auth/wrong-password':
                return 'Incorrect password.';
            case 'auth/email-already-in-use':
                return 'This email is already registered.';
            case 'auth/weak-password':
                return 'Password should be at least 6 characters.';
            case 'auth/network-request-failed':
                return 'Network error. Check your connection.';
            case 'auth/popup-closed-by-user':
                return 'Sign in cancelled.';
            default:
                return error.message;
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        try {
            if (isLogin) {
                await loginWithEmail(email, password);
            } else {
                await signupWithEmail(email, password);
            }
            onClose();
        } catch (err: any) {
            setError(getErrorMessage(err));
        }
    };

    const handleGoogleSignIn = async () => {
        try {
            await signInWithGoogle();
            onClose();
        } catch (err: any) {
            setError(getErrorMessage(err));
        }
    };

    return (
        <div className={styles.overlay}>
            <div className={styles.modal}>
                <button
                    onClick={onClose}
                    className={styles.closeButton}
                >
                    <X size={24} />
                </button>

                <h2 className={styles.title}>
                    {isLogin ? 'Welcome Back' : 'Create Account'}
                </h2>

                {error && (
                    <div className={styles.error}>
                        {error}
                    </div>
                )}

                <div className={styles.socialButtons}>
                    <button
                        onClick={handleGoogleSignIn}
                        className={styles.socialButton}
                    >
                        <img src="https://www.svgrepo.com/show/475656/google-color.svg" className={styles.googleIcon} alt="Google" />
                        Continue with Google
                    </button>
                </div>

                <div className={styles.divider}>
                    <div className={styles.dividerLineContainer}>
                        <div className={styles.dividerLine}></div>
                    </div>
                    <div className={styles.dividerTextContainer}>
                        <span className={styles.dividerText}>Or continue with email</span>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className={styles.form}>
                    <div className={styles.inputGroup}>
                        <label className={styles.label}>Email</label>
                        <div className={styles.inputWrapper}>
                            <Mail className={styles.inputIcon} size={20} />
                            <input
                                type="email"
                                required
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className={styles.input}
                                placeholder="you@example.com"
                            />
                        </div>
                    </div>

                    <div className={styles.inputGroup}>
                        <label className={styles.label}>Password</label>
                        <input
                            type="password"
                            required
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className={`${styles.input} ${styles.passwordInput} `}
                            placeholder="••••••••"
                            minLength={6}
                        />
                    </div>

                    <button
                        type="submit"
                        className={styles.submitButton}
                    >
                        {isLogin ? 'Sign In' : 'Sign Up'}
                    </button>
                </form>

                <p className={styles.footer}>
                    {isLogin ? "Don't have an account? " : "Already have an account? "}
                    <button
                        onClick={() => setIsLogin(!isLogin)}
                        className={styles.toggleButton}
                    >
                        {isLogin ? 'Sign up' : 'Log in'}
                    </button>
                </p>
            </div>
        </div>
    );
}
