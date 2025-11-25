import { useEffect, useRef, useState, useCallback } from 'react';
import { AudioRecorder } from '../lib/audio-recorder';
import { AudioStreamer } from '../lib/audio-streamer';
import { LiveConfig, LiveIncomingMessage, LiveOutgoingMessage } from '../types/live-api';

const HOST = 'generativelanguage.googleapis.com';
const URI = `wss://${HOST}/ws/google.ai.generativelanguage.v1alpha.GenerativeService.BidiGenerateContent`;

export function useLiveAPI(apiKey: string) {
    const [connected, setConnected] = useState(false);
    const [isRecording, setIsRecording] = useState(false);
    const [volume, setVolume] = useState(0);
    const wsRef = useRef<WebSocket | null>(null);
    const audioRecorderRef = useRef<AudioRecorder | null>(null);
    const audioStreamerRef = useRef<AudioStreamer | null>(null);

    const connect = useCallback(async (config: LiveConfig) => {
        if (!apiKey) {
            console.error("API Key is required");
            return;
        }

        // Initialize audio immediately to satisfy browser autoplay policies
        audioStreamerRef.current = new AudioStreamer();
        await audioStreamerRef.current.initialize();

        audioRecorderRef.current = new AudioRecorder();
        audioRecorderRef.current.addEventListener('data', ((e: CustomEvent) => {
            sendAudioChunk(e.detail);
        }) as EventListener);
        audioRecorderRef.current.addEventListener('volume', ((e: CustomEvent) => {
            setVolume(e.detail);
        }) as EventListener);

        const ws = new WebSocket(`${URI}?key=${apiKey}`);
        wsRef.current = ws;

        ws.onopen = async () => {
            console.log("Connected to Gemini Live API");
            setConnected(true);

            // Send setup message
            const setupMessage: LiveOutgoingMessage = {
                setup: config
            };
            console.log("Sending setup message:", JSON.stringify(setupMessage, null, 2));
            ws.send(JSON.stringify(setupMessage));
        };

        ws.onmessage = async (event) => {
            let data: LiveIncomingMessage;
            try {
                if (event.data instanceof Blob) {
                    const text = await event.data.text();
                    data = JSON.parse(text);
                } else {
                    data = JSON.parse(event.data);
                }
                console.log("Received message from server:", data);
            } catch (e) {
                console.error("Error parsing message", e);
                console.error("Raw message data:", event.data);
                return;
            }

            // Handle setup complete - send initial message to trigger AI introduction
            if ('setupComplete' in data) {
                console.log("Setup complete, sending initial greeting");
                
                const greetingMessage: LiveOutgoingMessage = {
                    clientContent: {
                        turns: [{
                            role: "user",
                            parts: [{ text: "Hello, please introduce yourself and start the interview." }]
                        }],
                        turnComplete: true
                    }
                };
                ws.send(JSON.stringify(greetingMessage));

                // Start recording automatically
                if (audioRecorderRef.current) {
                    await audioRecorderRef.current.start();
                    setIsRecording(true);
                }
            }

            if ('serverContent' in data) {
                const { modelTurn, inputTranscription, turnComplete, interrupted } = data.serverContent;
                console.log('ServerContent received:', { 
                    hasModelTurn: !!modelTurn, 
                    hasInputTranscription: !!inputTranscription,
                    turnComplete, 
                    interrupted,
                    inputTranscriptionText: inputTranscription?.text || 'none'
                });
                
                // Handle interruption
                if (interrupted) {
                    console.log('Conversation interrupted');
                }
                
                // Handle AI text responses - dispatch immediately for accumulation
                if (modelTurn) {
                    console.log('ModelTurn parts:', modelTurn.parts);
                    for (const part of modelTurn.parts) {
                        if (part.text) {
                            console.log('=== DISPATCHING AI FRAGMENT ===');
                            console.log('Fragment:', JSON.stringify(part.text));
                            window.dispatchEvent(new CustomEvent('ai-transcript-fragment', {
                                detail: { text: part.text, sender: 'ai' }
                            }));
                        }
                        if (part.inlineData && part.inlineData.mimeType.startsWith('audio/pcm')) {
                            console.log('Processing audio data');
                            const audioData = base64ToArrayBuffer(part.inlineData.data);
                            audioStreamerRef.current?.addPCM16(audioData);
                        }
                    }
                }
                
                // Handle user speech transcription - dispatch immediately for accumulation
                if (inputTranscription?.text) {
                    const text = inputTranscription.text;
                    if (text) {
                        console.log('=== DISPATCHING USER FRAGMENT ===');
                        console.log('Fragment:', JSON.stringify(text));
                        window.dispatchEvent(new CustomEvent('user-transcript-fragment', {
                            detail: { text, sender: 'user' }
                        }));
                    }
                }
                
                // Note: turnComplete is now handled by the receiving component's accumulation logic
                if (turnComplete) {
                    console.log('=== TURN COMPLETE DETECTED ===');
                    // No longer need to dispatch here - accumulation is handled in InterviewRoom
                }
            }
        };

        ws.onclose = (event) => {
            console.log("Disconnected from Gemini Live API");
            console.log("Close code:", event.code);
            console.log("Close reason:", event.reason);
            console.log("Was clean:", event.wasClean);
            setConnected(false);
            setIsRecording(false);
        };

        ws.onerror = (error) => {
            console.error("WebSocket Error:", error);
            console.error("Error type:", error.type);
        };
    }, [apiKey]);

    const disconnect = useCallback(() => {
        wsRef.current?.close();
        audioRecorderRef.current?.stop();
        audioStreamerRef.current?.stop();
        setConnected(false);
        setIsRecording(false);
    }, []);

    const startRecording = useCallback(async () => {
        if (!audioRecorderRef.current) return;
        await audioRecorderRef.current.start();
        setIsRecording(true);
    }, []);

    const stopRecording = useCallback(() => {
        audioRecorderRef.current?.stop();
        setIsRecording(false);
    }, []);

    const sendAudioChunk = (data: ArrayBuffer) => {
        if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) return;

        const base64Audio = arrayBufferToBase64(data);
        const message: LiveOutgoingMessage = {
            realtimeInput: {
                mediaChunks: [
                    {
                        mimeType: "audio/pcm;rate=16000",
                        data: base64Audio
                    }
                ]
            }
        };
        wsRef.current.send(JSON.stringify(message));
    };

    return {
        connect,
        disconnect,
        startRecording,
        stopRecording,
        connected,
        isRecording,
        volume
    };
}

function arrayBufferToBase64(buffer: ArrayBuffer): string {
    let binary = '';
    const bytes = new Uint8Array(buffer);
    const len = bytes.byteLength;
    for (let i = 0; i < len; i++) {
        binary += String.fromCharCode(bytes[i]);
    }
    return window.btoa(binary);
}

function base64ToArrayBuffer(base64: string): ArrayBuffer {
    const binaryString = window.atob(base64);
    const len = binaryString.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
        bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes.buffer;
}
