/**
 * Speech Utility using Web Speech API
 */

class SpeechService {
    private synth: SpeechSynthesis;
    private voices: SpeechSynthesisVoice[] = [];
    public isMuted: boolean = false;

    constructor() {
        this.synth = window.speechSynthesis;
        this.loadVoices();
        
        // Initial state from localStorage
        const saved = localStorage.getItem('benedicti_audio_muted');
        this.isMuted = saved !== null ? JSON.parse(saved) : false;
        
        // Some browsers load voices asynchronously
        if (this.synth.onvoiceschanged !== undefined) {
            this.synth.onvoiceschanged = () => this.loadVoices();
        }
    }

    private loadVoices() {
        this.voices = this.synth.getVoices();
    }

    /**
     * Toggles global mute state
     */
    public toggleMute(): boolean {
        this.isMuted = !this.isMuted;
        localStorage.setItem('benedicti_audio_muted', JSON.stringify(this.isMuted));
        return this.isMuted;
    }

    /**
     * Finds the best voice for a given language code (e.g., 'en', 'ru')
     */
    private findVoice(lang: string): SpeechSynthesisVoice | null {
        const langLower = lang.toLowerCase();
        
        // Priority 1: Exact match and high quality (Premium/Enhanced)
        const premium = this.voices.find(v => 
            v.lang.toLowerCase().includes(langLower) && 
            (v.name.includes('Premium') || v.name.includes('Enhanced') || v.name.includes('Siri'))
        );
        if (premium) return premium;

        // Priority 2: Standard match for the language
        const standard = this.voices.find(v => v.lang.toLowerCase().includes(langLower));
        return standard || null;
    }

    /**
     * Speaks the given text in the specified language.
     * Returns a Promise that resolves when speech finishes.
     */
    public speak(text: string, lang: string = 'en'): Promise<void> {
        return new Promise((resolve) => {
            if (!text || !this.synth || this.isMuted) {
                resolve();
                return;
            }

            // Cancel any ongoing speech
            this.synth.cancel();

            const utterance = new SpeechSynthesisUtterance(text);
            const voice = this.findVoice(lang);
            
            if (voice) {
                utterance.voice = voice;
            } else {
                // Fallback: set the lang string directly
                utterance.lang = lang === 'en' ? 'en-US' : lang === 'ru' ? 'ru-RU' : lang;
            }

            utterance.rate = 1.0;
            utterance.pitch = 1.0;
            utterance.volume = 1.0;

            utterance.onend = () => {
                resolve();
            };

            utterance.onerror = (event) => {
                console.error('Speech synthesis error:', event);
                resolve(); // Resolve anyway to avoid hanging promise chains
            };

            this.synth.speak(utterance);
        });
    }

    public cancel() {
        if (this.synth) {
            this.synth.cancel();
        }
    }
}

export const speechService = new SpeechService();
