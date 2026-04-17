import { X, Share, PlusSquare, Monitor, Layout } from 'lucide-react';
import styles from './InstallInstructions.module.css';

interface InstallInstructionsProps {
    isOpen: boolean;
    onClose: () => void;
    isMac?: boolean;
}

export default function InstallInstructions({ isOpen, onClose, isMac }: InstallInstructionsProps) {
    if (!isOpen) return null;

    return (
        <div className={styles.overlay} onClick={onClose}>
            <div className={styles.modal} onClick={e => e.stopPropagation()}>
                <button className={styles.closeButton} onClick={onClose} aria-label="Close">
                    <X size={24} />
                </button>
                
                <h2 className={styles.title}>Install benetict</h2>
                
                <div className={styles.steps}>
                    {isMac ? (
                        <>
                            <div className={styles.step}>
                                <div className={styles.stepNumber}>1</div>
                                <div className={styles.stepContent}>
                                    Click <span className={styles.highlight}>'File'</span> in the Safari menu bar at the top of your screen.
                                </div>
                            </div>
                            <div className={styles.step}>
                                <div className={styles.stepNumber}>2</div>
                                <div className={styles.stepContent}>
                                    Select <span className={styles.iconWrap}><PlusSquare size={18} /></span> <span className={styles.highlight}>'Add to Dock'</span>.
                                </div>
                            </div>
                        </>
                    ) : (
                        <>
                            <div className={styles.step}>
                                <div className={styles.stepNumber}>1</div>
                                <div className={styles.stepContent}>
                                    Tap the <span className={styles.iconWrap}><Share size={18} /></span> <span className={styles.highlight}>Share</span> button in the bottom menu bar of Safari.
                                </div>
                            </div>
                            
                            <div className={styles.step}>
                                <div className={styles.stepNumber}>2</div>
                                <div className={styles.stepContent}>
                                    Scroll down and select <span className={styles.iconWrap}><PlusSquare size={18} /></span> <span className={styles.highlight}>"Add to Home Screen"</span>.
                                </div>
                            </div>
                        </>
                    )}
                    
                    <div className={styles.step}>
                        <div className={styles.stepNumber}>{isMac ? '3' : '3'}</div>
                        <div className={styles.stepContent}>
                            Review the details and click <span className={styles.highlight}>{isMac ? "'Add'" : "'Add'"}</span> — and you're done!
                        </div>
                    </div>
                </div>
                
                <div className={styles.footer}>
                    Enjoy the sovereign experience from your home screen.
                </div>
            </div>
        </div>
    );
}
