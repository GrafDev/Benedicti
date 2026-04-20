import { X, AlertTriangle } from 'lucide-react';
import { createPortal } from 'react-dom';
import styles from './ConfirmationModal.module.css';

interface ConfirmationModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    title: string;
    message: string;
    confirmText?: string;
    cancelText?: string;
    isDestructive?: boolean;
}

export default function ConfirmationModal({
    isOpen,
    onClose,
    onConfirm,
    title,
    message,
    confirmText = 'Confirm',
    cancelText = 'Cancel',
    isDestructive = false
}: ConfirmationModalProps) {
    if (!isOpen) return null;

    return createPortal(
        <div className={styles.overlay} onClick={onClose}>
            <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
                <button
                    onClick={onClose}
                    className={styles.closeButton}
                >
                    <X size={20} />
                </button>

                <div className={styles.content}>
                    <div className={`${styles.iconWrapper} ${isDestructive ? styles.destructiveIcon : ''}`}>
                        <AlertTriangle size={32} />
                    </div>
                    
                    <h2 className={styles.title}>{title}</h2>
                    <p className={styles.message}>{message}</p>
                </div>

                <div className={styles.actions}>
                    <button
                        onClick={onClose}
                        className={styles.cancelButton}
                    >
                        {cancelText}
                    </button>
                    <button
                        onClick={() => {
                            onConfirm();
                            onClose();
                        }}
                        className={`${styles.confirmButton} ${isDestructive ? styles.destructiveButton : ''}`}
                    >
                        {confirmText}
                    </button>
                </div>
            </div>
        </div>,
        document.getElementById('portal-root')!
    );
}
