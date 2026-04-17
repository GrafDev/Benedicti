import { useState } from 'react';
import { Volume2, VolumeX } from 'lucide-react';
import { speechService } from '../utils/speechUtils';
import styles from './SoundToggle.module.css';

export default function SoundToggle() {
    const [isMuted, setIsMuted] = useState(speechService.isMuted);

    const handleToggle = () => {
        const newState = speechService.toggleMute();
        setIsMuted(newState);
    };

    return (
        <button 
            className={`${styles.toggleButton} ${isMuted ? styles.muted : ''}`}
            onClick={handleToggle}
            title={isMuted ? "Unmute All" : "Mute All"}
            aria-label="Toggle Sound"
        >
            {isMuted ? <VolumeX size={24} /> : <Volume2 size={24} />}
        </button>
    );
}
