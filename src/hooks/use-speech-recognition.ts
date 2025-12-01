import { useState, useEffect, useCallback, useRef } from 'react';
import { getPreferredLanguage, type LanguageOption } from '@/lib/language-config';

interface SpeechRecognition extends EventTarget {
    continuous: boolean;
    interimResults: boolean;
    lang: string;
    start: () => void;
    stop: () => void;
    abort: () => void;
    onresult: (event: any) => void;
    onerror: (event: any) => void;
    onend: () => void;
}

declare global {
    interface Window {
        SpeechRecognition: any;
        webkitSpeechRecognition: any;
    }
}

export function useSpeechRecognition(language?: LanguageOption) {
    const [isListening, setIsListening] = useState(false);
    const [transcript, setTranscript] = useState('');
    const recognitionRef = useRef<SpeechRecognition | null>(null);
    
    // Use provided language or get from preferences
    const selectedLanguage = language || getPreferredLanguage();

    useEffect(() => {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (SpeechRecognition) {
            recognitionRef.current = new SpeechRecognition();
            if (recognitionRef.current) {
                recognitionRef.current.continuous = true;
                recognitionRef.current.interimResults = true;
                // Use the selected language instead of hardcoded 'en-US'
                recognitionRef.current.lang = selectedLanguage.speechCode;
                
                console.log(`🌐 Speech recognition configured for: ${selectedLanguage.name} (${selectedLanguage.speechCode})`);

                recognitionRef.current.onresult = (event: any) => {
                    let finalTranscript = '';
                    for (let i = event.resultIndex; i < event.results.length; ++i) {
                        if (event.results[i].isFinal) {
                            finalTranscript += event.results[i][0].transcript;
                            // NOTE: We're now handling transcription via Gemini Live API's inputTranscription
                            // So we don't need to dispatch events from here anymore
                            console.log(`Speech recognition final result (${selectedLanguage.speechCode}):`, event.results[i][0].transcript);
                        }
                    }
                };

                recognitionRef.current.onerror = (event: any) => {
                    console.error('Speech recognition error', event.error);
                    if (event.error === 'language-not-supported') {
                        console.warn(`⚠️ Language ${selectedLanguage.speechCode} may not be supported by your browser`);
                    }
                    setIsListening(false);
                };

                recognitionRef.current.onend = () => {
                    setIsListening(false);
                };
            }
        }
        // Re-initialize when language changes
    }, [selectedLanguage.speechCode, selectedLanguage.name]);

    const startListening = useCallback(() => {
        if (recognitionRef.current && !isListening) {
            try {
                recognitionRef.current.start();
                setIsListening(true);
            } catch (error) {
                console.error("Error starting speech recognition:", error);
            }
        }
    }, [isListening]);

    const stopListening = useCallback(() => {
        if (recognitionRef.current && isListening) {
            recognitionRef.current.stop();
            setIsListening(false);
        }
    }, [isListening]);

    return {
        isListening,
        startListening,
        stopListening,
        selectedLanguage,
        hasSupport: !!(window.SpeechRecognition || window.webkitSpeechRecognition)
    };
}
